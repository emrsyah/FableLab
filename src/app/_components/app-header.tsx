"use client";

import { LogIn, Share2 } from "lucide-react";
import Link from "next/link";
import { UserProfilePill } from "@/components/user-profile-pill";
import { authClient } from "@/lib/auth/client";

export function AppHeader() {
  const { data: session, isPending } = authClient.useSession();

  // Loading state
  if (isPending) {
    return (
      <header className="absolute top-0 right-0 p-6 z-50 flex items-center gap-4">
        <button
          type="button"
          className="flex h-12 items-center gap-2 px-6 rounded-full bg-[radial-gradient(ellipse_at_center,#6FA0F6_0%,#3C7AE8_80%)] text-white shadow-[0_0_20px_rgba(59,130,246,0.6)] ring-4 ring-blue-200/80 font-medium"
        >
          <Share2 size={18} />
          <span>Share</span>
        </button>
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

  // Not logged in - show login button
  if (!session?.user) {
    return (
      <header className="absolute top-0 right-0 p-6 z-50 flex items-center gap-4">
        <button
          type="button"
          className="flex h-12 items-center gap-2 px-6 rounded-full bg-[radial-gradient(ellipse_at_center,#6FA0F6_0%,#3C7AE8_80%)] text-white shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:shadow-[0_0_20px_rgba(111,160,246,0.8)] hover:scale-[1.02] hover:brightness-105 ring-4 ring-blue-200/80 transition-all duration-300 transform font-medium"
        >
          <Share2 size={18} />
          <span>Share</span>
        </button>
        <Link
          href="/login"
          className="flex h-12 items-center gap-2 px-6 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm hover:shadow-md transition-all duration-300 font-medium"
        >
          <LogIn size={18} />
          <span>Login</span>
        </Link>
      </header>
    );
  }

  // Logged in - show user profile
  return (
    <header className="absolute top-0 right-0 p-6 z-50 flex items-center gap-4">
      <button
        type="button"
        className="flex h-12 items-center gap-2 px-6 rounded-full bg-[radial-gradient(ellipse_at_center,#6FA0F6_0%,#3C7AE8_80%)] text-white shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:shadow-[0_0_20px_rgba(111,160,246,0.8)] hover:scale-[1.02] hover:brightness-105 ring-4 ring-blue-200/80 transition-all duration-300 transform font-medium"
      >
        <Share2 size={18} />
        <span>Share</span>
      </button>
      <UserProfilePill user={session.user} />
    </header>
  );
}
