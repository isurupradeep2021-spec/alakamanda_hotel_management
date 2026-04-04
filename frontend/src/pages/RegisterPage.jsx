import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerApi } from '../api/service';
import { registrationRoles, ROLES, toBackendRole } from '../auth/role';
import '../styles/auth.css';
import StarsBackground from '../components/StarsBackground';

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: ROLES.CUSTOMER,
    phone: ''
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerApi({
        ...form,
        role: toBackendRole(form.role)
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
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
            <div className="auth-form-eyebrow">NEW GUEST</div>
            <h2 className="auth-form-title">Create Account</h2>
            <p className="auth-form-subtitle">Register for your HotelFlow Concierge account</p>
          </div>

          <form className="dark-form" onSubmit={handleSubmit}>
            <div className="dark-form-group">
              <label htmlFor="register-full-name">Full Name</label>
              <div className="dark-input-wrap">
                <i className="bi bi-person"></i>
                <input 
                  id="register-full-name"
                  type="text" 
                  className="dark-input" 
                  value={form.fullName} 
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })} 
                  placeholder="John Doe"
                  required 
                />
              </div>
            </div>

            <div className="dark-form-group">
              <label htmlFor="register-email">Email Address</label>
              <div className="dark-input-wrap">
                <i className="bi bi-envelope"></i>
                <input 
                  id="register-email"
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
              <label htmlFor="register-password">Password</label>
              <div className="dark-input-wrap">
                <i className="bi bi-lock"></i>
                <input 
                  id="register-password"
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

            <div className="dark-form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label htmlFor="register-phone">Phone Number</label>
                <div className="dark-input-wrap" style={{ marginTop: '8px' }}>
                  <i className="bi bi-telephone"></i>
                  <input 
                    id="register-phone"
                    type="tel" 
                    className="dark-input" 
                    value={form.phone} 
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                    placeholder="+1 234 567 890"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="register-role">Account Role</label>
                <div className="dark-input-wrap" style={{ marginTop: '8px' }}>
                  <i className="bi bi-shield-check"></i>
                  <select 
                    id="register-role"
                    className="dark-input" 
                    value={form.role} 
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    {registrationRoles.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" required />
                <span>I agree to the Terms & Conditions</span>
              </label>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="gold-btn" disabled={loading}>
              {loading ? 'CREATING ACCOUNT...' : 'CREATE CONCIERGE ACCOUNT'}
            </button>

            <div className="divider">Or register with</div>

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
            Already a member? <Link to="/login">Sign In to Concierge</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
