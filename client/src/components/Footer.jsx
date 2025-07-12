// src/components/Footer.jsx
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-primary text-light py-6">
    <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Brand & Copyright */}
      <div className="text-center md:text-left">
        <span className="font-bold text-accent text-lg">SkillSwap</span>
        <span className="ml-2 text-sm">
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
  </footer>
);

export default Footer;
