import { HomeSidebar } from "./_components/sidebar";
import { HomeHeader } from "./_components/header";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-[#EDF3FD] font-sans text-slate-800 selection:bg-blue-100 overflow-hidden gap-2">
      {/* Sidebar - Collapsible - Self-contained card style */}
      <HomeSidebar />

      {/* Main Content Area - Double Layer Card Style */}
      <main className="flex-1 relative flex flex-col h-full overflow-hidden p-2 pl-0 md:pl-0">
        {/* Outer layer */}
        <div className="h-full w-full rounded-3xl bg-white/70 p-1 shadow-sm">
          {/* Inner layer */}
          <div className="relative flex flex-col h-full w-full rounded-2xl bg-white overflow-hidden border border-white/50">
            {/* Dotted Background Pattern */}
            <div
              className="absolute inset-0 pointer-events-none opacity-60 mix-blend-multiply"
              style={{
                backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            {/* Floating Header */}
            <HomeHeader />

            {/* Scrollable Content Container */}
            <div className="relative z-10 flex-1 w-full h-full">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
