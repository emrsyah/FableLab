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

export function DashboardSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside 
      className={`relative bg-white border-r border-slate-100 flex flex-col h-full z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-20" : "w-80"
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-full p-1 shadow-sm hover:shadow-md transition-all z-30"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Sidebar Content */}
      <div className="py-6 px-2 h-full flex flex-col gap-8 overflow-hidden">
        {/* Logo Area */}
        <div className="flex items-center gap-3 pl-2">
           <div className="h-10 w-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 flex-shrink-0 transition-transform duration-300">
             <FlaskConical size={20} className="fill-white/20" />
           </div>
           
           <span className={`text-xl font-bold text-slate-900 tracking-tight whitespace-nowrap transition-all duration-300 ${isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"}`}>
             FableLab AI
           </span>
        </div>
        
        {/* Search Bar */}
        <div className="transition-all duration-300">
           {isCollapsed ? (
             <button className="w-10 h-10 ml-2 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
               <Search size={18} />
             </button>
           ) : (
             <div className="relative px-2">
               <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
               <input 
                 type="text" 
                 placeholder="Search" 
                 className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-100 rounded-full text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-400 text-slate-600"
               />
             </div>
           )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-2">
           <SidebarItem 
             icon={<Home size={20} />} 
             label="Homepage" 
             isActive={true} 
             isCollapsed={isCollapsed} 
           />
           <SidebarItem 
             icon={<History size={20} />} 
             label="History" 
             isActive={false} 
             isCollapsed={isCollapsed} 
           />
           <SidebarItem 
             icon={<PieChart size={20} />} 
             label="Progress Tracking" 
             isActive={false} 
             isCollapsed={isCollapsed} 
           />
        </nav>
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
      className={`flex items-center w-full p-3 rounded-2xl transition-all duration-200 group relative ${
        isActive 
          ? "bg-blue-50 text-blue-600 font-semibold" 
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
      }`}
    >
      {/* Icon Container - Fixed width for constant position */}
      <div className={`flex items-center justify-center flex-shrink-0 transition-transform duration-200 w-10 ${isActive ? "scale-105" : "group-hover:scale-105"}`}>
        {icon}
      </div>
      
      {/* Label Container */}
      <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100 ml-3"}`}>
        <span className="text-sm truncate block">{label}</span>
      </div>
      
      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          {label}
        </div>
      )}
    </button>
  );
}
