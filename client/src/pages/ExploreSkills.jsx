// src/pages/ExploreSkills.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import SkillCard from "../components/SkillCard";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
// import { useAuth } from "../contexts/AuthContext";

const API_BASE = "http://localhost:5000/api";

const ExploreSkills = () => {
  const [categories, setCategories] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loadingCats, setLoadingCats] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoadingCats(true);
    axios
      .get(`${API_BASE}/categories`)
      .then((res) => {
        setCategories(res.data);
        setLoadingCats(false);
      })
      .catch(() => {
        setError("Failed to load categories.");
        setLoadingCats(false);
      });
  }, []);

  const handleCategoryClick = (cat) => {
    setExpanded((prev) => {
      if (prev[cat._id]) {
        const newState = { ...prev };
        delete newState[cat._id];
        return newState;
      }
      return {
        ...prev,
        [cat._id]: { loading: true, error: "", skills: [] },
      };
    });

    if (!expanded[cat._id]) {
      axios
        .get(`${API_BASE}/categories/${cat._id}/skills`)
        .then((res) => {
          setExpanded((prev) => ({
            ...prev,
            [cat._id]: {
              loading: false,
              error: "",
              skills: res.data,
            },
          }));
        })
        .catch(() => {
          setExpanded((prev) => ({
            ...prev,
            [cat._id]: {
              loading: false,
              error: "Failed to load skills.",
              skills: [],
            },
          }));
        });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-bold text-primary mb-6 text-center">
        Explore Skills by Category
      </h1>

      <section>
        <h2 className="text-xl font-semibold text-secondary mb-4">
          Categories
        </h2>
        {loadingCats ? (
          <LoadingSpinner text="Loading categories..." />
        ) : error ? (
          <ErrorBanner error={error} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const isOpen = !!expanded[cat._id];
              const catState = expanded[cat._id] || {};
              return (
                <div key={cat._id}>
                  <SkillCard
                    skill={{
                      name: cat.name,
                      category: {
                        icon: cat.icon,
                        description: cat.description,
                      },
                    }}
                    onClick={() => handleCategoryClick(cat)}
                  />
                  {isOpen && (
                    <div className="w-full mt-4">
                      {catState.loading ? (
                        <LoadingSpinner text="Loading skills..." />
                      ) : catState.error ? (
                        <ErrorBanner error={catState.error} />
                      ) : catState.skills.length === 0 ? (
                        <div className="text-gray-500 text-center">
                          No skills found.
                        </div>
                      ) : (
                        <ul className="grid grid-cols-1 gap-4">
                          {catState.skills.map((skill) => (
                            <li
                              key={skill._id}
                              className="bg-white rounded-lg shadow p-4 border border-accent"
                            >
                              <span className="text-primary font-medium capitalize">
                                {skill.name?.replace(/-/g, " ") ??
                                  "Unnamed Skill"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default ExploreSkills;
