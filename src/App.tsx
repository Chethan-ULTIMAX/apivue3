import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-context';

// APIVue feature views (protected)
import { OverviewView } from '@/features/overview/OverviewView';
import { ProfilesView } from '@/features/profiles/ProfilesView';
import { ProfileDetailView } from '@/features/profiles/ProfileDetailView';
import { ProgressView } from '@/features/progress/ProgressView';
import { AnalyticsView } from '@/features/progress/AnalyticsView';
import { IntegrationsView } from '@/features/integrations/IntegrationsView';
import { AIInsightsView } from '@/features/ai-insights/AIInsightsView';
import { GoalsView } from '@/features/goals/GoalsView';

// Auth pages
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { OAuthConsent } from '@/pages/OAuthConsent';
import { NotFound } from '@/pages/NotFound';

// Landing page (public)
import { LandingPage } from '@/pages/LandingPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/oauth-consent" element={<OAuthConsent />} />

              {/* Protected dashboard routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<OverviewView />} />
                  <Route path="profiles" element={<ProfilesView />} />
                  <Route path="profile/:id" element={<ProfileDetailView />} />
                  <Route path="progress" element={<ProgressView />} />
                  <Route path="analytics" element={<AnalyticsView />} />
                  <Route path="integrations" element={<IntegrationsView />} />
                  <Route path="ai-insights" element={<AIInsightsView />} />
                  <Route path="goals" element={<GoalsView />} />
                </Route>
              </Route>

              {/* Redirect /dashboard to / (or handle any old dashboard references) */}
              <Route path="/dashboard" element={<Navigate to="/" replace />} />

              {/* Catch-all 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;