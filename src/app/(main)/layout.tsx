import { DottedBackground } from "@/components/ui/dotted-background";
import { DoubleLayerWrapper } from "@/components/ui/double-layer-wrapper";
import { AppHeader } from "../_components/app-header";
import { AppSidebar } from "../_components/app-sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-[#EDF3FD] font-sans text-slate-800 selection:bg-blue-100 overflow-hidden gap-2">
      <AppSidebar />
      <main className="flex-1 relative flex flex-col h-full overflow-hidden p-2 pl-0 md:pl-0">
        <DoubleLayerWrapper>
          <DottedBackground />
          <AppHeader />
          <div className="relative z-10 flex-1 w-full h-full">{children}</div>
        </DoubleLayerWrapper>
      </main>
    </div>
  );
}
