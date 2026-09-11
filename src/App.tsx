import { BrowserRouter, Routes, Route } from 'react-router-dom';

import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-context';

// APIVue feature views
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

// Auth pages
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { OAuthConsent } from '@/pages/OAuthConsent';
import { NotFound } from '@/pages/NotFound';

// Landing page
import { LandingPage } from '@/pages/LandingPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL === '/apivue3/' ? '/apivue3' : undefined}>
            <Routes>

              {/* =================================================
                  PUBLIC ROUTES
              ================================================== */}

              <Route
                path="/"
                element={<LandingPage />}
              />

              <Route
                path="/login"
                element={<LoginPage />}
              />

              <Route
                path="/signup"
                element={<SignupPage />}
              />

              <Route
                path="/forgot-password"
                element={<ForgotPasswordPage />}
              />

              <Route path="/reset-password" element={<ForgotPasswordPage />} />

              <Route
                path="/oauth-consent"
                element={<OAuthConsent />}
              />

              {/* =================================================
                  PROTECTED DASHBOARD
              ================================================== */}

              <Route element={<ProtectedRoute />}>

                <Route
                  path="/dashboard"
                  element={<DashboardLayout />}
                >

                  {/* Dashboard home */}
                  <Route
                    index
                    element={<OverviewView />}
                  />

                  {/* Profiles */}
                  <Route
                    path="profiles"
                    element={<ProfilesView />}
                  />

                  <Route
                    path="profile/:id"
                    element={<ProfileDetailView />}
                  />

                  {/* Progress */}
                  <Route
                    path="progress"
                    element={<ProgressView />}
                  />

                  {/* Public Explore */}
                  <Route
                    path="explore"
                    element={<ExploreView />}
                  />

                  {/* Compare */}
                  <Route
                    path="compare"
                    element={<CompareView />}
                  />

                  {/* Analytics */}
                  <Route
                    path="analytics"
                    element={<AnalyzeView />}
                  />

                  {/* Integrations */}
                  <Route
                    path="integrations"
                    element={<IntegrationsView />}
                  />

                  {/* AI */}
                  <Route
                    path="ai-insights"
                    element={<AIInsightsView />}
                  />

                  {/* Goals */}
                  <Route
                    path="goals"
                    element={<GoalsView />}
                  />

                </Route>

              </Route>

              {/* =================================================
                  404
              ================================================== */}

              <Route
                path="*"
                element={<NotFound />}
              />

            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;