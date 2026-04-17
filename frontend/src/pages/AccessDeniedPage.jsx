import { Link, useNavigate } from 'react-router-dom';
import { logoutUser } from '../auth/auth';

function AccessDeniedPage() {
  const navigate = useNavigate();

  const handleGoLogin = () => {
    logoutUser();
    navigate('/login', { replace: true });
  };

  return (
    <div className="simple-page">
      <div className="simple-card">
        <i className="bi bi-shield-lock" />
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
        <Link to="/dashboard" className="primary-link">Go to Dashboard</Link>
        <button type="button" className="secondary-action" onClick={handleGoLogin}>
          Login with another role
        </button>
      </div>
    </div>
  );
}

export default AccessDeniedPage;
