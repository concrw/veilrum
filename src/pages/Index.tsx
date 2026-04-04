import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

import { useNavigate, Link } from "react-router-dom";

import Logo from "@/components/Logo";

const Index = () => {
  const {
    user
  } = useAuth();
  const [hasCompleted, setHasCompleted] = useState<boolean>(false);
  const navigate = useNavigate();
  const goHome = () => navigate('/why');
  useEffect(() => {
    let active = true;
    const check = async () => {
      if (!user) {
        if (active) setHasCompleted(false);
        return;
      }
      const {
        data
      } = await supabase.from('brainstorm_sessions').select('id, ended_at').eq('user_id', user.id).not('ended_at', 'is', null).limit(1).maybeSingle();
      if (active) setHasCompleted(!!data);
    };
    check();
    return () => {
      active = false;
    };
  }, [user]);
  return <>
      <Helmet>
        <title>V-File — 나를 나답게 만드는 관점</title>
        <meta name="description" content="AI와 함께하는 깊이 있는 자기 발견 여정" />
        <link rel="canonical" href={`${window.location.origin}/`} />
      </Helmet>
      <main className="relative min-h-screen bg-background text-foreground">
          <div className="absolute inset-0 cursor-pointer select-none" role="link" tabIndex={0} onClick={goHome} onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') goHome();
      }} aria-label="첫 화면 - WHY로 이동">
          <main className="h-full w-full relative">
            <img src="/lovable-uploads/194c7968-5fbf-4e94-b3bd-b260ff6f6c83.png" alt="V-File 시작이미지" className="absolute inset-0 h-full w-full object-cover" loading="lazy" decoding="async" />
            <div className="absolute inset-0 grid place-items-center z-20">
              <Logo size={224} className="text-foreground" />
            </div>
          </main>
          <span className="sr-only">탭 또는 엔터 키를 누르면 WHY 페이지로 이동합니다.</span>
        </div>
      </main>
    </>;
};
export default Index;