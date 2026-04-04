import { useEffect, useState } from 'react';
import { downloadPayrollPayslip, getPayroll } from '../api/service';
import { useAuth } from '../context/AuthContext';

function PayslipPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currency = (value) => Number(value || 0).toFixed(2);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getPayroll();
      setRows(res.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load payslips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onDownload = async (id, month) => {
    try {
      const res = await downloadPayrollPayslip(id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${month || id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to download payslip');
    }
  };

  return (
    <div className="module-page dashboard-luxe">
      <div className="dash-hero luxe-hero">
        <div className="module-head">
          <p className="eyebrow">Payslip Center</p>
          <h2>My Payslips</h2>
          <p>View salary history and download monthly payslips as PDF.</p>
        </div>
        <div className="hero-chip">
          <i className="bi bi-file-earmark-pdf" />
          {user?.role}
        </div>
      </div>

      {error && <div className="inline-error">{error}</div>}
      <div className="action-row">
        <button type="button" className="secondary-btn" onClick={load} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="table-wrap ops-table-wrap">
        <h3 className="ops-table-title">Payslip History</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Base Salary</th>
              <th>Overtime</th>
              <th>Deductions</th>
              <th>Net Salary</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.payrollMonth || '-'}</td>
                <td>{currency(row.baseSalary)}</td>
                <td>{currency(row.overtimePay)}</td>
                <td>{currency(Number(row.deductions || 0) + Number(row.leaveDeduction || 0) + Number(row.tax || 0))}</td>
                <td style={{ fontWeight: 600 }}>{currency(row.netSalary)}</td>
                <td>{row.paymentStatus || 'UNPAID'}</td>
                <td>
                  <button type="button" className="secondary-btn" onClick={() => onDownload(row.id, row.payrollMonth)}>
                    Download PDF
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7}>No payslips generated yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PayslipPage;
