import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  createDiningBooking,
  createEventBooking,
  createPayroll,
  createRoom,
  createRoomBooking,
  deleteDiningBooking,
  deleteEventBooking,
  deletePayroll,
  deleteRoom,
  deleteRoomBooking,
  diningAnalytics,
  eventAnalytics,
  getDiningBookings,
  getEventBookings,
  getPayroll,
  getRooms,
  getRoomBookings,
  payrollSummary,
  roomBookingAnalytics,
  updateDiningBooking,
  updateEventBooking,
  updatePayroll,
  updateRoom,
  updateRoomBooking
} from '../api/service';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../auth/role';
import { eventHalls } from '../data/eventHalls';

function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '-';
  return n.toFixed(2);
}

function formatCurrency(value) {
  const amount = Number(value) || 0;
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

function formatDateTimeInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === 'string' ? value.slice(0, 16) : '';
  }
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function formatDurationLabel(start, end) {
  if (!start || !end) return '';
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return '';
  const milliseconds = endDate.getTime() - startDate.getTime();
  if (milliseconds <= 0) return '';
  const totalMinutes = Math.floor(milliseconds / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}min`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}min`;
}

function calculateDurationHours(start, end) {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0;
  const milliseconds = endDate.getTime() - startDate.getTime();
  if (milliseconds <= 0) return 0;
  return Number((milliseconds / (1000 * 60 * 60)).toFixed(2));
}

function isActiveEvent(row) {
  const status = (row?.status || '').toUpperCase();
  if (['CANCELLED', 'COMPLETED'].includes(status)) return false;

  const now = new Date();
  const startDate = new Date(row?.eventDateTime);
  const endDate = new Date(row?.endDateTime);
  const hasValidStart = !Number.isNaN(startDate.getTime());
  const hasValidEnd = !Number.isNaN(endDate.getTime());

  if (hasValidStart && hasValidEnd) {
    return endDate > now;
  }

  if (hasValidStart) {
    return startDate >= now;
  }

  return status === 'CONFIRMED';
}

const empty = {
  payroll: { employeeName: '', department: '', employeeCode: '', workingDays: 26, absentDays: 0, overtimeHours: 0, baseSalary: 0, overtimeRate: 0, bonus: 0, deductions: 0, epf: 0, tax: 0, payrollMonth: new Date().toISOString().slice(0, 7) },
  restaurant: { customerName: '', contact: '', guests: 2, bookingDateTime: '', category: 'Dinner', menuItem: '', quantity: 1, unitPrice: 0, tableNumber: 1, specialRequest: '', status: 'PENDING' },
  events: { customerName: '', customerEmail: '', customerMobile: '', eventType: 'Wedding', hallName: '', packageName: 'Standard', eventDateTime: '', endDateTime: '', durationHours: 0, attendees: 50, pricePerGuest: 0, totalPrice: 0, notes: '', status: 'INQUIRY' },
  rooms: { roomNumber: '', roomType: 'Deluxe', description: '', photoUrl: '', capacity: 2, pricePerNight: 0, weekendPricePerNight: 0, specialRate: 0, available: true, status: 'AVAILABLE' },
  roomBooking: { customerName: '', customerEmail: '', roomNumber: '', checkInDate: '', checkOutDate: '', guestCount: 1, status: 'CONFIRMED' }
};

function OperationsPage({ type }) {
  const { user } = useAuth();
  const location = useLocation();
  const bookingFormRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [form, setForm] = useState(empty[type] || {});
  const [bookingForm, setBookingForm] = useState(empty.roomBooking);
  const [editId, setEditId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [pageError, setPageError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(true);

  const meta = useMemo(() => {
    if (type === 'payroll') return { title: 'User & Payroll Management', subtitle: 'Salary generation, deductions, EPF/Tax and monthly summaries.', icon: 'bi-cash-stack', code: 'Payroll Suite' };
    if (type === 'restaurant') return { title: 'Restaurant & Dining Management', subtitle: 'Orders, status flow, table assignment and order analytics.', icon: 'bi-cup-hot', code: 'Dining Studio' };
    if (type === 'events') return { title: 'Event Management', subtitle: 'Booking lifecycle, hall allocation and event revenue tracking.', icon: 'bi-calendar-event', code: 'Event Atelier' };
    return { title: 'Room Management', subtitle: 'Room inventory, reservation handling and double-booking prevention.', icon: 'bi-building', code: 'Room Gallery' };
  }, [type]);

  const isEventBookingPage = type === 'events' && ['/event-booking', '/book-event'].includes(location.pathname);
  const canManageEventRecords = type !== 'events' || !isEventBookingPage;
  const isEditingRecord = Boolean(editId) && (type !== 'events' || canManageEventRecords);
  const isCustomerEventBookingPage = isEventBookingPage && user?.role === ROLES.CUSTOMER;
  const eventStatusOptions = isCustomerEventBookingPage
    ? ['INQUIRY']
    : isEventBookingPage
    ? ['INQUIRY', 'CANCELLED']
    : ['INQUIRY', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
  const keyMetric = analytics.totalRevenue || analytics.revenue || analytics.netTotal || analytics.eventRevenue || analytics.activeBookings || analytics.records || '-';
  const lockCustomerReservationIdentity = type === 'restaurant' && user?.role === ROLES.CUSTOMER;
  const selectedEventHall = type === 'events'
    ? eventHalls.find((hall) => hall.name === form.hallName) || null
    : null;
  const customerEventRows = type === 'events' && isCustomerEventBookingPage
    ? rows.filter((row) => (row.customerEmail || '').toLowerCase() === (user?.email || '').toLowerCase())
    : rows;
  const overallEventRows = type === 'events'
    ? rows
    : [];
  const activeEventCount = type === 'events'
    ? customerEventRows.filter((row) => isActiveEvent(row)).length
    : 0;
  const pendingConfirmationCount = type === 'events'
    ? customerEventRows.filter((row) => (row.status || '').toUpperCase() === 'INQUIRY').length
    : 0;
  const currentMonthEventRevenue = type === 'events'
    ? rows.reduce((sum, row) => {
        const status = (row.status || '').toUpperCase();
        if (!['CONFIRMED', 'COMPLETED'].includes(status)) return sum;

        const eventDate = new Date(row.eventDateTime);
        const now = new Date();
        if (Number.isNaN(eventDate.getTime())) return sum;
        if (eventDate.getFullYear() !== now.getFullYear() || eventDate.getMonth() !== now.getMonth()) return sum;

        return sum + (Number(row.totalPrice || row.totalCost) || 0);
      }, 0)
    : 0;
  const mostPopularHall = type === 'events'
    ? (() => {
        const canonicalHallNames = new Map(
          eventHalls.map((hall) => [hall.name.trim().toLowerCase(), hall.name])
        );
        const hallCounts = overallEventRows.reduce((counts, row) => {
          const rawHallName = (row.hallName || '').trim();
          if (!rawHallName) return counts;
          const normalizedHallKey = rawHallName.toLowerCase();
          const canonicalHallName = canonicalHallNames.get(normalizedHallKey) || rawHallName;
          counts.set(canonicalHallName, (counts.get(canonicalHallName) || 0) + 1);
          return counts;
        }, new Map());

        let topHall = '-';
        let topCount = 0;
        hallCounts.forEach((count, hallName) => {
          if (count > topCount) {
            topHall = hallName;
            topCount = count;
          }
        });

        return topHall;
      })()
    : '-';
  const eventDurationHours = type === 'events' ? calculateDurationHours(form.eventDateTime, form.endDateTime) : 0;
  const eventDurationLabel = type === 'events' ? formatDurationLabel(form.eventDateTime, form.endDateTime) : '';
  const eventTotalPrice = type === 'events'
    ? Number((((Number(form.pricePerGuest) || 0) * eventDurationHours) + (form.packageName === 'Premium' ? 10000 : 0)).toFixed(2))
    : 0;

  const load = async () => {
    setLoading(true);
    setPageError('');
    try {
      if (type === 'payroll') {
        const [list, summary] = await Promise.all([getPayroll(), payrollSummary()]);
        setRows(list.data || []);
        setAnalytics(summary.data || {});
      } else if (type === 'restaurant') {
        const [list, summary] = await Promise.all([getDiningBookings(), diningAnalytics()]);
        setRows(list.data || []);
        setAnalytics(summary.data || {});
      } else if (type === 'events') {
        if (canManageEventRecords) {
          const [list, summary] = await Promise.all([getEventBookings(), eventAnalytics()]);
          setRows(list.data || []);
          setAnalytics(summary.data || {});
        } else {
          const list = await getEventBookings();
          setRows(list.data || []);
          setAnalytics({});
        }
      } else {
        const [list, bookings, summary] = await Promise.all([getRooms(), getRoomBookings(), roomBookingAnalytics()]);
        setRows((list.data || []).map((x) => ({ ...x, _kind: 'room' })).concat((bookings.data || []).map((x) => ({ ...x, _kind: 'booking' }))));
        setAnalytics(summary.data || {});
      }
    } catch (e) {
      setPageError(e.response?.data?.message || e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (type === 'events' && !canManageEventRecords) {
      setEditId(null);
    }
  }, [type, canManageEventRecords]);

  useEffect(() => {
    setEditId(null);
    const nextForm = { ...(empty[type] || {}) };
    if (type === 'restaurant' && user?.role === ROLES.CUSTOMER) {
      nextForm.customerName = user.fullName || '';
      nextForm.contact = user.email || '';
    }
    if (type === 'events' && user?.role === ROLES.CUSTOMER) {
      nextForm.customerName = user.fullName || '';
      nextForm.customerEmail = user.email || '';
      nextForm.customerMobile = user.phone || '';
    }
    setForm(nextForm);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, user?.role, user?.fullName, user?.email, user?.phone, canManageEventRecords]);

  const handleSelectEventHall = (hall) => {
    setEditId(null);
    setFormError('');
    setForm((current) => ({
      ...(empty.events || {}),
      ...current,
      customerName: current.customerName || (user?.role === ROLES.CUSTOMER ? user.fullName || '' : ''),
      customerEmail: current.customerEmail || (user?.role === ROLES.CUSTOMER ? user.email || '' : ''),
      customerMobile: current.customerMobile || (user?.role === ROLES.CUSTOMER ? user.phone || '' : ''),
      hallName: hall.name,
      packageName: current.packageName || 'Standard',
      pricePerGuest: hall.price_per_hour,
      notes: current.notes || `Venue Type: ${hall.type} | Capacity: ${hall.capacity}`
    }));
    bookingFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setPageError('');
    setFormError('');
    try {
      let finalForm = { ...form };
      if (type === 'payroll') {
        const computedNetSalary = (Number(form.baseSalary) || 0) +
          (Number(form.overtimeHours) || 0) * (Number(form.overtimeRate) || 0) +
          (Number(form.bonus) || 0) -
          (Number(form.deductions) || 0) -
          (Number(form.epf) || 0) -
          (Number(form.tax) || 0);
        
        const pm = form.payrollMonth || new Date().toISOString().slice(0, 7);
        const [yyyy, mm] = pm.split('-');

        finalForm = { 
          ...finalForm, 
          netSalary: computedNetSalary,
          totalOvertimeHours: Number(form.overtimeHours) || 0,
          overtimePay: ((Number(form.overtimeHours) || 0) * (Number(form.overtimeRate) || 0)) + (Number(form.bonus) || 0),
          month: parseInt(mm, 10),
          year: parseInt(yyyy, 10),
          payrollMonth: pm
        };
      }
      if (type === 'events') {
        if (!finalForm.customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(finalForm.customerEmail)) {
          throw new Error('Customer email must be a valid email address');
        }
        if (!/^\d{10}$/.test(finalForm.customerMobile || '')) {
          throw new Error('Customer mobile number must be exactly 10 digits');
        }
        if (!finalForm.eventDateTime || !finalForm.endDateTime) {
          throw new Error('Starting date & time and end date & time are required');
        }
        if (new Date(finalForm.endDateTime) <= new Date(finalForm.eventDateTime)) {
          throw new Error('End date & time must be after starting date & time');
        }
        finalForm = {
          ...finalForm,
          durationHours: eventDurationHours,
          totalPrice: eventTotalPrice,
          totalCost: eventTotalPrice
        };
      }

      if (editId) {
        if (type === 'events' && !canManageEventRecords) {
          throw new Error('Editing event records is not allowed on the event booking page');
        }
        if (type === 'payroll') await updatePayroll(editId, finalForm);
        if (type === 'restaurant') await updateDiningBooking(editId, finalForm);
        if (type === 'events') await updateEventBooking(editId, finalForm);
        if (type === 'rooms') await updateRoom(editId, finalForm);
        setEditId(null);
      } else {
        if (type === 'payroll') await createPayroll(finalForm);
        if (type === 'restaurant') await createDiningBooking(finalForm);
        if (type === 'events') await createEventBooking(finalForm);
        if (type === 'rooms') await createRoom(finalForm);
      }
      const resetForm = { ...(empty[type] || {}) };
      if (type === 'restaurant' && user?.role === ROLES.CUSTOMER) {
        resetForm.customerName = user.fullName || '';
        resetForm.contact = user.email || '';
      }
      if (type === 'events' && user?.role === ROLES.CUSTOMER) {
        resetForm.customerName = user.fullName || '';
        resetForm.customerEmail = user.email || '';
        resetForm.customerMobile = user.phone || '';
      }
      setForm(resetForm);
      setFormError('');
      await load();
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Operation failed';
      if (type === 'events') {
        setFormError(message);
      } else {
        setPageError(message);
      }
    }
  };

  const handleEdit = (row) => {
    if (type === 'events' && !canManageEventRecords) {
      return;
    }
    setEditId(row.id);
    setFormError('');
    const { id, _kind, createdAt, updatedAt, ...rest } = row;
    
    // Map back backwards-compatibility fields for form state
    if (type === 'payroll') {
      rest.overtimeHours = rest.totalOvertimeHours || 0;
      // Reverse engineer bonus if we assume overtimePay holds both
      const knownOvertime = (rest.totalOvertimeHours || 0) * (rest.overtimeRate || 0);
      rest.bonus = (rest.overtimePay || 0) - knownOvertime;
      if (rest.bonus < 0) rest.bonus = 0;
    }

    if (type === 'events') {
      rest.eventDateTime = formatDateTimeInput(rest.eventDateTime);
      rest.endDateTime = formatDateTimeInput(rest.endDateTime);
    }

    setForm({ ...(empty[type] || {}), ...rest });
    if (type === 'events' && bookingFormRef.current) {
      bookingFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateRoomBooking = async (e) => {
    e.preventDefault();
    setPageError('');
    try {
      await createRoomBooking(bookingForm);
      setBookingForm(empty.roomBooking);
      await load();
    } catch (err) {
      setPageError(err.response?.data?.message || err.message || 'Booking failed');
    }
  };

  const handleDelete = async (row) => {
    if (type === 'events' && !canManageEventRecords) {
      return;
    }
    try {
      if (type === 'payroll') await deletePayroll(row.id);
      if (type === 'restaurant') await deleteDiningBooking(row.id);
      if (type === 'events') await deleteEventBooking(row.id);
      if (type === 'rooms' && row._kind === 'room') await deleteRoom(row.id);
      if (type === 'rooms' && row._kind === 'booking') await deleteRoomBooking(row.id);
      await load();
    } catch (err) {
      setPageError(err.response?.data?.message || err.message || 'Delete failed');
    }
  };

  const renderFields = () => {
    if (type === 'payroll') {
      const computedNet = (Number(form.baseSalary) || 0) +
        (Number(form.overtimeHours) || 0) * (Number(form.overtimeRate) || 0) +
        (Number(form.bonus) || 0) -
        (Number(form.deductions) || 0) -
        (Number(form.epf) || 0) -
        (Number(form.tax) || 0);

      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', width: '100%' }}>
          <label>Employee Name<input placeholder="Ex: John Doe" value={form.employeeName} onChange={(e) => setForm({ ...form, employeeName: e.target.value })} required /></label>
          <label>Department<input placeholder="Ex: Kitchen" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></label>
          <label>Employee Code<input placeholder="Ex: EMP-101" value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} /></label>
          <label>Payroll Month<input type="month" value={form.payrollMonth} onChange={(e) => setForm({ ...form, payrollMonth: e.target.value })} /></label>
          
          <label>Working Days<input type="number" placeholder="26" value={form.workingDays} onChange={(e) => setForm({ ...form, workingDays: Number(e.target.value) })} /></label>
          <label>Absent Days<input type="number" placeholder="0" value={form.absentDays} onChange={(e) => setForm({ ...form, absentDays: Number(e.target.value) })} /></label>
          
          <label>Overtime Hours<input type="number" placeholder="0" value={form.overtimeHours} onChange={(e) => setForm({ ...form, overtimeHours: Number(e.target.value) })} /></label>
          <label>Overtime Rate ($)<input type="number" placeholder="0" value={form.overtimeRate} onChange={(e) => setForm({ ...form, overtimeRate: Number(e.target.value) })} /></label>
          
          <label>Base Salary ($)<input type="number" placeholder="Base Salary" value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: Number(e.target.value) })} /></label>
          <label>Bonus ($)<input type="number" placeholder="Bonus" value={form.bonus} onChange={(e) => setForm({ ...form, bonus: Number(e.target.value) })} /></label>
          
          <label>Deductions ($)<input type="number" placeholder="0" value={form.deductions} onChange={(e) => setForm({ ...form, deductions: Number(e.target.value) })} /></label>
          <label>EPF/ETF ($)<input type="number" placeholder="0" value={form.epf} onChange={(e) => setForm({ ...form, epf: Number(e.target.value) })} /></label>
          <label>Tax ($)<input type="number" placeholder="0" value={form.tax} onChange={(e) => setForm({ ...form, tax: Number(e.target.value) })} /></label>

          <div className="summary-card signature-card" style={{ gridColumn: '1 / -1', marginTop: '16px', padding: '16px', border: '1px solid var(--accent-gold)' }}>
            <p className="eyebrow">Auto-Calculation Preview</p>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: 0 }}>Net Salary: ${computedNet.toFixed(2)}</h3>
          </div>
        </div>
      );
    }
    if (type === 'restaurant') {
      return (
        <>
          <input
            placeholder="Customer Name"
            value={form.customerName}
            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            readOnly={lockCustomerReservationIdentity}
            required
          />
          <input
            placeholder="Contact"
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
            readOnly={lockCustomerReservationIdentity}
          />
          <input placeholder="Menu Item" value={form.menuItem} onChange={(e) => setForm({ ...form, menuItem: e.target.value })} required />
          <input type="number" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
          <input type="number" placeholder="Unit Price" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })} />
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option>PENDING</option><option>PREPARING</option><option>READY</option><option>SERVED</option><option>CANCELLED</option>
          </select>
        </>
      );
    }
    if (type === 'events') {
      return (
        <div className="event-form-layout">
          <label>
            Customer Name
            <input placeholder="Customer Name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} required />
          </label>
          <label>
            Customer Email
            <input
              type="email"
              placeholder="customer@example.com"
              value={form.customerEmail}
              onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
              required
            />
          </label>
          <label>
            Customer Mobile Number
            <input
              type="tel"
              placeholder="07X XXX XXXX"
              value={form.customerMobile}
              onChange={(e) => setForm({ ...form, customerMobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              pattern="\d{10}"
              minLength="10"
              maxLength="10"
              required
            />
          </label>
          <label>
            Event Type
            <input placeholder="Wedding, Seminar, Birthday..." value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })} required />
          </label>
          <label>
            Hall Name
            <select
              value={form.hallName}
              onChange={(e) => {
                const nextHall = eventHalls.find((hall) => hall.name === e.target.value);
                setForm({
                  ...form,
                  hallName: e.target.value,
                  pricePerGuest: nextHall ? nextHall.price_per_hour : form.pricePerGuest
                });
              }}
              required
            >
              <option value="">Select Hall</option>
              {eventHalls.map((hall) => <option key={hall.name} value={hall.name}>{hall.name}</option>)}
            </select>
          </label>
          <label>
            Package Name
            <select value={form.packageName} onChange={(e) => setForm({ ...form, packageName: e.target.value })} required>
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
            </select>
          </label>
          <label>
            Starting Date & Time
            <input type="datetime-local" value={form.eventDateTime} onChange={(e) => setForm({ ...form, eventDateTime: e.target.value })} required />
          </label>
          <label>
            End Date & Time
            <input
              type="datetime-local"
              value={form.endDateTime}
              onChange={(e) => setForm({ ...form, endDateTime: e.target.value })}
              min={form.eventDateTime || undefined}
              disabled={!form.eventDateTime}
              required
            />
          </label>
          <label>
            Duration
            <input type="text" value={eventDurationLabel} placeholder="0h 0min" readOnly />
          </label>
          <label>
            Attendees
            <input type="number" min="1" placeholder="Attendees" value={form.attendees} onChange={(e) => setForm({ ...form, attendees: Number(e.target.value) })} />
          </label>
          <label>
            Price / Hour (LKR)
            <input type="number" min="0" placeholder="Hall rate" value={form.pricePerGuest} onChange={(e) => setForm({ ...form, pricePerGuest: Number(e.target.value) })} />
          </label>
          <label>
            Total Price for Hall/Decorations (LKR)
            <input type="text" value={eventDurationHours > 0 ? formatCurrency(eventTotalPrice) : ''} placeholder="0.00" readOnly />
          </label>
          <label>
            Booking Status
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {eventStatusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
          <label className="event-form-notes">
            Special Notes
            <textarea rows="4" placeholder="Decor, catering, theme, timing or any special requests" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </label>

          {selectedEventHall && (
            <article className="event-selection-summary">
              <div className="kpi-top">
                <i className="bi bi-building" />
                <span>Selected Hall</span>
              </div>
              <h4>{selectedEventHall.name}</h4>
              <p>{selectedEventHall.description}</p>
              <div className="event-selection-meta">
                <span><i className="bi bi-house-door" /> {selectedEventHall.type}</span>
                <span><i className="bi bi-people" /> {selectedEventHall.capacity} Guests</span>
                <span><i className="bi bi-cash-coin" /> {formatCurrency(selectedEventHall.price_per_hour)} / hour</span>
              </div>
            </article>
          )}
        </div>
      );
    }
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', width: '100%' }}>
        <input placeholder="Room Number" value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} required />
        <input placeholder="Room Type" value={form.roomType} onChange={(e) => setForm({ ...form, roomType: e.target.value })} required />
        <input placeholder="Photo URL" value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} />
        <input placeholder="Room Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input type="number" placeholder="Capacity" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
        <input type="number" placeholder="Price Per Night" value={form.pricePerNight} onChange={(e) => setForm({ ...form, pricePerNight: Number(e.target.value) })} />
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option>AVAILABLE</option><option>OCCUPIED</option><option>RESERVED</option><option>CLEANING</option><option>MAINTENANCE</option>
        </select>
        <label className="inline-check" style={{ alignSelf: 'center' }}><input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} /> Available</label>
      </div>
    );
  };

  const currentRows = useMemo(() => {
    let res = [...rows];
    if (type === 'events' && isCustomerEventBookingPage) {
      res = [...customerEventRows];
    }
    if (type === 'payroll') {
      if (searchQuery) {
        res = res.filter((r) => 
          (r.employeeName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
          (r.department || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      if (filterMonth) {
        res = res.filter((r) => r.payrollMonth === filterMonth);
      }
    }
    return res;
  }, [rows, type, searchQuery, filterMonth, isCustomerEventBookingPage, customerEventRows]);

  const renderRecordsTable = () => {
    if (loading) {
      return <p className="loading-line">Loading module data...</p>;
    }

    return (
      <div className="table-wrap ops-table-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
          <h3 className="ops-table-title" style={{ margin: 0 }}>Latest Records</h3>
          {type === 'payroll' && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                placeholder="Search Employee or Dept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '200px' }}
              />
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              />
              <button type="button" className="secondary-btn" onClick={() => { setSearchQuery(''); setFilterMonth(''); }}>Clear</button>
            </div>
          )}
        </div>
        <table className="data-table">
          {type === 'restaurant' ? (
            <>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Date & Time</th>
                  <th>Reservation/Menu</th>
                  <th>Guests</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((row) => (
                  <tr key={`restaurant-${row.id}`}>
                    <td>{row.id}</td>
                    <td>{row.customerName || '-'}</td>
                    <td>{row.contact || '-'}</td>
                    <td>{formatDate(row.bookingDateTime)}</td>
                    <td>{row.menuItem || row.category || '-'}</td>
                    <td>{row.guests ?? '-'}</td>
                    <td>{row.status || '-'}</td>
                    <td>{row.totalAmount ?? '-'}</td>
                    <td>
                      <button type="button" className="secondary-btn" style={{ marginRight: '8px', padding: '6px 12px' }} onClick={() => handleEdit(row)}>Edit</button>
                      <button type="button" className="danger-btn" style={{ padding: '6px 12px' }} onClick={() => handleDelete(row)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </>
          ) : type === 'payroll' ? (
            <>
              <thead>
                <tr>
                  <th>Emp Code</th>
                  <th>Name/Dept</th>
                  <th>Month</th>
                  <th>Base + Gross</th>
                  <th>Deductions + Tax</th>
                  <th>Net Salary</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((row) => (
                  <tr key={`payroll-${row.id}`}>
                    <td>{row.employeeCode || '-'}</td>
                    <td>
                      <strong>{row.employeeName || '-'}</strong>
                      <div style={{ fontSize: '0.8rem', color: '#888' }}>{row.department || '-'}</div>
                    </td>
                    <td>{row.payrollMonth || '-'}</td>
                    <td>
                      <div style={{ fontSize: '0.9rem' }}>Base: ${row.baseSalary ?? 0}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--accent-gold)' }}>+ Bonus/OT: ${(row.bonus ?? 0) + ((row.overtimeHours ?? 0) * (row.overtimeRate ?? 0))}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.9rem' }}>Ded: ${row.deductions ?? 0}</div>
                      <div style={{ fontSize: '0.8rem', color: '#ff4d4d' }}>- EPF/Tax: ${(row.epf ?? 0) + (row.tax ?? 0)}</div>
                    </td>
                    <td style={{ fontWeight: '600' }}>${row.netSalary ?? 0}</td>
                    <td>
                      <button type="button" className="secondary-btn" style={{marginRight: '8px', padding: '6px 12px'}} onClick={() => handleEdit(row)}>Edit</button>
                      <button type="button" className="danger-btn" style={{padding: '6px 12px'}} onClick={() => handleDelete(row)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </>
          ) : type === 'events' ? (
            <>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Event</th>
                  <th>Schedule</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Total</th>
                  {canManageEventRecords && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {currentRows.map((row) => (
                  <tr key={`events-${row.id}`}>
                    <td>
                      <strong>{row.customerName || '-'}</strong>
                      <div style={{ fontSize: '0.8rem', color: '#888' }}>{row.hallName || '-'}</div>
                    </td>
                    <td>
                      <div>{row.customerEmail || '-'}</div>
                      <div style={{ fontSize: '0.8rem', color: '#888' }}>{row.customerMobile || '-'}</div>
                    </td>
                    <td>
                      <div>{row.eventType || '-'}</div>
                      <div style={{ fontSize: '0.8rem', color: '#888' }}>{row.packageName || '-'}</div>
                    </td>
                    <td>
                      <div>{formatDate(row.eventDateTime)}</div>
                      <div style={{ fontSize: '0.8rem', color: '#888' }}>to {formatDate(row.endDateTime)}</div>
                    </td>
                    <td>{row.durationHours ? `${row.durationHours} hrs` : '-'}</td>
                    <td>{row.status || '-'}</td>
                    <td>{formatCurrency(row.totalPrice || row.totalCost)}</td>
                    {canManageEventRecords && (
                      <td>
                        <button type="button" className="secondary-btn" style={{marginRight: '8px', padding: '6px 12px'}} onClick={() => handleEdit(row)}>Edit</button>
                        <button type="button" className="danger-btn" style={{padding: '6px 12px'}} onClick={() => handleDelete(row)}>Delete</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </>
          ) : (
            <>
              <thead>
                <tr>
                  <th>ID</th><th>Name/Title</th><th>Status</th><th>Amount</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((row) => (
                  <tr key={`${row._kind || type}-${row.id}`}>
                    <td>{row.id}</td>
                    <td>{row.employeeName || row.customerName || row.roomNumber || row.eventType || row.menuItem}</td>
                    <td>{row.status || row._kind || '-'}</td>
                    <td>{row.netSalary || row.totalAmount || row.totalCost || row.pricePerNight || '-'}</td>
                    <td>
                      <button type="button" className="secondary-btn" style={{marginRight: '8px', padding: '6px 12px'}} onClick={() => handleEdit(row)}>Edit</button>
                      <button type="button" className="danger-btn" style={{padding: '6px 12px'}} onClick={() => handleDelete(row)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </>
          )}
        </table>
      </div>
    );
  };

  return (
    <div className="module-page dashboard-luxe operations-luxe">
      <div className="dash-hero luxe-hero">
        <div className="module-head">
          <p className="eyebrow">{meta.code}</p>
          <h2>{meta.title}</h2>
          <p>{meta.subtitle}</p>
        </div>
        <div className="hero-chip">
          <i className={`bi ${meta.icon}`} />
          Live Module
        </div>
      </div>

      {pageError && <div className="inline-error">{pageError}</div>}

      <div className="summary-grid premium-grid dashboard-kpis">
        {type === 'events' ? (
          <>
            {(!isCustomerEventBookingPage || customerEventRows.length > 0) && (
              <article className="summary-card premium-card signature-card">
                <div className="kpi-top"><i className={`bi ${meta.icon}`} /><span>Active Events</span></div>
                <h3>{activeEventCount}</h3>
                <p><i className="bi bi-calendar-check" /> Upcomming and Ongoing Events</p>
              </article>
            )}
            {(!isCustomerEventBookingPage || customerEventRows.length > 0) && (
              <article className="summary-card premium-card signature-card">
                <div className="kpi-top"><i className="bi bi-hourglass-split" /><span>Pending Confirmation</span></div>
                <h3>{pendingConfirmationCount}</h3>
                <p><i className="bi bi-clock-history" /> Inquiry requests to be confirmed</p>
              </article>
            )}
            {!canManageEventRecords && (
              <article className="summary-card premium-card signature-card">
                <div className="kpi-top"><i className="bi bi-building-check" /><span>Most Popular Hall</span></div>
                <h3>{mostPopularHall}</h3>
                <p><i className="bi bi-stars" /> Most frequently booked venue overall</p>
              </article>
            )}
            {canManageEventRecords && (
              <article className="summary-card premium-card signature-card">
                <div className="kpi-top"><i className="bi bi-cash-stack" /><span>Event Revenue in this Month</span></div>
                <h3>{formatCurrency(currentMonthEventRevenue)}</h3>
                <p><i className="bi bi-bar-chart-line" /> Confirmed and completed events this month</p>
              </article>
            )}
          </>
        ) : (
          <>
            <article className="summary-card premium-card signature-card">
              <div className="kpi-top"><i className={`bi ${meta.icon}`} /><span>Total Records</span></div>
              <h3>{rows.length}</h3>
              <p><i className="bi bi-graph-up-arrow" /> Active items in this module</p>
            </article>
            <article className="summary-card premium-card signature-card">
              <div className="kpi-top"><i className="bi bi-stars" /><span>Key Metric</span></div>
              <h3>{keyMetric}</h3>
              <p><i className="bi bi-lightning-charge" /> Real-time operational signal</p>
            </article>
            <article className="summary-card premium-card signature-card">
              <div className="kpi-top"><i className="bi bi-bar-chart" /><span>Analytics Fields</span></div>
              <h3>{Object.keys(analytics).length}</h3>
              <p><i className="bi bi-clock-history" /> Synced from backend summary</p>
            </article>
          </>
        )}
      </div>

      {type === 'events' && canManageEventRecords && renderRecordsTable()}

      {type === 'events' && (
        <section className="dash-section">
          <div className="module-head" style={{ marginBottom: '24px' }}>
            <p className="eyebrow">Venue Collection</p>
            <h2 style={{ fontSize: '32px', marginBottom: '10px' }}>Event Hall Listing</h2>
            <p>Browse available venues and prefill the booking form with one click.</p>
          </div>

          <div className="event-hall-grid">
            {eventHalls.map((hall) => (
              <article className="event-hall-card" key={hall.name}>
                <div className="event-hall-media">
                  <img src={hall.image} alt={hall.name} className="event-hall-image" />
                  <span className="event-hall-badge">{hall.type}</span>
                </div>
                <div className="event-hall-content">
                  <p className="room-type">Event Hall</p>
                  <h3>{hall.name}</h3>
                  <p className="room-description">{hall.description}</p>

                  <div className="event-hall-specs">
                    <span><i className="bi bi-people" /> Capacity: {hall.capacity}</span>
                    <span><i className="bi bi-cash-stack" /> {formatCurrency(hall.price_per_hour)} / hour</span>
                  </div>

                  <button type="button" className="primary-action event-book-btn" onClick={() => handleSelectEventHall(hall)}>
                    Book Now
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="ops-grid">
        <section className="ops-panel" ref={type === 'events' ? bookingFormRef : null}>
          <h3>{type === 'events' ? (isEditingRecord ? 'Edit Event Booking' : 'Create Event Booking') : (editId ? 'Edit Record' : 'Create Record')}</h3>
          <form className="crud-form premium-form" onSubmit={handleCreateOrUpdate}>
            {renderFields()}
            {type === 'events' && formError && <div className="inline-error">{formError}</div>}
            <div style={{display: 'flex', gap: '12px'}}>
              <button type="submit" className="primary-action">{isEditingRecord ? 'Update' : 'Create'}</button>
              {(editId || type === 'events') && (
                 <button type="button" className="secondary-action" onClick={() => {
                   setEditId(null);
                   const resetForm = { ...(empty[type] || {}) };
                   if (type === 'restaurant' && user?.role === ROLES.CUSTOMER) {
                     resetForm.customerName = user.fullName || '';
                     resetForm.contact = user.email || '';
                   }
                   if (type === 'events' && user?.role === ROLES.CUSTOMER) {
                     resetForm.customerName = user.fullName || '';
                     resetForm.customerEmail = user.email || '';
                     resetForm.customerMobile = user.phone || '';
                   }
                   setForm(resetForm);
                 }}>{isEditingRecord ? 'Cancel' : 'Clear Form'}</button>
              )}
            </div>
          </form>
        </section>

        {type === 'rooms' && (
          <section className="ops-panel">
            <h3>Create Room Booking</h3>
            <form className="crud-form premium-form" onSubmit={handleCreateRoomBooking}>
              <input placeholder="Booking Customer" value={bookingForm.customerName} onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })} required />
              <input placeholder="Customer Email" value={bookingForm.customerEmail} onChange={(e) => setBookingForm({ ...bookingForm, customerEmail: e.target.value })} required />
              <input placeholder="Room Number" value={bookingForm.roomNumber} onChange={(e) => setBookingForm({ ...bookingForm, roomNumber: e.target.value })} required />
              <input type="date" value={bookingForm.checkInDate} onChange={(e) => setBookingForm({ ...bookingForm, checkInDate: e.target.value })} required />
              <input type="date" value={bookingForm.checkOutDate} onChange={(e) => setBookingForm({ ...bookingForm, checkOutDate: e.target.value })} required />
              <button type="submit" className="primary-action">Create Booking</button>
            </form>
          </section>
        )}
      </div>

      {!(type === 'events' && canManageEventRecords) && renderRecordsTable()}
    </div>
  );
}

export default OperationsPage;
