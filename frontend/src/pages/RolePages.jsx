/* eslint-disable react/prop-types */

import { useEffect, useMemo, useState } from 'react';
import {
  createStaffMember,
  deleteStaffMember,
  diningAnalytics,
  eventAnalytics,
  getDiningBookings,
  getEventBookings,
  getRoomBookings,
  getStaffMembers,
  getSummary,
  payrollSummary,
  roomBookingAnalytics,
  updateStaffMember
} from '../api/service';
import { useAuth } from '../context/AuthContext';
import { registrationRoles, ROLES, toBackendRole } from '../auth/role';

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function RevenueBars({ data = [] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="mini-chart bars-chart">
      {data.map((d) => (
        <div key={d.label} className="bar-col">
          <div className="bar-wrap">
            <div className="bar-fill" style={{ height: `${Math.max((d.value / max) * 100, 8)}%` }} />
          </div>
          <span className="bar-value">{d.value.toFixed(0)}</span>
          <span className="bar-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function Sparkline({ points = [] }) {
  const width = 560;
  const height = 120;
  const max = Math.max(...points, 1);
  const step = width / Math.max(points.length - 1, 1);
  const path = points
    .map((p, i) => {
      const x = i * step;
      const y = height - (p / max) * (height - 18) - 8;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg className="mini-chart sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGradient" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#c9a56a" />
          <stop offset="100%" stopColor="#1d3d67" />
        </linearGradient>
      </defs>
      <path d={path} fill="none" stroke="url(#sparkGradient)" strokeWidth="4" strokeLinecap="round" />
      {points.map((p, i) => {
        const x = i * step;
        const y = height - (p / max) * (height - 18) - 8;
        return <circle key={`${p}-${i}`} cx={x} cy={y} r="4.2" fill="#183557" stroke="#f4e2be" strokeWidth="1.5" />;
      })}
    </svg>
  );
}

function Hero({ eyebrow, title, subtitle, chipIcon, chipLabel }) {
  return (
    <div className="dash-hero luxe-hero">
      <div className="module-head">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="hero-chip">
        <i className={`bi ${chipIcon}`} />
        {chipLabel}
      </div>
    </div>
  );
}

export function UserManagementPage() {
  const [staffMembers, setStaffMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    employeeCode: '',
    department: '',
    role: 'STAFF',
    baseSalary: '',
    phone: '',
    employmentStatus: 'ACTIVE'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    getStaffMembers().then((res) => setStaffMembers(res.data || [])).catch(() => setStaffMembers([]));
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm({
      fullName: '',
      email: '',
      password: '',
      employeeCode: '',
      department: '',
      role: 'STAFF',
      baseSalary: '',
      phone: '',
      employmentStatus: 'ACTIVE'
    });
    setEditingId(null);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const payload = {
        fullName: form.fullName,
        email: form.email,
        employeeCode: form.employeeCode,
        department: form.department,
        baseSalary: Number(form.baseSalary || 0),
        phone: form.phone,
        employmentStatus: form.employmentStatus
      };

      if (editingId) {
        await updateStaffMember(editingId, {
          ...payload,
          password: form.password || undefined
        });
        setSuccess('Staff member updated successfully');
      } else {
        await createStaffMember({
          ...payload,
          password: form.password,
          role: 'STAFF'
        });
        setSuccess('Staff member created successfully');
      }
      resetForm();
      await registerApi({
        ...form,
        role: toBackendRole(form.role)
      });
      setForm({ fullName: '', email: '', password: '', role: ROLES.STAFF_MEMBER });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save staff member');
    }
  };

  const totalSalary = useMemo(
    () => staffMembers.reduce((sum, item) => sum + Number(item.basicSalary || 0), 0),
    [staffMembers]
  );

  const onEdit = (row) => {
    setEditingId(row.id);
    setShowForm(true);
    setError('');
    setSuccess('');
    setForm({
      fullName: row.fullName || '',
      email: row.email || '',
      password: '',
      employeeCode: row.employeeId || '',
      department: row.employmentRole || '',
      role: 'STAFF',
      baseSalary: row.basicSalary ?? '',
      phone: row.phone || '',
      employmentStatus: row.employmentStatus || 'ACTIVE'
    });
  };

  const onDelete = async (id) => {
    setError('');
    setSuccess('');
    try {
      await deleteStaffMember(id);
      setSuccess('Staff member deleted/deactivated');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete staff member');
    }
  };

  return (
    <div className="module-page dashboard-luxe">
      <Hero
        eyebrow="Admin Control"
        title="Staff Management"
        subtitle="Add, update, and remove staff records used by payroll automation."
        chipIcon="bi-people"
        chipLabel="Payroll Ready"
      />

      <div className="summary-grid premium-grid dashboard-kpis">
        <article className="summary-card premium-card signature-card"><div className="kpi-top"><i className="bi bi-people" /><span>Total Staff</span></div><h3>{staffMembers.length}</h3><p><i className="bi bi-graph-up-arrow" /> Registered employees</p></article>
        <article className="summary-card premium-card signature-card"><div className="kpi-top"><i className="bi bi-cash-stack" /><span>Total Base Salary</span></div><h3>{totalSalary.toFixed(2)}</h3><p><i className="bi bi-receipt" /> Monthly baseline</p></article>
      </div>

      <div className="table-wrap ops-table-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="ops-table-title" style={{ margin: 0 }}>Staff Directory</h3>
          <button type="button" className="primary-action" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Staff'}
          </button>
        </div>
        
        {error && <div className="inline-error" style={{ marginBottom: '16px' }}>{error}</div>}
        {success && <div className="inline-success" style={{ marginBottom: '16px' }}>{success}</div>}
        
        {showForm && (
          <form className="crud-form premium-form" onSubmit={handleSaveStaff} style={{ marginBottom: '24px', padding: '16px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ marginBottom: '12px' }}>{editingId ? 'Update Staff Member' : 'Create New Staff Member'}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <input placeholder="Full Name" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} required />
              <input type="email" placeholder="Email Address" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              <input
                type="password"
                placeholder={editingId ? 'Password (optional)' : 'Password'}
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                required={!editingId}
              />
              <input placeholder="Employee Code (e.g. STF-010)" value={form.employeeCode} onChange={e => setForm({...form, employeeCode: e.target.value})} required />
              <input placeholder="Position / Department" value={form.department} onChange={e => setForm({...form, department: e.target.value})} required />
              <input type="number" min="0" step="0.01" placeholder="Base Salary" value={form.baseSalary} onChange={e => setForm({...form, baseSalary: e.target.value})} required />
              <input placeholder="Contact Number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              <select value={form.employmentStatus} onChange={e => setForm({...form, employmentStatus: e.target.value})}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="ON_LEAVE">ON LEAVE</option>
                <option value="INACTIVE">INACTIVE</option>
              <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} required>
                {registrationRoles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              <input value="STAFF" readOnly />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button type="submit" className="primary-action">{editingId ? 'Update Staff' : 'Create Staff'}</button>
              {editingId && (
                <button type="button" className="secondary-btn" onClick={resetForm}>Cancel Edit</button>
              )}
            </div>
          </form>
        )}

        <table className="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>Employee Code</th><th>Position</th><th>Base Salary</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {staffMembers.map((u) => (
              <tr key={u.id}>
                <td>{u.fullName}</td>
                <td>{u.email}</td>
                <td>{u.employeeId || '-'}</td>
                <td>{u.employmentRole || '-'}</td>
                <td>{u.basicSalary ?? 0}</td>
                <td>{u.employmentStatus || '-'}</td>
                <td>
                  <button type="button" className="secondary-btn" style={{ marginRight: 8 }} onClick={() => onEdit(u)}>Edit</button>
                  <button type="button" className="danger-btn" onClick={() => onDelete(u.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ReportsPage() {
  const [summary, setSummary] = useState({});
  const [room, setRoom] = useState({});
  const [dining, setDining] = useState({});
  const [events, setEvents] = useState({});
  const [payroll, setPayroll] = useState({});

  useEffect(() => {
    getSummary().then((r) => setSummary(r.data || {})).catch(() => setSummary({}));
    roomBookingAnalytics().then((r) => setRoom(r.data || {})).catch(() => setRoom({}));
    diningAnalytics().then((r) => setDining(r.data || {})).catch(() => setDining({}));
    eventAnalytics().then((r) => setEvents(r.data || {})).catch(() => setEvents({}));
    payrollSummary().then((r) => setPayroll(r.data || {})).catch(() => setPayroll({}));
  }, []);

  const cards = [
    { label: 'Room Revenue', value: room.totalRevenue ?? '-', icon: 'bi-building' },
    { label: 'Dining Revenue', value: dining.revenue ?? '-', icon: 'bi-cup-hot' },
    { label: 'Event Revenue', value: events.eventRevenue ?? '-', icon: 'bi-calendar-event' },
    { label: 'Payroll Net', value: payroll.netTotal ?? '-', icon: 'bi-cash-stack' },
    { label: 'Total Bookings', value: (summary.roomBookings || 0) + (summary.eventBookings || 0), icon: 'bi-journal-check' }
  ];

  const revenueData = useMemo(() => ([
    { label: 'Rooms', value: toNumber(room.totalRevenue) },
    { label: 'Dining', value: toNumber(dining.revenue) },
    { label: 'Events', value: toNumber(events.eventRevenue) },
    { label: 'Payroll', value: toNumber(payroll.netTotal) }
  ]), [room.totalRevenue, dining.revenue, events.eventRevenue, payroll.netTotal]);

  const trendPoints = useMemo(() => ([
    toNumber(summary.roomBookings),
    toNumber(summary.restaurantOrders),
    toNumber(summary.eventBookings),
    toNumber(room.activeBookings),
    toNumber(dining.orders),
    toNumber(events.events),
    toNumber(payroll.records)
  ]), [
    summary.roomBookings,
    summary.restaurantOrders,
    summary.eventBookings,
    room.activeBookings,
    dining.orders,
    events.events,
    payroll.records
  ]);

  return (
    <div className="module-page dashboard-luxe">
      <Hero
        eyebrow="Executive Lens"
        title="Reports"
        subtitle="Track operational performance across rooms, dining, events and payroll."
        chipIcon="bi-bar-chart"
        chipLabel="Live Metrics"
      />

      <div className="summary-grid premium-grid dashboard-kpis">
        {cards.map((c) => (
          <article className="summary-card premium-card signature-card" key={c.label}>
            <div className="kpi-top"><i className={`bi ${c.icon}`} /><span>{c.label}</span></div>
            <h3>{c.value}</h3>
            <p><i className="bi bi-activity" /> Updated from analytics APIs</p>
          </article>
        ))}
      </div>

      <div className="charts-grid">
        <section className="ops-panel">
          <h3>Revenue Mix</h3>
          <p className="chart-sub">Rooms, dining, events and payroll comparison.</p>
          <RevenueBars data={revenueData} />
        </section>
        <section className="ops-panel">
          <h3>Operations Trend</h3>
          <p className="chart-sub">Booking and activity signal across modules.</p>
          <Sparkline points={trendPoints} />
        </section>
      </div>
    </div>
  );
}

export function CustomersPage() {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    Promise.all([
      getRoomBookings().then((r) => r.data || []).catch(() => []),
      getDiningBookings().then((r) => r.data || []).catch(() => []),
      getEventBookings().then((r) => r.data || []).catch(() => [])
    ]).then(([rooms, dining, events]) => {
      const map = new Map();

      rooms.forEach((r) => {
        const key = (r.customerEmail || r.customerName || '').toLowerCase();
        if (!key) return;
        map.set(key, {
          name: r.customerName || 'Guest',
          contact: r.customerEmail || '-',
          roomBookings: (map.get(key)?.roomBookings || 0) + 1,
          diningOrders: map.get(key)?.diningOrders || 0,
          eventBookings: map.get(key)?.eventBookings || 0
        });
      });

      dining.forEach((d) => {
        const key = (d.contact || d.customerName || '').toLowerCase();
        if (!key) return;
        map.set(key, {
          name: d.customerName || map.get(key)?.name || 'Guest',
          contact: d.contact || map.get(key)?.contact || '-',
          roomBookings: map.get(key)?.roomBookings || 0,
          diningOrders: (map.get(key)?.diningOrders || 0) + 1,
          eventBookings: map.get(key)?.eventBookings || 0
        });
      });

      events.forEach((e) => {
        const key = (e.customerEmail || e.customerName || '').toLowerCase();
        if (!key) return;
        map.set(key, {
          name: e.customerName,
          contact: e.customerEmail || map.get(key)?.contact || '-',
          roomBookings: map.get(key)?.roomBookings || 0,
          diningOrders: map.get(key)?.diningOrders || 0,
          eventBookings: (map.get(key)?.eventBookings || 0) + 1
        });
      });

      setCustomers(Array.from(map.values()));
    });
  }, []);

  return (
    <div className="module-page dashboard-luxe">
      <Hero
        eyebrow="Front Desk"
        title="Customer Management"
        subtitle="Unified guest records based on booking activity."
        chipIcon="bi-person-badge"
        chipLabel="Reception Desk"
      />

      <div className="table-wrap ops-table-wrap">
        <h3 className="ops-table-title">Guest Profiles</h3>
        <table className="data-table">
          <thead><tr><th>Name</th><th>Contact</th><th>Room</th><th>Dining</th><th>Events</th></tr></thead>
          <tbody>
            {customers.map((c, i) => (
              <tr key={`${c.name}-${i}`}>
                <td>{c.name}</td>
                <td>{c.contact}</td>
                <td>{c.roomBookings}</td>
                <td>{c.diningOrders}</td>
                <td>{c.eventBookings}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BookingHistoryPage() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    Promise.all([
      getRoomBookings().then((r) => (r.data || []).map((x) => ({ type: 'Room', name: x.customerName, date: x.createdAt || x.checkInDate, status: x.status, detail: `${x.roomNumber} | ${x.checkInDate} - ${x.checkOutDate}` }))).catch(() => []),
      getDiningBookings().then((r) => (r.data || []).map((x) => ({ type: 'Dining', name: x.customerName, date: x.bookingDateTime, status: x.status, detail: `${x.menuItem || '-'} | Table ${x.tableNumber || '-'}` }))).catch(() => []),
      getEventBookings().then((r) => (r.data || []).map((x) => ({ type: 'Event', name: x.customerName, date: x.eventDateTime, status: x.status, detail: `${x.eventType || '-'} | ${x.hallName || '-'} | ${x.durationHours || 0} hrs` }))).catch(() => [])
    ]).then(([a, b, c]) => {
      const rows = [...a, ...b, ...c].sort((x, y) => new Date(y.date || 0) - new Date(x.date || 0));
      setHistory(rows);
    });
  }, []);

  return (
    <div className="module-page dashboard-luxe">
      <Hero
        eyebrow="Timeline"
        title="Booking History"
        subtitle="Recent activity across room, restaurant and event modules."
        chipIcon="bi-clock-history"
        chipLabel="Live Log"
      />

      <div className="feed-panel">
        <h3 className="ops-table-title">Latest Activity</h3>
        <div className="activity-feed">
          {history.map((item, idx) => (
            <article key={`${item.type}-${idx}`} className="activity-item">
              <span className="activity-dot">{idx + 1}</span>
              <p><strong>{item.type}</strong> | {item.name} | {item.status} | {item.detail} | {formatDate(item.date)}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export function GuestListPage() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    getEventBookings().then((r) => setEvents(r.data || [])).catch(() => setEvents([]));
  }, []);

  const totalGuests = useMemo(() => events.reduce((sum, e) => sum + (e.attendees || 0), 0), [events]);

  return (
    <div className="module-page dashboard-luxe">
      <Hero
        eyebrow="Event Floor"
        title="Guest List"
        subtitle="Monitor confirmed event guests, hall usage and booking status."
        chipIcon="bi-list-check"
        chipLabel="Event Desk"
      />

      <div className="summary-grid premium-grid dashboard-kpis">
        <article className="summary-card premium-card signature-card"><div className="kpi-top"><i className="bi bi-calendar-event" /><span>Event Count</span></div><h3>{events.length}</h3><p><i className="bi bi-graph-up-arrow" /> Planned and active</p></article>
        <article className="summary-card premium-card signature-card"><div className="kpi-top"><i className="bi bi-people" /><span>Total Guests</span></div><h3>{totalGuests}</h3><p><i className="bi bi-person-check" /> Combined attendees</p></article>
      </div>

      <div className="table-wrap ops-table-wrap">
        <h3 className="ops-table-title">Event Guest Register</h3>
        <table className="data-table">
          <thead><tr><th>Customer</th><th>Contact</th><th>Event</th><th>Hall</th><th>Duration</th><th>Status</th><th>Start</th></tr></thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td>{e.customerName}</td>
                <td>{e.customerEmail || e.customerMobile || '-'}</td>
                <td>{e.eventType}</td>
                <td>{e.hallName || '-'}</td>
                <td>{e.durationHours ? `${e.durationHours} hrs` : '-'}</td>
                <td>{e.status}</td>
                <td>{formatDate(e.eventDateTime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { user } = useAuth();
  const [roomBookings, setRoomBookings] = useState([]);
  const [eventBookings, setEventBookings] = useState([]);
  const [diningBookings, setDiningBookings] = useState([]);

  useEffect(() => {
    getRoomBookings().then((res) => setRoomBookings(res.data || [])).catch(() => setRoomBookings([]));
    getEventBookings().then((res) => setEventBookings(res.data || [])).catch(() => setEventBookings([]));
    getDiningBookings().then((res) => setDiningBookings(res.data || [])).catch(() => setDiningBookings([]));
  }, []);

  const myRooms = useMemo(() => roomBookings.filter((b) => (b.customerEmail || '').toLowerCase() === (user?.email || '').toLowerCase()), [roomBookings, user?.email]);
  const myEvents = useMemo(() => {
    const email = (user?.email || '').toLowerCase();
    const fullName = (user?.fullName || '').toLowerCase();
    return eventBookings.filter((b) => {
      const bookingEmail = (b.customerEmail || '').toLowerCase();
      const bookingName = (b.customerName || '').toLowerCase();
      return bookingEmail === email || bookingName.includes(fullName);
    });
  }, [eventBookings, user?.email, user?.fullName]);
  const myDining = useMemo(() => {
    const email = (user?.email || '').toLowerCase();
    const fullName = (user?.fullName || '').toLowerCase();
    return diningBookings
      .filter((b) => {
        const contact = (b.contact || '').toLowerCase();
        const customerName = (b.customerName || '').toLowerCase();
        return contact.includes(email) || customerName.includes(fullName);
      })
      .sort((a, b) => new Date(b.bookingDateTime || 0) - new Date(a.bookingDateTime || 0));
  }, [diningBookings, user?.email, user?.fullName]);

  return (
    <div className="module-page dashboard-luxe">
      <Hero
        eyebrow="Personal Hub"
        title="My Profile"
        subtitle="View your details and booking activity in one elegant space."
        chipIcon="bi-person-circle"
        chipLabel="Guest Profile"
      />

      <div className="summary-grid premium-grid dashboard-kpis">
        <article className="summary-card premium-card signature-card"><div className="kpi-top"><i className="bi bi-envelope" /><span>Email</span></div><h3>{user?.email || '-'}</h3><p><i className="bi bi-check2-circle" /> Verified account</p></article>
        <article className="summary-card premium-card signature-card"><div className="kpi-top"><i className="bi bi-door-open" /><span>My Room Bookings</span></div><h3>{myRooms.length}</h3><p><i className="bi bi-graph-up-arrow" /> Stay records</p></article>
        <article className="summary-card premium-card signature-card"><div className="kpi-top"><i className="bi bi-calendar-plus" /><span>My Event Bookings</span></div><h3>{myEvents.length}</h3><p><i className="bi bi-stars" /> Event planning</p></article>
        <article className="summary-card premium-card signature-card"><div className="kpi-top"><i className="bi bi-cup-hot" /><span>My Dining Orders</span></div><h3>{myDining.length}</h3><p><i className="bi bi-lightning-charge" /> Food services</p></article>
      </div>

      <div className="table-wrap ops-table-wrap" style={{ marginTop: '24px' }}>
        <h3 className="ops-table-title">My Restaurant Reservations</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Menu / Reservation</th>
              <th>Guests</th>
              <th>Table</th>
              <th>Status</th>
              <th>Special Request</th>
            </tr>
          </thead>
          <tbody>
            {myDining.length === 0 ? (
              <tr>
                <td colSpan={6}>No restaurant reservations found for your account yet.</td>
              </tr>
            ) : (
              myDining.map((row) => (
                <tr key={row.id}>
                  <td>{formatDate(row.bookingDateTime)}</td>
                  <td>{row.menuItem || '-'}</td>
                  <td>{row.guests ?? '-'}</td>
                  <td>{row.tableNumber ?? '-'}</td>
                  <td>{row.status || '-'}</td>
                  <td>{row.specialRequest || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
