import { Link } from "react-router-dom";

const features = [
  {
    icon: "🔄",
    title: "Skill Exchange",
    desc: "Offer what you know, get what you need. No money — just mutual growth between real people.",
    gradient: "from-primary to-secondary",
  },
  {
    icon: "🎯",
    title: "Smart Matching",
    desc: "Our algorithm connects you with people whose skills perfectly complement your learning goals.",
    gradient: "from-secondary to-accent",
  },
  {
    icon: "⭐",
    title: "Trusted Reviews",
    desc: "Every swap is rated. Build your reputation and find reliable partners with confidence.",
    gradient: "from-accent to-light",
  },
];

const steps = [
  { step: "01", title: "Create Your Profile", desc: "List what you can teach and what you want to learn." },
  { step: "02", title: "Find a Match",        desc: "Browse users or let our matchmaker do the work." },
  { step: "03", title: "Swap & Grow",         desc: "Propose a swap, connect, and level up together." },
];

const Home = () => (
  <div className="overflow-x-hidden">

    {/* ── Hero ─────────────────────────────────────────────────── */}
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent overflow-hidden">

      {/* Decorative blobs */}
      <div className="absolute top-16 left-8 w-80 h-80 bg-accent/30 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="absolute bottom-24 right-8 w-96 h-96 bg-light/20 rounded-full blur-3xl animate-float delay-300 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-secondary/40 rounded-full blur-3xl pointer-events-none" />

      {/* Dot-grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #A5D7E8 1px, transparent 1px)", backgroundSize: "40px 40px" }}
      />

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto py-24">

        {/* Badge */}
        <div className="animate-fade-in inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-5 py-2 text-light text-sm font-medium mb-8 shadow-lg">
          <span className="w-2 h-2 bg-light rounded-full animate-pulse" />
          Join thousands of skill sharers today
        </div>

        {/* Headline */}
        <h1 className="animate-fade-in-up delay-100 text-5xl sm:text-6xl md:text-7xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight">
          Exchange Skills,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-light to-accent">
            Grow Together
          </span>
        </h1>

        {/* Sub */}
        <p className="animate-fade-in-up delay-200 text-xl md:text-2xl text-light/80 mb-10 max-w-2xl mx-auto leading-relaxed">
          Offer your expertise, learn something new, and build a trusted community — one swap at a time.
        </p>

        {/* CTA Buttons */}
        <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/register"
            className="group inline-flex items-center justify-center gap-2 bg-light text-primary px-9 py-4 rounded-2xl font-bold text-lg shadow-light-glow hover:shadow-glow-lg hover:-translate-y-1 transition-all duration-300"
          >
            Get Started Free
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link
            to="/explore-skills"
            className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md text-white border border-white/30 px-9 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 hover:-translate-y-1 transition-all duration-300"
          >
            Explore Skills
          </Link>
        </div>

        {/* Stats */}
        <div className="animate-fade-in-up delay-400 flex flex-wrap justify-center gap-12 mt-20">
          {[
            { value: "500+", label: "Skills Available" },
            { value: "1K+",  label: "Active Users" },
            { value: "19",   label: "Categories" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl font-extrabold text-white tracking-tight">{s.value}</div>
              <div className="text-light/60 text-sm mt-1 uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 1440 72" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full">
          <path d="M0 72L60 66C120 60 240 48 360 44C480 40 600 44 720 48C840 52 960 56 1080 56C1200 56 1320 52 1380 50L1440 48V72H0Z" fill="white" />
        </svg>
      </div>
    </section>

    {/* ── Features ─────────────────────────────────────────────── */}
    <section className="py-28 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-accent font-semibold uppercase tracking-widest text-sm">Why SkillSwap</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-primary mt-2 mb-4">Built for learners,<br />by learners</h2>
          <p className="text-secondary/60 text-lg max-w-xl mx-auto">Everything you need to connect, trade knowledge, and grow.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f) => (
            <div
              key={f.title}
              className="group bg-white rounded-3xl p-8 shadow-md border border-gray-100 hover:shadow-glow hover:-translate-y-2 transition-all duration-300 cursor-default"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-2xl mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {f.icon}
              </div>
              <h3 className="text-xl font-bold text-primary mb-3">{f.title}</h3>
              <p className="text-secondary/60 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── How it works ─────────────────────────────────────────── */}
    <section className="py-28 px-4 bg-gradient-to-br from-primary/5 via-white to-accent/10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-accent font-semibold uppercase tracking-widest text-sm">Simple Process</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-primary mt-2 mb-4">How It Works</h2>
          <p className="text-secondary/60 text-lg">Three steps to your first skill swap</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
          {/* Connector */}
          <div className="hidden md:block absolute top-8 left-[22%] right-[22%] h-px bg-gradient-to-r from-accent/30 via-accent to-accent/30" />

          {steps.map((s, i) => (
            <div key={s.step} className="flex flex-col items-center text-center" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent text-white font-extrabold text-lg flex items-center justify-center mb-6 shadow-glow ring-4 ring-white z-10">
                {s.step}
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">{s.title}</h3>
              <p className="text-secondary/60 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── CTA Banner ───────────────────────────────────────────── */}
    <section className="py-24 px-4 bg-gradient-to-r from-primary to-secondary relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #A5D7E8 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
          Ready to start swapping?
        </h2>
        <p className="text-light/70 text-lg mb-10">
          Create your free account and make your first swap today.
        </p>
        <Link
          to="/register"
          className="group inline-flex items-center gap-3 bg-light text-primary px-10 py-4 rounded-2xl font-bold text-lg shadow-light-glow hover:-translate-y-1 hover:shadow-glow-lg transition-all duration-300"
        >
          Join for Free
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </section>

  </div>
);

export default Home;
