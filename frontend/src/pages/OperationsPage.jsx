import { useEffect, useMemo, useState } from "react";
import {
    calculateRoomPrice,
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
    getRoomPopularity,
    payrollSummary,
    roomBookingAnalytics,
    updateDiningBooking,
    updateEventBooking,
    updatePayroll,
    updateRoom,
    updateRoomBooking,
} from "../api/service";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../auth/role";

function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

const empty = {
    payroll: {
        employeeName: "",
        department: "",
        employeeCode: "",
        workingDays: 26,
        absentDays: 0,
        overtimeHours: 0,
        baseSalary: 0,
        overtimeRate: 0,
        bonus: 0,
        deductions: 0,
        epf: 0,
        tax: 0,
        payrollMonth: new Date().toISOString().slice(0, 7),
    },
    restaurant: { customerName: "", contact: "", guests: 2, bookingDateTime: "", category: "Dinner", menuItem: "", quantity: 1, unitPrice: 0, tableNumber: 1, specialRequest: "", status: "PENDING" },
    events: { customerName: "", eventType: "Wedding", hallName: "", packageName: "Standard", eventDateTime: "", attendees: 50, pricePerGuest: 0, notes: "", status: "INQUIRY" },
    rooms: { roomNumber: "", roomType: "Deluxe", description: "", photoUrl: "", capacity: 2, pricePerNight: 0, weekendPricePerNight: 0, specialRate: 0, available: true, status: "AVAILABLE" },
    roomBooking: { customerName: "", customerEmail: "", roomNumber: "", checkInDate: "", checkOutDate: "", guestCount: 1, status: "CONFIRMED" },
};

function OperationsPage({ type }) {
    const { user } = useAuth();
    const [rows, setRows] = useState([]);
    const [analytics, setAnalytics] = useState({});
    const [form, setForm] = useState(empty[type] || {});
    const [bookingForm, setBookingForm] = useState(empty.roomBooking);
    const [priceBreakdown, setPriceBreakdown] = useState(null);
    const [roomPopularity, setRoomPopularity] = useState(null);
    const [editId, setEditId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterMonth, setFilterMonth] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const meta = useMemo(() => {
        if (type === "payroll") return { title: "User & Payroll Management", subtitle: "Salary generation, deductions, EPF/Tax and monthly summaries.", icon: "bi-cash-stack", code: "Payroll Suite" };
        if (type === "restaurant")
            return { title: "Restaurant & Dining Management", subtitle: "Orders, status flow, table assignment and order analytics.", icon: "bi-cup-hot", code: "Dining Studio" };
        if (type === "events") return { title: "Event Management", subtitle: "Booking lifecycle, hall allocation and event revenue tracking.", icon: "bi-calendar-event", code: "Event Atelier" };
        return { title: "Room Management", subtitle: "Room inventory, reservation handling and double-booking prevention.", icon: "bi-building", code: "Room Gallery" };
    }, [type]);

    const keyMetric = analytics.totalRevenue || analytics.revenue || analytics.netTotal || analytics.eventRevenue || analytics.activeBookings || analytics.records || "-";
    const lockCustomerReservationIdentity = type === "restaurant" && user?.role === ROLES.CUSTOMER;

    const load = async () => {
        setLoading(true);
        setError("");
        try {
            if (type === "payroll") {
                const [list, summary] = await Promise.all([getPayroll(), payrollSummary()]);
                setRows(list.data || []);
                setAnalytics(summary.data || {});
            } else if (type === "restaurant") {
                const [list, summary] = await Promise.all([getDiningBookings(), diningAnalytics()]);
                setRows(list.data || []);
                setAnalytics(summary.data || {});
            } else if (type === "events") {
                const [list, summary] = await Promise.all([getEventBookings(), eventAnalytics()]);
                setRows(list.data || []);
                setAnalytics(summary.data || {});
            } else {
                const [list, bookings, summary] = await Promise.all([getRooms(), getRoomBookings(), roomBookingAnalytics()]);
                setRows((list.data || []).map((x) => ({ ...x, _kind: "room" })).concat((bookings.data || []).map((x) => ({ ...x, _kind: "booking" }))));
                setAnalytics(summary.data || {});
            }
        } catch (e) {
            setError(e.response?.data?.message || e.message || "Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setEditId(null);
        const nextForm = { ...(empty[type] || {}) };
        if (type === "restaurant" && user?.role === ROLES.CUSTOMER) {
            nextForm.customerName = user.fullName || "";
            nextForm.contact = user.email || "";
        }
        setForm(nextForm);
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type, user?.role, user?.fullName, user?.email]);

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        setError("");
        try {
            let finalForm = { ...form };
            if (type === "payroll") {
                const computedNetSalary =
                    (Number(form.baseSalary) || 0) +
                    (Number(form.overtimeHours) || 0) * (Number(form.overtimeRate) || 0) +
                    (Number(form.bonus) || 0) -
                    (Number(form.deductions) || 0) -
                    (Number(form.epf) || 0) -
                    (Number(form.tax) || 0);

                const pm = form.payrollMonth || new Date().toISOString().slice(0, 7);
                const [yyyy, mm] = pm.split("-");

                finalForm = {
                    ...finalForm,
                    netSalary: computedNetSalary,
                    totalOvertimeHours: Number(form.overtimeHours) || 0,
                    overtimePay: (Number(form.overtimeHours) || 0) * (Number(form.overtimeRate) || 0) + (Number(form.bonus) || 0),
                    month: parseInt(mm, 10),
                    year: parseInt(yyyy, 10),
                    payrollMonth: pm,
                };
            }

            if (editId) {
                if (type === "payroll") await updatePayroll(editId, finalForm);
                if (type === "restaurant") await updateDiningBooking(editId, finalForm);
                if (type === "events") await updateEventBooking(editId, finalForm);
                if (type === "rooms") await updateRoom(editId, finalForm);
                setEditId(null);
            } else {
                if (type === "payroll") await createPayroll(finalForm);
                if (type === "restaurant") await createDiningBooking(finalForm);
                if (type === "events") await createEventBooking(finalForm);
                if (type === "rooms") await createRoom(finalForm);
            }
            const resetForm = { ...(empty[type] || {}) };
            if (type === "restaurant" && user?.role === ROLES.CUSTOMER) {
                resetForm.customerName = user.fullName || "";
                resetForm.contact = user.email || "";
            }
            setForm(resetForm);
            await load();
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Operation failed");
        }
    };

    const handleEdit = (row) => {
        setEditId(row.id);
        const { id, _kind, createdAt, updatedAt, ...rest } = row;

        // Map back backwards-compatibility fields for form state
        if (type === "payroll") {
            rest.overtimeHours = rest.totalOvertimeHours || 0;
            // Reverse engineer bonus if we assume overtimePay holds both
            const knownOvertime = (rest.totalOvertimeHours || 0) * (rest.overtimeRate || 0);
            rest.bonus = (rest.overtimePay || 0) - knownOvertime;
            if (rest.bonus < 0) rest.bonus = 0;
        }

        setForm({ ...(empty[type] || {}), ...rest });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleCreateRoomBooking = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await createRoomBooking(bookingForm);
            setBookingForm(empty.roomBooking);
            setPriceBreakdown(null);
            setRoomPopularity(null);
            await load();
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Booking failed");
        }
    };

    // Calculate price and popularity when booking dates change
    useEffect(() => {
        if (type === "rooms" && bookingForm.checkInDate && bookingForm.checkOutDate) {
            const room = rows.find((r) => r._kind === "room" && r.roomNumber === bookingForm.roomNumber);
            if (room) {
                calculateRoomPrice(room.id, bookingForm.checkInDate, bookingForm.checkOutDate)
                    .then((res) => setPriceBreakdown(res.data))
                    .catch(() => setPriceBreakdown(null));

                getRoomPopularity(bookingForm.roomNumber)
                    .then((res) => setRoomPopularity(res.data))
                    .catch(() => setRoomPopularity(null));
            }
        }
    }, [bookingForm.roomNumber, bookingForm.checkInDate, bookingForm.checkOutDate, rows]);

    const handleDelete = async (row) => {
        try {
            if (type === "payroll") await deletePayroll(row.id);
            if (type === "restaurant") await deleteDiningBooking(row.id);
            if (type === "events") await deleteEventBooking(row.id);
            if (type === "rooms" && row._kind === "room") await deleteRoom(row.id);
            if (type === "rooms" && row._kind === "booking") await deleteRoomBooking(row.id);
            await load();
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Delete failed");
        }
    };

    const renderFields = () => {
        if (type === "payroll") {
            const computedNet =
                (Number(form.baseSalary) || 0) +
                (Number(form.overtimeHours) || 0) * (Number(form.overtimeRate) || 0) +
                (Number(form.bonus) || 0) -
                (Number(form.deductions) || 0) -
                (Number(form.epf) || 0) -
                (Number(form.tax) || 0);

            return (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", width: "100%" }}>
                    <label>
                        Employee Name
                        <input placeholder="Ex: John Doe" value={form.employeeName} onChange={(e) => setForm({ ...form, employeeName: e.target.value })} required />
                    </label>
                    <label>
                        Department
                        <input placeholder="Ex: Kitchen" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                    </label>
                    <label>
                        Employee Code
                        <input placeholder="Ex: EMP-101" value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} />
                    </label>
                    <label>
                        Payroll Month
                        <input type="month" value={form.payrollMonth} onChange={(e) => setForm({ ...form, payrollMonth: e.target.value })} />
                    </label>

                    <label>
                        Working Days
                        <input type="number" placeholder="26" value={form.workingDays} onChange={(e) => setForm({ ...form, workingDays: Number(e.target.value) })} />
                    </label>
                    <label>
                        Absent Days
                        <input type="number" placeholder="0" value={form.absentDays} onChange={(e) => setForm({ ...form, absentDays: Number(e.target.value) })} />
                    </label>

                    <label>
                        Overtime Hours
                        <input type="number" placeholder="0" value={form.overtimeHours} onChange={(e) => setForm({ ...form, overtimeHours: Number(e.target.value) })} />
                    </label>
                    <label>
                        Overtime Rate ($)
                        <input type="number" placeholder="0" value={form.overtimeRate} onChange={(e) => setForm({ ...form, overtimeRate: Number(e.target.value) })} />
                    </label>

                    <label>
                        Base Salary ($)
                        <input type="number" placeholder="Base Salary" value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: Number(e.target.value) })} />
                    </label>
                    <label>
                        Bonus ($)
                        <input type="number" placeholder="Bonus" value={form.bonus} onChange={(e) => setForm({ ...form, bonus: Number(e.target.value) })} />
                    </label>

                    <label>
                        Deductions ($)
                        <input type="number" placeholder="0" value={form.deductions} onChange={(e) => setForm({ ...form, deductions: Number(e.target.value) })} />
                    </label>
                    <label>
                        EPF/ETF ($)
                        <input type="number" placeholder="0" value={form.epf} onChange={(e) => setForm({ ...form, epf: Number(e.target.value) })} />
                    </label>
                    <label>
                        Tax ($)
                        <input type="number" placeholder="0" value={form.tax} onChange={(e) => setForm({ ...form, tax: Number(e.target.value) })} />
                    </label>

                    <div className="summary-card signature-card" style={{ gridColumn: "1 / -1", marginTop: "16px", padding: "16px", border: "1px solid var(--accent-gold)" }}>
                        <p className="eyebrow">Auto-Calculation Preview</p>
                        <h3 style={{ color: "var(--accent-gold)", marginBottom: 0 }}>Net Salary: ${computedNet.toFixed(2)}</h3>
                    </div>
                </div>
            );
        }
        if (type === "restaurant") {
            return (
                <>
                    <input
                        placeholder="Customer Name"
                        value={form.customerName}
                        onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                        readOnly={lockCustomerReservationIdentity}
                        required
                    />
                    <input placeholder="Contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} readOnly={lockCustomerReservationIdentity} />
                    <input placeholder="Menu Item" value={form.menuItem} onChange={(e) => setForm({ ...form, menuItem: e.target.value })} required />
                    <input type="number" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
                    <input type="number" placeholder="Unit Price" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })} />
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                        <option>PENDING</option>
                        <option>PREPARING</option>
                        <option>READY</option>
                        <option>SERVED</option>
                        <option>CANCELLED</option>
                    </select>
                </>
            );
        }
        if (type === "events") {
            return (
                <>
                    <input placeholder="Customer Name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} required />
                    <input placeholder="Event Type" value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })} required />
                    <input placeholder="Hall Name" value={form.hallName} onChange={(e) => setForm({ ...form, hallName: e.target.value })} required />
                    <input type="datetime-local" value={form.eventDateTime} onChange={(e) => setForm({ ...form, eventDateTime: e.target.value })} required />
                    <input type="number" placeholder="Attendees" value={form.attendees} onChange={(e) => setForm({ ...form, attendees: Number(e.target.value) })} />
                    <input type="number" placeholder="Price Per Guest" value={form.pricePerGuest} onChange={(e) => setForm({ ...form, pricePerGuest: Number(e.target.value) })} />
                </>
            );
        }
        return (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", width: "100%" }}>
                <input placeholder="Room Number" value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} required />
                <input placeholder="Room Type" value={form.roomType} onChange={(e) => setForm({ ...form, roomType: e.target.value })} required />
                <input placeholder="Photo URL" value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} />
                <input placeholder="Room Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <input type="number" placeholder="Capacity" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
                <input type="number" placeholder="Price Per Night" value={form.pricePerNight} onChange={(e) => setForm({ ...form, pricePerNight: Number(e.target.value) })} />
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option>AVAILABLE</option>
                    <option>OCCUPIED</option>
                    <option>RESERVED</option>
                    <option>CLEANING</option>
                    <option>MAINTENANCE</option>
                </select>
                <label className="inline-check" style={{ alignSelf: "center" }}>
                    <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} /> Available
                </label>
            </div>
        );
    };

    const currentRows = useMemo(() => {
        let res = [...rows];
        if (type === "payroll") {
            if (searchQuery) {
                res = res.filter((r) => (r.employeeName || "").toLowerCase().includes(searchQuery.toLowerCase()) || (r.department || "").toLowerCase().includes(searchQuery.toLowerCase()));
            }
            if (filterMonth) {
                res = res.filter((r) => r.payrollMonth === filterMonth);
            }
        }
        return res;
    }, [rows, type, searchQuery, filterMonth]);

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

            {error && <div className="inline-error">{error}</div>}

            <div className="summary-grid premium-grid dashboard-kpis">
                <article className="summary-card premium-card signature-card">
                    <div className="kpi-top">
                        <i className={`bi ${meta.icon}`} />
                        <span>Total Records</span>
                    </div>
                    <h3>{rows.length}</h3>
                    <p>
                        <i className="bi bi-graph-up-arrow" /> Active items in this module
                    </p>
                </article>
                <article className="summary-card premium-card signature-card">
                    <div className="kpi-top">
                        <i className="bi bi-stars" />
                        <span>Key Metric</span>
                    </div>
                    <h3>{keyMetric}</h3>
                    <p>
                        <i className="bi bi-lightning-charge" /> Real-time operational signal
                    </p>
                </article>
                <article className="summary-card premium-card signature-card">
                    <div className="kpi-top">
                        <i className="bi bi-bar-chart" />
                        <span>Analytics Fields</span>
                    </div>
                    <h3>{Object.keys(analytics).length}</h3>
                    <p>
                        <i className="bi bi-clock-history" /> Synced from backend summary
                    </p>
                </article>
            </div>

            <div className="ops-grid">
                <section className="ops-panel">
                    <h3>{editId ? "Edit Record" : "Create Record"}</h3>
                    <form className="crud-form premium-form" onSubmit={handleCreateOrUpdate}>
                        {renderFields()}
                        <div style={{ display: "flex", gap: "12px" }}>
                            <button type="submit" className="primary-action">
                                {editId ? "Update" : "Create"}
                            </button>
                            {editId && (
                                <button
                                    type="button"
                                    className="secondary-btn"
                                    onClick={() => {
                                        setEditId(null);
                                        setForm(empty[type] || {});
                                    }}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </section>

                {type === "rooms" && (
                    <section className="ops-panel">
                        <h3>Create Room Booking</h3>
                        <form className="crud-form premium-form" onSubmit={handleCreateRoomBooking}>
                            <input placeholder="Booking Customer" value={bookingForm.customerName} onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })} required />
                            <input placeholder="Customer Email" value={bookingForm.customerEmail} onChange={(e) => setBookingForm({ ...bookingForm, customerEmail: e.target.value })} required />
                            <input placeholder="Room Number" value={bookingForm.roomNumber} onChange={(e) => setBookingForm({ ...bookingForm, roomNumber: e.target.value })} required />
                            <input type="date" value={bookingForm.checkInDate} onChange={(e) => setBookingForm({ ...bookingForm, checkInDate: e.target.value })} required />
                            <input type="date" value={bookingForm.checkOutDate} onChange={(e) => setBookingForm({ ...bookingForm, checkOutDate: e.target.value })} required />

                            {priceBreakdown && (
                                <div
                                    className="summary-card signature-card"
                                    style={{ gridColumn: "1 / -1", marginTop: "16px", padding: "16px", border: "1px solid var(--accent-gold)", backgroundColor: "rgba(212, 175, 55, 0.08)" }}
                                >
                                    <p className="eyebrow" style={{ marginBottom: "12px" }}>
                                        💰 Dynamic Pricing {roomPopularity?.isPopular && "⭐ POPULAR ROOM"}
                                    </p>
                                    <div style={{ fontSize: "0.85rem", lineHeight: "1.6", color: "rgba(255,255,255,0.9)" }}>
                                        <div style={{ marginBottom: "8px" }}>
                                            📅 Stay Duration: <strong>{priceBreakdown.numberOfNights} nights</strong>
                                        </div>
                                        <div style={{ marginBottom: "8px" }}>
                                            📊 Weekdays ({priceBreakdown.weekdayNights}): ${priceBreakdown.weekdayCost?.toFixed(2)}
                                        </div>
                                        <div style={{ marginBottom: "8px" }}>
                                            🌙 Weekends ({priceBreakdown.weekendNights}): ${priceBreakdown.weekendCost?.toFixed(2)}
                                        </div>
                                        {priceBreakdown.seasonalMultiplier && (
                                            <div style={{ marginBottom: "8px" }}>
                                                🎉 Seasonal ({(priceBreakdown.seasonalMultiplier - 1) * 100}%): +${priceBreakdown.seasonalAdjustment?.toFixed(2)}
                                            </div>
                                        )}
                                        {roomPopularity?.isPopular && <div style={{ marginBottom: "8px" }}>⭐ Popular Room (+15%): +${priceBreakdown.popularityPremium?.toFixed(2)}</div>}
                                        <div
                                            style={{
                                                marginTop: "12px",
                                                paddingTop: "12px",
                                                borderTop: "1px solid var(--accent-gold)",
                                                fontWeight: "bold",
                                                fontSize: "1rem",
                                                color: "var(--accent-gold)",
                                            }}
                                        >
                                            💵 Total: ${priceBreakdown.totalCost?.toFixed(2)}
                                        </div>
                                        {roomPopularity && (
                                            <div style={{ marginTop: "8px", fontSize: "0.8rem", color: "rgba(255,255,255,0.7)" }}>Occupancy Rate: {roomPopularity.occupancyRate?.toFixed(0)}%</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <button type="submit" className="primary-action">
                                Create Booking
                            </button>
                        </form>
                    </section>
                )}
            </div>

            {loading ? (
                <p className="loading-line">Loading module data...</p>
            ) : (
                <div className="table-wrap ops-table-wrap">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "16px" }}>
                        <h3 className="ops-table-title" style={{ margin: 0 }}>
                            Latest Records
                        </h3>
                        {type === "payroll" && (
                            <div style={{ display: "flex", gap: "12px" }}>
                                <input type="text" placeholder="Search Employee or Dept..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: "200px" }} />
                                <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} />
                                <button
                                    type="button"
                                    className="secondary-btn"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setFilterMonth("");
                                    }}
                                >
                                    Clear
                                </button>
                            </div>
                        )}
                    </div>
                    <table className="data-table">
                        {type === "restaurant" ? (
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
                                            <td>{row.customerName || "-"}</td>
                                            <td>{row.contact || "-"}</td>
                                            <td>{formatDate(row.bookingDateTime)}</td>
                                            <td>{row.menuItem || row.category || "-"}</td>
                                            <td>{row.guests ?? "-"}</td>
                                            <td>{row.status || "-"}</td>
                                            <td>{row.totalAmount ?? "-"}</td>
                                            <td>
                                                <button type="button" className="secondary-btn" style={{ marginRight: "8px", padding: "6px 12px" }} onClick={() => handleEdit(row)}>
                                                    Edit
                                                </button>
                                                <button type="button" className="danger-btn" style={{ padding: "6px 12px" }} onClick={() => handleDelete(row)}>
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </>
                        ) : type === "payroll" ? (
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
                                            <td>{row.employeeCode || "-"}</td>
                                            <td>
                                                <strong>{row.employeeName || "-"}</strong>
                                                <div style={{ fontSize: "0.8rem", color: "#888" }}>{row.department || "-"}</div>
                                            </td>
                                            <td>{row.payrollMonth || "-"}</td>
                                            <td>
                                                <div style={{ fontSize: "0.9rem" }}>Base: ${row.baseSalary ?? 0}</div>
                                                <div style={{ fontSize: "0.8rem", color: "var(--accent-gold)" }}>
                                                    + Bonus/OT: ${(row.bonus ?? 0) + (row.overtimeHours ?? 0) * (row.overtimeRate ?? 0)}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: "0.9rem" }}>Ded: ${row.deductions ?? 0}</div>
                                                <div style={{ fontSize: "0.8rem", color: "#ff4d4d" }}>- EPF/Tax: ${(row.epf ?? 0) + (row.tax ?? 0)}</div>
                                            </td>
                                            <td style={{ fontWeight: "600" }}>${row.netSalary ?? 0}</td>
                                            <td>
                                                <button type="button" className="secondary-btn" style={{ marginRight: "8px", padding: "6px 12px" }} onClick={() => handleEdit(row)}>
                                                    Edit
                                                </button>
                                                <button type="button" className="danger-btn" style={{ padding: "6px 12px" }} onClick={() => handleDelete(row)}>
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </>
                        ) : (
                            <>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name/Title</th>
                                        <th>Status</th>
                                        <th>Amount</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentRows.map((row) => (
                                        <tr key={`${row._kind || type}-${row.id}`}>
                                            <td>{row.id}</td>
                                            <td>{row.employeeName || row.customerName || row.roomNumber || row.eventType || row.menuItem}</td>
                                            <td>{row.status || row._kind || "-"}</td>
                                            <td>{row.netSalary || row.totalAmount || row.totalCost || row.pricePerNight || "-"}</td>
                                            <td>
                                                <button type="button" className="secondary-btn" style={{ marginRight: "8px", padding: "6px 12px" }} onClick={() => handleEdit(row)}>
                                                    Edit
                                                </button>
                                                <button type="button" className="danger-btn" style={{ padding: "6px 12px" }} onClick={() => handleDelete(row)}>
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </>
                        )}
                    </table>
                </div>
            )}
        </div>
    );
}

export default OperationsPage;
