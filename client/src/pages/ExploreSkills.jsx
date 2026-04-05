import { useEffect, useState } from "react";
import axios from "axios";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";

import { API_BASE } from "../config";

const ExploreSkills = () => {
  const [categories, setCategories] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loadingCats, setLoadingCats] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoadingCats(true);
    axios
      .get(`${API_BASE}/categories`)
      .then((res) => { setCategories(res.data); setLoadingCats(false); })
      .catch(() => { setError("Failed to load categories."); setLoadingCats(false); });
  }, []);

  const handleCategoryClick = (cat) => {
    setExpanded((prev) => {
      if (prev[cat._id]) {
        const next = { ...prev };
        delete next[cat._id];
        return next;
      }
      return { ...prev, [cat._id]: { loading: true, error: "", skills: [] } };
    });

    if (!expanded[cat._id]) {
      axios
        .get(`${API_BASE}/categories/${cat._id}/skills`)
        .then((res) =>
          setExpanded((prev) => ({ ...prev, [cat._id]: { loading: false, error: "", skills: res.data } }))
        )
        .catch(() =>
          setExpanded((prev) => ({ ...prev, [cat._id]: { loading: false, error: "Failed to load skills.", skills: [] } }))
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/10">

      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary to-secondary py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle, #A5D7E8 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-light text-sm font-medium mb-4">
            🎓 Browse all skill categories
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
            Explore Skills
          </h1>
          <p className="text-light/70 text-lg max-w-xl mx-auto">
            Discover what our community can teach — click any category to see available skills.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {loadingCats ? (
          <LoadingSpinner text="Loading categories..." />
        ) : error ? (
          <ErrorBanner error={error} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {categories.map((cat, i) => {
              const isOpen = !!expanded[cat._id];
              const catState = expanded[cat._id] || {};
              const gradients = [
                "from-primary to-secondary",
                "from-secondary to-accent",
                "from-accent to-light",
                "from-primary to-accent",
              ];
              const grad = gradients[i % gradients.length];

              return (
                <div key={cat._id} className="flex flex-col">
                  {/* Category Card */}
                  <button
                    onClick={() => handleCategoryClick(cat)}
                    className={`group w-full bg-white rounded-2xl p-5 shadow-md border-2 transition-all duration-300 text-left hover:shadow-glow hover:-translate-y-1 ${
                      isOpen ? "border-accent shadow-glow" : "border-transparent hover:border-accent/30"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-2xl mb-3 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      {cat.icon}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary capitalize text-sm">
                        {cat.name.replace(/-/g, " ")}
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-4 w-4 text-accent transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded Skills */}
                  {isOpen && (
                    <div className="mt-3 bg-white rounded-2xl shadow-md border border-accent/20 p-4 animate-fade-in">
                      {catState.loading ? (
                        <LoadingSpinner text="Loading skills..." />
                      ) : catState.error ? (
                        <ErrorBanner error={catState.error} />
                      ) : catState.skills.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-2">No skills found.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {catState.skills.map((skill) => (
                            <span
                              key={skill._id}
                              className="bg-gradient-to-r from-primary/10 to-accent/10 text-primary border border-accent/20 px-3 py-1 rounded-full text-xs font-semibold capitalize"
                            >
                              {cat.icon} {skill.name?.replace(/-/g, " ") ?? "Unnamed"}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreSkills;
