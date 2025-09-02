// src/pages/Transactions.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import TransactionItem from "../components/TransactionItem";

const API_BASE = "http://localhost:5000/api";

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

  // Fetch all transactions
  const fetchTransactions = () => {
    setLoading(true);
    setError("");
    let url = `${API_BASE}/transactions`;
    
    // Use filter endpoint if filtering
    if (statusFilter !== "all" || typeFilter !== "all") {
      url = `${API_BASE}/transactions/filter?${statusFilter !== "all" ? `status=${statusFilter}` : ""}${statusFilter !== "all" && typeFilter !== "all" ? "&" : ""}${typeFilter !== "all" ? `type=${typeFilter}` : ""}`;
    }
    
    axios
      .get(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setTransactions(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load transactions.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line
  }, [token, statusFilter, typeFilter]);

  // Fetch all skills for new transaction form
  useEffect(() => {
    if (!creating) return;
    setLoadingSkills(true);
    axios
      .get(`${API_BASE}/categories`)
      .then((res) => {
        const catPromises = res.data.map((cat) =>
          axios.get(`${API_BASE}/categories/${cat._id}/skills`).then((r) =>
            r.data.map((skill) => ({
              ...skill,
              category: cat,
            }))
          )
        );
        Promise.all(catPromises).then((all) => {
          setSkills(all.flat());
          setLoadingSkills(false);
        });
      })
      .catch(() => setLoadingSkills(false));
  }, [creating]);

  // Create new transaction
  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError("");
    if (!newSkill) {
      setCreateError("Please select a skill.");
      return;
    }
    setCreating("submitting");
    try {
      await axios.post(
        `${API_BASE}/transactions`,
        { skill: newSkill, type: newType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCreating(false);
      setNewSkill("");
      setNewType("offer");
      fetchTransactions();
    } catch (err) {
      setCreateError(
        err.response?.data?.error || "Failed to create transaction."
      );
      setCreating(false);
    }
  };

  // Transaction actions (accept, complete, cancel, swap actions)
  const handleAction = async (id, status) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await axios.patch(
        `${API_BASE}/transactions/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTransactions();
    } catch (err) {
      console.error("Action failed:", err);
      // Optionally show error to user
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  // Delete transaction
  const handleDelete = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await axios.delete(`${API_BASE}/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTransactions();
    } catch {
      // Optionally show error
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  // Calculate stats including swap statuses
  const pendingCount = transactions.filter(tx => tx.status === 'pending').length;
  const acceptedCount = transactions.filter(tx => tx.status === 'accepted').length;
  const completedCount = transactions.filter(tx => tx.status === 'completed').length;
  const cancelledCount = transactions.filter(tx => tx.status === 'cancelled').length;
  const proposedSwapCount = transactions.filter(tx => tx.status === 'proposed-swap').length;
  const acceptedSwapCount = transactions.filter(tx => tx.status === 'accepted-swap').length;
  const rejectedSwapCount = transactions.filter(tx => tx.status === 'rejected-swap').length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold text-primary">My Transactions</h1>
        <button
          className="bg-accent text-white px-4 py-2 rounded-lg font-semibold hover:bg-secondary transition"
          onClick={() => setCreating((c) => !c)}
        >
          {creating === true ? "Cancel" : "New Transaction"}
        </button>
      </div>

      {/* Notifications and Stats */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-primary mb-4">Notifications & Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-light rounded p-4">
            <span className="font-semibold text-secondary">Total:</span>
            <span className="text-primary ml-2">{transactions.length}</span>
          </div>
          <div className="bg-yellow-100 rounded p-4">
            <span className="font-semibold text-secondary">Pending:</span>
            <span className="text-primary ml-2">{pendingCount}</span>
          </div>
          <div className="bg-purple-100 rounded p-4">
            <span className="font-semibold text-secondary">Swap Proposed:</span>
            <span className="text-primary ml-2">{proposedSwapCount}</span>
          </div>
          <div className="bg-green-100 rounded p-4">
            <span className="font-semibold text-secondary">Completed:</span>
            <span className="text-primary ml-2">{completedCount + acceptedSwapCount}</span>
          </div>
        </div>
      </div>

      {/* New Transaction Form */}
      {creating && creating !== "submitting" && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-xl shadow p-6 mb-8 flex flex-col sm:flex-row gap-4 items-center"
        >
          <select
            className="border rounded px-3 py-2 flex-1"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
          >
            <option value="offer">Offer</option>
            <option value="request">Request</option>
          </select>
          <select
            className="border rounded px-3 py-2 flex-1"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            disabled={loadingSkills}
          >
            <option value="">Select Skill</option>
            {skills.map((skill) => (
              <option key={skill._id} value={skill._id}>
                {skill.category.icon} {skill.name.replace(/-/g, " ")} ({skill.category.name.replace(/-/g, " ")})
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-secondary transition"
            disabled={creating === "submitting"}
          >
            {creating === "submitting" ? "Creating..." : "Create"}
          </button>
          {createError && (
            <div className="text-red-600 text-sm mt-2">{createError}</div>
          )}
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          className="border rounded px-3 py-2"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="proposed-swap">Proposed Swap</option>
          <option value="accepted-swap">Accepted Swap</option>
          <option value="rejected-swap">Rejected Swap</option>
        </select>
        <select
          className="border rounded px-3 py-2"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="offer">Offer</option>
          <option value="request">Request</option>
        </select>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow p-6">
        {loading ? (
          <div className="text-accent animate-pulse">Loading transactions...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : transactions.length === 0 ? (
          <div className="text-gray-400">No transactions found.</div>
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
                onAction={handleAction} // Add this prop for swap actions
              />
            ))}
          </ul>
        )}
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-4 mt-8">
        <Link
          to="/dashboard"
          className="bg-accent text-white px-4 py-2 rounded-lg font-semibold hover:bg-secondary transition"
        >
          Back to Dashboard
        </Link>
        <Link
          to="/explore-skills"
          className="bg-accent text-white px-4 py-2 rounded-lg font-semibold hover:bg-secondary transition"
        >
          Explore Skills
        </Link>
        <Link
          to="/explore-users"
          className="bg-accent text-white px-4 py-2 rounded-lg font-semibold hover:bg-secondary transition"
        >
          Explore Users
        </Link>
      </div>
    </div>
  );
};

export default Transactions;