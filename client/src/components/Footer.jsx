// src/components/Footer.jsx
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-primary text-light py-10">
    <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
      {/* Brand & Copyright with Logo */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-2">
          <img 
            src="/SkillSwap_Logoo.png" // Same logo as navbar
            alt="SkillSwap Logo"
            className="h-11" // Slightly smaller than navbar
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
            }}
          />
          <span className="font-bold text-accent text-lg hidden sm:inline">
            SkillSwap
          </span>
        </div>
        <span className="text-sm text-center md:text-left">
          &copy; {new Date().getFullYear()} All rights reserved Icarus and Co.
        </span>
      </div>

      {/* Footer Links */}
      <div className="flex flex-wrap gap-4 justify-center md:justify-end">
        <Link
          to="/explore-skills"
          className="hover:text-accent transition text-sm"
        >
          Explore Skills
        </Link>
        <Link
          to="/explore-users"
          className="hover:text-accent transition text-sm"
        >
          Explore Users
        </Link>
        <Link to="/about" className="hover:text-accent transition text-sm">
          About
        </Link>
        <Link to="/contact" className="hover:text-accent transition text-sm">
          Contact
        </Link>
      </div>
    </div>

    {/* Optional Footer Bottom */}
    <div className="max-w-7xl mx-auto px-4 pt-6 mt-6 border-t border-t-secondary/10">
      <p className="text-xs text-center text-light/60">
        Made with ❤️ for skill enthusiasts worldwide
      </p>
    </div>
  </footer>
);

export default Footer;