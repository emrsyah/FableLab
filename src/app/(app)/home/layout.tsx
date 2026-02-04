import { HomeSidebar } from "./_components/sidebar";
import { HomeHeader } from "./_components/header";
import { DottedBackground } from "@/components/ui/dotted-background";
import { DoubleLayerWrapper } from "@/components/ui/double-layer-wrapper";

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
        <DoubleLayerWrapper>
            {/* Dotted Background Pattern */}
            <DottedBackground />

            {/* Floating Header */}
            <HomeHeader />

            {/* Scrollable Content Container */}
            <div className="relative z-10 flex-1 w-full h-full">
              {children}
            </div>
        </DoubleLayerWrapper>
      </main>
    </div>
  );
}
