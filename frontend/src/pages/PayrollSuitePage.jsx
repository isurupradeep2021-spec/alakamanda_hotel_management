import { useEffect, useMemo, useState } from 'react';
import {
  adminApprovePayrollRun,
  archivePayrollProfile,
  createPayrollProfile,
  createPayrollRun,
  deletePayrollRun,
  exportPayrollReport,
  finalSettlementPayrollProfile,
  financeReleasePayrollRun,
  getPayrollAuditLogs,
  getPayrollCostTrend,
  getPayrollDashboard,
  getPayrollMonthlySummary,
  getPayrollProfiles,
  getPayrollRuns,
  getPayrollTaxLiability,
  getPayrollYtd,
  getUsers,
  managerReviewPayrollRun,
  updatePayrollProfile,
  verifyPayrollBank
} from '../api/service';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../auth/role';

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

function num(value, fallback = 0) {
  if (value === '' || value == null) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

const emptyProfileForm = {
  userId: '',
  employeeCode: '',
  employeeName: '',
  contractType: 'STAFF_MEMBER',
  department: '',
  payCycle: 'MONTHLY',
  baseSalary: '',
  hourlyRate: '',
  dailyRate: '',
  housingAllowance: '',
  transportAllowance: '',
  mealAllowance: '',
  shiftAllowancePerShift: '',
  performanceBonus: '',
  taxRate: '',
  insuranceRate: '',
  loanRepayment: '',
  overtimeMultiplier: '1.5',
  carryForwardAmount: '',
  bankName: '',
  bankAccountNumber: '',
  paymentMethod: 'BANK_TRANSFER',
  taxId: ''
};

function PayrollSuitePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;

  const now = useMemo(() => new Date(), []);
  const [tab, setTab] = useState('profiles');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [runs, setRuns] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [dashboard, setDashboard] = useState({});

  const [editingProfileId, setEditingProfileId] = useState(null);
  const [profileForm, setProfileForm] = useState(emptyProfileForm);

  const [runForm, setRunForm] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    payCycle: 'MONTHLY',
    notes: ''
  });

  const [reportYear, setReportYear] = useState(now.getFullYear());
  const [reportMonth, setReportMonth] = useState(now.getMonth() + 1);
  const [employeeCode, setEmployeeCode] = useState('');
  const [summaryReport, setSummaryReport] = useState(null);
  const [ytdReport, setYtdReport] = useState(null);
  const [taxReport, setTaxReport] = useState([]);
  const [trendReport, setTrendReport] = useState([]);

  const showMessage = (kind, message) => {
    if (kind === 'error') {
      setError(message);
      setSuccess('');
    } else {
      setSuccess(message);
      setError('');
    }
  };

  const loadProfiles = async () => {
    const [profilesRes, usersRes] = await Promise.all([
      getPayrollProfiles(),
      getUsers()
    ]);
    setProfiles(profilesRes.data || []);
    setUsers(usersRes.data || []);
  };

  const loadRuns = async () => {
    const [runsRes, dashboardRes] = await Promise.all([
      getPayrollRuns(),
      getPayrollDashboard()
    ]);
    setRuns(runsRes.data || []);
    setDashboard(dashboardRes.data || {});
  };

  const loadAudit = async () => {
    const res = await getPayrollAuditLogs();
    setAuditLogs(res.data || []);
  };

  const loadReports = async () => {
    const [summaryRes, taxRes, trendRes] = await Promise.all([
      getPayrollMonthlySummary(reportYear, reportMonth),
      getPayrollTaxLiability(reportYear),
      getPayrollCostTrend(12)
    ]);
    setSummaryReport(summaryRes.data || null);
    setTaxReport(taxRes.data || []);
    setTrendReport(trendRes.data || []);
  };

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([loadProfiles(), loadRuns(), loadAudit(), loadReports()]);
    } catch (e) {
      showMessage('error', e.response?.data?.message || e.message || 'Failed to load payroll suite data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizeProfilePayload = () => ({
    userId: num(profileForm.userId, null),
    employeeCode: profileForm.employeeCode,
    employeeName: profileForm.employeeName,
    contractType: profileForm.contractType,
    department: profileForm.department,
    payCycle: profileForm.payCycle,
    baseSalary: num(profileForm.baseSalary, 0),
    hourlyRate: profileForm.hourlyRate === '' ? null : num(profileForm.hourlyRate, 0),
    dailyRate: profileForm.dailyRate === '' ? null : num(profileForm.dailyRate, 0),
    housingAllowance: num(profileForm.housingAllowance, 0),
    transportAllowance: num(profileForm.transportAllowance, 0),
    mealAllowance: num(profileForm.mealAllowance, 0),
    shiftAllowancePerShift: num(profileForm.shiftAllowancePerShift, 0),
    performanceBonus: num(profileForm.performanceBonus, 0),
    taxRate: num(profileForm.taxRate, 0),
    insuranceRate: num(profileForm.insuranceRate, 0),
    loanRepayment: num(profileForm.loanRepayment, 0),
    overtimeMultiplier: num(profileForm.overtimeMultiplier, 1.5),
    carryForwardAmount: num(profileForm.carryForwardAmount, 0),
    bankName: profileForm.bankName || null,
    bankAccountNumber: profileForm.bankAccountNumber || null,
    paymentMethod: profileForm.paymentMethod || null,
    taxId: profileForm.taxId || null
  });

  const onSubmitProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = normalizeProfilePayload();
      if (!payload.userId) {
        throw new Error('Please select a user');
      }
      if (editingProfileId) {
        await updatePayrollProfile(editingProfileId, payload);
        showMessage('success', 'Payroll profile updated');
      } else {
        await createPayrollProfile(payload);
        showMessage('success', 'Payroll profile created');
      }
      setEditingProfileId(null);
      setProfileForm(emptyProfileForm);
      await loadProfiles();
    } catch (e2) {
      showMessage('error', e2.response?.data?.message || e2.message || 'Profile save failed');
    } finally {
      setLoading(false);
    }
  };

  const onEditProfile = (row) => {
    setEditingProfileId(row.id);
    setProfileForm({
      userId: row.userId || '',
      employeeCode: row.employeeCode || '',
      employeeName: row.employeeName || '',
      contractType: row.contractType || 'STAFF_MEMBER',
      department: row.department || '',
      payCycle: row.payCycle || 'MONTHLY',
      baseSalary: row.baseSalary ?? '',
      hourlyRate: row.hourlyRate ?? '',
      dailyRate: row.dailyRate ?? '',
      housingAllowance: row.housingAllowance ?? '',
      transportAllowance: row.transportAllowance ?? '',
      mealAllowance: row.mealAllowance ?? '',
      shiftAllowancePerShift: row.shiftAllowancePerShift ?? '',
      performanceBonus: row.performanceBonus ?? '',
      taxRate: row.taxRate ?? '',
      insuranceRate: row.insuranceRate ?? '',
      loanRepayment: row.loanRepayment ?? '',
      overtimeMultiplier: row.overtimeMultiplier ?? '1.5',
      carryForwardAmount: row.carryForwardAmount ?? '',
      bankName: row.bankName || '',
      bankAccountNumber: row.bankAccountNumber || '',
      paymentMethod: row.paymentMethod || 'BANK_TRANSFER',
      taxId: row.taxId || ''
    });
    setTab('profiles');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const profileAction = async (fn, successMessage) => {
    setLoading(true);
    setError('');
    try {
      await fn();
      showMessage('success', successMessage);
      await loadProfiles();
    } catch (e) {
      showMessage('error', e.response?.data?.message || e.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const onCreateRun = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createPayrollRun({
        year: num(runForm.year, now.getFullYear()),
        month: num(runForm.month, now.getMonth() + 1),
        payCycle: runForm.payCycle,
        notes: runForm.notes || null
      });
      showMessage('success', 'Payroll run created');
      await loadRuns();
    } catch (e2) {
      showMessage('error', e2.response?.data?.message || e2.message || 'Failed to create payroll run');
    } finally {
      setLoading(false);
    }
  };

  const runAction = async (fn, successMessage) => {
    setLoading(true);
    setError('');
    try {
      await fn();
      showMessage('success', successMessage);
      await loadRuns();
    } catch (e) {
      showMessage('error', e.response?.data?.message || e.message || 'Run action failed');
    } finally {
      setLoading(false);
    }
  };

  const onLoadYtd = async () => {
    if (!employeeCode) {
      showMessage('error', 'Enter employee code for YTD');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await getPayrollYtd(employeeCode, reportYear);
      setYtdReport(res.data || null);
    } catch (e) {
      showMessage('error', e.response?.data?.message || e.message || 'Failed to load YTD');
    } finally {
      setLoading(false);
    }
  };

  const onRefreshReports = async () => {
    setLoading(true);
    setError('');
    try {
      await loadReports();
      showMessage('success', 'Reports refreshed');
    } catch (e) {
      showMessage('error', e.response?.data?.message || e.message || 'Failed to refresh reports');
    } finally {
      setLoading(false);
    }
  };

  const onExportReport = async (format) => {
    setLoading(true);
    setError('');
    try {
      const res = await exportPayrollReport(reportYear, reportMonth, format);
      const blob = new Blob([res.data], { type: format === 'pdf' ? 'application/pdf' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll-summary-${reportYear}-${reportMonth}.${format === 'pdf' ? 'pdf' : 'csv'}`;
      a.click();
      URL.revokeObjectURL(url);
      showMessage('success', `Exported ${format.toUpperCase()} report`);
    } catch (e) {
      showMessage('error', e.response?.data?.message || e.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="module-page dashboard-luxe">
      <div className="dash-hero luxe-hero">
        <div className="module-head">
          <p className="eyebrow">Payroll Governance</p>
          <h2>Payroll Suite</h2>
          <p>Profiles, automated runs, approvals, reporting, and audit trail in one control center.</p>
        </div>
        <div className="hero-chip">
          <i className="bi bi-diagram-3" />
          {user?.role}
        </div>
      </div>

      {(error || success) && (
        <div className={error ? 'inline-error' : 'inline-success'} style={{ marginBottom: '12px' }}>
          {error || success}
        </div>
      )}

      <div className="summary-grid premium-grid dashboard-kpis">
        <article className="summary-card premium-card signature-card"><div className="kpi-top"><i className="bi bi-cash-stack" /><span>Total Payroll Cost</span></div><h3>{dashboard?.totalPayrollCost ?? '-'}</h3><p><i className="bi bi-graph-up-arrow" /> Current cycle</p></article>
        <article className="summary-card premium-card signature-card"><div className="kpi-top"><i className="bi bi-hourglass-split" /><span>Pending Payments</span></div><h3>{dashboard?.pendingPayments ?? '-'}</h3><p><i className="bi bi-clock-history" /> Awaiting release</p></article>
        <article className="summary-card premium-card signature-card"><div className="kpi-top"><i className="bi bi-calendar-event" /><span>Upcoming Runs</span></div><h3>{dashboard?.upcomingDisbursements ?? '-'}</h3><p><i className="bi bi-bell" /> Next 7 days</p></article>
      </div>

      <div className="room-type-tabs" style={{ marginTop: '20px' }}>
        <button type="button" className={`type-tab ${tab === 'profiles' ? 'active' : ''}`} onClick={() => setTab('profiles')}>Profiles</button>
        <button type="button" className={`type-tab ${tab === 'runs' ? 'active' : ''}`} onClick={() => setTab('runs')}>Runs & Approvals</button>
        <button type="button" className={`type-tab ${tab === 'reports' ? 'active' : ''}`} onClick={() => setTab('reports')}>Reports</button>
        <button type="button" className={`type-tab ${tab === 'audit' ? 'active' : ''}`} onClick={() => setTab('audit')}>Audit Log</button>
      </div>

      {tab === 'profiles' && (
        <>
          <section className="ops-panel">
            <h3>{editingProfileId ? 'Edit Payroll Profile' : 'Create Payroll Profile'}</h3>
            <form className="crud-form premium-form" onSubmit={onSubmitProfile}>
              <select value={profileForm.userId} onChange={(e) => setProfileForm({ ...profileForm, userId: e.target.value })} required>
                <option value="">Select Employee User</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
                ))}
              </select>
              <input placeholder="Employee Code" value={profileForm.employeeCode} onChange={(e) => setProfileForm({ ...profileForm, employeeCode: e.target.value })} required />
              <input placeholder="Employee Name" value={profileForm.employeeName} onChange={(e) => setProfileForm({ ...profileForm, employeeName: e.target.value })} required />
              <select value={profileForm.contractType} onChange={(e) => setProfileForm({ ...profileForm, contractType: e.target.value })}>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
                <option value="STAFF_MEMBER">Staff Member</option>
              </select>
              <input placeholder="Department" value={profileForm.department} onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })} required />
              <select value={profileForm.payCycle} onChange={(e) => setProfileForm({ ...profileForm, payCycle: e.target.value })}>
                <option value="MONTHLY">Monthly</option>
                <option value="BIWEEKLY">Biweekly</option>
                <option value="WEEKLY">Weekly</option>
              </select>
              <input type="number" step="0.01" placeholder="Base Salary" value={profileForm.baseSalary} onChange={(e) => setProfileForm({ ...profileForm, baseSalary: e.target.value })} />
              <input type="number" step="0.01" placeholder="Hourly Rate" value={profileForm.hourlyRate} onChange={(e) => setProfileForm({ ...profileForm, hourlyRate: e.target.value })} />
              <input type="number" step="0.01" placeholder="Daily Rate" value={profileForm.dailyRate} onChange={(e) => setProfileForm({ ...profileForm, dailyRate: e.target.value })} />
              <input type="number" step="0.01" placeholder="Housing Allowance" value={profileForm.housingAllowance} onChange={(e) => setProfileForm({ ...profileForm, housingAllowance: e.target.value })} />
              <input type="number" step="0.01" placeholder="Transport Allowance" value={profileForm.transportAllowance} onChange={(e) => setProfileForm({ ...profileForm, transportAllowance: e.target.value })} />
              <input type="number" step="0.01" placeholder="Meal Allowance" value={profileForm.mealAllowance} onChange={(e) => setProfileForm({ ...profileForm, mealAllowance: e.target.value })} />
              <input type="number" step="0.01" placeholder="Shift Allowance Per Shift" value={profileForm.shiftAllowancePerShift} onChange={(e) => setProfileForm({ ...profileForm, shiftAllowancePerShift: e.target.value })} />
              <input type="number" step="0.01" placeholder="Performance Bonus" value={profileForm.performanceBonus} onChange={(e) => setProfileForm({ ...profileForm, performanceBonus: e.target.value })} />
              <input type="number" step="0.01" placeholder="Tax Rate (0.08)" value={profileForm.taxRate} onChange={(e) => setProfileForm({ ...profileForm, taxRate: e.target.value })} />
              <input type="number" step="0.01" placeholder="Insurance Rate (0.03)" value={profileForm.insuranceRate} onChange={(e) => setProfileForm({ ...profileForm, insuranceRate: e.target.value })} />
              <input type="number" step="0.01" placeholder="Loan Repayment" value={profileForm.loanRepayment} onChange={(e) => setProfileForm({ ...profileForm, loanRepayment: e.target.value })} />
              <input type="number" step="0.01" placeholder="Overtime Multiplier (1.5)" value={profileForm.overtimeMultiplier} onChange={(e) => setProfileForm({ ...profileForm, overtimeMultiplier: e.target.value })} />
              <input type="number" step="0.01" placeholder="Carry Forward Amount" value={profileForm.carryForwardAmount} onChange={(e) => setProfileForm({ ...profileForm, carryForwardAmount: e.target.value })} />
              <input placeholder="Bank Name" value={profileForm.bankName} onChange={(e) => setProfileForm({ ...profileForm, bankName: e.target.value })} />
              <input placeholder="Bank Account Number" value={profileForm.bankAccountNumber} onChange={(e) => setProfileForm({ ...profileForm, bankAccountNumber: e.target.value })} />
              <input placeholder="Payment Method" value={profileForm.paymentMethod} onChange={(e) => setProfileForm({ ...profileForm, paymentMethod: e.target.value })} />
              <input placeholder="Tax ID" value={profileForm.taxId} onChange={(e) => setProfileForm({ ...profileForm, taxId: e.target.value })} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="primary-action" disabled={loading}>{editingProfileId ? 'Update' : 'Create'}</button>
                {editingProfileId && (
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => {
                      setEditingProfileId(null);
                      setProfileForm(emptyProfileForm);
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          <div className="table-wrap ops-table-wrap">
            <h3 className="ops-table-title">Payroll Profiles</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Contract</th>
                  <th>Dept</th>
                  <th>Cycle</th>
                  <th>Bank Verified</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id}>
                    <td>{p.employeeCode}</td>
                    <td>{p.employeeName}</td>
                    <td>{p.contractType}</td>
                    <td>{p.department}</td>
                    <td>{p.payCycle}</td>
                    <td>{p.bankVerified ? 'YES' : 'NO'}</td>
                    <td>{p.archived ? 'ARCHIVED' : p.active ? 'ACTIVE' : 'INACTIVE'}</td>
                    <td>
                      <button type="button" className="secondary-btn" style={{ marginRight: 6, padding: '6px 10px' }} onClick={() => onEditProfile(p)}>Edit</button>
                      <button type="button" className="secondary-btn" style={{ marginRight: 6, padding: '6px 10px' }} onClick={() => profileAction(() => verifyPayrollBank(p.id, true), 'Bank verified')}>Verify Bank</button>
                      <button type="button" className="secondary-btn" style={{ marginRight: 6, padding: '6px 10px' }} onClick={() => profileAction(() => finalSettlementPayrollProfile(p.id, 0), 'Final settlement marked')}>Final Settle</button>
                      {isAdmin && (
                        <button type="button" className="danger-btn" style={{ padding: '6px 10px' }} onClick={() => profileAction(() => archivePayrollProfile(p.id), 'Profile archived')}>Archive</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'runs' && (
        <>
          <section className="ops-panel">
            <h3>Create Payroll Run</h3>
            <form className="crud-form premium-form" onSubmit={onCreateRun}>
              <input type="number" placeholder="Year" value={runForm.year} onChange={(e) => setRunForm({ ...runForm, year: e.target.value })} required />
              <input type="number" min="1" max="12" placeholder="Month" value={runForm.month} onChange={(e) => setRunForm({ ...runForm, month: e.target.value })} required />
              <select value={runForm.payCycle} onChange={(e) => setRunForm({ ...runForm, payCycle: e.target.value })}>
                <option value="MONTHLY">MONTHLY</option>
                <option value="BIWEEKLY">BIWEEKLY</option>
                <option value="WEEKLY">WEEKLY</option>
              </select>
              <input placeholder="Notes" value={runForm.notes} onChange={(e) => setRunForm({ ...runForm, notes: e.target.value })} />
              <button type="submit" className="primary-action" disabled={loading}>Create Draft</button>
            </form>
          </section>

          <div className="table-wrap ops-table-wrap">
            <h3 className="ops-table-title">Payroll Runs Workflow</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Period</th>
                  <th>Cycle</th>
                  <th>Status</th>
                  <th>Records</th>
                  <th>Total Net</th>
                  <th>Scheduled</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.year}-{String(r.month).padStart(2, '0')}</td>
                    <td>{r.payCycle}</td>
                    <td>{r.status}</td>
                    <td>{r.recordCount}</td>
                    <td>{r.totalNetAmount}</td>
                    <td>{r.scheduledDate}</td>
                    <td>
                      {r.status === 'DRAFT' && (
                        <>
                          <button type="button" className="secondary-btn" style={{ marginRight: 6, padding: '6px 10px' }} onClick={() => runAction(() => managerReviewPayrollRun(r.id, 'Reviewed by manager'), 'Moved to manager review')}>Manager Review</button>
                          <button type="button" className="danger-btn" style={{ padding: '6px 10px' }} onClick={() => runAction(() => deletePayrollRun(r.id), 'Draft run deleted')}>Delete</button>
                        </>
                      )}
                      {r.status === 'MANAGER_REVIEW' && isAdmin && (
                        <button type="button" className="secondary-btn" style={{ padding: '6px 10px' }} onClick={() => runAction(() => adminApprovePayrollRun(r.id, 'Approved by admin'), 'Run approved by admin')}>Admin Approve</button>
                      )}
                      {r.status === 'ADMIN_APPROVED' && isAdmin && (
                        <button type="button" className="primary-action" style={{ padding: '6px 10px' }} onClick={() => runAction(() => financeReleasePayrollRun(r.id, 'Released by finance'), 'Run released by finance')}>Finance Release</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'reports' && (
        <>
          <section className="ops-panel">
            <h3>Payroll Reports & Exports</h3>
            <div className="crud-form premium-form">
              <input type="number" placeholder="Year" value={reportYear} onChange={(e) => setReportYear(num(e.target.value, now.getFullYear()))} />
              <input type="number" min="1" max="12" placeholder="Month" value={reportMonth} onChange={(e) => setReportMonth(num(e.target.value, now.getMonth() + 1))} />
              <button type="button" className="primary-action" onClick={onRefreshReports} disabled={loading}>Refresh Summary</button>
              <button type="button" className="secondary-btn" onClick={() => onExportReport('excel')} disabled={loading}>Export CSV</button>
              <button type="button" className="secondary-btn" onClick={() => onExportReport('pdf')} disabled={loading}>Export PDF</button>
            </div>
            <div className="crud-form premium-form" style={{ marginTop: 10 }}>
              <input placeholder="Employee Code for YTD" value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} />
              <button type="button" className="secondary-btn" onClick={onLoadYtd} disabled={loading}>Load YTD</button>
            </div>
          </section>

          <div className="summary-grid premium-grid dashboard-kpis">
            <article className="summary-card premium-card signature-card"><div className="kpi-top"><i className="bi bi-receipt" /><span>Summary Records</span></div><h3>{summaryReport?.recordCount ?? '-'}</h3><p><i className="bi bi-calendar-event" /> {reportYear}-{String(reportMonth).padStart(2, '0')}</p></article>
            <article className="summary-card premium-card signature-card"><div className="kpi-top"><i className="bi bi-currency-dollar" /><span>Total Net</span></div><h3>{summaryReport?.totalNet ?? '-'}</h3><p><i className="bi bi-graph-up-arrow" /> Monthly payroll</p></article>
            <article className="summary-card premium-card signature-card"><div className="kpi-top"><i className="bi bi-person-lines-fill" /><span>YTD Net</span></div><h3>{ytdReport?.netYtd ?? '-'}</h3><p><i className="bi bi-clock-history" /> {employeeCode || 'Set employee code'}</p></article>
          </div>

          <div className="table-wrap ops-table-wrap">
            <h3 className="ops-table-title">Tax Liability Report</h3>
            <table className="data-table">
              <thead><tr><th>Employee Code</th><th>Name</th><th>Year</th><th>Tax Liability</th></tr></thead>
              <tbody>
                {taxReport.map((t, idx) => (
                  <tr key={`${t.employeeCode}-${idx}`}>
                    <td>{t.employeeCode}</td>
                    <td>{t.employeeName}</td>
                    <td>{t.year}</td>
                    <td>{t.taxLiability}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-wrap ops-table-wrap" style={{ marginTop: 14 }}>
            <h3 className="ops-table-title">Payroll Cost Trend</h3>
            <table className="data-table">
              <thead><tr><th>Year</th><th>Month</th><th>Total Cost</th></tr></thead>
              <tbody>
                {trendReport.map((t, idx) => (
                  <tr key={`${t.year}-${t.month}-${idx}`}>
                    <td>{t.year}</td>
                    <td>{t.month}</td>
                    <td>{t.totalCost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'audit' && (
        <div className="table-wrap ops-table-wrap">
          <h3 className="ops-table-title">Payroll Audit Log</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Entity</th>
                <th>Entity ID</th>
                <th>Action</th>
                <th>Changed By</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td>{formatDate(log.changedAt)}</td>
                  <td>{log.entityType}</td>
                  <td>{log.entityId}</td>
                  <td>{log.action}</td>
                  <td>{log.changedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PayrollSuitePage;
