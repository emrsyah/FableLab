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
import { DoubleLayerWrapper } from "@/components/ui/double-layer-wrapper";

export function HomeSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside 
      className={`relative h-full flex flex-col z-20 transition-all duration-300 ease-in-out py-2 pl-2 ${
        isCollapsed ? "w-[5.5rem]" : "w-[21rem]"
      }`}
    >
      {/* Toggle Button - Moved outside to avoid overflow clipping */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-1 top-10 translate-x-1/2 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-full p-1 shadow-sm hover:shadow-md transition-all z-50"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Double Layer Effect */}
      <DoubleLayerWrapper>

          {/* Sidebar Content */}
          <div className="py-6 px-2 h-full flex flex-col gap-6 overflow-hidden">
            {/* Logo Area */}
            <div className={`flex items-center gap-3 transition-all duration-300 pl-0.5`}>
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
            <div className={`transition-all duration-300 ease-in-out px-0.5`}>
              <div 
                className={`
                  relative bg-white p-1 shadow-sm border border-slate-100 rounded-2xl transition-all duration-300 ease-in-out overflow-hidden
                  ${isCollapsed ? "w-[3.25rem]" : "w-full"}
                `}
              >
                <div 
                  className={`
                    flex items-center bg-slate-50/50 rounded-xl transition-all duration-300 ease-in-out h-10
                    w-full px-0
                  `}
                >
                  {/* Icon Container - Matches SidebarItem width but accounts for parent padding (52px - 8px = 44px) */}
                   <div className="w-11 flex items-center justify-center flex-shrink-0">
                      <Search 
                        className="text-slate-400 transition-all duration-300"
                        size={20}
                      />
                   </div>
                  
                  <input 
                    type="text" 
                    placeholder="Search" 
                    className={`
                      bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-600 h-full
                      transition-all ease-in-out
                      ${isCollapsed 
                        ? "w-0 opacity-0 p-0 absolute pointer-events-none duration-1" 
                        : "w-full opacity-100 relative pr-4 duration-300 delay-100"
                      }
                    `}
                  />
                </div>
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="space-y-2 px-0.5">
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
      </DoubleLayerWrapper>
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
