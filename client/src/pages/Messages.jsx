// src/pages/Messages.jsx
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../hooks/useSocket";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:5000/api";

// Helper: Get avatar URL
const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith("http")) return avatarPath;
  return `http://localhost:5000${avatarPath}`;
};

// Helper: Get initials from name
const getInitials = (user) => {
  if (!user) return "";
  if (user.name) {
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }
  return "U";
};

const Messages = () => {
  const { token, user } = useAuth();
  const { socket, isConnected, joinUserRoom } = useSocket();
  const [inbox, setInbox] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [thread, setThread] = useState([]);
  const [message, setMessage] = useState("");
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [errorThread, setErrorThread] = useState("");

  const threadEndRef = useRef(null);

  // Helper: Get the ID from an object (handles both _id and id formats)
  const getId = (obj) => {
    if (!obj) {
      console.warn("getId called with null/undefined object");
      return null;
    }
    const id = obj._id || obj.id;

    return id;
  };

  // Helper: Group messages by conversation partner
  const groupInbox = (messages) => {
    const map = {};
    messages.forEach((msg) => {
      const currentUserId = getId(user);
      const senderId = getId(msg.sender);

      const other = senderId === currentUserId ? msg.receiver : msg.sender;
      const otherId = getId(other);

      if (
        !map[otherId] ||
        new Date(msg.timestamp) > new Date(map[otherId].lastMessage.timestamp)
      ) {
        map[otherId] = {
          user: other,
          lastMessage: msg,
        };
      }
    });
    const result = Object.values(map).sort(
      (a, b) =>
        new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
    );
    return result;
  };

  // Scroll to bottom of thread
  const scrollToBottom = () => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch inbox on mount
  useEffect(() => {
    if (!user || !user.id) {
      console.warn("Cannot fetch inbox: user or user.id is missing");
      return;
    }
    setLoadingInbox(true);
    setError("");
    axios
      .get(`${API_BASE}/messages/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setInbox(groupInbox(res.data));
        setLoadingInbox(false);
      })
      .catch((err) => {
        console.error("Inbox fetch error:", err.response?.data || err.message);
        setError("Failed to load inbox.");
        setLoadingInbox(false);
      });
  }, [token, user.id]);

  // Fetch thread when selectedUser changes
  useEffect(() => {
    if (!selectedUser) {
      return;
    }
    if (!selectedUser._id && !selectedUser.id) {
      console.error("Selected user has no ID:", selectedUser);
      return;
    }

    const selectedUserId = selectedUser._id || selectedUser.id;

    setLoadingThread(true);
    setErrorThread("");
    axios
      .get(`${API_BASE}/messages/${user.id}/${selectedUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setThread(res.data);
        setLoadingThread(false);
        setTimeout(scrollToBottom, 100);
      })
      .catch((err) => {
        console.error("Thread fetch error:", err.response?.data || err.message);
        setErrorThread("Failed to load conversation.");
        setLoadingThread(false);
      });
  }, [selectedUser, token, user.id]);

  // Socket.IO Effects
  useEffect(() => {
    if (socket && user) {
      // Join user's personal room for receiving messages
      joinUserRoom();

      // Listen for incoming messages
      socket.on("new-message", (newMessage) => {
        const currentUserId = getId(user);
        const selectedUserId = getId(selectedUser);
        const newMessageSenderId = getId(newMessage.sender);
        const newMessageReceiverId = getId(newMessage.receiver);

        // Check if this message belongs to the current thread
        const isForCurrentThread =
          selectedUser &&
          (newMessageSenderId === selectedUserId ||
            newMessageReceiverId === selectedUserId);

        // Check if this message is from/to the current user
        const isRelevant =
          newMessageSenderId === currentUserId ||
          newMessageReceiverId === currentUserId;

        if (isForCurrentThread) {
          // Add to current thread
          setThread((prev) => [...prev, newMessage]);
          setTimeout(scrollToBottom, 100);
        }

        if (isRelevant) {
          // Refresh inbox to update last message and ordering
          axios
            .get(`${API_BASE}/messages/${user.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => setInbox(groupInbox(res.data)))
            .catch(console.error);
        }
      });

      // Cleanup on unmount
      return () => {
        socket.off("new-message");
      };
    }
  }, [socket, user, selectedUser, token, joinUserRoom]);

  // Send message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedUser) {
      return;
    }

    // Use _id since that's what the backend expects
    const receiverId = selectedUser._id || selectedUser.id;

    if (!receiverId) {
      console.error("No receiver ID found!");
      setErrorThread("Failed to send message: invalid recipient");
      return;
    }

    setSending(true);
    try {
      // 1. Send via HTTP API (this saves to database)
      const response = await axios.post(
        `${API_BASE}/messages`,
        {
          receiver: receiverId,
          content: message,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const savedMessage = response.data.data;

      // 2. Emit via Socket.IO for real-time delivery
      if (socket && isConnected) {
        socket.emit("send-message", savedMessage);
      }

      // 3. Optimistically update UI
      setThread((prev) => [...prev, savedMessage]);
      setMessage("");
      setTimeout(scrollToBottom, 100);

      // 4. Refresh inbox to update last message
      axios
        .get(`${API_BASE}/messages/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setInbox(groupInbox(res.data)))
        .catch(console.error);
    } catch (err) {
      console.error("Send message error details:", err.response?.data);
      console.error("Full error:", err);
      setErrorThread("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  // Auto-scroll when thread updates
  useEffect(() => {
    scrollToBottom();
  }, [thread]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row gap-8 min-h-[60vh]">
      {/* Connection Status Indicator */}
      <div
        className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold ${
          isConnected
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {isConnected ? "🟢 Online" : "🔴 Offline"}
      </div>

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
                key={getId(conv.user)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                  selectedUser && getId(selectedUser) === getId(conv.user)
                    ? "bg-light border-l-4 border-accent"
                    : "hover:bg-light"
                }`}
                onClick={() => {
                  setSelectedUser(conv.user);
                }}
              >
                {/* Avatar with fallback to initials */}
                <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center text-lg font-bold overflow-hidden">
                  {conv.user.avatar ? (
                    <img
                      src={getAvatarUrl(conv.user.avatar)}
                      alt={conv.user.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = "none";
                      }}
                    />
                  ) : null}
                  {!conv.user.avatar && (
                    <span>{getInitials(conv.user).slice(0, 2)}</span>
                  )}
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
              {/* Avatar in conversation header */}
              <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center text-lg font-bold overflow-hidden">
                {selectedUser.avatar ? (
                  <img
                    src={getAvatarUrl(selectedUser.avatar)}
                    alt={selectedUser.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = "none";
                    }}
                  />
                ) : null}
                {!selectedUser.avatar && (
                  <span>{getInitials(selectedUser).slice(0, 2)}</span>
                )}
              </div>
              <div className="font-semibold text-primary capitalize">
                {selectedUser.name}
              </div>
              <Link
                to={`/profile/${selectedUser._id || selectedUser.id}`}
                className="ml-auto text-accent hover:underline text-xs"
              >
                View Profile
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto mb-4 max-h-[40vh]">
              {loadingThread ? (
                <div className="text-accent animate-pulse">
                  Loading conversation...
                </div>
              ) : errorThread ? (
                <div className="text-red-600">{errorThread}</div>
              ) : thread.length === 0 ? (
                <div className="text-gray-400">No messages yet. Say hello!</div>
              ) : (
                <ul className="space-y-3">
                  {thread.map((msg) => {
                    const senderId = getId(msg.sender);
                    const currentUserId = getId(user);
                    const isOwnMessage = senderId === currentUserId;

                    return (
                      <li
                        key={msg._id}
                        className={`flex items-end gap-2 ${
                          isOwnMessage ? "justify-end" : "justify-start"
                        }`}
                      >
                        {/* Show avatar for received messages */}
                        {!isOwnMessage && (
                          <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0">
                            {msg.sender.avatar ? (
                              <img
                                src={getAvatarUrl(msg.sender.avatar)}
                                alt={msg.sender.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.style.display = "none";
                                }}
                              />
                            ) : null}
                            {!msg.sender.avatar && (
                              <span>{getInitials(msg.sender).slice(0, 1)}</span>
                            )}
                          </div>
                        )}
                        
                        <div
                          className={`px-4 py-2 rounded-lg max-w-xs ${
                            isOwnMessage
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

                        {/* Show avatar for sent messages */}
                        {isOwnMessage && (
                          <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0">
                            {user.avatar ? (
                              <img
                                src={getAvatarUrl(user.avatar)}
                                alt={user.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.style.display = "none";
                                }}
                              />
                            ) : null}
                            {!user.avatar && (
                              <span>{getInitials(user).slice(0, 1)}</span>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                  <div ref={threadEndRef} />
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
                disabled={sending || !isConnected}
                required
              />
              <button
                type="submit"
                className="bg-accent text-white px-4 py-2 rounded-lg font-semibold hover:bg-secondary transition disabled:opacity-50"
                disabled={sending || !message.trim() || !isConnected}
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </form>
            {!isConnected && (
              <div className="text-red-500 text-xs mt-2">
                Connection lost. Reconnecting...
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Messages;