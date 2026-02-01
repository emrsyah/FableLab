import { DashboardSidebar } from "./_components/sidebar";
import { DashboardHeader } from "./_components/dashboard-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-[#f8fafc] font-sans text-slate-800 selection:bg-blue-100">
      {/* Sidebar - Collapsible */}
      <DashboardSidebar />

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col h-full overflow-hidden">
        {/* Dotted Background Pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-60 mix-blend-multiply"
          style={{
            backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Floating Header */}
        <DashboardHeader />

        {/* Scrollable Content Container */}
        {/* Scrollable Content Container */}
        <div className="relative z-10 flex-1 w-full h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
