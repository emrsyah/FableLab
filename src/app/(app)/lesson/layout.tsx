import { HomeSidebar } from "@/app/(app)/home/_components/sidebar";
import { HomeHeader } from "@/app/(app)/home/_components/header";
import { DottedBackground } from "@/components/ui/dotted-background";
import { DoubleLayerWrapper } from "@/components/ui/double-layer-wrapper";

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
        <DoubleLayerWrapper>
          <DottedBackground className="opacity-40" />
          
          {/* Content Container */}
          <div className="relative z-10 w-full h-full flex flex-col">
            {children}
          </div>
        </DoubleLayerWrapper>
      </main>
    </div>
  );
}
