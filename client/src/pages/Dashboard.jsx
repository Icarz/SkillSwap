import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../hooks/useSocket";
import { Link } from "react-router-dom";
import { API_BASE, SOCKET_URL } from "../config";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale } from "chart.js";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import TransactionItem from "../components/TransactionItem";

ChartJS.register(BarElement, CategoryScale, LinearScale);

const getInitials = (user) => {
  if (!user) return "";
  if (user.name) return user.name.split(" ").map((n) => n[0]).join("").toUpperCase();
  if (user.email) return user.email[0].toUpperCase();
  return "";
};

const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith("http")) return avatarPath;
  return `${SOCKET_URL}${avatarPath}`;
};

const StatCard = ({ value, label, gradient, icon }) => (
  <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 text-white shadow-md`}>
    <div className="flex items-center justify-between mb-2">
      <span className="text-2xl">{icon}</span>
    </div>
    <div className="text-3xl font-extrabold">{value}</div>
    <div className="text-white/70 text-sm mt-1">{label}</div>
  </div>
);

const QuickLink = ({ to, children, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="group flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 hover:border-accent/40 hover:bg-accent/5 transition-all duration-200"
  >
    <span className="font-semibold text-secondary text-sm">{children}</span>
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-accent transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </Link>
);

const Dashboard = () => {
  const { token } = useAuth();
  const { socket } = useSocket();
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
  const [notificationCount, setNotificationCount] = useState(0);
  const [, setNotifications] = useState([]);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_BASE}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { setProfile(res.data); setLoading(false); })
      .catch((err) => { setError(err.response?.data?.error || "Failed to load profile."); setLoading(false); });
  }, [token]);

  useEffect(() => {
    if (!token) return;
    setLoadingTx(true);
    axios.get(`${API_BASE}/transactions?limit=50`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { setTransactions(res.data.transactions ?? []); setLoadingTx(false); })
      .catch(() => { setErrorTx("Failed to load transactions."); setLoadingTx(false); });
  }, [token]);

  useEffect(() => {
    if (!profile?._id) return;
    setLoadingMsg(true);
    axios.get(`${API_BASE}/messages/${profile._id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { setMessages(res.data); setLoadingMsg(false); })
      .catch(() => { setErrorMsg("Failed to load messages."); setLoadingMsg(false); });
  }, [profile, token]);

  useEffect(() => {
    if (!socket) return;
    const handleNotification = (notificationData) => {
      setNotificationCount((prev) => prev + 1);
      setNotifications((prev) => [notificationData, ...prev]);
      if (Notification.permission === "granted") {
        new Notification("SkillSwap", { body: notificationData.message, icon: "/favicon.ico" });
      }
    };
    socket.on("new-notification", handleNotification);
    return () => { socket.off("new-notification", handleNotification); };
  }, [socket]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const handleMessagesLinkClick = () => setNotificationCount(0);

  const pendingCount   = transactions.filter((tx) => tx.status === "pending").length;
  const acceptedCount  = transactions.filter((tx) => tx.status === "accepted").length;
  const completedCount = transactions.filter((tx) => tx.status === "completed").length;
  const cancelledCount = transactions.filter((tx) => tx.status === "cancelled").length;

  const txStats = {
    labels: ["Pending", "Accepted", "Completed", "Cancelled"],
    datasets: [{
      label: "Transactions",
      data: [pendingCount, acceptedCount, completedCount, cancelledCount],
      backgroundColor: ["#FBBF24", "#576CBC", "#10B981", "#9CA3AF"],
      borderRadius: 8,
    }],
  };

  const filteredTx = txFilter === "all"
    ? transactions.slice(0, 5)
    : transactions.filter((tx) => tx.status === txFilter).slice(0, 5);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;
  if (error) return <ErrorBanner error={error} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/10">

      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary to-secondary px-4 py-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle, #A5D7E8 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative z-10 max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-white/20 text-white flex items-center justify-center text-3xl font-bold overflow-hidden shadow-lg shrink-0">
            {profile.avatar ? (
              <img src={getAvatarUrl(profile.avatar)} alt="Profile" className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = "none"; }} />
            ) : getInitials(profile)}
          </div>
          <div className="text-center md:text-left">
            <p className="text-light/60 text-sm font-medium uppercase tracking-widest mb-1">Dashboard</p>
            <h1 className="text-3xl font-extrabold text-white">Welcome back, {profile.name}!</h1>
            <p className="text-light/70 mt-1">{profile.email}</p>
          </div>
          {notificationCount > 0 && (
            <div className="md:ml-auto bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-red-400 rounded-full animate-pulse" />
              <span className="font-semibold">{notificationCount} new notification{notificationCount > 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">

        {/* Pending alert */}
        {pendingCount > 0 && (
          <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-4">
            <span className="text-xl">⏳</span>
            <p className="text-yellow-800 font-medium">
              You have <span className="font-bold">{pendingCount}</span> pending transaction{pendingCount > 1 ? "s" : ""}.{" "}
              <Link to="/transactions" className="underline font-bold">Review now →</Link>
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard value={profile.skills?.length || 0}  label="Skills"       gradient="from-primary to-secondary"  icon="🎯" />
          <StatCard value={profile.learning?.length || 0} label="Learning"     gradient="from-secondary to-accent"   icon="📚" />
          <StatCard value={transactions.length}           label="Transactions" gradient="from-accent to-light"       icon="🔄" />
          <div className="relative">
            <StatCard value={messages.length} label="Messages" gradient="from-primary to-accent" icon="💬" />
            {notificationCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse shadow-lg">
                {notificationCount}
              </span>
            )}
          </div>
        </div>

        {/* Chart + Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="md:col-span-2 bg-white rounded-2xl shadow-md border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-primary mb-1">Transaction Overview</h2>
            <p className="text-secondary/50 text-xs mb-5">Breakdown of your transaction statuses</p>
            <Bar data={txStats} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: "#f0f0f0" }, ticks: { stepSize: 1 } } } }} />
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex flex-col">
            <h2 className="text-lg font-bold text-primary mb-1">Quick Links</h2>
            <p className="text-secondary/50 text-xs mb-5">Navigate to key sections</p>
            <div className="space-y-2 flex-1">
              <QuickLink to="/explore-skills">Explore Skills</QuickLink>
              <QuickLink to="/explore-users">Find Users</QuickLink>
              <QuickLink to="/profile">My Profile</QuickLink>
              <QuickLink to="/transactions">My Transactions</QuickLink>
              <QuickLink to="/messages" onClick={handleMessagesLinkClick}>
                <span className="flex items-center gap-2">
                  My Messages
                  {notificationCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5">{notificationCount}</span>
                  )}
                </span>
              </QuickLink>
            </div>
          </div>
        </div>

        {/* Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-primary">Recent Transactions</h2>
                <p className="text-secondary/50 text-xs">Your latest activity</p>
              </div>
              <select
                className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 text-secondary focus:outline-none focus:ring-2 focus:ring-accent/30"
                value={txFilter}
                onChange={(e) => setTxFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            {loadingTx ? <LoadingSpinner text="Loading..." /> :
             errorTx  ? <ErrorBanner error={errorTx} /> :
             filteredTx.length === 0 ? <p className="text-gray-400 text-sm">No transactions yet.</p> : (
              <ul className="space-y-3">
                {filteredTx.map((tx) => <TransactionItem key={tx._id} tx={tx} />)}
              </ul>
            )}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link to="/transactions" className="text-accent hover:text-secondary text-sm font-semibold transition-colors flex items-center gap-1">
                View all transactions
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Recent Messages */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-primary">Recent Messages</h2>
                <p className="text-secondary/50 text-xs">Your latest conversations</p>
              </div>
              {notificationCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2.5 py-1 animate-pulse">
                  {notificationCount} new
                </span>
              )}
            </div>
            {loadingMsg ? <LoadingSpinner text="Loading..." /> :
             errorMsg  ? <ErrorBanner error={errorMsg} /> :
             messages.length === 0 ? <p className="text-gray-400 text-sm">No messages yet.</p> : (
              <ul className="space-y-3">
                {messages.slice(0, 5).map((msg) => (
                  <li key={msg._id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-secondary">
                        {msg.sender?.name === profile.name ? "To " : "From "}
                        <span className="text-primary">
                          {msg.sender?.name === profile.name ? msg.receiver?.name : msg.sender?.name}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{msg.content}</div>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 ml-3">{new Date(msg.timestamp).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link to="/messages" onClick={handleMessagesLinkClick} className="text-accent hover:text-secondary text-sm font-semibold transition-colors flex items-center gap-1">
                View all messages
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
