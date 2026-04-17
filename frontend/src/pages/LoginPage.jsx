import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../auth/role';
import '../styles/auth.css';
import StarsBackground from '../components/StarsBackground';

const roleOptions = Object.values(ROLES);

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', role: ROLES.CUSTOMER });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      const next = location.state?.from || '/dashboard';
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* Left Hero Section */}
      <div className="auth-hero">
        <StarsBackground />
        
        <div className="auth-brand">
          <div className="brand-logo-mark"><span>H</span></div>
          HOTELFLOW & RESORTS
        </div>

        <div className="auth-hero-content">
          <div className="auth-hero-eyebrow">EST. 2024 • WORLDWIDE</div>
          <h1 className="auth-hero-title">Where Luxury Becomes <span>Legend</span></h1>
          <p className="auth-hero-desc">
            Immerse yourself in the extraordinary. Each property is a sanctuary of refinement — where timeless elegance meets impeccable service, and every moment is curated to perfection.
          </p>
        </div>

        <div className="auth-hero-stats">
          <div className="stat-item">
            <span className="stat-label">Forbes Rating</span>
            <span className="stat-value stat-stars">
              <i className="bi bi-star-fill"></i>
              <i className="bi bi-star-fill"></i>
              <i className="bi bi-star-fill"></i>
              <i className="bi bi-star-fill"></i>
              <i className="bi bi-star-fill"></i>
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Properties</span>
            <span className="stat-value">47 <span style={{fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginLeft: '4px'}}>Destinations</span></span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Member Since</span>
            <span className="stat-value">Preferred <br/> Collection</span>
          </div>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="auth-form-side">
        <div className="auth-form-wrapper">
          <div className="auth-form-header">
            <div className="auth-form-eyebrow">MEMBER ACCESS</div>
            <h2 className="auth-form-title">Welcome Back</h2>
            <p className="auth-form-subtitle">Sign in to your HotelFlow Concierge account</p>
          </div>

          <form className="dark-form" onSubmit={handleSubmit}>
            <div className="dark-form-group">
              <label>Email Address</label>
              <div className="dark-input-wrap">
                <i className="bi bi-envelope"></i>
                <input 
                  type="email" 
                  className="dark-input" 
                  value={form.email} 
                  onChange={(e) => setForm({ ...form, email: e.target.value })} 
                  placeholder="your@email.com"
                  required 
                />
              </div>
            </div>

            <div className="dark-form-group">
              <label>Password</label>
              <div className="dark-input-wrap">
                <i className="bi bi-lock"></i>
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="dark-input" 
                  value={form.password} 
                  onChange={(e) => setForm({ ...form, password: e.target.value })} 
                  placeholder="••••••••"
                  required 
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>
            
            <div className="dark-form-group">
              <label>Account Role</label>
              <div className="dark-input-wrap">
                <i className="bi bi-shield-check"></i>
                <select 
                  className="dark-input" 
                  value={form.role} 
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" />
                Remember me
              </label>
              <a href="#" className="forgot-link">Forgot password?</a>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="gold-btn" disabled={loading}>
              {loading ? 'SIGNING IN...' : 'SIGN IN TO CONCIERGE'}
            </button>

            <div className="divider">Or continue with</div>

            <div className="social-btns">
              <button type="button" className="social-btn">
                <i className="bi bi-google"></i> Google
              </button>
              <button type="button" className="social-btn">
                <i className="bi bi-facebook"></i> Facebook
              </button>
            </div>
          </form>

          <div className="auth-footer">
            New to HotelFlow? <Link to="/register">Create a Concierge Account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
