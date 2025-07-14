// src/pages/Home.jsx
import { Link } from "react-router-dom";

const Home = () => (
  <div className="flex flex-col items-center justify-center min-h-[70vh] bg-gradient-to-br from-primary to-accent px-4">
    <h1 className="text-4xl md:text-5xl font-extrabold text-light mb-4 text-center drop-shadow-lg">
      Welcome to <span className="text-accent">SkillSwap</span>
    </h1>
    <p className="text-lg md:text-xl text-light mb-8 text-center max-w-2xl">
      Exchange skills, connect with talented people, and grow together. Offer your expertise, learn something new, and build a trusted community—one swap at a time.
    </p>
    <div className="flex flex-col sm:flex-row gap-4">
      <Link
        to="/register"
        className="bg-accent text-white px-6 py-3 rounded-lg font-semibold text-lg shadow hover:bg-secondary transition"
      >
        Get Started
      </Link>
      <Link
        to="/explore-skills"
        className="bg-white text-primary px-6 py-3 rounded-lg font-semibold text-lg shadow hover:bg-light transition border border-accent"
      >
        Explore Skills
      </Link>
    </div>
  </div>
);

export default Home;