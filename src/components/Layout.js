import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSpotify } from '../contexts/SpotifyContext';
import { Home, BarChart3, Clock, Library, Menu, X, LogOut, User } from 'lucide-react';
import './Layout.css';

const Layout = ({ children }) => {
  const { handleLogout } = useAuth();
  const { user, range, setRange } = useSpotify();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/stats', label: 'Stats', icon: BarChart3 },
    { path: '/recently-played', label: 'Recently Played', icon: Clock },
    { path: '/library', label: 'Library', icon: Library },
  ];

  const timeRanges = [
    { value: 'short_term', label: 'Last 4 Weeks' },
    { value: 'medium_term', label: 'Last 6 Months' },
    { value: 'long_term', label: 'All Time' },
  ];

  return (
    <div className="layout">
      <header className="header">
        <div className="header-container">
          <div className="header-left">
            <button
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="logo">
              <h1 className="logo-text">Spütify</h1>
            </div>
          </div>

          <nav className={`nav ${mobileMenuOpen ? 'nav-mobile-open' : ''}`}>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="header-right">
            <select
              className="time-range-select"
              value={range}
              onChange={(e) => setRange(e.target.value)}
            >
              {timeRanges.map((tr) => (
                <option key={tr.value} value={tr.value}>
                  {tr.label}
                </option>
              ))}
            </select>

            <div className="user-menu">
              {user && (
                <div className="user-info">
                  {user.images?.[0]?.url ? (
                    <img
                      src={user.images[0].url}
                      alt={user.display_name}
                      className="user-avatar"
                    />
                  ) : (
                    <div className="user-avatar-placeholder">
                      <User size={20} />
                    </div>
                  )}
                  <span className="user-name">{user.display_name}</span>
                </div>
              )}
              <button onClick={handleLogout} className="btn btn-ghost logout-btn">
                <LogOut size={18} />
                <span className="logout-text">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="content-container">{children}</div>
      </main>
    </div>
  );
};

export default Layout;