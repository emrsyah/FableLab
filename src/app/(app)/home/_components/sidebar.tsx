"use client";

import { useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Home, 
  History, 
  PieChart, 
  FlaskConical 
} from "lucide-react";
import Link from "next/link";

export function HomeSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside 
      className={`relative h-full flex flex-col z-20 transition-all duration-300 ease-in-out py-2 pl-2 ${
        isCollapsed ? "w-[5.5rem]" : "w-[21rem]"
      }`}
    >
      {/* Double Layer Effect */}
      <div className="h-full w-full rounded-3xl bg-white/70 p-1 shadow-sm">
        <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white border border-white/50">
          {/* Toggle Button - Moved inside/adjusted */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-0 top-10 translate-x-1/2 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-full p-1 shadow-sm hover:shadow-md transition-all z-30"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          {/* Sidebar Content */}
          <div className="py-6 px-2 h-full flex flex-col gap-6 overflow-hidden">
            {/* Logo Area */}
            <div className={`flex items-center gap-3 transition-all duration-300 pl-[0.35rem]`}>
              {/* Fixed width container for stable icon position */}
              <div className="w-[3.25rem] flex items-center justify-center flex-shrink-0">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 transition-transform duration-300">
                  <FlaskConical size={20} className="fill-white/20" />
                </div>
              </div>
              
              <span className={`text-xl font-bold text-slate-900 tracking-tight whitespace-nowrap transition-all duration-300 ${isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"}`}>
                FableLab AI
              </span>
            </div>
            
            {/* Search Bar - Unified Animated Structure */}
            <div className={`transition-all duration-300 ease-in-out px-2`}>
              <div 
                className={`
                  relative bg-white p-1 shadow-sm border border-slate-100 rounded-full transition-all duration-300 ease-in-out overflow-hidden
                  ${isCollapsed ? "w-[3.25rem] mx-auto" : "w-full"}
                `}
              >
                <div 
                  className={`
                    flex items-center bg-slate-50/50 rounded-full transition-all duration-300 ease-in-out h-10
                    ${isCollapsed ? "w-full justify-center px-0" : "w-full px-3"}
                  `}
                >
                  <Search 
                    className={`
                      text-slate-400 flex-shrink-0 transition-all duration-300 
                      ${isCollapsed ? "mr-0" : "mr-2"}
                    `} 
                    size={isCollapsed ? 18 : 16} 
                  />
                  
                  <input 
                    type="text" 
                    placeholder="Search" 
                    className={`
                      bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-600 h-full
                      transition-all duration-300 ease-in-out
                      ${isCollapsed ? "w-0 opacity-0 p-0 absolute pointer-events-none" : "w-full opacity-100 relative"}
                    `}
                  />
                </div>
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="space-y-2 px-1">
              <SidebarItem 
                icon={<Home size={20} />} 
                label="Homepage" 
                isActive={true} 
                isCollapsed={isCollapsed} 
              />
              <Link href="/history" className="w-full">
                <SidebarItem 
                    icon={<History size={20} />} 
                    label="History" 
                    isActive={false} // Todo: dynamic active state based on path
                    isCollapsed={isCollapsed} 
                />
              </Link>
              <SidebarItem 
                icon={<PieChart size={20} />} 
                label="Progress Tracking" 
                isActive={false} 
                isCollapsed={isCollapsed} 
              />
            </nav>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SidebarItem({ 
  icon, 
  label, 
  isActive = false, 
  isCollapsed = false 
}: { 
  icon: React.ReactNode; 
  label: string; 
  isActive?: boolean; 
  isCollapsed?: boolean; 
}) {
  return (
    <button
      className={`flex items-center w-full py-3 rounded-2xl transition-all duration-300 group relative ${
        isActive 
          ? "bg-blue-50 text-blue-600 font-semibold" 
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
      }`}
    >
      {/* Icon Container - Fixed width for absolute stability */}
      {/* 3.25rem (52px) matches the search bar collapsed width and logo container */}
      <div className="w-[3.25rem] flex items-center justify-center flex-shrink-0">
        <div className={`transition-transform duration-200 ${isActive ? "scale-105" : "group-hover:scale-105"}`}>
          {icon}
        </div>
      </div>
      
      {/* Label Container */}
      <div className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
        <span className="text-sm block">{label}</span>
      </div>
      
      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
          {label}
        </div>
      )}
    </button>
  );
}
