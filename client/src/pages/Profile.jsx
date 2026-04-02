import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useParams } from "react-router-dom";
import CategorySkillInput from "../components/CategorySkillInput";
import { useSocket } from "../hooks/useSocket";
import Reviews from "../components/Reviews";
import TransactionItem from "../components/TransactionItem";

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

const API_BASE = "http://localhost:5000/api";

const Profile = () => {
  const { token, user: authUser, updateUser } = useAuth();
  const { socket } = useSocket();
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    bio: "",
    skills: [],
    learning: [],
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [categories, setCategories] = useState([]);
  const [, setLoadingCategories] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [messageSuccess, setMessageSuccess] = useState("");
  const fileInputRef = useRef();

  // Add state for transactions
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  // Get full avatar URL
  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith("http")) return avatarPath;
    return `http://localhost:5000${avatarPath}`;
  };

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const res = await axios.get(`${API_BASE}/categories`);
        setCategories(res.data);
      } catch (err) {
        console.error("Failed to load categories:", err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const url = userId
          ? `${API_BASE}/users/${userId}`
          : `${API_BASE}/users/me`;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(url, { headers });

        setProfile(res.data);

        if (!userId || (authUser && res.data._id === authUser._id)) {
          setEditData({
            bio: res.data.bio || "",
            skills: res.data.skills || [],
            learning: res.data.learning || [],
          });
          setAvatarPreview(getAvatarUrl(res.data.avatar));
        }
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token, userId, authUser]);

  // Fetch user transactions
  const fetchUserTransactions = async () => {
    if (!profile?._id) return;
    setTransactionsLoading(true);
    try {
      const url = `${API_BASE}/transactions?userId=${profile._id}`;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(url, { headers });
      setTransactions(res.data);
    } catch (err) {
      console.error("Failed to fetch user transactions:", err);
    } finally {
      setTransactionsLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchUserTransactions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, token]);

  // Transaction action handlers
  const handleAccept = async (transactionId) => {
    setActionLoading(prev => ({ ...prev, [transactionId]: true }));
    try {
       await axios.patch(
      `${API_BASE}/transactions/${transactionId}`,
      { status: "accepted" },  // Add status in request body
      { headers: { Authorization: `Bearer ${token}` } }
    );
      // Refresh transactions
      const res = await axios.get(`${API_BASE}/transactions?userId=${profile._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(res.data);
    } catch (err) {
      console.error("Failed to accept transaction:", err);
    } finally {
      setActionLoading(prev => ({ ...prev, [transactionId]: false }));
    }
  };

  const handleComplete = async (transactionId) => {
  setActionLoading(prev => ({ ...prev, [transactionId]: true }));
  try {
    await axios.patch(
      `${API_BASE}/transactions/${transactionId}`,  // Remove "/complete"
      { status: "completed" },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // Refresh transactions - also fix this endpoint
    const res = await axios.get(`${API_BASE}/transactions?userId=${profile._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setTransactions(res.data);
  } catch (err) {
    console.error("Failed to complete transaction:", err);
  } finally {
    setActionLoading(prev => ({ ...prev, [transactionId]: false }));
  }
};

const handleCancel = async (transactionId) => {
  setActionLoading(prev => ({ ...prev, [transactionId]: true }));
  try {
    await axios.patch(  // Change from PUT to PATCH
      `${API_BASE}/transactions/${transactionId}`,  // Remove "/cancel"
      { status: "cancelled" },  // Add status in request body
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // Refresh transactions - fix the endpoint
    const res = await axios.get(`${API_BASE}/transactions?userId=${profile._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setTransactions(res.data);
  } catch (err) {
    console.error("Failed to cancel transaction:", err);
  } finally {
    setActionLoading(prev => ({ ...prev, [transactionId]: false }));
  }
};

 const handleDelete = async (transactionId) => {
  setActionLoading(prev => ({ ...prev, [transactionId]: true }));
  try {
    await axios.delete(
      `${API_BASE}/transactions/${transactionId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // Refresh transactions - FIX THIS ENDPOINT
    const res = await axios.get(`${API_BASE}/transactions?userId=${profile._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setTransactions(res.data);
  } catch (err) {
    console.error("Failed to delete transaction:", err);
  } finally {
    setActionLoading(prev => ({ ...prev, [transactionId]: false }));
  }
};

  const handleAction = async (transactionId, action) => {
    setActionLoading(prev => ({ ...prev, [transactionId]: true }));
    try {
      await axios.patch(
        `${API_BASE}/transactions/${transactionId}`,
        { status: action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh transactions
      const res = await axios.get(`${API_BASE}/transactions?userId=${profile._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(res.data);
    } catch (err) {
      console.error("Failed to update transaction status:", err);
    } finally {
      setActionLoading(prev => ({ ...prev, [transactionId]: false }));
    }
  };

  // Handle avatar file selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setAvatarError("");
    } else {
      setAvatarFile(null);
      setAvatarPreview(null);
    }
  };

  // Upload avatar to server
  const uploadAvatar = async () => {
    if (!avatarFile) return null;

    setAvatarUploading(true);
    setAvatarError("");

    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);

      const res = await axios.put(`${API_BASE}/users/me/avatar`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.user) {
        updateUser(res.data.user);
      }

      return res.data.avatar;
    } catch (err) {
      setAvatarError(err.response?.data?.error || "Failed to upload avatar.");
      return null;
    } finally {
      setAvatarUploading(false);
    }
  };

  // Handler for skill changes
  const handleSkillChange = (field, index, updatedSkill) => {
    setEditData((prev) => ({
      ...prev,
      [field]: prev[field].map((skill, i) =>
        i === index ? updatedSkill : skill
      ),
    }));
  };

  // Handler for adding skills
  const addSkill = (field) => {
    setEditData((prev) => ({
      ...prev,
      [field]: [...prev[field], { name: "", category: "" }],
    }));
  };

  // Handler for removing skills
  const removeSkill = (field, index) => {
    setEditData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  // Handle profile update
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");
    setEditSuccess("");

    try {
      // Upload avatar first if changed
      const uploadedAvatar = avatarFile ? await uploadAvatar() : null;
      if (avatarFile && !uploadedAvatar) return;

      // Prepare data for API
      const updateData = {
        bio: editData.bio,
        skills: editData.skills
          .filter((s) => s != null)
          .filter((s) => s.name && s.category),
        learning: editData.learning
          .filter((s) => s != null)
          .filter((s) => s.name && s.category),
        ...(uploadedAvatar ? { avatar: uploadedAvatar } : {}),
      };

      const res = await axios.put(`${API_BASE}/users/me`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProfile(res.data);
      updateUser(res.data);
      setEditSuccess("Profile updated!");
      setEditOpen(false);
      setAvatarFile(null);
      setAvatarPreview(getAvatarUrl(res.data.avatar));
    } catch (err) {
      setEditError(err.response?.data?.error || "Failed to update profile.");
    } finally {
      setEditLoading(false);
    }
  };

  // Handle sending message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageContent.trim() || !profile || sendingMessage) return;

    setSendingMessage(true);
    setMessageError("");
    setMessageSuccess("");

    try {
      const response = await axios.post(
        `${API_BASE}/messages`,
        {
          receiver: profile._id,
          content: messageContent,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Emit via Socket.IO for real-time delivery if socket is connected
      if (socket) {
        socket.emit("send-message", response.data.data);
      }

      setMessageSuccess("Message sent successfully!");
      setMessageContent("");
      setTimeout(() => {
        setMessageModalOpen(false);
        setMessageSuccess("");
      }, 1500);
    } catch (err) {
      setMessageError(err.response?.data?.error || "Failed to send message.");
    } finally {
      setSendingMessage(false);
    }
  };

  const isOwnProfile =
    (!userId && authUser) ||
    (userId && authUser && profile?._id === authUser._id);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <span className="text-accent animate-pulse">Loading profile...</span>
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

  if (!profile) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow p-8 flex flex-col md:flex-row items-center gap-8">
        {/* Avatar Section */}
        <div className="w-24 h-24 rounded-full bg-accent text-white flex items-center justify-center text-4xl font-bold overflow-hidden relative">
          {avatarLoadError || !(profile.avatar || avatarPreview) ? (
            getInitials(profile)
          ) : (
            <img
              src={avatarPreview || getAvatarUrl(profile.avatar)}
              alt="Avatar"
              className="w-full h-full object-cover rounded-full"
              onError={() => setAvatarLoadError(true)}
              onLoad={() => setAvatarLoadError(false)}
            />
          )}
          {isOwnProfile && (
            <div
              className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 flex items-center justify-center cursor-pointer transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="text-white opacity-0 hover:opacity-100 text-sm">
                Change
              </span>
            </div>
          )}
        </div>

        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
          ref={fileInputRef}
          disabled={avatarUploading}
        />

        {/* Profile Info */}
        <div className="flex-1 w-full">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-primary mb-1 capitalize">
              {profile.name}
            </h1>
            {isOwnProfile ? (
              <button
                className="px-3 py-1 bg-accent text-white rounded hover:bg-secondary text-sm"
                onClick={() => setEditOpen(true)}
              >
                Edit Profile
              </button>
            ) : (
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center gap-2"
                onClick={() => setMessageModalOpen(true)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z"
                    clipRule="evenodd"
                  />
                </svg>
                Send Message
              </button>
            )}
          </div>

          <div className="text-secondary mb-2">{profile.email}</div>
          <div className="mb-4">
            <span className="font-semibold text-secondary">Bio: </span>
            <span className="text-gray-700">
              {profile.bio || "No bio yet."}
            </span>
          </div>

          {/* Skills & Learning Sections */}
          <div className="mb-2">
            <span className="font-semibold text-secondary">Skills:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {profile.skills?.length > 0 ? (
                profile.skills.map((skill) => (
                  <span
                    key={skill._id}
                    className="bg-light text-secondary px-2 py-1 rounded text-xs flex items-center gap-1"
                  >
                    {skill.category?.icon && (
                      <span className="text-base">{skill.category.icon}</span>
                    )}
                    {skill.name.replace(/-/g, " ")}
                  </span>
                ))
              ) : (
                <span className="text-gray-400 text-xs">No skills added</span>
              )}
            </div>
          </div>

          <div className="mb-2">
            <span className="font-semibold text-secondary">Learning:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {profile.learning?.length > 0 ? (
                profile.learning.map((skill) => (
                  <span
                    key={skill._id}
                    className="bg-light text-accent px-2 py-1 rounded text-xs flex items-center gap-1"
                  >
                    {skill.category?.icon && (
                      <span className="text-base">{skill.category.icon}</span>
                    )}
                    {skill.name.replace(/-/g, " ")}
                  </span>
                ))
              ) : (
                <span className="text-gray-400 text-xs">No learning goals</span>
              )}
            </div>
          </div>

          <div className="text-xs text-gray-500 mt-4">
            Joined: {new Date(profile.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <Reviews profile={profile} />

      {/* Transactions Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-primary mb-4">
          {isOwnProfile ? "My Transactions" : `${profile.name}'s Transactions`}
        </h2>
        
        {transactionsLoading ? (
          <div className="text-center py-4">
            <span className="text-accent animate-pulse">Loading transactions...</span>
          </div>
        ) : transactions.length > 0 ? (
          <ul className="space-y-3">
            {transactions.map((tx) => (
              <TransactionItem
                key={tx._id}
                tx={tx}
                actionLoading={actionLoading}
                onAccept={handleAccept}
                onComplete={handleComplete}
                onCancel={handleCancel}
                onDelete={handleDelete}
                onAction={handleAction}
                onRefresh={fetchUserTransactions}
              />
            ))}
          </ul>
        ) : (
          <div className="bg-light rounded p-4 text-center text-gray-500">
            No transactions yet.
          </div>
        )}
      </div>

      {/* Send Message Modal */}
      {messageModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-accent text-2xl"
              onClick={() => {
                setMessageModalOpen(false);
                setMessageError("");
                setMessageSuccess("");
                setMessageContent("");
              }}
              aria-label="Close"
            >
              &times;
            </button>

            <h2 className="text-xl font-bold text-primary mb-4">
              Send Message to {profile.name}
            </h2>

            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-secondary font-semibold">
                  Message
                </label>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-accent focus:border-transparent"
                  rows={4}
                  placeholder="Write your message here..."
                  required
                  disabled={sendingMessage}
                />
              </div>

              {messageError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                  {messageError}
                </div>
              )}

              {messageSuccess && (
                <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg">
                  {messageSuccess}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMessageModalOpen(false);
                    setMessageError("");
                    setMessageSuccess("");
                    setMessageContent("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={sendingMessage}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-70 flex items-center gap-2"
                  disabled={sendingMessage || !messageContent.trim()}
                >
                  {sendingMessage ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    "Send Message"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col">

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary to-secondary px-6 py-5 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-white">Edit Profile</h2>
                <p className="text-light/70 text-sm mt-0.5">Update your info and skills</p>
              </div>
              <button
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                onClick={() => setEditOpen(false)}
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto flex-1 px-6 py-6">
              <form onSubmit={handleEditSubmit} className="space-y-6" id="edit-profile-form">

                {/* Avatar */}
                <div>
                  <p className="text-xs font-semibold text-secondary/50 uppercase tracking-widest mb-3">Photo</p>
                  <div className="flex items-center gap-5 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center text-2xl font-bold overflow-hidden shrink-0 shadow-md">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : profile.avatar ? (
                        <img src={getAvatarUrl(profile.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        getInitials(profile)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        type="file"
                        accept="image/*"
                        className="block w-full text-sm text-gray-500
                          file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0
                          file:text-sm file:font-semibold file:bg-accent file:text-white
                          hover:file:bg-secondary file:transition-colors file:cursor-pointer"
                        onChange={handleAvatarChange}
                        ref={fileInputRef}
                        disabled={avatarUploading || editLoading}
                      />
                      <p className="text-xs text-gray-400 mt-2">JPG, PNG or GIF · Max 2MB</p>
                      {avatarUploading && <p className="text-accent text-xs mt-1 animate-pulse">Uploading…</p>}
                    </div>
                  </div>
                  {avatarError && <p className="text-red-500 text-sm mt-2">{avatarError}</p>}
                </div>

                {/* Bio */}
                <div>
                  <p className="text-xs font-semibold text-secondary/50 uppercase tracking-widest mb-3">About You</p>
                  <textarea
                    name="bio"
                    value={editData.bio}
                    onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                    className="w-full border border-gray-200 rounded-2xl p-4 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent focus:bg-white transition-all resize-none"
                    rows={3}
                    placeholder="Tell the community what you're about…"
                  />
                </div>

                {/* Skills */}
                <div>
                  <p className="text-xs font-semibold text-secondary/50 uppercase tracking-widest mb-3">Skills I Can Teach</p>
                  <div className="space-y-2">
                    {editData.skills.map((skill, index) => (
                      <div key={index} className="flex items-start gap-2 bg-gray-50 rounded-xl p-2 border border-gray-100">
                        <CategorySkillInput
                          skill={skill}
                          categories={categories}
                          onChange={(updated) => handleSkillChange("skills", index, updated)}
                          className="flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => removeSkill("skills", index)}
                          className="mt-1.5 w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 flex items-center justify-center transition-colors shrink-0"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => addSkill("skills")}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-secondary transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Skill
                  </button>
                </div>

                {/* Learning */}
                <div>
                  <p className="text-xs font-semibold text-secondary/50 uppercase tracking-widest mb-3">Skills I Want to Learn</p>
                  <div className="space-y-2">
                    {editData.learning.map((skill, index) => (
                      <div key={index} className="flex items-start gap-2 bg-gray-50 rounded-xl p-2 border border-gray-100">
                        <CategorySkillInput
                          skill={skill}
                          categories={categories}
                          onChange={(updated) => handleSkillChange("learning", index, updated)}
                          className="flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => removeSkill("learning", index)}
                          className="mt-1.5 w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 flex items-center justify-center transition-colors shrink-0"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => addSkill("learning")}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-secondary transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Learning Goal
                  </button>
                </div>

                {/* Status */}
                {editError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {editError}
                  </div>
                )}
                {editSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 text-green-600 text-sm rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {editSuccess}
                  </div>
                )}
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/80 flex gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                disabled={editLoading}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-profile-form"
                disabled={editLoading || avatarUploading}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-bold hover:shadow-glow hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:translate-y-0 flex items-center justify-center gap-2"
              >
                {editLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving…
                  </>
                ) : "Save Changes"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;