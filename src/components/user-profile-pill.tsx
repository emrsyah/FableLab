import { ChevronRight, User } from "lucide-react";

interface UserProfilePillProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function UserProfilePill({ user }: UserProfilePillProps) {
  return (
    <div className="flex items-center gap-3 bg-white p-1.5 pr-4 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors group">
      {user.image ? (
        <img
          src={user.image}
          alt={user.name || "User"}
          className="h-9 w-9 rounded-lg bg-slate-100 object-cover"
        />
      ) : (
        <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
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
        <ChevronRight size={16} className="rotate-90" />
      </div>
    </div>
  );
}
