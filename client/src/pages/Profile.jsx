// src/pages/Profile.jsx
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useParams } from "react-router-dom";

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
  const { token, user: authUser,updateUser } = useAuth();
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [error, setError] = useState("");
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    bio: "",
    skills: "",
    learning: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const fileInputRef = useRef();

  // Get full avatar URL
const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith("http")) return avatarPath;
  // In development, use full URL including /api prefix
  return `http://localhost:5000${avatarPath}`;
};

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
            skills: (res.data.skills || []).map((s) => s.name).join(", "),
            learning: (res.data.learning || []).map((s) => s.name).join(", "),
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

  // Fetch reviews
  useEffect(() => {
    if (!profile?._id || !token) return;

    setLoadingReviews(true);
    axios
      .get(`${API_BASE}/users/reviews/${profile._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setReviews(res.data))
      .catch(console.error)
      .finally(() => setLoadingReviews(false));
  }, [profile, token]);

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
        updateUser(res.data.user); // Immediate sync with Navbar
      }

      return res.data.avatar; // Return the avatar path
    } catch (err) {
      setAvatarError(err.response?.data?.error || "Failed to upload avatar.");
      return null;
    } finally {
      setAvatarUploading(false);
    }
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

      // Update profile data
      const res = await axios.put(
        `${API_BASE}/users/me`,
        {
          bio: editData.bio,
          skills: editData.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          learning: editData.learning
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          ...(uploadedAvatar ? { avatar: uploadedAvatar } : {}),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-primary mb-1 capitalize">
              {profile.name}
            </h1>
            {isOwnProfile && (
              <button
                className="ml-2 px-3 py-1 bg-accent text-white rounded hover:bg-secondary text-sm"
                onClick={() => setEditOpen(true)}
              >
                Edit Profile
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
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-primary mb-4">Reviews</h2>
        {loadingReviews ? (
          <div className="text-accent animate-pulse">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="text-gray-400">No reviews yet.</div>
        ) : (
          <ul className="space-y-4">
            {reviews.map((review) => (
              <li
                key={review._id}
                className="bg-white rounded-lg shadow p-4 flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center text-lg font-bold">
                  {getInitials(review.reviewer)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">
                      {review.reviewer?.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={
                          i < review.rating
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-gray-700">{review.comment}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Edit Profile Modal */}
      {editOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-accent text-2xl"
              onClick={() => setEditOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>

            <h2 className="text-xl font-bold text-primary mb-4">
              Edit Profile
            </h2>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Avatar Upload */}
              <div>
                <label className="block text-secondary font-semibold mb-1">
                  Avatar
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center text-2xl font-bold overflow-hidden">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : profile.avatar ? (
                      <img
                        src={getAvatarUrl(profile.avatar)}
                        alt="Current Avatar"
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      getInitials(profile)
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="block"
                    onChange={handleAvatarChange}
                    ref={fileInputRef}
                    disabled={avatarUploading || editLoading}
                  />
                </div>
                {avatarError && (
                  <div className="text-red-600 text-sm mt-1">{avatarError}</div>
                )}
                {avatarUploading && (
                  <div className="text-accent text-xs mt-1 animate-pulse">
                    Uploading avatar...
                  </div>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="block text-secondary font-semibold mb-1">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={editData.bio}
                  onChange={handleEditSubmit}
                  className="w-full border rounded p-2"
                  rows={3}
                />
              </div>

              {/* Skills */}
              <div>
                <label className="block text-secondary font-semibold mb-1">
                  Skills{" "}
                  <span className="text-xs text-gray-400">
                    (comma separated)
                  </span>
                </label>
                <input
                  name="skills"
                  value={editData.skills}
                  onChange={handleEditSubmit}
                  className="w-full border rounded p-2"
                  placeholder="e.g. react,nodejs,python"
                />
              </div>

              {/* Learning */}
              <div>
                <label className="block text-secondary font-semibold mb-1">
                  Learning{" "}
                  <span className="text-xs text-gray-400">
                    (comma separated)
                  </span>
                </label>
                <input
                  name="learning"
                  value={editData.learning}
                  onChange={handleEditSubmit}
                  className="w-full border rounded p-2"
                  placeholder="e.g. spanish,photography"
                />
              </div>

              {/* Status Messages */}
              {editError && (
                <div className="text-red-600 text-sm">{editError}</div>
              )}
              {editSuccess && (
                <div className="text-green-600 text-sm">{editSuccess}</div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-accent text-white py-2 rounded-lg font-semibold hover:bg-secondary transition"
                disabled={editLoading || avatarUploading}
              >
                {editLoading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
