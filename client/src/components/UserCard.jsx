import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { SOCKET_URL } from "../config";

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

const SkillPills = ({ skills, color }) => {
  if (!skills?.length) return <span className="text-xs text-gray-400 italic">None listed</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.slice(0, 3).map((skill) => (
        <span
          key={skill._id}
          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${color}`}
        >
          {(typeof skill === "string" ? skill : skill.name).replace(/-/g, " ")}
        </span>
      ))}
      {skills.length > 3 && (
        <span className="text-xs text-accent font-semibold self-center">+{skills.length - 3}</span>
      )}
    </div>
  );
};

const StarRating = ({ avg, count }) => {
  if (avg === null) return <span className="text-xs text-gray-400 italic">No reviews yet</span>;
  const full = Math.floor(avg);
  const half = avg - full >= 0.5;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <svg key={i} className={`w-4 h-4 ${i <= full ? "text-amber-400" : i === full + 1 && half ? "text-amber-300" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-xs font-semibold text-amber-600">{avg.toFixed(1)}</span>
      <span className="text-xs text-gray-400">({count})</span>
    </div>
  );
};

const UserCard = ({ user }) => {
  const { token } = useAuth();
  const navigate = useNavigate();

  return (
  <div className="group bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex flex-col hover:shadow-glow hover:-translate-y-1 transition-all duration-300">
    {/* Avatar + Name */}
    <div className="flex items-center gap-4 mb-3">
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center text-xl font-bold shrink-0 overflow-hidden shadow-md group-hover:scale-105 transition-transform duration-300">
        {user.avatar ? (
          <img
            src={getAvatarUrl(user.avatar)}
            alt="Profile"
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : getInitials(user)}
      </div>
      <div className="min-w-0">
        <div className="font-bold text-primary text-base capitalize truncate">{user.name}</div>
        {user.bio && (
          <p className="text-secondary/60 text-xs line-clamp-2 mt-0.5">{user.bio}</p>
        )}
      </div>
    </div>

    {/* Stats row */}
    <div className="flex items-center gap-4 mb-4">
      <StarRating avg={user.avgRating ?? null} count={user.reviewCount ?? 0} />
      <div className="flex items-center gap-1 text-xs text-secondary/60 border-l border-gray-100 pl-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-accent" viewBox="0 0 20 20" fill="currentColor">
          <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
        </svg>
        <span className="font-semibold text-secondary">{user.transactionCount ?? 0}</span>
        <span>swap{(user.transactionCount ?? 0) !== 1 ? "s" : ""}</span>
      </div>
    </div>

    {/* Skills sections */}
    <div className="flex flex-col gap-3 flex-1 mb-4">
      {/* Teaches */}
      <div>
        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
          <span>🎓</span> Teaches
        </p>
        <SkillPills
          skills={user.skills}
          color="bg-emerald-50 text-emerald-700 border-emerald-200"
        />
      </div>

      {/* Wants to learn */}
      <div>
        <p className="text-xs font-bold text-violet-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
          <span>📚</span> Wants to Learn
        </p>
        <SkillPills
          skills={user.learning}
          color="bg-violet-50 text-violet-700 border-violet-200"
        />
      </div>
    </div>

    {/* View Profile Button */}
    {token ? (
      <Link
        to={`/profile/${user._id}`}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-sm font-bold text-center hover:shadow-glow hover:-translate-y-0.5 transition-all duration-200"
      >
        View Profile
      </Link>
    ) : (
      <button
        onClick={() => navigate("/login")}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-sm font-bold text-center hover:shadow-glow hover:-translate-y-0.5 transition-all duration-200"
      >
        Login to View Profile
      </button>
    )}
  </div>
  );
};

export default UserCard;
