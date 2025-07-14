// src/pages/Messages.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
// import { getInitials } from "../utils/getInitials"; // (optional: or inline helper)
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:5000/api"; 

const Messages = () => {
  const { token, user } = useAuth();
  const [inbox, setInbox] = useState([]); // [{ user: { _id, name }, lastMessage }]
  const [selectedUser, setSelectedUser] = useState(null);
  const [thread, setThread] = useState([]);
  const [message, setMessage] = useState("");
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [errorThread, setErrorThread] = useState("");

  // Helper: Group messages by conversation partner
  const groupInbox = (messages) => {
    const map = {};
    messages.forEach((msg) => {
      const other =
        msg.sender._id === user._id ? msg.receiver : msg.sender;
      if (!map[other._id] || new Date(msg.timestamp) > new Date(map[other._id].lastMessage.timestamp)) {
        map[other._id] = {
          user: other,
          lastMessage: msg,
        };
      }
    });
    // Sort by most recent
    return Object.values(map).sort(
      (a, b) =>
        new Date(b.lastMessage.timestamp) -
        new Date(a.lastMessage.timestamp)
    );
  };

  // Fetch inbox on mount
  useEffect(() => {
    if (!user || !user._id) return;
    setLoadingInbox(true);
    setError("");
    axios
      .get(`${API_BASE}/messages/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setInbox(groupInbox(res.data));
        setLoadingInbox(false);
      })
      .catch(() => {
        setError("Failed to load inbox.");
        setLoadingInbox(false);
      });
  }, [token, user._id]);

  // Fetch thread when selectedUser changes
  useEffect(() => {
    if (!selectedUser) return;
    setLoadingThread(true);
    setErrorThread("");
    axios
      .get(`${API_BASE}/messages/${user._id}/${selectedUser._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setThread(res.data);
        setLoadingThread(false);
      })
      .catch(() => {
        setErrorThread("Failed to load conversation.");
        setLoadingThread(false);
      });
  }, [selectedUser, token, user._id]);

  // Send message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await axios.post(
        `${API_BASE}/messages`,
        {
          receiver: selectedUser._id,
          content: message,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("");
      // Refresh thread and inbox
      axios
        .get(`${API_BASE}/messages/${user._id}/${selectedUser._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setThread(res.data));
      axios
        .get(`${API_BASE}/messages/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setInbox(groupInbox(res.data)));
    } catch {
      setErrorThread("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row gap-8 min-h-[60vh]">
      {/* Inbox/Threads List */}
      <aside className="w-full md:w-1/3">
        <h2 className="text-xl font-semibold text-primary mb-4">Inbox</h2>
        {loadingInbox ? (
          <div className="text-accent animate-pulse">Loading inbox...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : inbox.length === 0 ? (
          <div className="text-gray-400">No conversations yet.</div>
        ) : (
          <ul className="space-y-2">
            {inbox.map((conv) => (
              <li
                key={conv.user._id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                  selectedUser && selectedUser._id === conv.user._id
                    ? "bg-light border-l-4 border-accent"
                    : "hover:bg-light"
                }`}
                onClick={() => setSelectedUser(conv.user)}
              >
                <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center text-lg font-bold">
                  {/* {getInitials(conv.user)} */}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-primary capitalize">
                    {conv.user.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate max-w-[160px]">
                    {conv.lastMessage.content}
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(conv.lastMessage.timestamp).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* Thread View */}
      <main className="flex-1 bg-white rounded-xl shadow p-6 flex flex-col">
        {!selectedUser ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a conversation to view messages.
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4 border-b pb-2">
              <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center text-lg font-bold">
                {/* {getInitials(selectedUser)} */}
              </div>
              <div className="font-semibold text-primary capitalize">
                {selectedUser.name}
              </div>
              <Link
                to={`/profile/${selectedUser._id}`}
                className="ml-auto text-accent hover:underline text-xs"
              >
                View Profile
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto mb-4 max-h-[40vh]">
              {loadingThread ? (
                <div className="text-accent animate-pulse">Loading conversation...</div>
              ) : errorThread ? (
                <div className="text-red-600">{errorThread}</div>
              ) : thread.length === 0 ? (
                <div className="text-gray-400">No messages yet. Say hello!</div>
              ) : (
                <ul className="space-y-3">
                  {thread.map((msg) => (
                    <li
                      key={msg._id}
                      className={`flex ${
                        msg.sender._id === user._id
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`px-4 py-2 rounded-lg max-w-xs ${
                          msg.sender._id === user._id
                            ? "bg-accent text-white"
                            : "bg-light text-primary"
                        }`}
                      >
                        <div className="text-sm">{msg.content}</div>
                        <div className="text-xs text-gray-300 mt-1 text-right">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Send Message Form */}
            <form
              onSubmit={handleSend}
              className="flex items-center gap-2 border-t pt-3"
            >
              <input
                type="text"
                className="flex-1 border rounded-lg px-3 py-2 focus:outline-none"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={sending}
                required
              />
              <button
                type="submit"
                className="bg-accent text-white px-4 py-2 rounded-lg font-semibold hover:bg-secondary transition"
                disabled={sending || !message.trim()}
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
};

export default Messages;

// ---
// Optional: src/utils/getInitials.js
// export const getInitials = (user) => {
//   if (!user) return "";
//   if (user.name) {
//     return user.name
//       .split(" ")
//       .map((n) => n[0])
//       .join("")
//       .toUpperCase();
//   }
//   if (user.email) return user.email[0].toUpperCase();
//   return "";
// };