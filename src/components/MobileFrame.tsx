import { BatteryFull, Signal, Wifi } from "lucide-react";
import { PropsWithChildren } from "react";
type MobileFrameProps = PropsWithChildren<{
  title?: string;
  noPadding?: boolean;
}>;
const StatusBar = () => {
  const time = "9:41";
  return (
    <header className="sticky top-0 z-30 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b border-border">
      <div className="flex items-center justify-between px-4 py-2 text-foreground/80 text-[11px]">
        <span aria-label="현재 시간">{time}</span>
        <div className="flex items-center gap-2">
          <Signal className="h-4 w-4" aria-hidden="true" />
          <Wifi className="h-4 w-4" aria-hidden="true" />
          <BatteryFull className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
    </header>
  );
};
const MobileFrame = ({
  children,
  noPadding
}: MobileFrameProps) => {
  return <div className="w-full max-w-[420px] mx-auto">
      <div className="relative rounded-[2rem] border border-border bg-card text-foreground overflow-hidden shadow-[0_30px_120px_hsl(var(--ring)/0.15)]">
        <StatusBar />
        {/* separator removed - using sticky status bar border */}
        <div className={`min-h-[720px] ${noPadding ? '' : 'p-5'} text-xs`}>
          {children}
        </div>
      </div>
    </div>;
};
export default MobileFrame;