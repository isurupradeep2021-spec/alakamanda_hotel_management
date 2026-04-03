/* eslint-disable react/prop-types */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  createHousekeepingTask,
  createMaintenanceTicket,
  createRoomServiceStaff,
  deleteHousekeepingTask,
  deleteMaintenanceTicket,
  deleteRoomServiceStaff,
  getHousekeepingStats,
  getHousekeepingTasks,
  getMaintenanceStats,
  getMaintenanceTickets,
  getRoomServiceStaff,
  updateHousekeepingTask,
  updateMaintenanceTicket,
  updateRoomServiceStaff
} from '../api/roomService';
import { ROLES, getAllowedMenuForRole } from '../auth/role';
import { useAuth } from '../context/AuthContext';

const housekeepingStatuses = ['PENDING', 'IN_PROGRESS', 'CLEANED', 'INSPECTED'];
const maintenanceStatuses = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const priorityOptions = ['LOW', 'MEDIUM', 'HIGH'];
const roomConditionOptions = ['OCCUPIED', 'CHECKOUT', 'PRE_CHECK_IN'];
const taskTypeOptions = ['CLEANING', 'INSPECTION', 'TURNDOWN'];
const facilityOptions = ['AC', 'PLUMBING', 'ELECTRICAL', 'FURNITURE', 'OTHER'];
const staffRoleOptions = ['HOUSEKEEPER', 'MAINTENANCE_STAFF'];

const housekeepingInitialForm = {
  roomNumber: '',
  floor: '',
  roomCondition: 'OCCUPIED',
  taskType: 'CLEANING',
  status: 'PENDING',
  priority: 'MEDIUM',
  staffId: '',
  deadline: '',
  notes: '',
  cleaningNotes: ''
};

const maintenanceInitialForm = {
  roomNumber: '',
  floor: '',
  facilityType: 'AC',
  issueDescription: '',
  status: 'OPEN',
  priority: 'MEDIUM',
  staffId: '',
  deadline: '',
  resolutionNotes: '',
  partsUsed: ''
};

const staffInitialForm = {
  name: '',
  role: 'HOUSEKEEPER',
  contactNumber: ''
};

function formatLabel(value) {
  return value ? value.replaceAll('_', ' ') : '-';
}

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function toNumber(value) {
  if (value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function StatCard({ icon, label, value, detail }) {
  return (
    <article className="summary-card premium-card signature-card">
      <div className="kpi-top">
        <i className={`bi ${icon}`} />
        <span>{label}</span>
      </div>
      <h3>{value}</h3>
      <p>
        <i className="bi bi-activity" />
        {detail}
      </p>
    </article>
  );
}

function StatusBadge({ value }) {
  const normalized = (value || '').toLowerCase().replaceAll('_', '-');
  return <span className={`room-service-badge room-service-badge-${normalized}`}>{formatLabel(value)}</span>;
}

function FilterBar({ children }) {
  return <div className="room-service-filter-bar">{children}</div>;
}

function EmptyState({ message }) {
  return <div className="room-service-empty-state">{message}</div>;
}

export function RoomServiceDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ housekeeping: null, maintenance: null, staffCount: 0 });

  useEffect(() => {
    let ignore = false;

    Promise.all([
      getHousekeepingStats().then((response) => response.data).catch(() => null),
      getMaintenanceStats().then((response) => response.data).catch(() => null),
      getRoomServiceStaff().then((response) => response.data).catch(() => [])
    ]).then(([housekeeping, maintenance, staff]) => {
      if (ignore) {
        return;
      }

      setStats({
        housekeeping,
        maintenance,
        staffCount: Array.isArray(staff) ? staff.length : 0
      });
    });

    return () => {
      ignore = true;
    };
  }, []);

  const quickLinks = getAllowedMenuForRole(user?.role).filter((item) => item.path.startsWith('/room-service'));

  return (
    <div className="module-page dashboard-luxe">
      <div className="dash-hero luxe-hero room-service-hero">
        <div className="module-head">
          <p className="eyebrow">Service Operations</p>
          <h2>Room Service Command</h2>
          <p>Track housekeeping, maintenance and staffing without leaving the Alakamanda control center.</p>
        </div>
        <div className="hero-chip">
          <i className="bi bi-stars" />
          {user?.role}
        </div>
      </div>

      <div className="summary-grid premium-grid dashboard-kpis">
        <StatCard icon="bi-brush" label="Housekeeping Tasks" value={stats.housekeeping?.total ?? '-'} detail={`${stats.housekeeping?.pending ?? 0} pending inspections and cleanups`} />
        <StatCard icon="bi-tools" label="Maintenance Tickets" value={stats.maintenance?.total ?? '-'} detail={`${stats.maintenance?.open ?? 0} open technical issues`} />
        <StatCard icon="bi-people" label="Service Team" value={stats.staffCount} detail="Cross-functional room operations staff" />
        <StatCard icon="bi-check2-square" label="Resolved Today" value={(stats.housekeeping?.inspected ?? 0) + (stats.maintenance?.resolved ?? 0)} detail="Combined completed work items" />
      </div>

      <div className="dash-section">
        <h3>Quick Actions</h3>
        <div className="module-grid action-grid">
          {quickLinks.map((item) => (
            <Link key={item.path} to={item.path} className="module-card action-tile signature-action">
              <i className={`bi ${item.icon}`} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HousekeepingOperationsPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState(housekeepingInitialForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canManage = [ROLES.ADMIN, ROLES.MANAGER, ROLES.HOUSEKEEPER].includes(user?.role);

  const loadData = () => {
    getHousekeepingTasks().then((response) => setTasks(response.data || [])).catch(() => setTasks([]));
    getRoomServiceStaff().then((response) => setStaff(response.data || [])).catch(() => setStaff([]));
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    if (statusFilter && task.status !== statusFilter) {
      return false;
    }

    if (priorityFilter && task.priority !== priorityFilter) {
      return false;
    }

    if (searchTerm && !task.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  }), [tasks, statusFilter, priorityFilter, searchTerm]);

  const housekeepingSubmitLabel = editingTask ? 'Update Task' : 'Create Task';

  const beginCreate = () => {
    setEditingTask(null);
    setForm(housekeepingInitialForm);
    setError('');
    setShowForm(true);
  };

  const beginEdit = (task) => {
    setEditingTask(task);
    setForm({
      roomNumber: task.roomNumber || '',
      floor: task.floor ?? '',
      roomCondition: task.roomCondition || 'OCCUPIED',
      taskType: task.taskType || 'CLEANING',
      status: task.status || 'PENDING',
      priority: task.priority || 'MEDIUM',
      staffId: task.staffId ?? '',
      deadline: task.deadline ? task.deadline.slice(0, 16) : '',
      notes: task.notes || '',
      cleaningNotes: task.cleaningNotes || ''
    });
    setError('');
    setShowForm(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.roomNumber.trim()) {
      setError('Room number is required.');
      return;
    }

    const payload = {
      roomNumber: form.roomNumber.trim(),
      roomCondition: form.roomCondition,
      taskType: form.taskType,
      status: form.status,
      priority: form.priority,
      notes: form.notes || undefined,
      cleaningNotes: form.cleaningNotes || undefined,
      deadline: form.deadline || undefined,
      floor: toNumber(form.floor),
      staffId: toNumber(form.staffId)
    };

    setSubmitting(true);

    try {
      if (editingTask) {
        await updateHousekeepingTask(editingTask.id, payload);
      } else {
        await createHousekeepingTask(payload);
      }

      setShowForm(false);
      setEditingTask(null);
      setForm(housekeepingInitialForm);
      loadData();
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Unable to save housekeeping task.'));
    } finally {
      setSubmitting(false);
    }
  };

  const removeTask = async (task) => {
    if (!globalThis.confirm(`Delete housekeeping task for room ${task.roomNumber}?`)) {
      return;
    }

    try {
      await deleteHousekeepingTask(task.id);
      loadData();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'Unable to delete housekeeping task.'));
    }
  };

  return (
    <div className="module-page ops-grid">
      <div className="dash-hero room-service-hero">
        <div className="module-head">
          <p className="eyebrow">Housekeeping</p>
          <h2>Service Floor Board</h2>
          <p>Schedule cleanups, assign staff and monitor inspection progress using the hotel’s existing operating shell.</p>
        </div>
        {canManage ? (
          <button type="button" className="primary-action" onClick={beginCreate}>New Task</button>
        ) : null}
      </div>

      {showForm ? (
        <section className="ops-panel">
          <h3>{editingTask ? 'Update Task' : 'Create Task'}</h3>
          <form className="crud-form room-service-form" onSubmit={submit}>
            <div>
              <label htmlFor="housekeeping-room-number">Room Number</label>
              <input id="housekeeping-room-number" value={form.roomNumber} onChange={(event) => setForm({ ...form, roomNumber: event.target.value })} required />
            </div>
            <div>
              <label htmlFor="housekeeping-floor">Floor</label>
              <input id="housekeeping-floor" type="number" value={form.floor} onChange={(event) => setForm({ ...form, floor: event.target.value })} />
            </div>
            <div>
              <label htmlFor="housekeeping-room-condition">Room Condition</label>
              <select id="housekeeping-room-condition" value={form.roomCondition} onChange={(event) => setForm({ ...form, roomCondition: event.target.value })}>
                {roomConditionOptions.map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="housekeeping-task-type">Task Type</label>
              <select id="housekeeping-task-type" value={form.taskType} onChange={(event) => setForm({ ...form, taskType: event.target.value })}>
                {taskTypeOptions.map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="housekeeping-status">Status</label>
              <select id="housekeeping-status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                {housekeepingStatuses.map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="housekeeping-priority">Priority</label>
              <select id="housekeeping-priority" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
                {priorityOptions.map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="housekeeping-staff">Assigned Staff</label>
              <select id="housekeeping-staff" value={form.staffId} onChange={(event) => setForm({ ...form, staffId: event.target.value })}>
                <option value="">Unassigned</option>
                {staff.filter((member) => member.role === 'HOUSEKEEPER').map((member) => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="housekeeping-deadline">Deadline</label>
              <input id="housekeeping-deadline" type="datetime-local" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} />
            </div>
            <div className="room-service-form-span">
              <label htmlFor="housekeeping-notes">Task Notes</label>
              <textarea id="housekeeping-notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={3} />
            </div>
            <div className="room-service-form-span">
              <label htmlFor="housekeeping-cleaning-notes">Cleaning Notes</label>
              <textarea id="housekeeping-cleaning-notes" value={form.cleaningNotes} onChange={(event) => setForm({ ...form, cleaningNotes: event.target.value })} rows={3} />
            </div>
            {error ? <div className="inline-error room-service-form-span">{error}</div> : null}
            <div className="room-service-actions room-service-form-span">
              <button type="submit" className="primary-action" disabled={submitting}>{submitting ? 'Saving...' : housekeepingSubmitLabel}</button>
              <button type="button" className="secondary-action" onClick={() => { setShowForm(false); setEditingTask(null); setError(''); }}>Cancel</button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="ops-panel">
        <h3>Task Ledger</h3>
        <FilterBar>
          <input placeholder="Search room number" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All Statuses</option>
            {housekeepingStatuses.map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}
          </select>
          <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
            <option value="">All Priorities</option>
            {priorityOptions.map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}
          </select>
        </FilterBar>
        <div className="table-wrap ops-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Condition</th>
                <th>Task</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Staff</th>
                <th>Deadline</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8}><EmptyState message="No housekeeping tasks match the current filters." /></td>
                </tr>
              ) : filteredTasks.map((task) => (
                <tr key={task.id}>
                  <td>
                    <strong>{task.roomNumber}</strong>
                    <div className="room-service-meta">Floor {task.floor ?? '-'}</div>
                  </td>
                  <td>{formatLabel(task.roomCondition)}</td>
                  <td>{formatLabel(task.taskType)}</td>
                  <td><StatusBadge value={task.status} /></td>
                  <td><StatusBadge value={task.priority} /></td>
                  <td>{task.staff?.name || 'Unassigned'}</td>
                  <td>{formatDateTime(task.deadline)}</td>
                  <td>
                    <div className="room-service-table-actions">
                      {canManage ? <button type="button" className="secondary-action room-service-inline-button" onClick={() => beginEdit(task)}>Edit</button> : null}
                      {user?.role === ROLES.ADMIN || user?.role === ROLES.MANAGER ? <button type="button" className="danger-btn" onClick={() => removeTask(task)}>Delete</button> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function MaintenanceOperationsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [staff, setStaff] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [form, setForm] = useState(maintenanceInitialForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canManage = [ROLES.ADMIN, ROLES.MANAGER, ROLES.MAINTENANCE_STAFF].includes(user?.role);

  const loadData = () => {
    getMaintenanceTickets().then((response) => setTickets(response.data || [])).catch(() => setTickets([]));
    getRoomServiceStaff().then((response) => setStaff(response.data || [])).catch(() => setStaff([]));
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTickets = useMemo(() => tickets.filter((ticket) => {
    if (statusFilter && ticket.status !== statusFilter) {
      return false;
    }

    if (priorityFilter && ticket.priority !== priorityFilter) {
      return false;
    }

    if (facilityFilter && ticket.facilityType !== facilityFilter) {
      return false;
    }

    if (searchTerm && !ticket.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  }), [tickets, statusFilter, priorityFilter, facilityFilter, searchTerm]);

  const maintenanceSubmitLabel = editingTicket ? 'Update Ticket' : 'Create Ticket';

  const beginCreate = () => {
    setEditingTicket(null);
    setForm(maintenanceInitialForm);
    setError('');
    setShowForm(true);
  };

  const beginEdit = (ticket) => {
    setEditingTicket(ticket);
    setForm({
      roomNumber: ticket.roomNumber || '',
      floor: ticket.floor ?? '',
      facilityType: ticket.facilityType || 'AC',
      issueDescription: ticket.issueDescription || '',
      status: ticket.status || 'OPEN',
      priority: ticket.priority || 'MEDIUM',
      staffId: ticket.staffId ?? '',
      deadline: ticket.deadline ? ticket.deadline.slice(0, 16) : '',
      resolutionNotes: ticket.resolutionNotes || '',
      partsUsed: ticket.partsUsed || ''
    });
    setError('');
    setShowForm(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.roomNumber.trim() || !form.issueDescription.trim()) {
      setError('Room number and issue description are required.');
      return;
    }

    const payload = {
      roomNumber: form.roomNumber.trim(),
      facilityType: form.facilityType,
      issueDescription: form.issueDescription.trim(),
      status: form.status,
      priority: form.priority,
      resolutionNotes: form.resolutionNotes || undefined,
      partsUsed: form.partsUsed || undefined,
      deadline: form.deadline || undefined,
      floor: toNumber(form.floor),
      staffId: toNumber(form.staffId)
    };

    setSubmitting(true);

    try {
      if (editingTicket) {
        await updateMaintenanceTicket(editingTicket.id, payload);
      } else {
        await createMaintenanceTicket(payload);
      }

      setShowForm(false);
      setEditingTicket(null);
      setForm(maintenanceInitialForm);
      loadData();
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Unable to save maintenance ticket.'));
    } finally {
      setSubmitting(false);
    }
  };

  const removeTicket = async (ticket) => {
    if (!globalThis.confirm(`Delete maintenance ticket for room ${ticket.roomNumber}?`)) {
      return;
    }

    try {
      await deleteMaintenanceTicket(ticket.id);
      loadData();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'Unable to delete maintenance ticket.'));
    }
  };

  return (
    <div className="module-page ops-grid">
      <div className="dash-hero room-service-hero">
        <div className="module-head">
          <p className="eyebrow">Maintenance</p>
          <h2>Engineering Desk</h2>
          <p>Coordinate room repairs and assign technical staff with the same luxury operations styling used across the hotel platform.</p>
        </div>
        {canManage ? <button type="button" className="primary-action" onClick={beginCreate}>New Ticket</button> : null}
      </div>

      {showForm ? (
        <section className="ops-panel">
          <h3>{editingTicket ? 'Update Ticket' : 'Create Ticket'}</h3>
          <form className="crud-form room-service-form" onSubmit={submit}>
            <div>
              <label htmlFor="maintenance-room-number">Room Number</label>
              <input id="maintenance-room-number" value={form.roomNumber} onChange={(event) => setForm({ ...form, roomNumber: event.target.value })} required />
            </div>
            <div>
              <label htmlFor="maintenance-floor">Floor</label>
              <input id="maintenance-floor" type="number" value={form.floor} onChange={(event) => setForm({ ...form, floor: event.target.value })} />
            </div>
            <div>
              <label htmlFor="maintenance-facility">Facility Type</label>
              <select id="maintenance-facility" value={form.facilityType} onChange={(event) => setForm({ ...form, facilityType: event.target.value })}>
                {facilityOptions.map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="maintenance-status">Status</label>
              <select id="maintenance-status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                {maintenanceStatuses.map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="maintenance-priority">Priority</label>
              <select id="maintenance-priority" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
                {priorityOptions.map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="maintenance-staff">Assigned Staff</label>
              <select id="maintenance-staff" value={form.staffId} onChange={(event) => setForm({ ...form, staffId: event.target.value })}>
                <option value="">Unassigned</option>
                {staff.filter((member) => member.role === 'MAINTENANCE_STAFF').map((member) => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="maintenance-deadline">Deadline</label>
              <input id="maintenance-deadline" type="datetime-local" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} />
            </div>
            <div className="room-service-form-span">
              <label htmlFor="maintenance-issue">Issue Description</label>
              <textarea id="maintenance-issue" value={form.issueDescription} onChange={(event) => setForm({ ...form, issueDescription: event.target.value })} rows={3} required />
            </div>
            <div>
              <label htmlFor="maintenance-resolution">Resolution Notes</label>
              <textarea id="maintenance-resolution" value={form.resolutionNotes} onChange={(event) => setForm({ ...form, resolutionNotes: event.target.value })} rows={3} />
            </div>
            <div>
              <label htmlFor="maintenance-parts">Parts Used</label>
              <textarea id="maintenance-parts" value={form.partsUsed} onChange={(event) => setForm({ ...form, partsUsed: event.target.value })} rows={3} />
            </div>
            {error ? <div className="inline-error room-service-form-span">{error}</div> : null}
            <div className="room-service-actions room-service-form-span">
              <button type="submit" className="primary-action" disabled={submitting}>{submitting ? 'Saving...' : maintenanceSubmitLabel}</button>
              <button type="button" className="secondary-action" onClick={() => { setShowForm(false); setEditingTicket(null); setError(''); }}>Cancel</button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="ops-panel">
        <h3>Maintenance Pipeline</h3>
        <FilterBar>
          <input placeholder="Search room number" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All Statuses</option>
            {maintenanceStatuses.map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}
          </select>
          <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
            <option value="">All Priorities</option>
            {priorityOptions.map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}
          </select>
          <select value={facilityFilter} onChange={(event) => setFacilityFilter(event.target.value)}>
            <option value="">All Facilities</option>
            {facilityOptions.map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}
          </select>
        </FilterBar>
        <div className="table-wrap ops-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Facility</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assigned Staff</th>
                <th>Deadline</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7}><EmptyState message="No maintenance tickets match the current filters." /></td>
                </tr>
              ) : filteredTickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td>
                    <strong>{ticket.roomNumber}</strong>
                    <div className="room-service-meta">Floor {ticket.floor ?? '-'}</div>
                  </td>
                  <td>{formatLabel(ticket.facilityType)}</td>
                  <td><StatusBadge value={ticket.status} /></td>
                  <td><StatusBadge value={ticket.priority} /></td>
                  <td>{ticket.staff?.name || 'Unassigned'}</td>
                  <td>{formatDateTime(ticket.deadline)}</td>
                  <td>
                    <div className="room-service-table-actions">
                      {canManage ? <button type="button" className="secondary-action room-service-inline-button" onClick={() => beginEdit(ticket)}>Edit</button> : null}
                      {user?.role === ROLES.ADMIN || user?.role === ROLES.MANAGER ? <button type="button" className="danger-btn" onClick={() => removeTicket(ticket)}>Delete</button> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function RoomServiceStaffPage() {
  const [staff, setStaff] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [form, setForm] = useState(staffInitialForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadStaff = () => {
    getRoomServiceStaff().then((response) => setStaff(response.data || [])).catch(() => setStaff([]));
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const staffSubmitLabel = editingMember ? 'Update Staff Member' : 'Create Staff Member';

  const filteredStaff = useMemo(() => staff.filter((member) => {
    if (roleFilter && member.role !== roleFilter) {
      return false;
    }

    if (searchTerm && !member.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  }), [staff, roleFilter, searchTerm]);

  const beginCreate = () => {
    setEditingMember(null);
    setForm(staffInitialForm);
    setError('');
    setShowForm(true);
  };

  const beginEdit = (member) => {
    setEditingMember(member);
    setForm({
      name: member.name || '',
      role: member.role || 'HOUSEKEEPER',
      contactNumber: member.contactNumber || ''
    });
    setError('');
    setShowForm(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Full name is required.');
      return;
    }

    setSubmitting(true);

    try {
      if (editingMember) {
        await updateRoomServiceStaff(editingMember.id, form);
      } else {
        await createRoomServiceStaff(form);
      }

      setShowForm(false);
      setEditingMember(null);
      setForm(staffInitialForm);
      loadStaff();
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Unable to save staff member.'));
    } finally {
      setSubmitting(false);
    }
  };

  const removeMember = async (member) => {
    if (!globalThis.confirm(`Delete staff member ${member.name}?`)) {
      return;
    }

    try {
      await deleteRoomServiceStaff(member.id);
      loadStaff();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'Unable to delete staff member.'));
    }
  };

  return (
    <div className="module-page ops-grid">
      <div className="dash-hero room-service-hero">
        <div className="module-head">
          <p className="eyebrow">Service Staffing</p>
          <h2>Operations Crew</h2>
          <p>Maintain the dedicated room-service team roster from within the Alakamanda management interface.</p>
        </div>
        <button type="button" className="primary-action" onClick={beginCreate}>Add Staff Member</button>
      </div>

      {showForm ? (
        <section className="ops-panel">
          <h3>{editingMember ? 'Update Staff Member' : 'Create Staff Member'}</h3>
          <form className="crud-form room-service-form" onSubmit={submit}>
            <div>
              <label htmlFor="room-service-staff-name">Full Name</label>
              <input id="room-service-staff-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </div>
            <div>
              <label htmlFor="room-service-staff-role">Role</label>
              <select id="room-service-staff-role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                {staffRoleOptions.map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="room-service-staff-contact">Contact Number</label>
              <input id="room-service-staff-contact" value={form.contactNumber} onChange={(event) => setForm({ ...form, contactNumber: event.target.value })} />
            </div>
            {error ? <div className="inline-error room-service-form-span">{error}</div> : null}
            <div className="room-service-actions room-service-form-span">
              <button type="submit" className="primary-action" disabled={submitting}>{submitting ? 'Saving...' : staffSubmitLabel}</button>
              <button type="button" className="secondary-action" onClick={() => { setShowForm(false); setEditingMember(null); setError(''); }}>Cancel</button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="ops-panel">
        <h3>Staff Directory</h3>
        <FilterBar>
          <input placeholder="Search by name" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="">All Roles</option>
            {staffRoleOptions.map((option) => <option key={option} value={option}>{formatLabel(option)}</option>)}
          </select>
        </FilterBar>
        <div className="table-wrap ops-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Contact</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5}><EmptyState message="No room-service staff members match the current filters." /></td>
                </tr>
              ) : filteredStaff.map((member) => (
                <tr key={member.id}>
                  <td>{member.name}</td>
                  <td><StatusBadge value={member.role} /></td>
                  <td>{member.contactNumber || '-'}</td>
                  <td>{formatDateTime(member.createdAt)}</td>
                  <td>
                    <div className="room-service-table-actions">
                      <button type="button" className="secondary-action room-service-inline-button" onClick={() => beginEdit(member)}>Edit</button>
                      <button type="button" className="danger-btn" onClick={() => removeMember(member)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
