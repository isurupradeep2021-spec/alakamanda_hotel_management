import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAllowedMenuForRole, ROLES } from "../auth/role";
import { getRoomBookingInsights, getSummary } from "../api/service";
import CustomerDashboardPage from "./CustomerDashboardPage";

function DashboardPage() {
    const { user } = useAuth();
    const menu = getAllowedMenuForRole(user?.role);
    const [summary, setSummary] = useState(null);
    const [roomInsights, setRoomInsights] = useState({ topBookedRooms: [], leastBookedRooms: [] });
    const isManager = user?.role === ROLES.MANAGER;

    if (user?.role === ROLES.CUSTOMER) {
        return <CustomerDashboardPage />;
    }

    useEffect(() => {
        getSummary()
            .then((summaryRes) => setSummary(summaryRes.data))
            .catch(() => setSummary(null));

  const stats = [
    { key: 'rooms', label: 'Total Rooms', icon: 'bi-building', value: summary?.rooms ?? '-', trend: '+6% this week' },
    { key: 'roomBookings', label: 'Room Bookings', icon: 'bi-door-open', value: summary?.roomBookings ?? '-', trend: '+12% this week' },
    { key: 'eventBookings', label: 'Active Events', icon: 'bi-calendar-event', value: summary?.eventBookings ?? '-', trend: '+4 this month' },
    { key: 'restaurantOrders', label: 'Restaurant Orders', icon: 'bi-cup-hot', value: summary?.restaurantOrders ?? '-', trend: '+9% today' },
    { key: 'payrollRecords', label: 'Payroll Records', icon: 'bi-cash-stack', value: summary?.payrollRecords ?? '-', trend: 'Updated monthly' }
  ];

  const activityFeed = [
    `Rooms currently listed: ${summary?.rooms ?? '-'}`,
    `New room bookings recorded: ${summary?.roomBookings ?? '-'}`,
    `Active event count: ${summary?.eventBookings ?? '-'}`,
    `Restaurant order volume: ${summary?.restaurantOrders ?? '-'}`
  ];

    const activityFeed = [
        `Rooms currently listed: ${summary?.rooms ?? "-"}`,
        `New room bookings recorded: ${summary?.roomBookings ?? "-"}`,
        `Active event pipeline count: ${summary?.eventBookings ?? "-"}`,
        `Restaurant order volume: ${summary?.restaurantOrders ?? "-"}`,
    ];

    const managerKpis = [
        {
            key: "roomUtilization",
            label: "Room Utilization",
            icon: "bi-house-check",
            value: summary?.rooms && summary?.roomBookings ? `${Math.min(100, Math.round((summary.roomBookings / Math.max(summary.rooms, 1)) * 100))}%` : "-",
            trend: "Bookings vs inventory",
        },
        {
            key: "opsLoad",
            label: "Operations Load",
            icon: "bi-speedometer",
            value: summary?.restaurantOrders != null && summary?.eventBookings != null ? summary.restaurantOrders + summary.eventBookings : "-",
            trend: "Dining + events volume",
        },
        {
            key: "hotRoom",
            label: "Most Demanded Room",
            icon: "bi-fire",
            value: roomInsights.topBookedRooms?.[0]?.roomNumber || "-",
            trend: roomInsights.topBookedRooms?.[0]?.bookingCount != null ? `${roomInsights.topBookedRooms[0].bookingCount} bookings` : "No demand data",
        },
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
                        <div className="kpi-top">
                            <i className={`bi ${item.icon}`} />
                            <span>{item.label}</span>
                        </div>
                        <h3>{item.value}</h3>
                        <p>
                            <i className="bi bi-graph-up-arrow" /> {item.trend}
                        </p>
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

            {isManager && (
                <div className="dash-section">
                    <h3>Manager Snapshot</h3>
                    <div className="summary-grid premium-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                        {managerKpis.map((item) => (
                            <article key={item.key} className="summary-card premium-card signature-card">
                                <div className="kpi-top">
                                    <i className={`bi ${item.icon}`} />
                                    <span>{item.label}</span>
                                </div>
                                <h3>{item.value}</h3>
                                <p>
                                    <i className="bi bi-activity" /> {item.trend}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            )}

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

            <div className="dash-section">
                <h3>Room Booking Insights</h3>
                <div className="summary-grid premium-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
                    <article className="summary-card premium-card signature-card">
                        <div className="kpi-top">
                            <i className="bi bi-trophy" />
                            <span>Top 5 Most Booked Rooms</span>
                        </div>
                        {(roomInsights.topBookedRooms || []).length === 0 ? (
                            <p>No booking data available yet.</p>
                        ) : (
                            <div className="activity-feed">
                                {roomInsights.topBookedRooms.map((room, idx) => (
                                    <article key={`top-${room.roomNumber}`} className="activity-item">
                                        <span className="activity-dot">{idx + 1}</span>
                                        <p>
                                            Room {room.roomNumber}: {room.bookingCount} bookings
                                        </p>
                                    </article>
                                ))}
                            </div>
                        )}
                    </article>

                    <article className="summary-card premium-card signature-card">
                        <div className="kpi-top">
                            <i className="bi bi-graph-down" />
                            <span>Least Booked Rooms</span>
                        </div>
                        {(roomInsights.leastBookedRooms || []).length === 0 ? (
                            <p>No booking data available yet.</p>
                        ) : (
                            <div className="activity-feed">
                                {roomInsights.leastBookedRooms.map((room, idx) => (
                                    <article key={`least-${room.roomNumber}`} className="activity-item">
                                        <span className="activity-dot">{idx + 1}</span>
                                        <p>
                                            Room {room.roomNumber}: {room.bookingCount} bookings
                                        </p>
                                    </article>
                                ))}
                            </div>
                        )}
                    </article>
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;
