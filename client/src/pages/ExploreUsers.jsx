// src/pages/ExploreUsers.jsx
import { useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import UserCard from "../components/UserCard";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";

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
        err.response?.data?.error || "Failed to search users. Please try again."
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
      {loading ? (
        <LoadingSpinner text="Searching users..." />
      ) : error ? (
        <ErrorBanner error={error} />
      ) : searched && users.length === 0 ? (
        <div className="text-gray-500 text-center">
          No users found for these skills.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {users.map((user) => (
            <UserCard key={user._id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ExploreUsers;
