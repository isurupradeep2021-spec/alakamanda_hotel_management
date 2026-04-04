import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getDiningBookings, getEventBookings, getRoomBookings, getSummary } from "../api/service";
import { useAuth } from "../context/AuthContext";

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
    () => eventBookings.filter((b) => {
      const bookingEmail = (b.customerEmail || '').toLowerCase();
      const bookingName = (b.customerName || '').toLowerCase();
      return bookingEmail === (user?.email || '').toLowerCase() || bookingName.includes((user?.fullName || '').toLowerCase());
    }),
    [eventBookings, user?.email, user?.fullName]
  );

  const myDiningBookings = useMemo(
    () => diningBookings.filter((b) => (b.contact || '').toLowerCase().includes((user?.email || '').toLowerCase())),
    [diningBookings, user?.email]
  );

  const stats = [
    { key: 'my-room', label: 'My Room Bookings', icon: 'bi-door-open', value: myRoomBookings.length, trend: 'Stay planning' },
    { key: 'my-event', label: 'My Event Requests', icon: 'bi-calendar-heart', value: myEventBookings.length, trend: 'Event pipeline' },
    { key: 'my-dining', label: 'My Dining Orders', icon: 'bi-cup-hot', value: myDiningBookings.length, trend: 'Dining schedule' },
    { key: 'all-rooms', label: 'Rooms In Hotel', icon: 'bi-building', value: summary?.rooms ?? '-', trend: 'Real-time inventory' },
    { key: 'all-events', label: 'Total Events', icon: 'bi-calendar-event', value: summary?.eventBookings ?? '-', trend: 'Live event board' },
    { key: 'all-orders', label: 'Restaurant Orders', icon: 'bi-receipt', value: summary?.restaurantOrders ?? '-', trend: 'Kitchen activity' }
  ];

  return (
    <div className="module-page dashboard-luxe">
      <div className="dash-hero luxe-hero">
        <div className="module-head">
          <p className="eyebrow">Guest Lounge</p>
          <h2>Luxury Guest Dashboard</h2>
          <p>Welcome {user?.fullName}. Track bookings, discover experiences, and plan your stay smoothly.</p>
        </div>
        <div className="hero-chip">
          <i className="bi bi-stars" />
          Loyalty Guest
        </div>
      </div>

      <div className="summary-grid premium-grid dashboard-kpis">
        {stats.map((item) => (
          <article key={item.key} className="summary-card premium-card signature-card">
            <div className="kpi-top"><i className={`bi ${item.icon}`} /><span>{item.label}</span></div>
            <h3>{item.value}</h3>
            <p><i className="bi bi-sparkles" /> {item.trend}</p>
          </article>
        ))}
      </div>

      <div className="dash-section">
        <h3>Quick Actions</h3>
        <div className="customer-actions">
        <Link className="module-card action-card action-tile signature-action" to="/view-rooms">
          <i className="bi bi-building" />
          <span>View Rooms</span>
        </Link>
        <Link className="module-card action-card action-tile signature-action" to="/book-room">
          <i className="bi bi-door-open" />
          <span>Book Room</span>
        </Link>
        <Link className="module-card action-card action-tile signature-action" to="/view-menu">
          <i className="bi bi-cup-hot" />
          <span>View Menu</span>
        </Link>
        <Link className="module-card action-card action-tile signature-action" to="/book-event">
          <i className="bi bi-calendar-plus" />
          <span>Book Event</span>
        </Link>
        <Link className="module-card action-card action-tile signature-action" to="/profile">
          <i className="bi bi-person-circle" />
          <span>My Profile</span>
        </Link>
        </div>
      </div>

      {myDiningBookings.length > 0 && (
        <div className="dash-section" style={{marginTop: '40px'}}>
          <h3>My Dining Reservations</h3>
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
                    <td>{new Date(b.bookingDateTime).toLocaleString()}</td>
                    <td>{b.guests} Guests</td>
                    <td><span className={`room-status-badge ${b.status === 'CONFIRMED' ? 'ok' : ''}`}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {myRoomBookings.length > 0 && (
        <div className="dash-section" style={{marginTop: '40px'}}>
          <h3>My Room Reservations</h3>
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
                    <td>{new Date(b.checkInDate).toLocaleDateString()}</td>
                    <td>{new Date(b.checkOutDate).toLocaleDateString()}</td>
                    <td>{b.guestCount} Guests</td>
                    <td><span className={`room-status-badge ${b.status === 'CONFIRMED' ? 'ok' : ''}`}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {myEventBookings.length > 0 && (
        <div className="dash-section" style={{marginTop: '40px'}}>
          <h3>My Event Reservations</h3>
          <div className="table-wrap ops-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event Type</th>
                  <th>Hall / Venue</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myEventBookings.map((b) => (
                  <tr key={b.id}>
                    <td style={{fontWeight: '600'}}>{b.eventType}</td>
                    <td>{b.hallName}</td>
                    <td>{new Date(b.eventDateTime).toLocaleString()}</td>
                    <td>{b.endDateTime ? new Date(b.endDateTime).toLocaleString() : '-'}</td>
                    <td>{b.durationHours ? `${b.durationHours} hrs` : '-'}</td>
                    <td><span className={`room-status-badge ${b.status === 'CONFIRMED' ? 'ok' : ''}`}>{b.status}</span></td>
                  </tr>
                ))}
            </div>

            <div className="dash-section">
                <h3>Quick Actions</h3>
                <div className="customer-actions">
                    <Link className="module-card action-card action-tile signature-action" to="/view-rooms">
                        <i className="bi bi-building" />
                        <span>View Rooms</span>
                    </Link>
                    <Link className="module-card action-card action-tile signature-action" to="/book-room">
                        <i className="bi bi-door-open" />
                        <span>Book Room</span>
                    </Link>
                    <Link className="module-card action-card action-tile signature-action" to="/view-menu">
                        <i className="bi bi-cup-hot" />
                        <span>View Menu</span>
                    </Link>
                    <Link className="module-card action-card action-tile signature-action" to="/book-event">
                        <i className="bi bi-calendar-plus" />
                        <span>Book Event</span>
                    </Link>
                    <Link className="module-card action-card action-tile signature-action" to="/profile">
                        <i className="bi bi-person-circle" />
                        <span>My Profile</span>
                    </Link>
                </div>
            </div>

            {myDiningBookings.length > 0 && (
                <div className="dash-section" style={{ marginTop: "40px" }}>
                    <h3>My Dining Reservations</h3>
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
                                        <td style={{ fontWeight: "600" }}>{b.menuItem || "Reservation"}</td>
                                        <td>{new Date(b.bookingDateTime).toLocaleString()}</td>
                                        <td>{b.guests} Guests</td>
                                        <td>
                                            <span className={`room-status-badge ${b.status === "CONFIRMED" ? "ok" : ""}`}>{b.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {myRoomBookings.length > 0 && (
                <div className="dash-section" style={{ marginTop: "40px" }}>
                    <h3>My Room Reservations</h3>
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
                                        <td style={{ fontWeight: "600" }}>{b.roomNumber}</td>
                                        <td>{new Date(b.checkInDate).toLocaleDateString()}</td>
                                        <td>{new Date(b.checkOutDate).toLocaleDateString()}</td>
                                        <td>{b.guestCount} Guests</td>
                                        <td>
                                            <span className={`room-status-badge ${b.status === "CONFIRMED" ? "ok" : ""}`}>{b.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {myEventBookings.length > 0 && (
                <div className="dash-section" style={{ marginTop: "40px" }}>
                    <h3>My Event Reservations</h3>
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
                                        <td style={{ fontWeight: "600" }}>{b.eventType}</td>
                                        <td>{b.hallName}</td>
                                        <td>{new Date(b.eventDateTime).toLocaleString()}</td>
                                        <td>{b.attendees} People</td>
                                        <td>
                                            <span className={`room-status-badge ${b.status === "CONFIRMED" ? "ok" : ""}`}>{b.status}</span>
                                        </td>
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
