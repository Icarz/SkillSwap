import { Link } from "react-router-dom";

const getInitials = (user) => {
  if (!user) return "";
  if (user.name) return user.name.split(" ").map((n) => n[0]).join("").toUpperCase();
  if (user.email) return user.email[0].toUpperCase();
  return "";
};

const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith("http")) return avatarPath;
  return `http://localhost:5000${avatarPath}`;
};

const UserCard = ({ user }) => (
  <div className="group bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex flex-col items-center hover:shadow-glow hover:-translate-y-1 transition-all duration-300">
    {/* Avatar */}
    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center text-2xl font-bold mb-4 overflow-hidden shadow-md group-hover:scale-105 transition-transform duration-300">
      {user.avatar ? (
        <img
          src={getAvatarUrl(user.avatar)}
          alt="Profile"
          className="w-full h-full object-cover"
          onError={(e) => { e.target.style.display = "none"; }}
        />
      ) : getInitials(user)}
    </div>

    {/* Name */}
    <div className="font-bold text-primary text-lg mb-1 capitalize text-center">{user.name}</div>

    {/* Bio */}
    {user.bio && (
      <p className="text-secondary/60 text-xs text-center mb-3 line-clamp-2">{user.bio}</p>
    )}

    {/* Skills */}
    {user.skills?.length > 0 && (
      <div className="flex flex-wrap gap-1.5 justify-center mb-4">
        {user.skills.slice(0, 3).map((skill) => (
          <span key={skill._id}
            className="bg-gradient-to-r from-primary/10 to-accent/10 text-primary border border-accent/20 px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
          >
            {typeof skill === "string" ? skill.replace(/-/g, " ") : skill.name.replace(/-/g, " ")}
          </span>
        ))}
        {user.skills.length > 3 && (
          <span className="text-xs text-accent font-semibold">+{user.skills.length - 3}</span>
        )}
      </div>
    )}

    {/* View Profile Button */}
    <Link
      to={`/profile/${user._id}`}
      className="mt-auto w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-sm font-bold text-center hover:shadow-glow hover:-translate-y-0.5 transition-all duration-200"
    >
      View Profile
    </Link>
  </div>
);

export default UserCard;
