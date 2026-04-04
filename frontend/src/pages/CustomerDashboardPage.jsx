import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDiningBookings, getEventBookings, getRoomBookings, getSummary } from '../api/service';
import { useAuth } from '../context/AuthContext';

function CustomerDashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [roomBookings, setRoomBookings] = useState([]);
  const [eventBookings, setEventBookings] = useState([]);
  const [diningBookings, setDiningBookings] = useState([]);

  useEffect(() => {
    getSummary().then((res) => setSummary(res.data)).catch(() => setSummary(null));

    getRoomBookings()
      .then((res) => setRoomBookings(res.data || []))
      .catch(() => setRoomBookings([]));
    getEventBookings()
      .then((res) => setEventBookings(res.data || []))
      .catch(() => setEventBookings([]));
    getDiningBookings()
      .then((res) => setDiningBookings(res.data || []))
      .catch(() => setDiningBookings([]));
  }, []);

  const myRoomBookings = useMemo(
    () => roomBookings.filter((b) => (b.customerEmail || '').toLowerCase() === (user?.email || '').toLowerCase()),
    [roomBookings, user?.email]
  );

  const myEventBookings = useMemo(
    () => eventBookings.filter((b) => (b.customerName || '').toLowerCase().includes((user?.fullName || '').toLowerCase())),
    [eventBookings, user?.fullName]
  );

  const myDiningBookings = useMemo(
    () => diningBookings.filter((b) => (b.contact || '').toLowerCase().includes((user?.email || '').toLowerCase())),
    [diningBookings, user?.email]
  );

  const roomUpcoming = useMemo(() => {
    const today = new Date();
    return [...myRoomBookings]
      .filter((b) => b?.checkInDate && new Date(b.checkInDate) >= new Date(today.toDateString()))
      .sort((a, b) => new Date(a.checkInDate) - new Date(b.checkInDate))[0];
  }, [myRoomBookings]);

  const stats = [
    { key: 'my-room', label: 'My Room Bookings', icon: 'bi-door-open', value: myRoomBookings.length, trend: 'Stay planning' , tone: 'gold' },
    { key: 'my-event', label: 'My Event Requests', icon: 'bi-calendar-heart', value: myEventBookings.length, trend: 'Event pipeline', tone: 'blue' },
    { key: 'my-dining', label: 'My Dining Orders', icon: 'bi-cup-hot', value: myDiningBookings.length, trend: 'Dining schedule', tone: 'sage' },
    { key: 'all-rooms', label: 'Rooms In Hotel', icon: 'bi-building', value: summary?.rooms ?? '-', trend: 'Real-time inventory', tone: 'charcoal' },
    { key: 'all-events', label: 'Total Events', icon: 'bi-calendar-event', value: summary?.eventBookings ?? '-', trend: 'Live event board', tone: 'gold' },
    { key: 'all-orders', label: 'Restaurant Orders', icon: 'bi-receipt', value: summary?.restaurantOrders ?? '-', trend: 'Kitchen activity', tone: 'blue' }
  ];

  const quickActions = [
    { to: '/view-rooms', icon: 'bi-building', title: 'View Rooms', subtitle: 'Explore suites and rates' },
    { to: '/book-room', icon: 'bi-door-open', title: 'Book Room', subtitle: 'Reserve your next stay' },
    { to: '/view-menu', icon: 'bi-cup-hot', title: 'Restaurant & Dining', subtitle: 'Browse menus and reserve' },
    { to: '/book-event', icon: 'bi-calendar-plus', title: 'Book Event', subtitle: 'Plan celebrations in style' },
    { to: '/profile', icon: 'bi-person-circle', title: 'My Profile', subtitle: 'Manage your preferences' }
  ];

  const activityFeed = useMemo(() => {
    const roomRows = myRoomBookings.map((row) => ({
      id: `room-${row.id}`,
      type: 'Room',
      icon: 'bi-building',
      title: `${row.roomNumber || 'Room'} reservation`,
      detail: `${toDateTime(row.checkInDate, false)} to ${toDateTime(row.checkOutDate, false)}`,
      dateRaw: row.createdAt || row.checkInDate,
      status: row.status
    }));

    const diningRows = myDiningBookings.map((row) => ({
      id: `dining-${row.id}`,
      type: 'Dining',
      icon: 'bi-cup-hot',
      title: row.menuItem || 'Dining reservation',
      detail: `${row.guests || 0} guests`,
      dateRaw: row.bookingDateTime,
      status: row.status
    }));

    const eventRows = myEventBookings.map((row) => ({
      id: `event-${row.id}`,
      type: 'Event',
      icon: 'bi-calendar-event',
      title: row.eventType || 'Event booking',
      detail: row.hallName || 'Venue pending',
      dateRaw: row.eventDateTime,
      status: row.status
    }));

    return [...roomRows, ...diningRows, ...eventRows]
      .sort((a, b) => toTimestamp(b.dateRaw) - toTimestamp(a.dateRaw))
      .slice(0, 6);
  }, [myRoomBookings, myDiningBookings, myEventBookings]);

  return (
    <div className="module-page dashboard-luxe customer-dashboard">
      <section className="customer-hero-panel">
        <div className="customer-hero-copy">
          <p className="eyebrow">Guest Lounge</p>
          <h2>Luxury Guest Dashboard</h2>
          <p>Welcome back, {user?.fullName || 'Guest'}. Manage bookings, dining plans, and events from one elegant control center.</p>
        </div>
        <div className="customer-hero-aside">
          <div className="customer-hero-chip">
            <i className="bi bi-stars" />
            Gold Loyalty Tier
          </div>
          <div className="customer-hero-facts">
            <div>
              <span>Member</span>
              <strong>{user?.email || '-'}</strong>
            </div>
            <div>
              <span>Next Stay</span>
              <strong>{roomUpcoming ? toDateTime(roomUpcoming.checkInDate, false) : 'No upcoming stay'}</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="customer-stats-grid">
        {stats.map((item) => (
          <article key={item.key} className={`customer-stat-card tone-${item.tone}`}>
            <div className="customer-kpi-top"><i className={`bi ${item.icon}`} /><span>{item.label}</span></div>
            <h3>{item.value}</h3>
            <p><i className="bi bi-sparkles" /> {item.trend}</p>
          </article>
        ))}
      </div>

      <div className="dash-section">
        <h3>Quick Actions</h3>
        <div className="customer-actions-grid">
          {quickActions.map((action) => (
            <Link key={action.to} className="customer-action-tile" to={action.to}>
              <div className="icon-wrap"><i className={`bi ${action.icon}`} /></div>
              <span>{action.title}</span>
              <small>{action.subtitle}</small>
            </Link>
          ))}
        </div>
      </div>

      <div className="customer-split-grid">
        <section className="customer-panel">
          <div className="customer-panel-head">
            <h3>Recent Activity</h3>
            <span className="customer-mini-chip">Last 6 updates</span>
          </div>
          {activityFeed.length === 0 ? (
            <div className="customer-empty">
              <i className="bi bi-stars" />
              <p>Your booking journey will appear here once you make your first reservation.</p>
            </div>
          ) : (
            <div className="customer-timeline">
              {activityFeed.map((entry) => (
                <article key={entry.id} className="customer-timeline-item">
                  <div className="dot"><i className={`bi ${entry.icon}`} /></div>
                  <div className="content">
                    <div className="top-line">
                      <h4>{entry.title}</h4>
                      <span className={`customer-status-chip ${statusTone(entry.status)}`}>{entry.status || 'PENDING'}</span>
                    </div>
                    <p>{entry.detail}</p>
                    <small>{entry.type} · {toDateTime(entry.dateRaw)}</small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="customer-panel">
          <div className="customer-panel-head">
            <h3>Guest Snapshot</h3>
            <span className="customer-mini-chip">Personal summary</span>
          </div>
          <div className="snapshot-grid">
            <article>
              <span>Profile</span>
              <strong>{user?.fullName || '-'}</strong>
            </article>
            <article>
              <span>Email</span>
              <strong>{user?.email || '-'}</strong>
            </article>
            <article>
              <span>Total Active Requests</span>
              <strong>{myRoomBookings.length + myEventBookings.length + myDiningBookings.length}</strong>
            </article>
            <article>
              <span>Dining Reservations</span>
              <strong>{myDiningBookings.length}</strong>
            </article>
          </div>
        </section>
      </div>

      {myDiningBookings.length > 0 && (
        <div className="dash-section customer-table-panel" style={{marginTop: '8px'}}>
          <div className="customer-panel-head">
          <h3>My Dining Reservations</h3>
            <span className="customer-mini-chip">{myDiningBookings.length} bookings</span>
          </div>
          <div className="table-wrap ops-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Restaurant / Request</th>
                  <th>Date & Time</th>
                  <th>Guests</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myDiningBookings.map((b) => (
                  <tr key={b.id}>
                    <td style={{fontWeight: '600'}}>{b.menuItem || 'Reservation'}</td>
                    <td>{toDateTime(b.bookingDateTime)}</td>
                    <td>{b.guests} Guests</td>
                    <td><span className={`customer-status-chip ${statusTone(b.status)}`}>{b.status || 'PENDING'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {myRoomBookings.length > 0 && (
        <div className="dash-section customer-table-panel" style={{marginTop: '8px'}}>
          <div className="customer-panel-head">
          <h3>My Room Reservations</h3>
            <span className="customer-mini-chip">{myRoomBookings.length} bookings</span>
          </div>
          <div className="table-wrap ops-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Room Number</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Guests</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myRoomBookings.map((b) => (
                  <tr key={b.id}>
                    <td style={{fontWeight: '600'}}>{b.roomNumber}</td>
                    <td>{toDateTime(b.checkInDate, false)}</td>
                    <td>{toDateTime(b.checkOutDate, false)}</td>
                    <td>{b.guestCount} Guests</td>
                    <td><span className={`customer-status-chip ${statusTone(b.status)}`}>{b.status || 'PENDING'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {myEventBookings.length > 0 && (
        <div className="dash-section customer-table-panel" style={{marginTop: '8px'}}>
          <div className="customer-panel-head">
          <h3>My Event Reservations</h3>
            <span className="customer-mini-chip">{myEventBookings.length} bookings</span>
          </div>
          <div className="table-wrap ops-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event Type</th>
                  <th>Hall / Venue</th>
                  <th>Date & Time</th>
                  <th>Attendees</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myEventBookings.map((b) => (
                  <tr key={b.id}>
                    <td style={{fontWeight: '600'}}>{b.eventType}</td>
                    <td>{b.hallName}</td>
                    <td>{toDateTime(b.eventDateTime)}</td>
                    <td>{b.attendees} People</td>
                    <td><span className={`customer-status-chip ${statusTone(b.status)}`}>{b.status || 'PENDING'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function statusTone(status) {
  const value = (status || '').toUpperCase();
  if (['CONFIRMED', 'COMPLETED', 'APPROVED', 'SERVED'].includes(value)) return 'ok';
  if (['CANCELLED', 'CLOSED', 'REJECTED'].includes(value)) return 'danger';
  return 'pending';
}

function toTimestamp(value) {
  const date = value ? new Date(value) : null;
  const time = date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
  return time;
}

function toDateTime(value, withTime = true) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '-';
  return withTime ? date.toLocaleString() : date.toLocaleDateString();
}

export default CustomerDashboardPage;
