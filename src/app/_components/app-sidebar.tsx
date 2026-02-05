"use client";

import {
  ChevronLeft,
  ChevronRight,
  History,
  Home,
  PieChart,
  Search,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { DoubleLayerWrapper } from "@/components/ui/double-layer-wrapper";
import { UserProfilePill } from "@/components/user-profile-pill";
import { authClient } from "@/lib/auth/client";

import logo from "~/images/logo/logo.png";

export function AppSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

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
            <Link href="/progress" className="w-full">
              <SidebarItem
                icon={<PieChart size={20} />}
                label="Progress Tracking"
                isActive={pathname === "/progress"}
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

          {/* User Profile at Bottom */}
          {session?.user && (
            <div className="px-0.5 pb-2">
              <UserProfilePill user={session.user} isCollapsed={isCollapsed} />
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
