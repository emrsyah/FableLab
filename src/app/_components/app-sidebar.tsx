"use client";

import {
  ChevronLeft,
  ChevronRight,
  History,
  Home,
  LibraryBig,
  LogIn,
  Search,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DoubleLayerWrapper } from "@/components/ui/double-layer-wrapper";
import { UserProfilePill } from "@/components/user-profile-pill";
import { authClient } from "@/lib/auth/client";

import logo from "~/images/logo/logo.png";

export function AppSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  return (
    <aside
      className={`relative h-full flex flex-col z-20 transition-all duration-300 ease-in-out py-2 pl-2 ${
        isCollapsed ? "w-[5.5rem]" : "w-[21rem]"
      }`}
    >
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute cursor-pointer -right-1 top-10 translate-x-1/2 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-full p-2 shadow-sm hover:shadow-md transition-all z-50"
      >
        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      {/* Double Layer Effect */}
      <DoubleLayerWrapper>
        {/* Sidebar Content */}
        <div className="py-6 px-2 h-full flex flex-col gap-6 overflow-hidden">
          {/* Logo Area */}
          <div
            className={`flex items-center gap-3 ml-2 transition-all duration-300 pl-0.5`}
          >
            <Image src={logo} alt="Logo" width={40} height={40} />
            <span
              className={`text-xl font-bold text-slate-900 tracking-tight whitespace-nowrap transition-all duration-300 ${
                isCollapsed
                  ? "opacity-0 w-0 overflow-hidden"
                  : "opacity-100 w-auto"
              }`}
            >
              FableLab AI
            </span>
          </div>

          {/* Search Bar */}
          <div className={`transition-all duration-300 ease-in-out px-0.5`}>
            <div
              className={`relative bg-white p-1 shadow-sm border border-slate-100 rounded-2xl transition-all duration-300 ease-in-out overflow-hidden ${
                isCollapsed ? "w-[3.25rem]" : "w-full"
              }`}
            >
              <div className="flex items-center bg-slate-50/50 rounded-xl transition-all duration-300 ease-in-out h-10 w-full px-0">
                <div className="w-11 flex items-center justify-center flex-shrink-0">
                  <Search
                    className="text-slate-400 transition-all duration-300"
                    size={20}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Search"
                  className={`bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-600 h-full transition-all ease-in-out ${
                    isCollapsed
                      ? "w-0 opacity-0 p-0 absolute pointer-events-none duration-1"
                      : "w-full opacity-100 relative pr-4 duration-300 delay-100"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-2 px-0.5">
            <Link href="/" className="w-full">
              <SidebarItem
                icon={<Home size={20} />}
                label="Homepage"
                isActive={pathname === "/"}
                isCollapsed={isCollapsed}
              />
            </Link>
            <Link href="/library" className="w-full">
              <SidebarItem
                icon={<LibraryBig size={20} />}
                label="Community Library"
                isActive={pathname === "/library"}
                isCollapsed={isCollapsed}
              />
            </Link>
            <Link href="/history" className="w-full">
              <SidebarItem
                icon={<History size={20} />}
                label="History"
                isActive={pathname === "/history"}
                isCollapsed={isCollapsed}
              />
            </Link>
          </nav>

          {/* Spacer to push profile to bottom */}
          <div className="flex-grow" />

          {/* User Profile or Login Button at Bottom */}
          {isPending ? (
            <div className="px-0.5">
              <div
                className={`flex items-center bg-white p-1.5 pr-4 rounded-2xl border border-slate-100 shadow-sm animate-pulse ${
                  isCollapsed ? "justify-center px-0.5" : "justify-start px-4"
                }`}
              >
                <div className="h-9 w-9 bg-slate-100 rounded-lg flex-shrink-0" />
                <div
                  className={`overflow-hidden whitespace-nowrap ml-3 space-y-1.5 ${
                    isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                  }`}
                >
                  <div className="h-2.5 w-16 bg-slate-100 rounded" />
                  <div className="h-2 w-20 bg-slate-50 rounded" />
                </div>
              </div>
            </div>
          ) : session?.user ? (
            <div className="px-0.5">
              <UserProfilePill user={session.user} isCollapsed={isCollapsed} />
            </div>
          ) : (
            <div className="px-0.5">
              <Link href="/login" className="w-full">
                <button
                  type="button"
                  className={`flex cursor-pointer items-center w-full py-3 rounded-2xl transition-all duration-300 group relative bg-blue-500 hover:bg-blue-600 text-white font-medium shadow-sm hover:shadow-md ${
                    isCollapsed ? "justify-center px-0.5" : "justify-start px-4"
                  }`}
                >
                  <div
                    className={`flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                      isCollapsed ? "scale-100" : "group-hover:scale-105"
                    }`}
                  >
                    {isCollapsed ? <LogIn size={20} /> : <User size={20} />}
                  </div>
                  <div
                    className={`overflow-hidden transition-all duration-300 whitespace-nowrap ml-3 ${
                      isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                    }`}
                  >
                    <span className="text-sm font-medium">Sign In</span>
                  </div>
                  {isCollapsed && (
                    <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                      Sign In
                    </div>
                  )}
                </button>
              </Link>
            </div>
          )}
        </div>
      </DoubleLayerWrapper>
    </aside>
  );
}

function SidebarItem({
  icon,
  label,
  isActive = false,
  isCollapsed = false,
}: {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  isCollapsed?: boolean;
}) {
  return (
    <button
      type="button"
      className={`flex cursor-pointer items-center w-full py-3 rounded-2xl transition-all duration-300 group relative ${
        isActive
          ? "bg-blue-50 text-blue-600 font-semibold"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
      }`}
    >
      <div className="w-[3.25rem] flex items-center justify-center flex-shrink-0">
        <div
          className={`transition-transform duration-200 ${isActive ? "scale-105" : "group-hover:scale-105"}`}
        >
          {icon}
        </div>
      </div>
      <div
        className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${
          isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
        }`}
      >
        <span className="text-sm block">{label}</span>
      </div>
      {isCollapsed && (
        <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
          {label}
        </div>
      )}
    </button>
  );
}
