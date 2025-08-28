// src/components/ReviewList.jsx
import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

const ReviewList = ({ userId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE}/users/reviews/${userId}`);
        setReviews(response.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load reviews");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchReviews();
    }
  }, [userId]);

  if (loading) {
    return <div className="text-accent animate-pulse">Loading reviews...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (reviews.length === 0) {
    return <div className="text-gray-400">No reviews yet.</div>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review._id}
          className="bg-white rounded-lg shadow p-4 flex items-start gap-4"
        >
          {/* Reviewer Avatar */}
          <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
            {review.reviewer.avatar ? (
              <img
                src={review.reviewer.avatar.startsWith("http") 
                  ? review.reviewer.avatar 
                  : `http://localhost:5000${review.reviewer.avatar}`}
                alt={review.reviewer.name}
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : null}
            {(!review.reviewer.avatar || review.reviewer.avatar === "") && (
              <span>
                {review.reviewer.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            )}
          </div>

          {/* Review Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary">
                {review.reviewer.name}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            {/* Star Rating */}
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
        </div>
      ))}
    </div>
  );
};

export default ReviewList;