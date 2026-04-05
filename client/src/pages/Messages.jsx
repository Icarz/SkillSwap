import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../hooks/useSocket";
import { Link } from "react-router-dom";

import { API_BASE, SOCKET_URL } from "../config";

const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith("http")) return avatarPath;
  return `${SOCKET_URL}${avatarPath}`;
};

const getInitials = (user) => {
  if (!user) return "";
  if (user.name) return user.name.split(" ").map((n) => n[0]).join("").toUpperCase();
  return "U";
};

const Avatar = ({ user, size = "md" }) => {
  const sz = size === "sm" ? "w-7 h-7 text-xs" : size === "lg" ? "w-12 h-12 text-lg" : "w-10 h-10 text-sm";
  return (
    <div className={`${sz} rounded-xl bg-gradient-to-br from-primary to-accent text-white font-bold flex items-center justify-center overflow-hidden shrink-0`}>
      {user?.avatar ? (
        <img src={getAvatarUrl(user.avatar)} alt={user.name} className="w-full h-full object-cover"
          onError={(e) => { e.target.style.display = "none"; }} />
      ) : getInitials(user).slice(0, 2)}
    </div>
  );
};

const Messages = () => {
  const { token, user } = useAuth();
  const { socket, isConnected, isReconnecting } = useSocket();
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

  const getId = (obj) => {
    if (!obj) return null;
    return obj._id || obj.id;
  };

  const groupInbox = (messages) => {
    const map = {};
    messages.forEach((msg) => {
      const currentUserId = getId(user);
      const senderId = getId(msg.sender);
      const other = senderId === currentUserId ? msg.receiver : msg.sender;
      const otherId = getId(other);
      if (!map[otherId] || new Date(msg.timestamp) > new Date(map[otherId].lastMessage.timestamp)) {
        map[otherId] = { user: other, lastMessage: msg };
      }
    });
    return Object.values(map).sort((a, b) => new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp));
  };

  const scrollToBottom = () => threadEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    if (!user?.id) return;
    setLoadingInbox(true);
    setError("");
    axios.get(`${API_BASE}/messages/${user.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { setInbox(groupInbox(res.data)); setLoadingInbox(false); })
      .catch(() => { setError("Failed to load inbox."); setLoadingInbox(false); });
  }, [token, user?.id]);

  useEffect(() => {
    if (!selectedUser) return;
    const selectedUserId = selectedUser._id || selectedUser.id;
    setLoadingThread(true);
    setErrorThread("");
    axios.get(`${API_BASE}/messages/${user.id}/${selectedUserId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { setThread(res.data.messages ?? res.data); setLoadingThread(false); setTimeout(scrollToBottom, 100); })
      .catch(() => { setErrorThread("Failed to load conversation."); setLoadingThread(false); });
  }, [selectedUser, token, user?.id]);

  useEffect(() => {
    if (!socket || !user) return;

    const handleNewMessage = (newMessage) => {
      const currentUserId = getId(user);
      const selectedUserId = getId(selectedUser);
      const senderId = getId(newMessage.sender);
      const receiverId = getId(newMessage.receiver);

      // Add to thread if this message belongs to the open conversation
      const isForCurrentThread =
        selectedUser &&
        (senderId === selectedUserId || receiverId === selectedUserId);
      if (isForCurrentThread) {
        setThread((prev) => [...prev, newMessage]);
        setTimeout(scrollToBottom, 100);
      }

      // Update inbox list incrementally — no re-fetch needed
      const otherId = senderId === currentUserId ? receiverId : senderId;
      const otherUser = senderId === currentUserId ? newMessage.receiver : newMessage.sender;
      setInbox((prev) => {
        const exists = prev.some((c) => getId(c.user) === otherId);
        const updated = exists
          ? prev.map((c) => getId(c.user) === otherId ? { ...c, lastMessage: newMessage } : c)
          : [{ user: otherUser, lastMessage: newMessage }, ...prev];
        return updated.sort((a, b) => new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp));
      });
    };

    socket.on("new-message", handleNewMessage);
    return () => { socket.off("new-message", handleNewMessage); };
  }, [socket, user?.id, selectedUser]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedUser) return;
    const receiverId = selectedUser._id || selectedUser.id;
    if (!receiverId) { setErrorThread("Invalid recipient"); return; }
    setSending(true);
    try {
      const response = await axios.post(
        `${API_BASE}/messages`,
        { receiver: receiverId, content: message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const savedMessage = response.data.data;
      // Add sender's own message to thread (server only emits new-message to receiver)
      setThread((prev) => [...prev, savedMessage]);
      // Update inbox for sender side incrementally
      setInbox((prev) => {
        const exists = prev.some((c) => getId(c.user) === receiverId);
        const updated = exists
          ? prev.map((c) => getId(c.user) === receiverId ? { ...c, lastMessage: savedMessage } : c)
          : [{ user: selectedUser, lastMessage: savedMessage }, ...prev];
        return updated.sort((a, b) => new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp));
      });
      setMessage("");
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      setErrorThread(err.response?.data?.error || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => { scrollToBottom(); }, [thread]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/10">

      {/* Page Header */}
      <div className="bg-gradient-to-r from-secondary to-primary py-10 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle, #A5D7E8 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative z-10 max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-light/60 text-sm font-medium uppercase tracking-widest mb-1">Inbox</p>
            <h1 className="text-3xl font-extrabold text-white">Messages</h1>
          </div>
          {/* Connection Status */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${
            isConnected ? "bg-green-500/20 text-green-300 border border-green-500/30"
            : isReconnecting ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
            : "bg-red-500/20 text-red-300 border border-red-500/30"
          }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : isReconnecting ? "bg-yellow-400 animate-pulse" : "bg-red-400"}`} />
            {isConnected ? "Online" : isReconnecting ? "Reconnecting…" : "Offline"}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6 h-[calc(100vh-280px)] min-h-[500px]">

          {/* Inbox Sidebar */}
          <aside className="w-full md:w-80 shrink-0 bg-white rounded-2xl shadow-md border border-gray-100 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-primary">Conversations</h2>
              <p className="text-secondary/40 text-xs">{inbox.length} thread{inbox.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="overflow-y-auto flex-1">
              {loadingInbox ? (
                <div className="p-5 text-accent text-sm animate-pulse">Loading inbox…</div>
              ) : error ? (
                <div className="p-5 text-red-500 text-sm">{error}</div>
              ) : inbox.length === 0 ? (
                <div className="p-5 text-center">
                  <div className="text-4xl mb-2">💬</div>
                  <p className="text-secondary/40 text-sm">No conversations yet.</p>
                </div>
              ) : (
                <ul>
                  {inbox.map((conv) => (
                    <li
                      key={getId(conv.user)}
                      onClick={() => setSelectedUser(conv.user)}
                      className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all border-b border-gray-50 ${
                        selectedUser && getId(selectedUser) === getId(conv.user)
                          ? "bg-accent/10 border-l-4 border-l-accent"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <Avatar user={conv.user} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-primary text-sm capitalize truncate">{conv.user?.name}</div>
                        <div className="text-xs text-gray-400 truncate mt-0.5">{conv.lastMessage.content}</div>
                      </div>
                      <div className="text-xs text-gray-300 shrink-0">{new Date(conv.lastMessage.timestamp).toLocaleDateString()}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          {/* Thread View */}
          <main className="flex-1 bg-white rounded-2xl shadow-md border border-gray-100 flex flex-col overflow-hidden">
            {!selectedUser ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-4xl mb-4">💬</div>
                <h3 className="text-lg font-bold text-primary mb-2">Select a conversation</h3>
                <p className="text-secondary/50 text-sm">Choose a conversation from the left to start messaging.</p>
              </div>
            ) : (
              <>
                {/* Thread Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                  <Avatar user={selectedUser} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-primary capitalize">{selectedUser.name}</div>
                    <div className="text-xs text-secondary/40">Active conversation</div>
                  </div>
                  <Link
                    to={`/profile/${selectedUser._id || selectedUser.id}`}
                    className="text-xs font-semibold text-accent hover:text-secondary transition-colors border border-accent/30 px-3 py-1.5 rounded-lg hover:bg-accent/5"
                  >
                    View Profile
                  </Link>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {loadingThread ? (
                    <div className="text-accent animate-pulse text-sm">Loading conversation…</div>
                  ) : errorThread ? (
                    <div className="text-red-500 text-sm">{errorThread}</div>
                  ) : thread.length === 0 ? (
                    <div className="text-center text-secondary/40 text-sm py-8">No messages yet. Say hello! 👋</div>
                  ) : (
                    thread.map((msg) => {
                      const isOwn = getId(msg.sender) === getId(user);
                      return (
                        <div key={msg._id} className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
                          {!isOwn && <Avatar user={msg.sender} size="sm" />}
                          <div className={`max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl shadow-sm ${isOwn ? "bg-gradient-to-r from-primary to-accent text-white rounded-br-sm" : "bg-gray-100 text-primary rounded-bl-sm"}`}>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                            <p className={`text-xs mt-1 text-right ${isOwn ? "text-white/60" : "text-gray-400"}`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          {isOwn && <Avatar user={user} size="sm" />}
                        </div>
                      );
                    })
                  )}
                  <div ref={threadEndRef} />
                </div>

                {/* Send Form */}
                <div className="px-4 py-4 border-t border-gray-100 bg-gray-50/50">
                  {!isConnected && (
                    <p className={`text-xs mb-2 text-center ${isReconnecting ? "text-yellow-500" : "text-red-400"}`}>
                      {isReconnecting ? "Reconnecting…" : "You are offline. Messages cannot be sent."}
                    </p>
                  )}
                  <form onSubmit={handleSend} className="flex items-center gap-3">
                    <input
                      type="text"
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                      placeholder="Type your message…"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={sending || !isConnected}
                      required
                    />
                    <button
                      type="submit"
                      disabled={sending || !message.trim() || !isConnected}
                      className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center hover:shadow-glow hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:translate-y-0 shrink-0"
                    >
                      {sending ? (
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                      )}
                    </button>
                  </form>
                </div>
              </>
            )}
          </main>

        </div>
      </div>
    </div>
  );
};

export default Messages;
