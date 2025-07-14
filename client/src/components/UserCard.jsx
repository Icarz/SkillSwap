import { Link } from "react-router-dom";

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

const UserCard = ({ user }) => (
  <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center border-2 border-transparent hover:border-accent transition">
    <div className="w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center text-2xl font-bold mb-3">
      {getInitials(user)}
    </div>
    <div className="font-bold text-primary text-lg mb-1 capitalize">{user.name}</div>
    {user.skills && user.skills.length > 0 && (
      <div className="flex flex-wrap gap-2 justify-center mb-2">
        {user.skills.slice(0, 3).map((skill) => (
          <span
            key={skill._id}
            className="bg-light text-secondary px-2 py-1 rounded text-xs"
          >
            {typeof skill === "string"
              ? skill.replace(/-/g, " ")
              : skill.name.replace(/-/g, " ")}
          </span>
        ))}
        {user.skills.length > 3 && (
          <span className="text-xs text-accent">+{user.skills.length - 3} more</span>
        )}
      </div>
    )}
    <Link
      to={`/profile/${user._id}`}
      className="mt-2 text-accent hover:underline text-sm font-semibold"
    >
      View Profile
    </Link>
  </div>
);

export default UserCard;