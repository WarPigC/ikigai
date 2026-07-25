import React from "react";
import ProfileMenu from "./ProfileMenu";
import ramsitaLogo from "../../assets/ramsita-logo.png";

export default function StudentHeader({ student }) {
  return (
    <header className="w-full bg-white/70 backdrop-blur-md border-b border-gray-800/10 shadow-sm">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:h-20">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={ramsitaLogo}
            alt="HackEval Logo"
            className="w-12 h-12 object-contain shrink-0"
          />
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-800 tracking-tight leading-none truncate">
            HackEval
          </h1>
        </div>
        <ProfileMenu student={student} />
      </div>
    </header>
  );
}