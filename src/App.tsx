import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider, useAuth } from "./context/AuthContext";
import BottomNav from "./components/BottomNav";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Brainstorm = lazy(() => import("./pages/Brainstorm"));
const Define = lazy(() => import("./pages/Define"));
const Classify = lazy(() => import("./pages/Classify"));
const Results = lazy(() => import("./pages/Results"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/auth/Login"));
const Signup = lazy(() => import("./pages/auth/Signup"));
const BrandDesign = lazy(() => import("./pages/BrandDesign"));
const Community = lazy(() => import("./pages/Community"));
const Ikigai = lazy(() => import("./pages/Ikigai"));
const Why = lazy(() => import("./pages/Why"));
const WhyAnalysis = lazy(() => import("./pages/WhyAnalysis"));
const Personas = lazy(() => import("./pages/Personas"));
const PersonaRelationships = lazy(() => import("./pages/PersonaRelationships"));
const GroupDetail = lazy(() => import("./pages/GroupDetail"));
const Chat = lazy(() => import("./pages/Chat"));
const Admin = lazy(() => import("./pages/Admin"));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
      <p className="text-xs text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;

  if (!user) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  return children;
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
                <Route path="/" element={<Index />} />
                <Route path="/why" element={<RequireAuth><Why /></RequireAuth>} />
                <Route path="/why-analysis" element={<RequireAuth><WhyAnalysis /></RequireAuth>} />
                <Route path="/personas" element={<RequireAuth><Personas /></RequireAuth>} />
                <Route path="/personas/relationships" element={<RequireAuth><PersonaRelationships /></RequireAuth>} />
                <Route path="/ikigai" element={<RequireAuth><Ikigai /></RequireAuth>} />
                <Route path="/brand" element={<RequireAuth><BrandDesign /></RequireAuth>} />
                <Route path="/commu" element={<RequireAuth><Community /></RequireAuth>} />
                <Route path="/me" element={<RequireAuth><Dashboard /></RequireAuth>} />
                <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
                <Route path="/brainstorm" element={<RequireAuth><Brainstorm /></RequireAuth>} />
                <Route path="/define" element={<RequireAuth><Define /></RequireAuth>} />
                <Route path="/classify" element={<RequireAuth><Classify /></RequireAuth>} />
                <Route path="/results" element={<RequireAuth><Results /></RequireAuth>} />
                <Route path="/brand-design" element={<RequireAuth><BrandDesign /></RequireAuth>} />
                <Route path="/community" element={<RequireAuth><Community /></RequireAuth>} />
                <Route path="/community/group/:groupId" element={<RequireAuth><GroupDetail /></RequireAuth>} />
                <Route path="/chat" element={<RequireAuth><Chat /></RequireAuth>} />
                <Route path="/admin" element={<RequireAuth><Admin /></RequireAuth>} />
                <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/signup" element={<Signup />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <BottomNav />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
