import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import UserCard from "../components/UserCard";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";

const API_BASE = "http://localhost:5000/api";

const ExploreUsers = () => {
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [searchResults, setSearchResults] = useState(null); // null = not searched yet
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState("");

  // Load all users on mount
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const res = await axios.get(`${API_BASE}/users/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAllUsers(res.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load users.");
      } finally {
        setLoading(false);
      }
    };
    fetchAllUsers();
  }, [token]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    setSearchLoading(true);
    setError("");
    try {
      const res = await axios.get(
        `${API_BASE}/users/search?skills=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSearchResults(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to search users. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setSearchResults(null);
    setError("");
  };

  const displayedUsers = searchResults !== null ? searchResults : allUsers;
  const isSearchActive = searchResults !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/10">

      {/* Page Header */}
      <div className="bg-gradient-to-r from-secondary to-accent py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle, #A5D7E8 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
<h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
            Find Skill Partners
          </h1>
          <p className="text-light/70 text-lg mb-8">
            Browse everyone in the community or search by skill.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="e.g. react, guitar, spanish…"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/20 transition-all"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={searchLoading}
              className="px-7 py-3.5 bg-light text-primary font-bold rounded-xl hover:shadow-light-glow hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 whitespace-nowrap"
            >
              {searchLoading ? "Searching…" : "Search"}
            </button>
            {isSearchActive && (
              <button
                type="button"
                onClick={handleClear}
                className="px-5 py-3.5 bg-white/10 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-200 whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {loading ? (
          <LoadingSpinner text="Loading users..." />
        ) : error ? (
          <ErrorBanner error={error} />
        ) : (
          <>
            <p className="text-secondary/60 text-sm font-medium mb-6">
              {isSearchActive
                ? `${displayedUsers.length} user${displayedUsers.length !== 1 ? "s" : ""} found for "${query}"`
                : `${displayedUsers.length} member${displayedUsers.length !== 1 ? "s" : ""} in the community`}
            </p>

            {displayedUsers.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-primary mb-2">No users found</h3>
                <p className="text-secondary/60">Try a different skill name or check your spelling.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {displayedUsers.map((user) => (
                  <UserCard key={user._id} user={user} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExploreUsers;
