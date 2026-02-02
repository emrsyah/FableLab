import { HomeSidebar } from "@/app/(app)/home/_components/sidebar";
import { HomeHeader } from "@/app/(app)/home/_components/header";

export default function LessonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-[#EDF3FD] font-sans text-slate-800 selection:bg-blue-100 overflow-hidden gap-2">
      {/* Reusing HomeSidebar for consistency */}
      <HomeSidebar />

      {/* Main Content Area - Single Card Style for Lesson */}
      <main className="flex-1 relative flex flex-col h-full overflow-hidden p-2 pl-0 md:pl-0">
        {/* Dotted Background Pattern directly on main area */}
        <div className="relative flex-1 h-full w-full rounded-3xl overflow-hidden border border-slate-200/60 shadow-sm bg-white">
          <div
            className="absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply z-0"
            style={{
              backgroundImage: "radial-gradient(#94a3b8 1.5px, transparent 1.5px)",
              backgroundSize: "24px 24px",
            }}
          />
          
          {/* Content Container */}
          <div className="relative z-10 w-full h-full flex flex-col">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
