import { useEffect, useMemo, useState } from 'react';
import {
  askChatbot,
  checkIn,
  checkOut,
  generatePayroll,
  getAttendanceHistory,
  getAttendanceSummary,
  getLeaveHistory,
  getLatestStaffPayroll,
  getPayrollInsights,
  getPayroll,
  downloadPayslip,
  getStaffProfile,
  requestLeave
} from '../api/service';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../auth/role';

function PayrollCenterPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [payroll, setPayroll] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [insights, setInsights] = useState(null);
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { by: 'bot', text: 'Hello! Ask payroll questions like salary, overtime, leave, payslip, total expense, highest overtime, or generate payroll.' }
  ]);
  const [error, setError] = useState('');

  const isStaff = user?.role === ROLES.STAFF_MEMBER;
  const isManager = user?.role === ROLES.MANAGER;
  const isAdmin = user?.role === ROLES.ADMIN;

  const ym = useMemo(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  }, []);

  const loadStaff = async () => {
    setError('');
    try {
      const [p, s, pr] = await Promise.all([
        getStaffProfile(),
        getAttendanceSummary(ym.month, ym.year),
        getLatestStaffPayroll()
      ]);
      setProfile(p.data || null);
      setSummary(s.data || null);
      setPayroll(pr.data || null);
      const [attendanceRes, leaveRes, payslipsRes] = await Promise.all([
        getAttendanceHistory(ym.month, ym.year),
        getLeaveHistory(ym.month, ym.year),
        getPayroll()
      ]);
      setAttendanceHistory(attendanceRes.data || []);
      setLeaveHistory(leaveRes.data || []);
      setPayslips(payslipsRes.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load staff payroll data');
    }
  };

  const loadInsights = async () => {
    setError('');
    try {
      const res = await getPayrollInsights(ym.month, ym.year);
      setInsights(res.data || null);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load insights');
    }
  };

  useEffect(() => {
    if (isStaff || isManager) {
      loadStaff();
    }
    if (isAdmin || isManager) {
      loadInsights();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaff, isManager, isAdmin]);

  const onCheckIn = async () => {
    try {
      await checkIn();
      await loadStaff();
    } catch (e) {
      setError(e.response?.data?.message || 'Check-in failed');
    }
  };

  const onCheckOut = async () => {
    try {
      await checkOut();
      await loadStaff();
    } catch (e) {
      setError(e.response?.data?.message || 'Check-out failed');
    }
  };

  const onRequestLeave = async (e) => {
    e.preventDefault();
    try {
      await requestLeave({ leaveDate, reason: leaveReason });
      setLeaveDate('');
      setLeaveReason('');
      await loadStaff();
    } catch (er) {
      setError(er.response?.data?.message || 'Leave request failed');
    }
  };

  const onGeneratePayroll = async () => {
    try {
      await generatePayroll(ym.month, ym.year);
      await loadInsights();
      if (isManager || isStaff) {
        await loadStaff();
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Payroll generation failed');
    }
  };

  const onAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const q = question.trim();
    setChatMessages((prev) => [...prev, { by: 'me', text: q }]);
    setQuestion('');

    try {
      const res = await askChatbot(q);
      setChatMessages((prev) => [...prev, { by: 'bot', text: res.data?.answer || 'No response' }]);
    } catch (er) {
      setChatMessages((prev) => [...prev, { by: 'bot', text: er.response?.data?.message || 'Chatbot failed' }]);
    }
  };

  const onDownloadPayslip = async (id, month) => {
    try {
      const res = await downloadPayslip(id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Payslip_${month}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (er) {
      setError('Cannot download payslip');
    }
  };

  return (
    <div className="module-page dashboard-luxe">
      <div className="dash-hero luxe-hero">
        <div className="module-head">
          <p className="eyebrow">Payroll Automation</p>
          <h2>Payroll Management Center</h2>
          <p>Attendance, overtime, leaves, monthly payroll and chatbot assistance in one place.</p>
        </div>
        <div className="hero-chip">
          <i className="bi bi-cash-stack" />
          {user?.role}
        </div>
      </div>

      {error && <div className="inline-error">{error}</div>}

      {(isStaff || isManager) && (
        <>
          <div className="summary-grid premium-grid dashboard-kpis">
            <article className="summary-card premium-card signature-card"><div className="kpi-top"><i className="bi bi-person-badge" /><span>Employee ID</span></div><h3>{profile?.employeeId || '-'}</h3><p><i className="bi bi-shield-check" /> {profile?.employmentStatus || '-'}</p></article>
            <article className="summary-card premium-card signature-card"><div className="kpi-top"><i className="bi bi-clock-history" /><span>Overtime (Month)</span></div><h3>{summary?.totalOvertimeHours ?? '-'}</h3><p><i className="bi bi-graph-up-arrow" /> Auto from checkout</p></article>
            <article className="summary-card premium-card signature-card"><div className="kpi-top"><i className="bi bi-calendar2-x" /><span>Leave Days</span></div><h3>{summary?.leaveDays ?? '-'}</h3><p><i className="bi bi-info-circle" /> Max paid: {summary?.maxPaidLeaves ?? 5}</p></article>
            <article className="summary-card premium-card signature-card"><div className="kpi-top"><i className="bi bi-currency-dollar" /><span>Latest Salary</span></div><h3>{payroll?.netSalary ?? '-'}</h3><p><i className="bi bi-receipt" /> {payroll?.payrollMonth || 'No payroll yet'}</p></article>
          </div>

          <div className="ops-grid">
            <section className="ops-panel">
              <h3>Profile</h3>
              <div className="profile-grid">
                <p><strong>Name:</strong> {profile?.fullName || '-'}</p>
                <p><strong>Role:</strong> {profile?.employmentRole || '-'}</p>
                <p><strong>Basic Salary:</strong> {profile?.basicSalary || '-'}</p>
                <p><strong>Email:</strong> {profile?.email || '-'}</p>
                <p><strong>Contact:</strong> {profile?.phone || '-'}</p>
                <p><strong>Join Date:</strong> {profile?.joinDate || '-'}</p>
              </div>
            </section>

            <section className="ops-panel">
              <h3>Attendance</h3>
              <div className="action-row">
                <button type="button" className="primary-action" onClick={onCheckIn}>Check-In</button>
                <button type="button" className="primary-action" onClick={onCheckOut}>Check-Out</button>
              </div>
              <p className="chart-sub">Working hours per day: 8. Overtime is calculated automatically on checkout.</p>
              <div className="profile-grid">
                <p><strong>Working Days:</strong> {summary?.workingDays ?? '-'}</p>
                <p><strong>Absent Days:</strong> {summary?.absentDays ?? '-'}</p>
                <p><strong>Late Days:</strong> {summary?.lateDays ?? '-'}</p>
              </div>
            </section>

            <section className="ops-panel">
              <h3>Leave Management</h3>
              <form className="crud-form premium-form" onSubmit={onRequestLeave}>
                <input type="date" value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} required />
                <input placeholder="Leave reason" value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} />
                <button type="submit" className="primary-action">Submit Leave</button>
              </form>
              <p className="chart-sub" style={{ marginTop: '8px' }}>Leave records this month: {leaveHistory.length}</p>
            </section>
          </div>

          <div className="table-wrap ops-table-wrap">
            <h3 className="ops-table-title">Daily Attendance History</h3>
            <table className="data-table">
              <thead><tr><th>Date</th><th>Check-In</th><th>Check-Out</th><th>Hours</th><th>Overtime</th></tr></thead>
              <tbody>
                {attendanceHistory.map((a) => (
                  <tr key={a.id}>
                    <td>{a.attendanceDate}</td>
                    <td>{a.checkInTime ? new Date(a.checkInTime).toLocaleTimeString() : '-'}</td>
                    <td>{a.checkOutTime ? new Date(a.checkOutTime).toLocaleTimeString() : '-'}</td>
                    <td>{a.workingHours ?? '-'}</td>
                    <td>{a.overtimeHours ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-wrap ops-table-wrap" style={{ marginTop: '24px' }}>
            <h3 className="ops-table-title">My Payslip History</h3>
            <table className="data-table">
              <thead><tr><th>Month</th><th>Status</th><th>Base Salary</th><th>Overtime</th><th>Deductions</th><th>Net Salary</th><th>Action</th></tr></thead>
              <tbody>
                {payslips.map((p) => (
                  <tr key={p.id}>
                    <td>{p.payrollMonth || '-'}</td>
                    <td>{p.paymentStatus || '-'}</td>
                    <td>${p.baseSalary ?? 0}</td>
                    <td>${(p.overtimePay ?? 0) + (p.bonus ?? 0)}</td>
                    <td>${(p.deductions ?? 0) + (p.epf ?? 0) + (p.tax ?? 0)}</td>
                    <td style={{fontWeight:'bold'}}>${p.netSalary ?? 0}</td>
                    <td>
                      <button type="button" className="secondary-btn" onClick={() => onDownloadPayslip(p.id, p.payrollMonth)}>Download PDF</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {(isAdmin || isManager) && (
        <div className="ops-grid">
          <section className="ops-panel">
            <h3>Admin / Manager Payroll Insights</h3>
            <div className="summary-grid premium-grid dashboard-kpis">
              <article className="summary-card premium-card signature-card"><div className="kpi-top"><i className="bi bi-cash-stack" /><span>Total Expense</span></div><h3>{insights?.totalSalaryExpense ?? '-'}</h3><p><i className="bi bi-calendar-event" /> {insights?.year}-{insights?.month}</p></article>
              <article className="summary-card premium-card signature-card"><div className="kpi-top"><i className="bi bi-trophy" /><span>Highest Overtime</span></div><h3>{insights?.highestOvertimeHours ?? '-'}</h3><p><i className="bi bi-person" /> {insights?.highestOvertimeEmployee || '-'}</p></article>
              <article className="summary-card premium-card signature-card"><div className="kpi-top"><i className="bi bi-files" /><span>Payroll Records</span></div><h3>{insights?.recordCount ?? '-'}</h3><p><i className="bi bi-check2-circle" /> Generated records</p></article>
            </div>
            {isAdmin && (
              <div className="action-row" style={{ marginTop: '8px' }}>
                <button type="button" className="primary-action" onClick={onGeneratePayroll}>Generate Payroll This Month</button>
              </div>
            )}
          </section>
        </div>
      )}

      <button type="button" className="chatbot-fab" onClick={() => setChatOpen((v) => !v)}>
        <i className="bi bi-chat-dots" />
      </button>

      {chatOpen && (
        <div className="chatbot-panel">
          <div className="chatbot-head">
            <strong>Payroll Assistant</strong>
            <button type="button" onClick={() => setChatOpen(false)}>x</button>
          </div>
          <div className="chatbot-body">
            {chatMessages.map((m, i) => (
              <div key={`${m.by}-${i}`} className={`chat-msg ${m.by}`}>{m.text}</div>
            ))}
          </div>
          <form className="chatbot-form" onSubmit={onAsk}>
            <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask about salary, overtime, leaves, payslip..." />
            <button type="submit" className="primary-action">Ask</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default PayrollCenterPage;
