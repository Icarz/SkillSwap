// src/pages/ExploreSkills.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import SkillCard from "../components/SkillCard";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import { useAuth } from "../contexts/AuthContext";

const API_BASE = "http://localhost:5000/api";

const ExploreSkills = () => {
  const [categories, setCategories] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loadingCats, setLoadingCats] = useState(true);
  const [error, setError] = useState("");
  const { token } = useAuth(); // grab token from context

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
          const skillsWithReviewsState = res.data.map((skill) => ({
            ...skill,
            reviews: [],
            reviewsLoading: false,
            reviewsError: "",
          }));

          setExpanded((prev) => ({
            ...prev,
            [cat._id]: {
              loading: false,
              error: "",
              skills: skillsWithReviewsState,
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

  const fetchSkillReviews = async (catId, skillId) => {
    setExpanded((prev) => {
      const updatedSkills = prev[catId].skills.map((s) =>
        s._id === skillId ? { ...s, reviewsLoading: true, reviewsError: "" } : s
      );
      return {
        ...prev,
        [catId]: { ...prev[catId], skills: updatedSkills },
      };
    });

    try {
      const res = await axios.get(`${API_BASE}/users/reviews/${skillId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setExpanded((prev) => {
        const updatedSkills = prev[catId].skills.map((s) =>
          s._id === skillId
            ? { ...s, reviews: res.data, reviewsLoading: false }
            : s
        );
        return {
          ...prev,
          [catId]: { ...prev[catId], skills: updatedSkills },
        };
      });
    } catch (err) {
      setExpanded((prev) => {
        const updatedSkills = prev[catId].skills.map((s) =>
          s._id === skillId
            ? {
                ...s,
                reviews: [],
                reviewsLoading: false,
                reviewsError: "Failed to load reviews",
              }
            : s
        );
        return {
          ...prev,
          [catId]: { ...prev[catId], skills: updatedSkills },
        };
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
                              <div className="flex items-center justify-between">
                                <span className="text-primary font-medium capitalize">
                                  {skill.name.replace(/-/g, " ")}
                                </span>
                                <button
                                  className="text-sm text-blue-600 hover:underline"
                                  onClick={() =>
                                    fetchSkillReviews(cat._id, skill._id)
                                  }
                                >
                                  View Reviews
                                </button>
                              </div>

                              {/* Reviews */}
                              {skill.reviewsLoading ? (
                                <p className="text-gray-500 text-sm mt-2">
                                  Loading reviews...
                                </p>
                              ) : skill.reviewsError ? (
                                <p className="text-red-500 text-sm mt-2">
                                  {skill.reviewsError}
                                </p>
                              ) : skill.reviews && skill.reviews.length > 0 ? (
                                <ul className="mt-2 space-y-1">
                                  {skill.reviews.map((review) => (
                                    <li
                                      key={review._id}
                                      className="text-sm text-gray-700 border-t pt-1"
                                    >
                                      <strong>{review.reviewerName}</strong>:{" "}
                                      {review.comment || "No comment"}{" "}
                                      <span className="text-yellow-500">
                                        {"⭐".repeat(review.rating)}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
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
