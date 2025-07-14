// src/pages/ExploreUsers.jsx
import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Helper: Get initials from name/email
const getInitials = (user) => {
  if (!user) return "";
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

const API_BASE = "http://localhost:5000/api"; // Adjust if needed

const ExploreUsers = () => {
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setUsers([]);
    setSearched(true);

    try {
      const res = await axios.get(
        `${API_BASE}/users/search?skills=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUsers(res.data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to search users. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-bold text-primary mb-6 text-center">
        Find Users by Skill
      </h1>
      {/* Search Bar */}
      <form
        onSubmit={handleSearch}
        className="flex flex-col sm:flex-row gap-3 items-center justify-center mb-8"
      >
        <input
          type="text"
          placeholder="Enter skill(s), e.g. react,node"
          className="w-full sm:w-80 px-4 py-2 rounded-lg border border-accent focus:outline-none focus:ring-2 focus:ring-accent"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-accent text-white px-6 py-2 rounded-lg font-semibold hover:bg-secondary transition"
          disabled={loading}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Results */}
      {error && (
        <div className="text-red-600 text-center mb-4">{error}</div>
      )}

      {searched && !loading && users.length === 0 && !error && (
        <div className="text-gray-500 text-center">No users found for these skills.</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {users.map((user) => (
          <div
            key={user._id}
            className="bg-white rounded-xl shadow p-6 flex flex-col items-center border-2 border-transparent hover:border-accent transition"
          >
            {/* Avatar or initials */}
            <div className="w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center text-2xl font-bold mb-3">
              {getInitials(user)}
            </div>
            {/* Name */}
            <div className="font-bold text-primary text-lg mb-1 capitalize">{user.name}</div>
            {/* Skills */}
            {user.skills && user.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mb-2">
                {user.skills.slice(0, 3).map((skill) => (
                  <span
                    key={skill._id}
                    className="bg-light text-secondary px-2 py-1 rounded text-xs flex items-center gap-1"
                  >
                    {skill.category?.icon && (
                      <span className="text-base">{skill.category.icon}</span>
                    )}
                    {skill.name.replace(/-/g, " ")}
                  </span>
                ))}
                {user.skills.length > 3 && (
                  <span className="text-xs text-accent">+{user.skills.length - 3} more</span>
                )}
              </div>
            )}
            {/* Profile link */}
            <Link
              to={`/profile/${user._id}`}
              className="mt-2 text-accent hover:underline text-sm font-semibold"
            >
              View Profile
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExploreUsers;