import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllowedMenuForRole, ROLES } from '../auth/role';
import { getSummary } from '../api/service';
import CustomerDashboardPage from './CustomerDashboardPage';

function DashboardPage() {
  const { user } = useAuth();
  const menu = getAllowedMenuForRole(user?.role);
  const [summary, setSummary] = useState(null);

  if (user?.role === ROLES.CUSTOMER) {
    return <CustomerDashboardPage />;
  }

  useEffect(() => {
    getSummary()
      .then((res) => setSummary(res.data))
      .catch(() => setSummary(null));
  }, []);

  const stats = [
    { key: 'rooms', label: 'Total Rooms', icon: 'bi-building', value: summary?.rooms ?? '-', trend: '+6% this week' },
    { key: 'roomBookings', label: 'Room Bookings', icon: 'bi-door-open', value: summary?.roomBookings ?? '-', trend: '+12% this week' },
    { key: 'eventBookings', label: 'Active Events', icon: 'bi-calendar-event', value: summary?.eventBookings ?? '-', trend: '+4 this month' },
    { key: 'restaurantOrders', label: 'Restaurant Orders', icon: 'bi-cup-hot', value: summary?.restaurantOrders ?? '-', trend: '+9% today' },
    { key: 'payrollRecords', label: 'Payroll Records', icon: 'bi-cash-stack', value: summary?.payrollRecords ?? '-', trend: 'Updated monthly' },
    { key: 'modules', label: 'Modules Available', icon: 'bi-grid-1x2', value: menu.length, trend: user?.role || '' }
  ];

  const activityFeed = [
    `Rooms currently listed: ${summary?.rooms ?? '-'}`,
    `New room bookings recorded: ${summary?.roomBookings ?? '-'}`,
    `Active event pipeline count: ${summary?.eventBookings ?? '-'}`,
    `Restaurant order volume: ${summary?.restaurantOrders ?? '-'}`
  ];

  return (
    <div className="module-page dashboard-luxe">
      <div className="dash-hero luxe-hero">
        <div className="module-head">
          <p className="eyebrow">Morning Briefing</p>
          <h2>Hotel Command Center</h2>
          <p>Welcome {user?.fullName}. Review operations, bookings and revenue signals at a glance.</p>
        </div>
        <div className="hero-chip">
          <i className="bi bi-person-badge" />
          {user?.role}
        </div>
      </div>

      <div className="summary-grid premium-grid dashboard-kpis">
        {stats.map((item) => (
          <article key={item.key} className="summary-card premium-card signature-card">
            <div className="kpi-top"><i className={`bi ${item.icon}`} /><span>{item.label}</span></div>
            <h3>{item.value}</h3>
            <p><i className="bi bi-graph-up-arrow" /> {item.trend}</p>
          </article>
        ))}
      </div>

      <div className="dash-section">
        <h3>Quick Actions</h3>
        <div className="module-grid action-grid">
        {menu.slice(0, 6).map((item) => (
          <Link key={item.path} className="module-card action-tile signature-action" to={item.path}>
            <i className={`bi ${item.icon}`} />
            <span>{item.label}</span>
          </Link>
        ))}
        </div>
      </div>

      <div className="dash-section feed-panel">
        <h3>Activity Feed</h3>
        <div className="activity-feed">
          {activityFeed.map((line, idx) => (
            <article key={line} className="activity-item">
              <span className="activity-dot">{idx + 1}</span>
              <p>{line}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
