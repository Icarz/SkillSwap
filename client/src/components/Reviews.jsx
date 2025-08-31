import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

// Helper to get initials
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

const Reviews = ({ profile }) => {
  const { token, user: authUser } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  // Fetch reviews
  useEffect(() => {
    if (!profile?._id || !token) return;
    setLoading(true);
    axios
      .get(`${API_BASE}/users/reviews/${profile._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log('Fetched reviews:', res.data);
        setReviews(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [profile, token]);

  // Show notification function
  const showNotification = (message, type = "error") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 4000);
  };

  // Delete review - FIXED ENDPOINT
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/users/reviews/${id}`, { // Changed endpoint
        headers: { Authorization: `Bearer ${token}` },
      });
      setReviews((prev) => prev.filter((r) => r._id !== id));
      showNotification("Review deleted successfully!", "success");
    } catch (err) {
      console.error("Delete review failed:", err);
      showNotification("Failed to delete review", "error");
    }
  };

  // Submit new review
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newReview = {
      rating: parseInt(formData.get("rating")),
      comment: formData.get("comment"),
      reviewedUser: profile._id,
    };

    try {
      const res = await axios.post(
        `${API_BASE}/users/review`,
        newReview,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReviews((prev) => [res.data, ...prev]);
      e.target.reset();
      showNotification("Review submitted successfully!", "success");
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to submit review";
      console.error("Post review failed:", errorMessage);
      showNotification(errorMessage, "error");
    }
  };

  // Check if current user can delete a review
  const canDeleteReview = (review) => {
    if (!authUser || !review || !review.reviewer) {
      return false;
    }
    
    try {
      // Handle different reviewer data structures
      let reviewerId;
      
      if (typeof review.reviewer === 'object' && review.reviewer !== null) {
        reviewerId = review.reviewer._id || review.reviewer.id || review.reviewer;
      } else {
        reviewerId = review.reviewer;
      }
      
      const authUserId = authUser._id || authUser.id;
      
      if (!reviewerId || !authUserId) {
        return false;
      }
      
      // Convert both to string for safe comparison
      return reviewerId.toString() === authUserId.toString();
    } catch (error) {
      console.error('Error in canDeleteReview:', error, review);
      return false;
    }
  };

  // Check if user has already reviewed
  const hasUserReviewed = () => {
    if (!authUser) return false;
    return reviews.some(review => {
      try {
        return canDeleteReview(review);
      } catch (error) {
        console.error('Error checking if user reviewed:', error, review);
        return false;
      }
    });
  };

  return (
    <div className="mt-10">
      {/* Notification Popup */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${
          notification.show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}>
          <div className={`p-4 rounded-lg shadow-lg border-l-4 ${
            notification.type === "success" 
              ? "bg-green-50 border-green-500 text-green-700" 
              : "bg-red-50 border-red-500 text-red-700"
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === "success" ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
              <button
                onClick={() => setNotification({ show: false, message: "", type: "" })}
                className="ml-4 inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-xl font-semibold text-primary mb-4">Reviews</h2>

      {loading ? (
        <div className="text-accent animate-pulse">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="text-gray-400">No reviews yet.</div>
      ) : (
        <ul className="space-y-4">
          {reviews.map((review) => {
            const canDelete = canDeleteReview(review);
            
            return (
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
                      {review.reviewer?.name || 'Unknown User'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={i < review.rating ? "text-yellow-400" : "text-gray-300"}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-gray-700">{review.comment}</div>
                </div>

                {canDelete && (
                  <button
                    onClick={() => handleDelete(review._id)}
                    className="text-red-500 hover:text-red-700 text-sm ml-2 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    title="Delete your review"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Add Review Form (only if viewing someone else's profile) */}
      {authUser && profile._id !== authUser._id && (
        <div className="mt-6 bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-primary mb-2">Leave a Review</h3>
          {hasUserReviewed() ? (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    You have already reviewed this user.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <label key={star} className="cursor-pointer">
                    <input
                      type="radio"
                      name="rating"
                      value={star}
                      className="hidden peer"
                      required
                    />
                    <span className="text-2xl text-gray-300 hover:text-yellow-400 peer-checked:text-yellow-400 transition-colors">
                      ★
                    </span>
                  </label>
                ))}
              </div>
              <textarea
                name="comment"
                placeholder="Write your review..."
                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-accent focus:border-transparent"
                rows={3}
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                Submit Review
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default Reviews;