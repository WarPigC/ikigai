import React, { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";

export default function AdminLayout() {
  const location = useLocation();
  const path = location.pathname;
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Determine active tab based on URL path
  let activeTab = "events";
  if (path.includes("/progress") || path.includes("/event/")) activeTab = "progress";
  if (path.includes("/users")) activeTab = "users";

  return (
    <div className="flex min-h-screen bg-gray-50 w-full relative">
      
      {/* Collapse Toggle Button - Positioned over the sidebar border */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute z-10 top-4 left-4 bg-white border border-green-200 rounded-md p-2 shadow-sm text-green-700 hover:bg-green-50 transition hidden md:block"
        title="Toggle Sidebar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar - Collapsible */}
      <aside 
        className={`bg-white border-r border-gray-200 shadow-sm pt-16 flex flex-col hidden md:flex shrink-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-56'}`}
      >
        <div className={`px-4 mb-8 text-center ${isCollapsed ? 'block' : 'text-left px-6'}`}>
          {isCollapsed ? (
            <h1 className="text-xl font-extrabold text-green-700">A</h1>
          ) : (
            <h1 className="text-2xl font-extrabold text-green-700">Admin</h1>
          )}
        </div>
        <nav className="flex-1 px-2 space-y-2">
          <Link 
            to="/dashboard"
            title="Events"
            className={`block w-full text-left py-3 rounded-lg font-semibold transition ${isCollapsed ? 'text-center px-0' : 'px-4'} ${activeTab === "events" ? "bg-green-100 text-green-700" : "text-gray-600 hover:bg-gray-100"}`}
          >
            {isCollapsed ? 'E' : 'Events'}
          </Link>
          <Link 
            to="/progress"
            title="Progress"
            className={`block w-full text-left py-3 rounded-lg font-semibold transition ${isCollapsed ? 'text-center px-0' : 'px-4'} ${activeTab === "progress" ? "bg-green-100 text-green-700" : "text-gray-600 hover:bg-gray-100"}`}
          >
            {isCollapsed ? 'P' : 'Progress'}
          </Link>
          <Link 
            to="/users"
            title="Users"
            className={`block w-full text-left py-3 rounded-lg font-semibold transition ${isCollapsed ? 'text-center px-0' : 'px-4'} ${activeTab === "users" ? "bg-green-100 text-green-700" : "text-gray-600 hover:bg-gray-100"}`}
          >
            {isCollapsed ? 'U' : 'Users'}
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full min-w-0 flex flex-col h-screen">
        {/* We use h-screen and overflow-y-auto so nested pages that rely on full height (like EventDetails) work seamlessly */}
        <Outlet />
      </main>
    </div>
  );
}
