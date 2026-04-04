import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllowedMenuForRole, isRoomServiceRole, ROLES } from '../auth/role';
import { getSummary } from '../api/service';
import CustomerDashboardPage from './CustomerDashboardPage';
import { RoomServiceDashboardPage } from './RoomServicePages';

function DashboardPage() {
  const { user } = useAuth();
  const menu = getAllowedMenuForRole(user?.role);
  const [summary, setSummary] = useState(null);
  const isCustomer = user?.role === ROLES.CUSTOMER;
  const isStaffMember = user?.role === ROLES.STAFF_MEMBER;

  useEffect(() => {
    if (isCustomer || isStaffMember) {
      setSummary(null);
      return;
  const isRoomServiceUser = isRoomServiceRole(user?.role);

  useEffect(() => {
    if (isCustomer || isRoomServiceUser) {
      return undefined;
    }

    getSummary()
      .then((res) => setSummary(res.data))
      .catch(() => setSummary(null));
  }, [isCustomer, isStaffMember]);
  }, [isCustomer, isRoomServiceUser]);

  if (isCustomer) {
    return <CustomerDashboardPage />;
  }

  const stats = isStaffMember
    ? [
        { key: 'role', label: 'Role', icon: 'bi-person-badge', value: 'Staff Member', trend: 'Operational account' },
        { key: 'employee', label: 'Employee ID', icon: 'bi-person-vcard', value: user?.employeeId || '-', trend: 'Staff profile linked' },
        { key: 'payroll', label: 'Payroll Access', icon: 'bi-cash-stack', value: 'Enabled', trend: 'View salary and attendance' },
        { key: 'modules', label: 'Available Modules', icon: 'bi-grid-1x2', value: Math.max(menu.length - 1, 1), trend: 'Role-based access' }
      ]
    : [
        { key: 'rooms', label: 'Total Rooms', icon: 'bi-building', value: summary?.rooms ?? '-', trend: '+6% this week' },
        { key: 'roomBookings', label: 'Room Bookings', icon: 'bi-door-open', value: summary?.roomBookings ?? '-', trend: '+12% this week' },
        { key: 'eventBookings', label: 'Active Events', icon: 'bi-calendar-event', value: summary?.eventBookings ?? '-', trend: '+4 this month' },
        { key: 'restaurantOrders', label: 'Restaurant Orders', icon: 'bi-cup-hot', value: summary?.restaurantOrders ?? '-', trend: '+9% today' },
        { key: 'payrollRecords', label: 'Payroll Records', icon: 'bi-cash-stack', value: summary?.payrollRecords ?? '-', trend: 'Updated monthly' },
        { key: 'modules', label: 'Modules Available', icon: 'bi-grid-1x2', value: menu.length, trend: user?.role || '' }
      ];
  if (isRoomServiceUser) {
    return <RoomServiceDashboardPage />;
  }

  const activityFeed = isStaffMember
    ? [
        'Open Payroll Center to check attendance and salary details.',
        'Use clock-in and clock-out from the payroll dashboard.',
        'Track your monthly overtime and leave summary.',
        'Download your payslip once payroll is generated.'
      ]
    : [
        `Rooms currently listed: ${summary?.rooms ?? '-'}`,
        `New room bookings recorded: ${summary?.roomBookings ?? '-'}`,
        `Active event pipeline count: ${summary?.eventBookings ?? '-'}`,
        `Restaurant order volume: ${summary?.restaurantOrders ?? '-'}`
      ];

  const quickActions = menu.filter((item) => item.path !== '/dashboard').slice(0, 6);

  return (
    <div className="module-page dashboard-luxe">
      <div className="dash-hero luxe-hero">
        <div className="module-head">
          <p className="eyebrow">Morning Briefing</p>
          <h2>{isStaffMember ? 'Staff Work Desk' : 'Hotel Command Center'}</h2>
          <p>
            {isStaffMember
              ? `Welcome ${user?.fullName}. View your payroll, attendance, and personal staff records.`
              : `Welcome ${user?.fullName}. Review operations, bookings and revenue signals at a glance.`}
          </p>
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
        {quickActions.map((item) => (
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
