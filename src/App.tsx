import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-context';

/* ------------------------------------------------------------
 * Feature views (protected)
 * ------------------------------------------------------------ */

import { OverviewView } from '@/features/overview/OverviewView';
import { ProfilesView } from '@/features/profiles/ProfilesView';
import { ProfileDetailView } from '@/features/profiles/ProfileDetailView';
import { ProgressView } from '@/features/progress/ProgressView';
import { ExploreView } from '@/features/explore/ExploreView';
import { CompareView } from '@/features/compare/CompareView';
import { AnalyzeView } from '@/features/analyze/AnalyzeView';
import { IntegrationsView } from '@/features/integrations/IntegrationsView';
import { AIInsightsView } from '@/features/ai-insights/AIInsightsView';
import { GoalsView } from '@/features/goals/GoalsView';

/* ------------------------------------------------------------
 * Public pages
 * ------------------------------------------------------------ */

import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { OAuthConsent } from '@/pages/OAuthConsent';
import { NotFound } from '@/pages/NotFound';
import { LandingPage } from '@/pages/LandingPage';

/* ------------------------------------------------------------
 * React Router basename
 *
 * Vite's `BASE_URL` always has a trailing slash ("/" or
 * "/apivue3/"). React Router's `basename` must NOT have a trailing
 * slash (except for "/"). This transformation works for any base
 * path, without hardcoding a specific deployment.
 * ------------------------------------------------------------ */

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reasonable defaults for a dashboard: data is fresh for 30s,
      // retries twice on network failures, does not refetch on focus
      // (avoids surprising the user mid-read).
      staleTime: 30_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter basename={basename}>
            <Routes>
              {/* =================================================
                  PUBLIC
              ================================================== */}

              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/*
                Legacy route from a previous auth provider.
                Kept so old bookmarks resolve cleanly — the page
                redirects to /login.
              */}
              <Route path="/oauth-consent" element={<OAuthConsent />} />

              {/* =================================================
                  PROTECTED DASHBOARD
              ================================================== */}

              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<OverviewView />} />

                  <Route path="profiles" element={<ProfilesView />} />
                  <Route path="profile/:id" element={<ProfileDetailView />} />

                  <Route path="progress" element={<ProgressView />} />

                  <Route path="explore" element={<ExploreView />} />
                  <Route path="compare" element={<CompareView />} />
                  <Route path="analytics" element={<AnalyzeView />} />

                  <Route path="integrations" element={<IntegrationsView />} />
                  <Route path="ai-insights" element={<AIInsightsView />} />
                  <Route path="goals" element={<GoalsView />} />
                </Route>
              </Route>

              {/* =================================================
                  404
              ================================================== */}

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;