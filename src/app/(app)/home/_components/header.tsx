"use client";

import { authClient } from "@/lib/auth/client";
import { User, Share2 } from "lucide-react";
import { UserProfilePill } from "@/components/user-profile-pill";

export function HomeHeader() {
  const { data: session } = authClient.useSession();

  // If no session, show a skeleton or simplified placeholder
  // In a real app we might redirect, but layout components render first
  if (!session) {
    return (
      <header className="absolute top-0 right-0 p-6 z-50 flex items-center gap-4">
        {/* share Button (Always Visible) */}
        <button className="flex h-12 items-center gap-2 px-6 rounded-full bg-[radial-gradient(ellipse_at_center,#6FA0F6_0%,#3C7AE8_80%)] text-white shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:shadow-[0_0_20px_rgba(111,160,246,0.8)] hover:scale-[1.02] hover:brightness-105 ring-4 ring-blue-200/80 transition-all duration-300 transform font-medium">
          <Share2 size={18} />
          <span>Share</span>
        </button>

        {/* Auth Skeleton */}
        <div className="flex items-center gap-3 bg-white p-1.5 pr-4 rounded-2xl border border-slate-100 shadow-sm animate-pulse w-48 h-[52px]">
           <div className="h-9 w-9 bg-slate-100 rounded-lg" />
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
      <button className="flex h-12 items-center gap-2 px-6 rounded-full bg-[radial-gradient(ellipse_at_center,#6FA0F6_0%,#3C7AE8_80%)] text-white shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:shadow-[0_0_20px_rgba(111,160,246,0.8)] hover:scale-[1.02] hover:brightness-105 ring-4 ring-blue-200/80 transition-all duration-300 transform font-medium">
        <Share2 size={18} />
        <span>Share</span>
      </button>

      {/* User Profile Pill */}
      {/* User Profile Pill */}
      <UserProfilePill user={user} />
        

    </header>
  );
}
