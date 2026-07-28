import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function ProfileMenu({ student }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();
  
  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/change-password-direct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: student?.email,
          role: "studentCoordinator",
          newPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => setShowPasswordModal(false), 2000);
      } else {
        setError(data.message || "Failed to update password");
      }
    } catch (err) {
      setError("An error occurred.");
    }
    setLoading(false);
  };

  const initial = (student?.name || "S").charAt(0).toUpperCase();

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 cursor-pointer select-none"
      >
        {/* Avatar */}
        <div className="w-10 h-10 bg-green-600 text-white flex items-center justify-center rounded-full font-semibold">
          {initial}
        </div>

        {/* Profile Info */}
        <div className="text-sm leading-tight">
          <div className="font-semibold">
            {student?.name || "Student Coordinator"}
          </div>
          <div className="text-green-700 text-xs">
            {student?.email || "loading..."}
          </div>
          <div className="text-gray-500 text-xs">
            Student Coordinator
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute right-0 top-full mt-3 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-bold text-gray-800 truncate">{student?.name || "Student Coordinator"}</p>
            <p className="text-xs text-gray-500 truncate">{student?.email}</p>
          </div>
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                setShowPasswordModal(true);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 font-medium"
            >
              Change Password
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {showPasswordModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Change Password</h2>
            <p className="text-gray-500 mb-6 text-sm">Securely update your password.</p>
            
            {success ? (
              <div className="bg-green-100 text-green-700 p-4 rounded-xl text-center font-semibold">
                Password updated successfully!
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                {error && <div className="text-red-500 text-sm">{error}</div>}
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition disabled:opacity-50"
                  >
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
