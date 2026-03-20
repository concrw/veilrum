import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Users, UserRound, Settings, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface NavItem {
  key: string;
  label: string;
  to: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  adminOnly?: boolean;
}

const QuestionMarkIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <text x="12" y="12" textAnchor="middle" dominantBaseline="middle" fontSize="20" fontWeight="700" fill="currentColor">?</text>
  </svg>
);

const IkigaiIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" {...props}>
    <circle cx="9" cy="9" r="4.5" />
    <circle cx="15" cy="9" r="4.5" />
    <circle cx="9" cy="15" r="4.5" />
    <circle cx="15" cy="15" r="4.5" />
  </svg>
);

const LetterBIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <text x="12" y="12" textAnchor="middle" dominantBaseline="middle" fontSize="20" fontWeight="700" fill="currentColor">B</text>
  </svg>
);

const allItems: NavItem[] = [
  { key: "why", label: "WHY", to: "/why", icon: QuestionMarkIcon },
  { key: "ikigai", label: "IKIGAI", to: "/ikigai", icon: IkigaiIcon },
  { key: "brand", label: "BRAND", to: "/brand", icon: LetterBIcon },
  { key: "commu", label: "COMMU", to: "/commu", icon: Users },
  { key: "chat", label: "CHAT", to: "/chat", icon: MessageSquare },
  { key: "admin", label: "ADMIN", to: "/admin", icon: Settings, adminOnly: true },
  { key: "me", label: "ME", to: "/me", icon: UserRound },
];

const isActivePath = (pathname: string, to: string) => {
  if (to === "/brand") return pathname === "/brand" || pathname === "/brand-design";
  if (to === "/commu") return pathname === "/commu" || pathname === "/community";
  if (to === "/me") return pathname === "/me" || pathname === "/dashboard";
  if (to === "/admin") return pathname.startsWith("/admin");
  return pathname === to;
};

const BottomNav = () => {
  const location = useLocation();
  const authData = useAuth();
  const { toast } = useToast();
  const [hasCompleted, setHasCompleted] = useState<boolean>(false);

  // Safe destructuring with fallback
  const user = authData?.user || null;
  const isAdmin = authData?.isAdmin || false;

  useEffect(() => {
    let active = true;
    const check = async () => {
      if (!user) {
        if (active) setHasCompleted(false);
        return;
      }
      try {
        const { data } = await (supabase as any)
          .from('brainstorm_sessions')
          .select('id, ended_at')
          .eq('user_id', user.id)
          .not('ended_at', 'is', null)
          .limit(1)
          .maybeSingle();
        if (active) setHasCompleted(!!data);
      } catch (error) {
        console.log('Brainstorm session check failed:', error);
        if (active) setHasCompleted(false);
      }
    };
    check();
    return () => { active = false; };
  }, [user]);

  const handleGuard = (e: React.MouseEvent<HTMLAnchorElement>, key: string) => {
    // Temporary: disable guards to allow full access during design phase
    return;
  };

  const pathname = location.pathname;

  // Filter items based on admin status
  const items = useMemo(() => {
    return allItems.filter(item => !item.adminOnly || isAdmin);
  }, [isAdmin]);

  const navCls = useMemo(() =>
    "fixed bottom-0 inset-x-0 border-t bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40 h-16 pb-[env(safe-area-inset-bottom)]",
    []);

  const btnBase =
    "flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all duration-200 hover:opacity-90 hover-scale";

  if (pathname === "/") return null;

  // Dynamic grid class based on number of items
  const gridClass = isAdmin ? "grid-cols-7" : "grid-cols-6";

  return (
    <nav className={navCls} role="navigation" aria-label="Primary">
      <div className="mx-auto max-w-screen-sm">
        <div className={`grid ${gridClass}`}>
          {items.map(({ key, label, to, icon: Icon }) => {
            const active = isActivePath(pathname, to);
            return (
              <Link
                key={key}
                to={to}
                onClick={(e) => handleGuard(e, key)}
                className={cn(
                  btnBase,
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", active ? "" : "opacity-80")}/>
                <span className="text-xs tracking-wider">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;