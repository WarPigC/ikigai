import React from "react";
import ProfileMenu from "./ProfileMenu";
import ramsitaLogo from "../../assets/ramsita-logo.png";

export default function StudentHeader({ student }) {
  return (
    <header className="w-full bg-white/70 backdrop-blur-md border-b border-green-200 shadow-sm">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:h-20">
        <div className="flex items-center gap-3 min-w-0">
          {/* LOGO */}
          <img
            src={ramsitaLogo}
            alt="RAMSITA 2026 Logo"
            className="w-12 h-12 object-contain shrink-0"
          />

          {/* TITLE + FULL FORM */}
          <div className="flex flex-col min-w-0">
            <h1 className="text-xl md:text-3xl font-extrabold text-green-700 leading-tight truncate">
              RAMSITA 2026
            </h1>
            <span className="text-xs md:text-sm text-gray-600 leading-snug line-clamp-2 md:line-clamp-none">
              Recent Advancement and Modernization in Sustainable Intelligent Technologies & Applications
            </span>
          </div>
        </div>

        <ProfileMenu student={student} />
      </div>
    </header>
  );
}
