import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import TransactionItem from "../components/TransactionItem";

const API_BASE = "http://localhost:5000/api";

const statusFilters = ["all", "pending", "accepted", "completed", "cancelled", "proposed-swap", "accepted-swap", "rejected-swap"];
const typeFilters   = ["all", "offer", "request"];

const Transactions = () => {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [creating, setCreating] = useState(false);
  const [newType, setNewType] = useState("offer");
  const [newSkill, setNewSkill] = useState("");
  const [skills, setSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [createError, setCreateError] = useState("");
  const [actionLoading, setActionLoading] = useState({});

  const fetchTransactions = () => {
    setLoading(true);
    setError("");
    let url = `${API_BASE}/transactions`;
    if (statusFilter !== "all" || typeFilter !== "all") {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);
      url = `${API_BASE}/transactions/filter?${params.toString()}`;
    }
    axios.get(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { setTransactions(res.data); setLoading(false); })
      .catch(() => { setError("Failed to load transactions."); setLoading(false); });
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line
  }, [token, statusFilter, typeFilter]);

  useEffect(() => {
    if (!creating) return;
    setLoadingSkills(true);
    axios.get(`${API_BASE}/categories`)
      .then((res) => {
        const catPromises = res.data.map((cat) =>
          axios.get(`${API_BASE}/categories/${cat._id}/skills`).then((r) =>
            r.data.map((skill) => ({ ...skill, category: cat }))
          )
        );
        Promise.all(catPromises).then((all) => { setSkills(all.flat()); setLoadingSkills(false); });
      })
      .catch(() => setLoadingSkills(false));
  }, [creating]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError("");
    if (!newSkill) { setCreateError("Please select a skill."); return; }
    setCreating("submitting");
    try {
      await axios.post(`${API_BASE}/transactions`, { skill: newSkill, type: newType }, { headers: { Authorization: `Bearer ${token}` } });
      setCreating(false);
      setNewSkill("");
      setNewType("offer");
      fetchTransactions();
    } catch (err) {
      setCreateError(err.response?.data?.error || "Failed to create transaction.");
      setCreating(false);
    }
  };

  const handleAction = async (id, status) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await axios.patch(`${API_BASE}/transactions/${id}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      fetchTransactions();
    } catch (err) {
      console.error("Action failed:", err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDelete = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await axios.delete(`${API_BASE}/transactions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchTransactions();
    } catch { /* silent */ } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const pendingCount       = transactions.filter((tx) => tx.status === "pending").length;
  const completedCount     = transactions.filter((tx) => tx.status === "completed").length;
  const proposedSwapCount  = transactions.filter((tx) => tx.status === "proposed-swap").length;
  const acceptedSwapCount  = transactions.filter((tx) => tx.status === "accepted-swap").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/10">

      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary to-accent py-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle, #A5D7E8 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-light/60 text-sm font-medium uppercase tracking-widest mb-1">My Activity</p>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Transactions</h1>
          </div>
          <button
            className="inline-flex items-center gap-2 bg-light text-primary px-6 py-3 rounded-xl font-bold hover:shadow-light-glow hover:-translate-y-0.5 transition-all duration-200"
            onClick={() => setCreating((c) => !c)}
          >
            {creating === true ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Cancel
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                New Transaction
              </>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total",         value: transactions.length, gradient: "from-primary to-secondary",  icon: "🔄" },
            { label: "Pending",       value: pendingCount,        gradient: "from-yellow-400 to-yellow-500", icon: "⏳" },
            { label: "Swap Proposed", value: proposedSwapCount,   gradient: "from-purple-500 to-purple-600", icon: "🤝" },
            { label: "Completed",     value: completedCount + acceptedSwapCount, gradient: "from-green-500 to-green-600", icon: "✅" },
          ].map((s) => (
            <div key={s.label} className={`bg-gradient-to-br ${s.gradient} rounded-2xl p-5 text-white shadow-md`}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-3xl font-extrabold">{s.value}</div>
              <div className="text-white/70 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* New Transaction Form */}
        {creating && creating !== "submitting" && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 animate-fade-in">
            <h2 className="text-lg font-bold text-primary mb-4">Create New Transaction</h2>
            <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-secondary/50 uppercase tracking-widest mb-2">Type</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-secondary bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                >
                  <option value="offer">Offer</option>
                  <option value="request">Request</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-secondary/50 uppercase tracking-widest mb-2">Skill</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-secondary bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  disabled={loadingSkills}
                >
                  <option value="">{loadingSkills ? "Loading skills…" : "Select a skill"}</option>
                  {skills.map((skill) => (
                    <option key={skill._id} value={skill._id}>
                      {skill.category.icon} {skill.name.replace(/-/g, " ")} ({skill.category.name.replace(/-/g, " ")})
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={creating === "submitting"}
                className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl hover:shadow-glow hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 whitespace-nowrap"
              >
                {creating === "submitting" ? "Creating…" : "Create"}
              </button>
            </form>
            {createError && (
              <p className="text-red-500 text-sm mt-3">{createError}</p>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
          <p className="text-xs font-semibold text-secondary/50 uppercase tracking-widest mb-3">Filter</p>
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="block text-xs text-secondary/40 mb-1">Status</label>
              <select
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-secondary bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent/40"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statusFilters.map((s) => (
                  <option key={s} value={s}>{s === "all" ? "All Statuses" : s.replace(/-/g, " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-secondary/40 mb-1">Type</label>
              <select
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-secondary bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent/40"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                {typeFilters.map((t) => (
                  <option key={t} value={t}>{t === "all" ? "All Types" : t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-primary mb-5">
            {statusFilter !== "all" || typeFilter !== "all" ? "Filtered Results" : "All Transactions"}
          </h2>
          {loading ? (
            <div className="text-accent animate-pulse text-sm">Loading transactions…</div>
          ) : error ? (
            <div className="text-red-500 text-sm">{error}</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-3">📭</div>
              <p className="text-secondary/50">No transactions found.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {transactions.map((tx) => (
                <TransactionItem
                  key={tx._id}
                  tx={tx}
                  actionLoading={actionLoading}
                  onAccept={(id) => handleAction(id, "accepted")}
                  onComplete={(id) => handleAction(id, "completed")}
                  onCancel={(id) => handleAction(id, "cancelled")}
                  onDelete={handleDelete}
                  onAction={handleAction}
                  onRefresh={fetchTransactions}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap gap-3">
          <Link to="/dashboard" className="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold rounded-xl hover:shadow-glow hover:-translate-y-0.5 transition-all duration-200">
            ← Dashboard
          </Link>
          <Link to="/explore-skills" className="px-5 py-2.5 bg-white border border-gray-200 text-secondary text-sm font-bold rounded-xl hover:border-accent/40 hover:bg-accent/5 transition-all duration-200">
            Explore Skills
          </Link>
          <Link to="/explore-users" className="px-5 py-2.5 bg-white border border-gray-200 text-secondary text-sm font-bold rounded-xl hover:border-accent/40 hover:bg-accent/5 transition-all duration-200">
            Find Users
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Transactions;
