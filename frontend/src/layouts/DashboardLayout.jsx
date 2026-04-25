import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllowedMenuForRole, ROLES } from '../auth/role';
import CustomerSupportChatbot from '../components/CustomerSupportChatbot';

function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const contentRef = useRef(null);

  const menuItems = getAllowedMenuForRole(user?.role);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    contentRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand-block">
          <h1>HotelFlow</h1>
          <p>{user?.role}</p>
        </div>

        <nav className="side-nav">
          {menuItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
              <i className={`bi ${item.icon}`} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          className="logout-btn"
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          <i className="bi bi-box-arrow-right" />
          Logout
        </button>
      </aside>

      <main className="app-content" ref={contentRef}>
        <Outlet />
        {user?.role === ROLES.CUSTOMER && <CustomerSupportChatbot />}
      </main>
    </div>
  );
}

export default DashboardLayout;
