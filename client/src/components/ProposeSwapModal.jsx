import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const API_BASE = "http://localhost:5000/api";

const ProposeSwapModal = ({ targetTransaction, onClose, onSuccess }) => {
  const { user, token } = useAuth();
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [userSkills, setUserSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch the current user's skills when the modal opens
  useEffect(() => {
    const fetchUserSkills = async () => {
      if (!user?._id) return;
      setLoading(true);
      setError("");
      try {
        // Assuming the user's profile endpoint returns their skills
        const response = await axios.get(`${API_BASE}/users/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Adjust this line based on your API response structure
        setUserSkills(response.data.skills || []);
      } catch (err) {
        console.error("Failed to fetch user skills:", err);
        setError("Could not load your skills. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserSkills();
  }, [user, token]);

  const handleProposeSwap = async (e) => {
    e.preventDefault();
    if (!selectedSkillId) {
      setError("Please select a skill to offer.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      // Call the new backend endpoint to propose the swap
      await axios.post(
        `${API_BASE}/transactions/${targetTransaction._id}/propose-swap`,
        { offeredSkillId: selectedSkillId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Notify the parent component that the operation was successful
      onSuccess();
      // Close the modal
      onClose();
    } catch (err) {
      console.error("Swap proposal failed:", err);
      setError(err.response?.data?.error || "Failed to propose the swap. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-primary mb-4">Propose a Swap</h2>
        
        <p className="mb-4 text-sm text-gray-600">
          You are proposing to swap one of your skills for{" "}
          <span className="font-semibold text-primary">
            {targetTransaction.skill?.name?.replace(/-/g, " ") || "this skill"}
          </span>
          , requested by {targetTransaction.user?.name}.
        </p>

        <form onSubmit={handleProposeSwap}>
          <label htmlFor="skill-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select your skill to offer:
          </label>
          
          {loading ? (
            <div className="text-center py-4">Loading your skills...</div>
          ) : (
            <>
              <select
                id="skill-select"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent mb-4"
                value={selectedSkillId}
                onChange={(e) => setSelectedSkillId(e.target.value)}
                disabled={submitting || userSkills.length === 0}
              >
                <option value="">Choose a skill...</option>
                {userSkills.map((skill) => (
                  <option key={skill._id} value={skill._id}>
                    {skill.name?.replace(/-/g, " ")}
                  </option>
                ))}
              </select>

              {userSkills.length === 0 && (
                <p className="text-sm text-yellow-600 mb-4">
                  You don't have any skills listed yet. Add skills to your profile to propose swaps.
                </p>
              )}
            </>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-md disabled:opacity-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-purple-600 text-white px-4 py-2 rounded-md font-medium hover:bg-purple-700 transition disabled:opacity-50"
              disabled={submitting || userSkills.length === 0 || !selectedSkillId}
            >
              {submitting ? "Proposing..." : "Propose Swap"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProposeSwapModal;