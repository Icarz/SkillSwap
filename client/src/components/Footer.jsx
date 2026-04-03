import { Link } from "react-router-dom";

const FooterLink = ({ to, children }) => (
  <Link
    to={to}
    className="text-light/60 hover:text-light text-sm transition-colors duration-200"
  >
    {children}
  </Link>
);

const Footer = () => (
  <footer className="bg-gradient-to-r from-primary to-secondary relative overflow-hidden">
    {/* Dot pattern — same as page headers */}
    <div
      className="absolute inset-0 opacity-[0.07] pointer-events-none"
      style={{
        backgroundImage: "radial-gradient(circle, #A5D7E8 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    />

    <div className="relative z-10 max-w-7xl mx-auto px-4 pt-12 pb-8">

      {/* Main grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-10">

        {/* Brand */}
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <img
              src="/SkillSwap_Logoo.png"
              alt="SkillSwap"
              className="h-11"
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <span className="text-2xl font-extrabold text-white tracking-tight">
              SkillSwap
            </span>
          </Link>
          <p className="text-light/60 text-sm leading-relaxed max-w-xs">
            Connect with people who want to learn what you know — and teach what you want to learn. Swap skills, grow together.
          </p>
        </div>

        {/* Explore */}
        <div>
          <p className="text-light/40 text-xs font-semibold uppercase tracking-widest mb-4">
            Explore
          </p>
          <ul className="space-y-2.5">
            <li><FooterLink to="/explore-skills">Explore Skills</FooterLink></li>
            <li><FooterLink to="/explore-users">Find Users</FooterLink></li>
          </ul>
        </div>

        {/* Account */}
        <div>
          <p className="text-light/40 text-xs font-semibold uppercase tracking-widest mb-4">
            Account
          </p>
          <ul className="space-y-2.5">
            <li><FooterLink to="/dashboard">Dashboard</FooterLink></li>
            <li><FooterLink to="/profile">My Profile</FooterLink></li>
            <li><FooterLink to="/transactions">Transactions</FooterLink></li>
            <li><FooterLink to="/messages">Messages</FooterLink></li>
          </ul>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-light/40 text-xs">
          &copy; {new Date().getFullYear()} SkillSwap — Icarus &amp; Co. All rights reserved.
        </p>
        <p className="text-light/30 text-xs">
          Made with ♥ for skill enthusiasts worldwide
        </p>
      </div>

    </div>
  </footer>
);

export default Footer;
