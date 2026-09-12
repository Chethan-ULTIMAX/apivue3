import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTrackedProfiles } from '@/hooks/use-profiles';

import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  CalendarDays,
  Check,
  ChevronRight,
  Code2,
  Compass,
  Database,
  GitCompareArrows,
  GraduationCap,
  Lock,
  Plus,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Zap,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/* ============================================================
 * Feature card
 * ============================================================ */

type AccentKey = 'violet' | 'blue' | 'orange' | 'emerald' | 'cyan';

const ACCENT_CLASSES: Record<
  AccentKey,
  { gradient: string; icon: string; hover: string }
> = {
  violet: {
    gradient:
      'from-violet-500/[0.12] via-violet-500/[0.03] to-transparent',
    icon: 'text-violet-600 dark:text-violet-400',
    hover: 'hover:border-violet-500/40',
  },
  blue: {
    gradient: 'from-blue-500/[0.12] via-blue-500/[0.03] to-transparent',
    icon: 'text-blue-600 dark:text-blue-400',
    hover: 'hover:border-blue-500/40',
  },
  orange: {
    gradient:
      'from-orange-500/[0.12] via-orange-500/[0.03] to-transparent',
    icon: 'text-orange-600 dark:text-orange-400',
    hover: 'hover:border-orange-500/40',
  },
  emerald: {
    gradient:
      'from-emerald-500/[0.12] via-emerald-500/[0.03] to-transparent',
    icon: 'text-emerald-600 dark:text-emerald-400',
    hover: 'hover:border-emerald-500/40',
  },
  cyan: {
    gradient: 'from-cyan-500/[0.12] via-cyan-500/[0.03] to-transparent',
    icon: 'text-cyan-600 dark:text-cyan-400',
    hover: 'hover:border-cyan-500/40',
  },
};

function FeatureCard({
  icon: Icon,
  title,
  description,
  items,
  href = '#',
  accent = 'violet',
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  items: string[];
  href?: string;
  accent?: AccentKey;
}) {
  const styles = ACCENT_CLASSES[accent];

  return (
    <Link to={href} className="group block h-full">
      <Card
        className={`relative h-full overflow-hidden border-border bg-card transition-all duration-300 hover:-translate-y-1 ${styles.hover}`}
      >
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${styles.gradient}`}
        />

        <CardContent className="relative flex h-full flex-col p-5">
          <div className="flex items-start justify-between">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted/60 ${styles.icon}`}
            >
              <Icon className="h-5 w-5" />
            </div>

            <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-muted-foreground" />
          </div>

          <h3 className="mt-5 text-base font-semibold">{title}</h3>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {description}
          </p>

          <div className="mt-5 space-y-2">
            {items.map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                {item}
              </div>
            ))}
          </div>

          <div className="mt-auto pt-6 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
            Explore capability
            <ArrowRight className="ml-1 inline h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/* ============================================================
 * Empty data card
 * ============================================================ */

function EmptyDataCard({
  icon: Icon,
  title,
  description,
  action,
  href,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action: string;
  href: string;
}) {
  return (
    <Card className="border-border bg-card/60">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/60">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-medium">{title}</h3>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {description}
            </p>

            <Link to={href}>
              <Button variant="outline" size="sm" className="mt-4">
                {action}
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================================================
 * Main
 * ============================================================ */

export function OverviewView() {
  const { data: profiles, isLoading: profilesLoading } = useTrackedProfiles();

  const connectedProfiles = useMemo(() => {
    if (!Array.isArray(profiles)) return [];
    return profiles;
  }, [profiles]);

  const connectedCount = connectedProfiles.length;
  const hasConnections = connectedCount > 0;

  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  /* ---------- Loading skeleton ---------- */

  if (profilesLoading) {
    return (
      <div className="min-h-full p-5 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="animate-pulse space-y-3">
            <div className="h-8 w-64 rounded-lg bg-muted" />
            <div className="h-4 w-96 max-w-full rounded bg-muted" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="h-48 rounded-2xl bg-muted lg:col-span-2" />
            <div className="h-48 rounded-2xl bg-muted" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="h-56 rounded-2xl bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Main render ---------- */

  return (
    <div className="relative min-h-full overflow-hidden">
      {/* Ambient background — theme-aware */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-violet-500/[0.07] blur-3xl" />
        <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-blue-500/[0.05] blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-purple-500/[0.04] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-8 p-5 sm:p-6 lg:p-8">
        {/* HEADER */}
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300"
              >
                <Sparkles className="mr-1.5 h-3 w-3" />
                Personal Intelligence
              </Badge>

              {hasConnections && (
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                >
                  <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {connectedCount} connected
                </Badge>
              )}
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Your intelligence dashboard
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              {hasConnections
                ? 'Your connected activity, progress, and insights — all in one place.'
                : 'Explore your digital activity now. Connect your platforms when you want APIVue to build your personal history.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-lg border border-border bg-card/60 px-3 py-2 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            {today}
          </div>
        </header>

        {/* HERO / CONNECTION STATUS */}
        <section>
          {!hasConnections ? (
            <Card className="relative overflow-hidden border-violet-500/30 bg-gradient-to-br from-violet-500/[0.06] via-card to-card">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-1/4 -top-3/4 h-[500px] w-[500px] rounded-full bg-violet-500/[0.08] blur-3xl"
              />

              <CardContent className="relative p-6 sm:p-8 lg:p-10">
                <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="max-w-2xl">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10">
                      <Radar className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                    </div>

                    <h2 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">
                      Your data starts here.
                    </h2>

                    <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
                      APIVue has no connected account data yet. You can still
                      explore public information and compare profiles, or
                      connect your own platforms to unlock personal history,
                      analytics, and AI guidance.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link to="/dashboard/integrations">
                        <Button className="gap-2">
                          <Plus className="h-4 w-4" />
                          Connect your first platform
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>

                      <Link to="/dashboard/explore">
                        <Button variant="outline" className="gap-2">
                          <Compass className="h-4 w-4" />
                          Explore public data
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Pipeline */}
                  <div className="w-full max-w-sm lg:w-80">
                    <div className="rounded-2xl border border-border bg-muted/40 p-5">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        APIVue pipeline
                      </p>

                      <div className="mt-5 space-y-4">
                        {[
                          {
                            icon: Database,
                            title: 'Connect data',
                            desc: 'Choose your platforms',
                          },
                          {
                            icon: BarChart3,
                            title: 'Build history',
                            desc: 'Track real activity over time',
                          },
                          {
                            icon: Brain,
                            title: 'Get intelligence',
                            desc: 'Insights based on your data',
                          },
                        ].map((step, index) => {
                          const Icon = step.icon;

                          return (
                            <div key={step.title} className="flex items-center gap-3">
                              <div className="relative">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-background">
                                  <Icon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                </div>

                                {index < 2 && (
                                  <div className="absolute left-1/2 top-full h-4 w-px -translate-x-1/2 bg-border" />
                                )}
                              </div>

                              <div>
                                <p className="text-sm font-medium">
                                  {step.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {step.desc}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.05] via-card to-card">
              <CardContent className="p-6">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                      <Database className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>

                    <div>
                      <h2 className="font-semibold">Your connected data</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {connectedCount} platform
                        {connectedCount === 1 ? '' : 's'} connected. APIVue
                        can now begin building your activity history.
                      </p>
                    </div>
                  </div>

                  <Link to="/dashboard/integrations">
                    <Button variant="outline" size="sm" className="gap-2">
                      Manage connections
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* QUICK ACTIONS */}
        <section>
          <div className="mb-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Explore
            </p>
            <h2 className="mt-1 text-lg font-semibold">
              What do you want to do?
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                href: '/dashboard/explore',
                icon: Compass,
                title: 'Explore data',
                desc: 'Analyze public profiles',
                accent: 'text-violet-600 dark:text-violet-400',
                bg: 'bg-violet-500/10',
                border: 'hover:border-violet-500/40',
              },
              {
                href: '/dashboard/compare',
                icon: GitCompareArrows,
                title: 'Compare',
                desc: 'Compare profiles or periods',
                accent: 'text-blue-600 dark:text-blue-400',
                bg: 'bg-blue-500/10',
                border: 'hover:border-blue-500/40',
              },
              {
                href: '/dashboard/analytics',
                icon: BarChart3,
                title: 'Analytics',
                desc: 'Understand your activity',
                accent: 'text-cyan-600 dark:text-cyan-400',
                bg: 'bg-cyan-500/10',
                border: 'hover:border-cyan-500/40',
              },
              {
                href: '/dashboard/ai-insights',
                icon: Brain,
                title: 'AI insights',
                desc: 'Understand what to do next',
                accent: 'text-orange-600 dark:text-orange-400',
                bg: 'bg-orange-500/10',
                border: 'hover:border-orange-500/40',
              },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} to={action.href} className="group">
                  <Card
                    className={`border-border bg-card transition-all duration-300 ${action.border}`}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${action.bg}`}
                      >
                        <Icon className={`h-5 w-5 ${action.accent}`} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{action.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {action.desc}
                        </p>
                      </div>

                      <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-1" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* WHAT APIVUE CAN ANALYZE */}
        <section>
          <div className="mb-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Your digital journey
            </p>
            <h2 className="mt-1 text-xl font-semibold">
              What APIVue can understand
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Connect the platforms that matter to you. APIVue turns activity
              from different places into one understandable picture.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={Code2}
              title="Development"
              description="Understand your software development activity."
              items={[
                'Commits and repositories',
                'Pull requests and contributions',
                'Development trends',
              ]}
              href="/dashboard/progress"
              accent="blue"
            />
            <FeatureCard
              icon={Activity}
              title="DSA / Competitive Programming"
              description="Track your problem-solving journey."
              items={[
                'Problems and difficulty',
                'Contest activity',
                'Progress over time',
              ]}
              href="/dashboard/progress"
              accent="orange"
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Cybersecurity"
              description="Bring your security-learning activity together."
              items={[
                'Labs and challenges',
                'Security learning activity',
                'Long-term progress',
              ]}
              href="/dashboard/progress"
              accent="emerald"
            />
            <FeatureCard
              icon={GraduationCap}
              title="Learning"
              description="Understand how your learning activity changes."
              items={[
                'Courses and lessons',
                'Learning consistency',
                'Learning trends',
              ]}
              href="/dashboard/progress"
              accent="violet"
            />
            <FeatureCard
              icon={Target}
              title="Goals"
              description="Turn your ambitions into measurable progress."
              items={[
                'Create personal goals',
                'Track milestones',
                'Measure progress',
              ]}
              href="/dashboard/goals"
              accent="cyan"
            />
            <FeatureCard
              icon={Users}
              title="Social comparison"
              description="Compare progress with people who choose to share."
              items={[
                'Compare public profiles',
                'Compare with friends',
                'Shared progress views',
              ]}
              href="/dashboard/compare"
              accent="violet"
            />
          </div>
        </section>

        {/* INTELLIGENCE LAYER */}
        <section>
          <div className="mb-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Intelligence layer
            </p>
            <h2 className="mt-1 text-xl font-semibold">
              From activity to understanding
            </h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <EmptyDataCard
              icon={BarChart3}
              title="Personal analytics"
              description={
                hasConnections
                  ? 'Your connected platforms are ready to contribute to your activity history. Analytics will grow as APIVue collects real data.'
                  : 'Daily, weekly, and monthly analytics become meaningful once APIVue has real activity history from your connected platforms.'
              }
              action={hasConnections ? 'View analytics' : 'Learn about analytics'}
              href="/dashboard/analytics"
            />
            <EmptyDataCard
              icon={GitCompareArrows}
              title="Compare your progress"
              description="Compare yourself across different periods, analyze public profiles, or compare with friends who explicitly choose to share their data."
              action="Open comparison"
              href="/dashboard/compare"
            />
            <EmptyDataCard
              icon={Brain}
              title="AI intelligence"
              description={
                hasConnections
                  ? 'As real history accumulates, APIVue can use it to identify patterns and generate useful recommendations.'
                  : 'AI recommendations should come from your real activity history — not invented numbers or assumptions.'
              }
              action="Explore AI insights"
              href="/dashboard/ai-insights"
            />
          </div>
        </section>

        {/* ACTIVITY / GOALS */}
        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border bg-card/60">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60">
                  <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="font-semibold">Recent activity</h2>
                  <p className="text-xs text-muted-foreground">
                    Real events from your connected sources
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
                <Activity className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <h3 className="mt-3 text-sm font-medium">
                  {hasConnections
                    ? 'Your activity history is being built'
                    : 'No activity connected yet'}
                </h3>
                <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-muted-foreground">
                  {hasConnections
                    ? 'Once APIVue receives activity from your connected platforms, real events will appear here.'
                    : 'Connect a platform to let APIVue collect the activity you authorize and build your personal history.'}
                </p>
                <Link to="/dashboard/integrations">
                  <Button variant="outline" size="sm" className="mt-4">
                    {hasConnections ? 'Manage data sources' : 'Connect a platform'}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/60">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60">
                  <Target className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <h2 className="font-semibold">Goals</h2>
                  <p className="text-xs text-muted-foreground">
                    Define what you want APIVue to help you achieve
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
                <Target className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <h3 className="mt-3 text-sm font-medium">
                  Create your first goal
                </h3>
                <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-muted-foreground">
                  Goals can start manually and become automatically
                  measurable when connected platform data is available.
                </p>
                <Link to="/dashboard/goals">
                  <Button variant="outline" size="sm" className="mt-4">
                    Create a goal
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* PRIVACY */}
        <Card className="overflow-hidden border-border bg-card/60">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                <Lock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="font-medium">
                  Your connected data should stay yours.
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  APIVue should only access the information you authorize.
                  Private data must be protected by the platform
                  architecture, with clear controls over what is stored,
                  analyzed, and shared.
                </p>
              </div>

              <Link to="/dashboard/integrations">
                <Button variant="ghost" size="sm" className="shrink-0 gap-2">
                  Privacy & connections
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* FOOTER */}
        <div className="flex flex-col gap-3 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
            <span>APIVue intelligence is powered by your actual data.</span>
          </div>

          <Link
            to="/dashboard/integrations"
            className="transition-colors hover:text-foreground"
          >
            Manage data sources
            <ArrowRight className="ml-1 inline h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}