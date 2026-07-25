import React from "react";
import ProfileMenu from "./ProfileMenu";

export default function StudentHeader({ student }) {
  return (
    <header className="w-full bg-white/70 backdrop-blur-md border-b border-purple-200 shadow-sm">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:h-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-gradient-to-br from-purple-800 to-pink-500 text-white rounded-xl shadow-lg w-10 h-10 flex items-center justify-center font-extrabold text-xl shrink-0">
            HE
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-800 tracking-tight leading-none truncate">
            HackEval
          </h1>
        </div>
        <ProfileMenu student={student} />
      </div>
    </header>
  );
}