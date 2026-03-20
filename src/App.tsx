import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider, useAuth } from "./context/AuthContext";
import type { OnboardingStep } from "./context/AuthContext";

// ── Auth ─────────────────────────────────────────────────────────
const Login    = lazy(() => import("./pages/auth/Login"));
const Signup   = lazy(() => import("./pages/auth/Signup"));

// ── Onboarding ───────────────────────────────────────────────────
const Welcome        = lazy(() => import("./pages/onboarding/Welcome"));
const CoreQuestions  = lazy(() => import("./pages/onboarding/CoreQuestions"));
const PriperStart    = lazy(() => import("./pages/onboarding/priper/Start"));
const PriperQuestions = lazy(() => import("./pages/onboarding/priper/Questions"));
const PriperResult   = lazy(() => import("./pages/onboarding/priper/Result"));

// ── Main ─────────────────────────────────────────────────────────
const HomeLayout  = lazy(() => import("./layouts/HomeLayout"));
const VentPage    = lazy(() => import("./pages/home/VentPage"));
const DigPage     = lazy(() => import("./pages/home/DigPage"));
const GetPage     = lazy(() => import("./pages/home/GetPage"));
const SetPage     = lazy(() => import("./pages/home/SetPage"));
const MePage      = lazy(() => import("./pages/home/MePage"));
const NotFound    = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

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
    priper: '/onboarding/priper/start', completed: '/home',
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
    priper: '/onboarding/priper/start', completed: '/home',
  };
  return <Navigate to={stepPath[onboardingStep]} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
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
                <Route path="/onboarding/priper/start" element={
                  <RequireAuth><OnboardingGuard><PriperStart /></OnboardingGuard></RequireAuth>
                } />
                <Route path="/onboarding/priper/questions" element={
                  <RequireAuth><OnboardingGuard><PriperQuestions /></OnboardingGuard></RequireAuth>
                } />
                <Route path="/onboarding/priper/result" element={
                  <RequireAuth><PriperResult /></RequireAuth>
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
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
