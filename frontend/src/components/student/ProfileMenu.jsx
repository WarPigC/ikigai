import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ProfileMenu({ student }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  
  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  const initial = (student?.name || "S").charAt(0).toUpperCase();

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 cursor-pointer select-none"
      >
        {/* Avatar */}
        <div className="w-10 h-10 bg-purple-700 text-white flex items-center justify-center rounded-full font-semibold">
          {initial}
        </div>

        {/* Profile Info */}
        <div className="text-sm leading-tight">
          <div className="font-semibold">
            {student?.name || "Student Coordinator"}
          </div>
          <div className="text-purple-700 text-xs">
            {student?.email || "loading..."}
          </div>
          <div className="text-gray-500 text-xs">
            Student Coordinator
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-36 bg-white border border-purple-200 rounded-lg shadow-md z-50">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
