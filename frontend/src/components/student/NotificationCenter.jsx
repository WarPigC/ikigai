import React, { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle2, XCircle, Hand, Trash2, CheckCheck, X } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function NotificationCenter({ userEmail, onOpenPasswordModal }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (!userEmail) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/notifications?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [userEmail]);

  const markAsRead = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications/${id}/read`, { method: "PUT" });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const clearAll = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications/clear?email=${encodeURIComponent(userEmail)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Failed to clear all:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIcon = (type) => {
    switch (type) {
      case "Welcome": return <Hand className="text-blue-500" size={20} />;
      case "Approval": return <CheckCircle2 className="text-green-500" size={20} />;
      case "Rejection": return <XCircle className="text-red-500" size={20} />;
      default: return <Bell className="text-gray-500" size={20} />;
    }
  };

  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors mr-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        aria-label="Notifications"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 md:w-96 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 backdrop-blur-sm sticky top-0">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                  {unreadCount} new
                </span>
              )}
            </h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-gray-500 hover:text-green-600 font-medium transition-colors p-1"
                  title="Mark all as read"
                >
                  <CheckCheck size={16} />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-gray-500 hover:text-red-600 font-medium transition-colors p-1"
                  title="Clear all"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 overscroll-contain bg-gray-50/30">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <div className="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm">Loading...</p>
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {notifications.map((notif) => (
                  <div
                    key={notif._id}
                    className={`p-4 transition-colors relative group ${
                      !notif.isRead ? "bg-green-50/40" : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    {!notif.isRead && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                    )}
                    <div className="flex gap-3">
                      <div className="mt-1 shrink-0 bg-white p-1.5 rounded-full shadow-sm border border-gray-100">
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-sm ${!notif.isRead ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}>
                            {notif.title}
                          </h4>
                          <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-2">
                            {timeAgo(notif.createdAt)}
                          </span>
                        </div>
                        <p className={`text-xs leading-relaxed ${!notif.isRead ? "text-gray-700 font-medium" : "text-gray-500"}`}>
                          {notif.message}
                        </p>
                        
                        {/* Custom Action for Welcome */}
                        {notif.type === "Welcome" && (
                          <button
                            onClick={() => {
                              if(onOpenPasswordModal) onOpenPasswordModal();
                              setIsOpen(false);
                            }}
                            className="mt-2 w-full bg-green-600 text-white text-[11px] font-bold py-1.5 px-3 rounded hover:bg-green-700 transition shadow-sm"
                          >
                            Change Password
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Hover Actions */}
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-md shadow-sm border border-gray-100 p-0.5 flex">
                      {!notif.isRead && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markAsRead(notif._id); }}
                          className="p-1.5 text-gray-400 hover:text-green-600 rounded hover:bg-gray-50 transition-colors"
                          title="Mark as read"
                        >
                          <CheckCheck size={14} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotification(notif._id); }}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-gray-50 transition-colors"
                        title="Delete"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center flex flex-col items-center text-gray-400">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3 border border-gray-100">
                  <Bell size={24} className="text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">All caught up!</p>
                <p className="text-xs mt-1">No new notifications.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
