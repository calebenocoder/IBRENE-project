import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { supabase } from '../lib/supabase';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    navigate('/');
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''} ${location.pathname === '/dashboard' ? 'navbar-dashboard' : ''}`}>
      <div className="container flex items-center justify-between">
        <Link to="/" className="logo">
          <img src={logo} alt="IBRENE Logo" />
        </Link>

        {/* Desktop Menu */}
        <ul className="nav-links flex gap-md items-center">
          <li><Link to="/" className="nav-link">Home</Link></li>
          <li><a href="/#about" className="nav-link">Sobre</a></li>
          <li><a href="/#ministries" className="nav-link">Ministérios</a></li>
          {isAuthenticated ? (
            location.pathname === '/' ? (
              <li><Link to="/dashboard" className="btn btn-primary btn-with-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: '6px' }}>
                  <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2 2.5c0-.83-.67-1.5-1.5-1.5h-1c-.83 0-1.5.67-1.5 1.5V14h4v-3.5z" />
                  <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm4.5 2.5c0-1.38-1.12-2.5-2.5-2.5h-4c-1.38 0-2.5 1.12-2.5 2.5V14h9v-3.5z" />
                </svg>
                Cursos
              </Link></li>
            ) : (
              <li><button onClick={handleLogout} className="btn btn-primary">Sair</button></li>
            )
          ) : (
            location.pathname !== '/login' && (
              <li><Link to="/login" className="btn btn-primary">Login</Link></li>
            )
          )}
        </ul>

        {/* Mobile Toggle */}
        <button
          className="mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>
      </div>

      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 1000;
          padding: 1rem 0;
          transition: all 0.3s ease;
          background: transparent;
        }
        
        .navbar.scrolled {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          padding: 0.75rem 0;
        }

        .navbar.scrolled .nav-link {
          color: var(--color-text-main);
        }

        /* Dashboard Specific Navbar Styles */
        .navbar.navbar-dashboard {
          /* Force dark text even if not scrolled (since bg is light) */
        }
        
        .navbar.navbar-dashboard .nav-link {
          color: var(--color-text-main); 
        }

        .navbar.navbar-dashboard:not(.scrolled) .nav-link:hover {
           color: var(--color-accent);
        }

        .navbar.navbar-dashboard .bar {
          background-color: var(--color-text-main);
        }

        /* Logo Styling */
        .logo {
          transition: all 0.3s ease;
          border-radius: 8px;
        }

        .logo img {
          height: 40px;
          width: auto;
          display: block;
          transition: all 0.3s ease;
        }

        /* Make logo white when navbar is transparent (not scrolled) */
        .navbar:not(.scrolled) .logo img {
          filter: brightness(0) invert(1);
        }

        .nav-links {
          list-style: none;
        }

        .nav-link {
          font-weight: 500;
          color: var(--color-white);
          font-size: 0.95rem;
        }

        .navbar.scrolled .nav-link:hover {
          color: var(--color-accent);
        }

        .mobile-toggle {
          display: none;
          flex-direction: column;
          gap: 6px;
          background: none;
        }

        .bar {
          width: 25px;
          height: 2px;
          background-color: var(--color-white);
          transition: 0.3s;
        }

        .navbar.scrolled .bar {
          background-color: var(--color-text-main);
        }

        .btn-with-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .nav-links {
            display: none; /* Mobile menu implementation omitted for brevity, but toggle button exists */
          }
          .mobile-toggle {
            display: flex;
          }
        }
      `}</style>
    </nav>
  );
};
