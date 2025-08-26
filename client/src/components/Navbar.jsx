// src/components/Navbar.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Helper: Get initials from user name/email
const getInitials = (userData) => {
  if (!userData) return "";

  const user = userData.user || userData;
  if (user.name) {
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }
  if (user.email) return user.email[0].toUpperCase();
  return "";
};

// Helper: Get full avatar URL
const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith("http")) return avatarPath;
  return `http://localhost:5000${avatarPath}`;
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Reset avatar error state when user changes
  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatar]);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate("/login");
  };

  // Close mobile menu on navigation
  const handleNavClick = () => setMenuOpen(false);

  return (
    <nav className="bg-primary text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Brand - Logo with text */}
        <Link
          to="/"
          className="flex items-center gap-2"
          onClick={handleNavClick}
        >
          <img
            src="/SkillSwap_Logoo.png"
            alt="SkillSwap Logo"
            className="h-12"
          />
          <span className="text-2xl font-bold tracking-tight text-light hover:text-accent transition">
            SkillSwap
          </span>
        </Link>

        {/* Hamburger (mobile) */}
        <button
          className="md:hidden flex items-center px-2 py-1 rounded hover:bg-secondary focus:outline-none"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle menu"
        >
          <svg
            className="h-7 w-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8h16M4 16h16"
              />
            )}
          </svg>
        </button>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/explore-skills"
            className="hover:text-accent transition"
            onClick={handleNavClick}
          >
            Explore Skills
          </Link>
          <Link
            to="/explore-users"
            className="hover:text-accent transition"
            onClick={handleNavClick}
          >
            Explore Users
          </Link>
          {!user ? (
            <>
              <Link
                to="/login"
                className="hover:text-accent transition"
                onClick={handleNavClick}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="hover:text-accent transition"
                onClick={handleNavClick}
              >
                Register
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/dashboard"
                className="hover:text-accent transition"
                onClick={handleNavClick}
              >
                Dashboard
              </Link>
              <Link
                to="/profile"
                className="hover:text-accent transition"
                onClick={handleNavClick}
              >
                Profile
              </Link>
              {/* Avatar Dropdown */}
              <div className="relative">
                <button
                  className="ml-2 flex items-center gap-2 focus:outline-none"
                  onClick={() => setDropdownOpen((open) => !open)}
                  aria-label="User menu"
                >
                  {user?.avatar && !avatarError ? (
                    <img
                      src={getAvatarUrl(user.avatar)}
                      alt="Profile"
                      className="w-9 h-9 rounded-full object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-accent text-white font-bold text-lg">
                      {getInitials(user)}
                    </span>
                  )}
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {/* Dropdown */}
                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 bg-white text-secondary rounded shadow-lg py-2 z-50"
                    onMouseLeave={() => setDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 text-sm font-semibold border-b border-gray-200">
                      {user.name || user.email}
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 hover:bg-light text-primary"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-light text-primary"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-primary px-4 pb-4 pt-2 space-y-2">
          <Link
            to="/explore-skills"
            className="block hover:text-accent"
            onClick={handleNavClick}
          >
            Explore Skills
          </Link>
          <Link
            to="/explore-users"
            className="block hover:text-accent"
            onClick={handleNavClick}
          >
            Explore Users
          </Link>
          {!user ? (
            <>
              <Link
                to="/login"
                className="block hover:text-accent"
                onClick={handleNavClick}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="block hover:text-accent"
                onClick={handleNavClick}
              >
                Register
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/dashboard"
                className="block hover:text-accent"
                onClick={handleNavClick}
              >
                Dashboard
              </Link>
              <Link
                to="/profile"
                className="block hover:text-accent"
                onClick={handleNavClick}
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left hover:text-accent mt-2"
              >
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
