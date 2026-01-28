"use client";

import { authClient } from "@/lib/auth/client";
import { User } from "lucide-react";

export function DashboardHeader() {
  const { data: session } = authClient.useSession();

  // If no session, show a skeleton or simplified placeholder
  // In a real app we might redirect, but layout components render first
  if (!session) {
    return (
      <header className="absolute top-0 right-0 p-6 z-50 flex items-center gap-4">
        {/* New Chat Button (Always Visible) */}
        <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg shadow-blue-500/20 transition-all font-medium">
          <span className="text-xl leading-none">+</span>
          <span>New Chat</span>
        </button>

        {/* Auth Skeleton */}
        <div className="flex items-center gap-3 bg-white p-1.5 pr-4 rounded-full border border-slate-100 shadow-sm animate-pulse w-48 h-[52px]">
           <div className="h-9 w-9 bg-slate-100 rounded-full" />
           <div className="flex-1 space-y-1">
             <div className="h-3 w-20 bg-slate-100 rounded" />
             <div className="h-2 w-24 bg-slate-50 rounded" />
           </div>
        </div>
      </header>
    );
  }

  const { user } = session;

  return (
    <header className="absolute top-0 right-0 p-6 z-50 flex items-center gap-4">
      {/* New Chat Button */}
      <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg shadow-blue-500/20 transition-all font-medium">
        <span className="text-xl leading-none">+</span>
        <span>New Chat</span>
      </button>

      {/* User Profile Pill */}
      <div className="flex items-center gap-3 bg-white p-1.5 pr-4 rounded-full border border-slate-100 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors group">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || "User"}
            className="h-9 w-9 rounded-full bg-slate-100 object-cover"
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
             <User size={18} />
          </div>
        )}
        
        <div className="text-left hidden sm:block min-w-0 max-w-[120px]">
          <div className="text-sm font-bold text-slate-700 leading-tight truncate">
            {user.name || "User"}
          </div>
          <div className="text-[10px] text-slate-400 font-medium truncate">
            {user.email}
          </div>
        </div>
        
        <div className="text-slate-400 ml-1 group-hover:text-slate-600 transition-colors">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
    </header>
  );
}
