import React from "react";
import ProfileMenu from "./ProfileMenu";
import ikigaiLogo from "../../assets/ikigai.png";

export default function StudentHeader({ student }) {
  return (
    <header className="w-full bg-white/70 backdrop-blur-md border-b border-gray-800/10 shadow-sm">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:h-20">
        <div className="flex items-center min-w-0 w-1/2">
          <img
            src={ikigaiLogo}
            alt="Hackathon Logo"
            className="h-12 md:h-16 object-contain w-auto max-w-full"
          />
        </div>
        <ProfileMenu student={student} />
      </div>
    </header>
  );
}