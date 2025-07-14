// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale } from "chart.js";
ChartJS.register(BarElement, CategoryScale, LinearScale);

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

const Dashboard = () => {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTx, setLoadingTx] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState(true);
  const [error, setError] = useState("");
  const [errorTx, setErrorTx] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [txFilter, setTxFilter] = useState("all");

  // Fetch user profile
  useEffect(() => {
    setLoading(true);
    axios
      .get(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setProfile(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(
          err.response?.data?.error || "Failed to load profile."
        );
        setLoading(false);
      });
  }, [token]);

  // Fetch recent transactions
  useEffect(() => {
    if (!token) return;
    setLoadingTx(true);
    axios
      .get(`${API_BASE}/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setTransactions(res.data); // We'll filter/slice below
        setLoadingTx(false);
      })
      .catch(() => {
        setErrorTx("Failed to load transactions.");
        setLoadingTx(false);
      });
  }, [token]);

  // Fetch recent messages
  useEffect(() => {
    if (!profile?._id) return;
    setLoadingMsg(true);
    axios
      .get(`${API_BASE}/messages/${profile._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setMessages(res.data); // We'll slice below
        setLoadingMsg(false);
      })
      .catch(() => {
        setErrorMsg("Failed to load messages.");
        setLoadingMsg(false);
      });
  }, [profile, token]);

  // Stats
  const pendingCount = transactions.filter(tx => tx.status === "pending").length;
  const acceptedCount = transactions.filter(tx => tx.status === "accepted").length;
  const completedCount = transactions.filter(tx => tx.status === "completed").length;
  const cancelledCount = transactions.filter(tx => tx.status === "cancelled").length;

  // Chart data
  const txStats = {
    labels: ["Pending", "Accepted", "Completed", "Cancelled"],
    datasets: [
      {
        label: "Transactions",
        data: [pendingCount, acceptedCount, completedCount, cancelledCount],
        backgroundColor: ["#FBBF24", "#3B82F6", "#10B981", "#9CA3AF"],
      },
    ],
  };

  // Filtered transactions for widget
  const filteredTx =
    txFilter === "all"
      ? transactions.slice(0, 5)
      : transactions.filter(tx => tx.status === txFilter).slice(0, 5);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <span className="text-accent animate-pulse">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <span className="text-red-600">{error}</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Notifications */}
      {pendingCount > 0 && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded">
          <span className="font-semibold">{pendingCount}</span> pending transaction{pendingCount > 1 ? "s" : ""}!{" "}
          <Link to="/transactions" className="underline text-yellow-800">Review now</Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-light rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-primary">{profile.skills?.length || 0}</div>
          <div className="text-xs text-secondary">Skills</div>
        </div>
        <div className="bg-light rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-primary">{profile.learning?.length || 0}</div>
          <div className="text-xs text-secondary">Learning</div>
        </div>
        <div className="bg-light rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-primary">{transactions.length}</div>
          <div className="text-xs text-secondary">Transactions</div>
        </div>
        <div className="bg-light rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-primary">{messages.length}</div>
          <div className="text-xs text-secondary">Messages</div>
        </div>
      </div>

      {/* Transaction Status Chart */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-primary mb-4">Transaction Status Overview</h2>
        <Bar data={txStats} options={{ responsive: true, plugins: { legend: { display: false } } }} />
      </div>

      {/* User Overview & Quick Links */}
      <div className="bg-white rounded-xl shadow p-6 flex flex-col md:flex-row items-center gap-8 mb-8">
        <div className="w-20 h-20 rounded-full bg-accent text-white flex items-center justify-center text-3xl font-bold">
          {getInitials(profile)}
        </div>
        <div className="flex-1 w-full">
          <h1 className="text-2xl font-bold text-primary mb-1 capitalize">
            Welcome back, {profile.name}!
          </h1>
          <div className="text-secondary mb-2">{profile.email}</div>
          <div className="flex flex-wrap gap-6 mt-2">
            <div>
              <span className="font-semibold text-primary">{profile.skills?.length || 0}</span>
              <span className="text-xs text-secondary ml-1">Skills</span>
            </div>
            <div>
              <span className="font-semibold text-primary">{profile.learning?.length || 0}</span>
              <span className="text-xs text-secondary ml-1">Learning</span>
            </div>
            <div>
              <span className="font-semibold text-primary">{profile.role}</span>
              <span className="text-xs text-secondary ml-1">Role</span>
            </div>
          </div>
        </div>
        {/* More Quick Links */}
        <div className="flex flex-col gap-2">
          <Link to="/explore-skills" className="bg-accent text-white px-4 py-2 rounded-lg font-semibold hover:bg-secondary transition text-center">
            Explore Skills
          </Link>
          <Link to="/explore-users" className="bg-accent text-white px-4 py-2 rounded-lg font-semibold hover:bg-secondary transition text-center">
            Explore Users
          </Link>
          <Link to="/profile" className="bg-accent text-white px-4 py-2 rounded-lg font-semibold hover:bg-secondary transition text-center">
            My Profile
          </Link>
          <Link to="/transactions" className="bg-accent text-white px-4 py-2 rounded-lg font-semibold hover:bg-secondary transition text-center">
            My Transactions
          </Link>
          <Link to="/messages" className="bg-accent text-white px-4 py-2 rounded-lg font-semibold hover:bg-secondary transition text-center">
            My Messages
          </Link>
        </div>
      </div>

      {/* Dashboard Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-primary">Recent Transactions</h2>
            {/* Filter Dropdown */}
            <select
              className="border rounded px-2 py-1 text-sm"
              value={txFilter}
              onChange={e => setTxFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          {loadingTx ? (
            <div className="text-accent animate-pulse">Loading transactions...</div>
          ) : errorTx ? (
            <div className="text-red-600">{errorTx}</div>
          ) : filteredTx.length === 0 ? (
            <div className="text-gray-400">No transactions yet.</div>
          ) : (
            <ul className="space-y-3">
              {filteredTx.map((tx) => (
                <li
                  key={tx._id}
                  className="flex items-center justify-between bg-light rounded p-3"
                >
                  <div>
                    <span className="font-semibold text-secondary capitalize">
                      {tx.type}
                    </span>{" "}
                    <span className="text-primary font-medium">
                      {tx.skill?.name?.replace(/-/g, " ") || "Unknown Skill"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        tx.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : tx.status === "accepted"
                          ? "bg-blue-100 text-blue-700"
                          : tx.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {tx.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 text-right">
            <Link to="/transactions" className="text-accent hover:underline text-sm">
              View all transactions &rarr;
            </Link>
          </div>
        </div>

        {/* Recent Messages */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-primary mb-4">Recent Messages</h2>
          {loadingMsg ? (
            <div className="text-accent animate-pulse">Loading messages...</div>
          ) : errorMsg ? (
            <div className="text-red-600">{errorMsg}</div>
          ) : messages.length === 0 ? (
            <div className="text-gray-400">No messages yet.</div>
          ) : (
            <ul className="space-y-3">
              {messages.slice(0, 5).map((msg) => (
                <li
                  key={msg._id}
                  className="flex items-center justify-between bg-light rounded p-3"
                >
                  <div>
                    <span className="font-semibold text-secondary">
                      {msg.sender?.name === profile.name
                        ? "To"
                        : "From"}
                    </span>{" "}
                    <span className="text-primary font-medium">
                      {msg.sender?.name === profile.name
                        ? msg.receiver?.name
                        : msg.sender?.name}
                    </span>
                    <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                      {msg.content}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(msg.timestamp).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 text-right">
            <Link to="/messages" className="text-accent hover:underline text-sm">
              View all messages &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;