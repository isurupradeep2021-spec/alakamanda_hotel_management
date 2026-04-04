import { useEffect, useMemo, useState } from 'react';
import {
  checkIn,
  checkOut,
  downloadPayrollPayslip,
  generatePayroll,
  getAttendanceSummary,
  getLatestStaffPayroll,
  getPayroll,
  getPayrollInsights,
  getStaffProfile,
  requestLeave
} from '../api/service';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../auth/role';

function PayrollCenterPage() {
  const { user } = useAuth();
  const isStaff = user?.role === ROLES.STAFF_MEMBER;
  const isManager = user?.role === ROLES.MANAGER;
  const isAdmin = user?.role === ROLES.ADMIN;

  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [profile, setProfile] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [latestPayroll, setLatestPayroll] = useState(null);
  const [payrollRows, setPayrollRows] = useState([]);
  const [insights, setInsights] = useState(null);

  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const resetMessages = () => {
    setError('');
    setSuccess('');
  };

  const currency = (value) => Number(value || 0).toFixed(2);

  const loadStaffView = async () => {
    const [profileRes, summaryRes, latestRes, payrollRes] = await Promise.all([
      getStaffProfile(),
      getAttendanceSummary(month, year),
      getLatestStaffPayroll(),
      getPayroll()
    ]);
    setProfile(profileRes.data || null);
    setAttendanceSummary(summaryRes.data || null);
    setLatestPayroll(latestRes.data || null);
    setPayrollRows(payrollRes.data || []);
  };

  const loadAdminManagerView = async () => {
    const [payrollRes, insightsRes] = await Promise.all([
      getPayroll(),
      getPayrollInsights(month, year)
    ]);
    setPayrollRows(payrollRes.data || []);
    setInsights(insightsRes.data || null);
  };

  const loadData = async () => {
    setLoading(true);
    resetMessages();
    try {
      if (isStaff) {
        await loadStaffView();
      } else if (isAdmin || isManager) {
        await loadAdminManagerView();
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaff, isAdmin, isManager, month, year]);

  const onCheckIn = async () => {
    setLoading(true);
    resetMessages();
    try {
      await checkIn();
      setSuccess('Checked in successfully');
      await loadStaffView();
    } catch (e) {
      setError(e.response?.data?.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const onCheckOut = async () => {
    setLoading(true);
    resetMessages();
    try {
      await checkOut();
      setSuccess('Checked out successfully');
      await loadStaffView();
    } catch (e) {
      setError(e.response?.data?.message || 'Check-out failed');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitLeave = async (e) => {
    e.preventDefault();
    setLoading(true);
    resetMessages();
    try {
      await requestLeave({ leaveDate, reason: leaveReason });
      setLeaveDate('');
      setLeaveReason('');
      setSuccess('Leave submitted successfully');
      await loadStaffView();
    } catch (e2) {
      setError(e2.response?.data?.message || 'Leave request failed');
    } finally {
      setLoading(false);
    }
  };

  const onGeneratePayroll = async () => {
    setLoading(true);
    resetMessages();
    try {
      await generatePayroll(month, year);
      setSuccess(`Payroll generated for ${year}-${String(month).padStart(2, '0')}`);
      await loadAdminManagerView();
    } catch (e) {
      setError(e.response?.data?.message || 'Payroll generation failed');
    } finally {
      setLoading(false);
    }
  };

  const onDownloadPayslip = async (payrollId, payrollMonth) => {
    resetMessages();
    try {
      const res = await downloadPayrollPayslip(payrollId);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `payslip-${payrollMonth || payrollId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to download payslip');
    }
  };

  const totals = useMemo(() => {
    return payrollRows.reduce(
      (acc, row) => {
        acc.net += Number(row.netSalary || 0);
        acc.overtime += Number(row.overtimePay || 0);
        acc.deductions += Number(row.deductions || 0) + Number(row.leaveDeduction || 0) + Number(row.tax || 0);
        return acc;
      },
      { net: 0, overtime: 0, deductions: 0 }
    );
  }, [payrollRows]);

  return (
    <div className="module-page dashboard-luxe">
      <div className="dash-hero luxe-hero">
        <div className="module-head">
          <p className="eyebrow">Payroll System</p>
          <h2>Payroll Dashboard</h2>
          <p>Simple payroll operations with clear salary, overtime, deductions, and payslip access.</p>
        </div>
        <div className="hero-chip">
          <i className="bi bi-cash-stack" />
          {user?.role}
        </div>
      </div>

      <div className="crud-form premium-form" style={{ marginBottom: 0 }}>
        <input type="number" min="2000" max="2100" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        <input type="number" min="1" max="12" value={month} onChange={(e) => setMonth(Number(e.target.value))} />
        {(isAdmin || isManager) && (
          <button type="button" className="primary-action" disabled={loading} onClick={onGeneratePayroll}>
            Generate Monthly Payroll
          </button>
        )}
        <button type="button" className="secondary-btn" disabled={loading} onClick={loadData}>
          Refresh Data
        </button>
      </div>

      {error && <div className="inline-error">{error}</div>}
      {success && <div className="inline-success">{success}</div>}

      {isStaff && (
        <>
          <div className="summary-grid premium-grid dashboard-kpis">
            <article className="summary-card premium-card signature-card">
              <div className="kpi-top"><i className="bi bi-person-badge" /><span>Employee</span></div>
              <h3>{profile?.employeeId || '-'}</h3>
              <p><i className="bi bi-person-check" /> {profile?.fullName || '-'}</p>
            </article>
            <article className="summary-card premium-card signature-card">
              <div className="kpi-top"><i className="bi bi-clock-history" /><span>Overtime Hours</span></div>
              <h3>{attendanceSummary?.totalOvertimeHours ?? 0}</h3>
              <p><i className="bi bi-calendar-week" /> {year}-{String(month).padStart(2, '0')}</p>
            </article>
            <article className="summary-card premium-card signature-card">
              <div className="kpi-top"><i className="bi bi-currency-dollar" /><span>Latest Net Salary</span></div>
              <h3>{currency(latestPayroll?.netSalary)}</h3>
              <p><i className="bi bi-receipt" /> {latestPayroll?.payrollMonth || 'No payroll yet'}</p>
            </article>
          </div>

          <div className="ops-grid">
            <section className="ops-panel">
              <h3>Attendance Actions</h3>
              <div className="action-row">
                <button type="button" className="primary-action" disabled={loading} onClick={onCheckIn}>Clock In</button>
                <button type="button" className="primary-action" disabled={loading} onClick={onCheckOut}>Clock Out</button>
              </div>
              <div className="profile-grid" style={{ marginTop: 20 }}>
                <p><strong>Working Days:</strong> {attendanceSummary?.workingDays ?? 0}</p>
                <p><strong>Leave Days:</strong> {attendanceSummary?.leaveDays ?? 0}</p>
                <p><strong>Absent Days:</strong> {attendanceSummary?.absentDays ?? 0}</p>
                <p><strong>Late Days:</strong> {attendanceSummary?.lateDays ?? 0}</p>
              </div>
            </section>

            <section className="ops-panel">
              <h3>Leave Request</h3>
              <form className="crud-form premium-form" onSubmit={onSubmitLeave}>
                <input type="date" value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} required />
                <input placeholder="Reason for leave" value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} />
                <button type="submit" className="primary-action" disabled={loading}>Submit Leave</button>
              </form>
            </section>
          </div>
        </>
      )}

      {(isAdmin || isManager) && (
        <div className="summary-grid premium-grid dashboard-kpis">
          <article className="summary-card premium-card signature-card">
            <div className="kpi-top"><i className="bi bi-people" /><span>Total Employees Paid</span></div>
            <h3>{insights?.recordCount ?? payrollRows.length}</h3>
            <p><i className="bi bi-calendar-event" /> {year}-{String(month).padStart(2, '0')}</p>
          </article>
          <article className="summary-card premium-card signature-card">
            <div className="kpi-top"><i className="bi bi-cash-stack" /><span>Total Salary Paid</span></div>
            <h3>{currency(insights?.totalSalaryExpense ?? totals.net)}</h3>
            <p><i className="bi bi-bar-chart" /> Monthly summary</p>
          </article>
          <article className="summary-card premium-card signature-card">
            <div className="kpi-top"><i className="bi bi-clock-history" /><span>Highest Overtime</span></div>
            <h3>{insights?.highestOvertimeHours ?? 0}</h3>
            <p><i className="bi bi-person" /> {insights?.highestOvertimeEmployee || 'N/A'}</p>
          </article>
        </div>
      )}

      <div className="table-wrap ops-table-wrap">
        <h3 className="ops-table-title">{isStaff ? 'My Salary & Payslips' : 'Payroll Records'}</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Month</th>
              <th>Base Salary</th>
              <th>Overtime</th>
              <th>Deductions</th>
              <th>Net Salary</th>
              <th>Status</th>
              <th>Payslip</th>
            </tr>
          </thead>
          <tbody>
            {payrollRows.map((row) => (
              <tr key={row.id}>
                <td>{row.employeeName || '-'}</td>
                <td>{row.payrollMonth || '-'}</td>
                <td>{currency(row.baseSalary)}</td>
                <td>{currency(row.overtimePay)}</td>
                <td>{currency(Number(row.deductions || 0) + Number(row.leaveDeduction || 0) + Number(row.tax || 0))}</td>
                <td style={{ fontWeight: 600 }}>{currency(row.netSalary)}</td>
                <td>{row.paymentStatus || 'UNPAID'}</td>
                <td>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => onDownloadPayslip(row.id, row.payrollMonth)}
                  >
                    Download PDF
                  </button>
                </td>
              </tr>
            ))}
            {payrollRows.length === 0 && (
              <tr>
                <td colSpan={8}>No payroll records available for selected period.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PayrollCenterPage;
