import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider, useAuth } from "./context/AuthContext";
import type { OnboardingStep } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { OfflineBanner } from "./components/OfflineBanner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// ── Auth ─────────────────────────────────────────────────────────
const Login    = lazy(() => import("./pages/auth/Login"));
const Signup   = lazy(() => import("./pages/auth/Signup"));

// ── Onboarding ───────────────────────────────────────────────────
const Welcome        = lazy(() => import("./pages/onboarding/Welcome"));
const CoreQuestions  = lazy(() => import("./pages/onboarding/CoreQuestions"));
const VFileStart     = lazy(() => import("./pages/onboarding/vfile/Start"));
const VFileQuestions = lazy(() => import("./pages/onboarding/vfile/Questions"));
const VFileResult    = lazy(() => import("./pages/onboarding/vfile/Result"));

// ── Main ─────────────────────────────────────────────────────────
const HomeLayout  = lazy(() => import("./layouts/HomeLayout"));
const VentPage    = lazy(() => import("./pages/home/VentPage"));
const DigPage     = lazy(() => import("./pages/home/DigPage"));
const GetPage     = lazy(() => import("./pages/home/GetPage"));
const SetPage     = lazy(() => import("./pages/home/SetPage"));
const MePage      = lazy(() => import("./pages/home/MePage"));
const DmPage      = lazy(() => import("./pages/home/DmPage"));
const NotFound    = lazy(() => import("./pages/NotFound"));

import { toast as sonnerToast } from "sonner";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      const msg = error instanceof Error ? error.message : '데이터를 불러오지 못했습니다';
      sonnerToast.error('연결 오류', { description: msg, duration: 4000 });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      const msg = error instanceof Error ? error.message : '요청 처리 중 오류가 발생했습니다';
      sonnerToast.error('저장 오류', { description: msg, duration: 4000 });
    },
  }),
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60,
      refetchOnWindowFocus: true, // 탭/기기 전환 후 복귀 시 자동 갱신
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/auth/login" replace state={{ from: location }} />;
  return children;
};

const RequireOnboarding = ({ children }: { children: JSX.Element }) => {
  const { onboardingStep } = useAuth();
  const stepPath: Record<OnboardingStep, string> = {
    welcome: '/onboarding/welcome', cq: '/onboarding/cq',
    priper: '/onboarding/vfile/start', completed: '/home',
  };
  if (onboardingStep !== 'completed') return <Navigate to={stepPath[onboardingStep]} replace />;
  return children;
};

const OnboardingGuard = ({ children }: { children: JSX.Element }) => {
  const { onboardingStep } = useAuth();
  if (onboardingStep === 'completed') return <Navigate to="/home" replace />;
  return children;
};

const RootRedirect = () => {
  const { user, loading, onboardingStep } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/auth/login" replace />;
  const stepPath: Record<OnboardingStep, string> = {
    welcome: '/onboarding/welcome', cq: '/onboarding/cq',
    priper: '/onboarding/vfile/start', completed: '/home',
  };
  return <Navigate to={stepPath[onboardingStep]} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-background focus:text-foreground focus:px-4 focus:py-2 focus:rounded">
              본문으로 건너뛰기
            </a>
            <div aria-live="polite" aria-atomic="true" className="sr-only" id="route-announcer" />
            <OfflineBanner />
            <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<RootRedirect />} />

                {/* Auth */}
                <Route path="/auth/login"  element={<Login />} />
                <Route path="/auth/signup" element={<Signup />} />

                {/* 온보딩 */}
                <Route path="/onboarding/welcome" element={
                  <RequireAuth><OnboardingGuard><Welcome /></OnboardingGuard></RequireAuth>
                } />
                <Route path="/onboarding/cq" element={
                  <RequireAuth><OnboardingGuard><CoreQuestions /></OnboardingGuard></RequireAuth>
                } />
                <Route path="/onboarding/vfile/start" element={
                  <RequireAuth><VFileStart /></RequireAuth>
                } />
                <Route path="/onboarding/vfile/questions" element={
                  <RequireAuth><VFileQuestions /></RequireAuth>
                } />
                <Route path="/onboarding/vfile/result" element={
                  <RequireAuth><VFileResult /></RequireAuth>
                } />

                {/* 메인 앱 */}
                <Route path="/home" element={
                  <RequireAuth><RequireOnboarding><HomeLayout /></RequireOnboarding></RequireAuth>
                }>
                  <Route index        element={<Navigate to="/home/vent" replace />} />
                  <Route path="vent"  element={<VentPage />} />
                  <Route path="dig"   element={<DigPage />} />
                  <Route path="get"   element={<GetPage />} />
                  <Route path="set"   element={<SetPage />} />
                  <Route path="me"    element={<MePage />} />
                  <Route path="dm"    element={<DmPage />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
          <Analytics />
          <SpeedInsights />
        </AuthProvider>
      </TooltipProvider>
      </LanguageProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
