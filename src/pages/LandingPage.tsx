import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/lib/theme-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  BarChart3,
  Brain,
  Check,
  ChevronLeft,
  ChevronRight,
  Code2,
  ExternalLink,
  Github,
  GitPullRequest,
  GraduationCap,
  Lock,
  Menu,
  Moon,
  Network,
  Radar,
  Rocket,
  Shield,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  X,
  Zap,
  Activity,
  FolderKanban,
  Terminal,
  BookOpen,
  Trophy,
} from 'lucide-react';

/* =========================================================
   SCROLL REVEAL
========================================================= */

const useReveal = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.12,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return {
    ref,
    className: `transition-all duration-700 ease-out ${
      visible
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 translate-y-8'
    }`,
  };
};

const useCursorMotion = () => {
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = () => setReducedMotion(motionQuery.matches);
    const handleMove = (event: MouseEvent) => {
      if (!motionQuery.matches) {
        setCursor({ x: event.clientX, y: event.clientY });
      }
    };

    updateMotionPreference();
    window.addEventListener('mousemove', handleMove, { passive: true });
    motionQuery.addEventListener('change', updateMotionPreference);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      motionQuery.removeEventListener('change', updateMotionPreference);
    };
  }, []);

  return { cursor, reducedMotion };
};

/* =========================================================
   DATA
========================================================= */

const integrations = [
  {
    name: 'GitHub',
    short: 'GH',
    description: 'Repositories, commits, PRs',
    icon: Github,
  },
  {
    name: 'LeetCode',
    short: 'LC',
    description: 'Problems, streaks, difficulty',
    icon: Code2,
  },
  {
    name: 'Codeforces',
    short: 'CF',
    description: 'Contests, rating, problems',
    icon: Trophy,
  },
  {
    name: 'CodeChef',
    short: 'CC',
    description: 'Contests and problem solving',
    icon: Code2,
  },
  {
    name: 'GeeksForGeeks',
    short: 'GFG',
    description: 'Practice and learning',
    icon: BookOpen,
  },
  {
    name: 'AtCoder',
    short: 'AC',
    description: 'Competitive programming',
    icon: Terminal,
  },
  {
    name: 'Codewars',
    short: 'CW',
    description: 'Kata and practice',
    icon: Zap,
  },
  {
    name: 'PortSwigger',
    short: 'PS',
    description: 'Web security labs',
    icon: Shield,
  },
];

const areas = [
  {
    icon: Code2,
    title: 'Development',
    description:
      'Understand your coding activity, repositories, commits, pull requests and development consistency.',
    metric: 'GitHub',
  },
  {
    icon: Trophy,
    title: 'DSA & CP',
    description:
      'Bring competitive programming activity together and understand difficulty, topics, contests and consistency.',
    metric: 'LeetCode · CF · CC',
  },
  {
    icon: Shield,
    title: 'Cybersecurity',
    description:
      'Track security labs, CTFs, learning progress and the security work you are actually doing.',
    metric: 'Labs · CTFs',
  },
  {
    icon: GraduationCap,
    title: 'Learning',
    description:
      'Track courses, lessons and learning activity instead of leaving your progress scattered across platforms.',
    metric: 'Courses · Lessons',
  },
  {
    icon: FolderKanban,
    title: 'Projects',
    description:
      'Keep your projects visible and connect the work you do with the progress you are making.',
    metric: 'Build · Ship',
  },
  {
    icon: Target,
    title: 'Goals',
    description:
      'Turn your long-term goals into measurable progress and let APIVue help you decide what comes next.',
    metric: 'Goals · Plans',
  },
];

const demoSteps = [
  {
    title: 'One place for your entire journey',
    description:
      'APIVue brings activity from your connected platforms into one progress view instead of forcing you to jump between tabs.',
    highlight: 'Overview',
  },
  {
    title: 'See where your effort is going',
    description:
      'Compare development, DSA, cybersecurity, learning and projects to understand which areas are growing and which are being neglected.',
    highlight: 'Progress',
  },
  {
    title: 'Look beyond today',
    description:
      'Historical snapshots let APIVue detect trends instead of showing only your current numbers.',
    highlight: 'History',
  },
  {
    title: 'Understand your activity',
    description:
      'Activity streams connect things you have actually done across your platforms into a single timeline.',
    highlight: 'Activity',
  },
  {
    title: 'Let AI explain the data',
    description:
      'The AI layer uses APIVue analytics and history to turn raw numbers into useful observations and recommendations.',
    highlight: 'AI Insights',
  },
  {
    title: 'Know what to do next',
    description:
      'Instead of another dashboard that simply shows statistics, APIVue is designed to help you decide your next action.',
    highlight: 'Next Step',
  },
];

/* =========================================================
   BACKGROUND
========================================================= */

const Background = () => {
  const { cursor, reducedMotion } = useCursorMotion();

  return (
    <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden">
      <style>{`@keyframes ambientDrift { 0%, 100% { transform: translate3d(-8%, -4%, 0) scale(1); } 50% { transform: translate3d(8%, 5%, 0) scale(1.08); } } @media (prefers-reduced-motion: reduce) { .apivue-ambient { animation: none !important; } }`}</style>
      {/* Base */}
      <div className="absolute inset-0 bg-[#080a0f]" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Top glow */}
      <div className="absolute left-1/2 top-[-300px] h-[650px] w-[900px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[130px]" />

      {/* Purple glow */}
      <div className="absolute left-[-250px] top-[35%] h-[500px] w-[500px] rounded-full bg-indigo-600/[0.07] blur-[120px]" />

      {/* Orange glow */}
      <div className="absolute right-[-250px] top-[55%] h-[500px] w-[500px] rounded-full bg-orange-500/[0.05] blur-[120px]" />

      <div
        className="absolute h-[420px] w-[420px] rounded-full bg-violet-400/[0.045] blur-[110px] transition-transform ease-out motion-reduce:transition-none"
        style={reducedMotion ? undefined : { transform: `translate(${cursor.x * 0.035 - 150}px, ${cursor.y * 0.035 - 150}px)`, transitionDuration: '1.8s' }}
      />
      <div className="apivue-ambient absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/[0.025] blur-[100px] animate-[ambientDrift_18s_ease-in-out_infinite]" />
    </div>
  );
};

const CursorGlow = () => {
  const { cursor, reducedMotion } = useCursorMotion();

  if (reducedMotion) return null;

  return (
    <>
      {/* Main cursor aura */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-10 hidden md:block"
        style={{
          background: `
            radial-gradient(
              140px circle at ${cursor.x}px ${cursor.y}px,
              rgba(124, 58, 237, 0.10),
              rgba(99, 102, 241, 0.045) 30%,
              rgba(56, 189, 248, 0.018) 48%,
              transparent 72%
            )
          `,
          transition: "background 120ms ease-out",
        }}
      />

      {/* Soft outer diffusion */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-10 hidden md:block"
        style={{
          background: `
            radial-gradient(
              240px circle at ${cursor.x}px ${cursor.y}px,
              rgba(139, 92, 246, 0.035),
              transparent 68%
            )
          `,
          filter: "blur(18px)",
          transition: "background 180ms ease-out",
        }}
      />

      {/* Small cursor core */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed hidden md:block"
        style={{
          left: cursor.x,
          top: cursor.y,
          width: "10px",
          height: "10px",
          transform: "translate(-50%, -50%)",
          borderRadius: "9999px",
          background:
            "radial-gradient(circle, rgba(196,181,253,0.8) 0%, rgba(139,92,246,0.28) 45%, transparent 75%)",
          filter: "blur(2px)",
          boxShadow:
            "0 0 14px rgba(139,92,246,0.25), 0 0 28px rgba(99,102,241,0.12)",
          transition:
            "left 70ms ease-out, top 70ms ease-out, opacity 200ms ease-out",
        }}
      />
    </>
  );
};

const CursorCard = ({
  children,
  className = '',
  style: externalStyle,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const element = ref.current;

    if (
      !element ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const rect = element.getBoundingClientRect();

    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    setStyle({
      transform: `perspective(900px) translateY(-3px) rotateX(${y * -2}deg) rotateY(${x * 2}deg)`,
    });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={() => setStyle({})}
      className={`group relative transition-[transform,box-shadow,border-color,background-color] duration-500 ease-out ${className}`}
      style={{ ...externalStyle, ...style }}
    >
      <div className="pointer-events-none absolute -inset-px rounded-[inherit] bg-gradient-to-br from-violet-400/0 via-violet-400/0 to-cyan-300/0 opacity-0 blur-xl transition-opacity duration-500 group-hover:from-violet-400/20 group-hover:via-violet-400/5 group-hover:to-cyan-300/15 group-hover:opacity-100" />

      <div className="relative h-full">
        {children}
      </div>
    </div>
  );
};

/* =========================================================
   LOGO
========================================================= */

const Logo = () => {
  return (
    <Link
      to="/"
      className="group flex items-center gap-2.5"
    >
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10">
        <img src="/favicon.ico" alt="APIVue" className="h-7 w-7 object-contain transition-transform duration-300 group-hover:scale-110" />
      </div>

      <span className="text-xl font-bold tracking-tight">
        API<span className="text-violet-400">Vue</span>
      </span>
    </Link>
  );
};

/* =========================================================
   NAVBAR
========================================================= */

const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#080a0f]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#platform"
            className="text-sm text-zinc-400 transition-colors hover:text-white"
          >
            Platform
          </a>

          <a
            href="#integrations"
            className="text-sm text-zinc-400 transition-colors hover:text-white"
          >
            Integrations
          </a>

          <a
            href="#intelligence"
            className="text-sm text-zinc-400 transition-colors hover:text-white"
          >
            Intelligence
          </a>

          <a
            href="#how-it-works"
            className="text-sm text-zinc-400 transition-colors hover:text-white"
          >
            How it works
          </a>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setTheme(theme === 'dark' ? 'light' : 'dark')
            }
            className="rounded-lg text-zinc-400 hover:bg-white/[0.06] hover:text-white"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          <Link to="/login">
            <Button
              variant="ghost"
              className="text-zinc-300 hover:bg-white/[0.06] hover:text-white"
            >
              Sign in
            </Button>
          </Link>

          <Link to="/signup">
            <Button className="bg-white text-black transition-[transform,box-shadow] duration-300 hover:scale-[1.02] hover:bg-zinc-200 hover:shadow-lg hover:shadow-white/10">
              Get started
            </Button>
          </Link>
        </div>

        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/[0.06] bg-[#080a0f] px-5 py-5 md:hidden">
          <div className="flex flex-col gap-4">
            <a href="#platform" onClick={() => setMobileOpen(false)}>
              Platform
            </a>

            <a href="#integrations" onClick={() => setMobileOpen(false)}>
              Integrations
            </a>

            <a href="#intelligence" onClick={() => setMobileOpen(false)}>
              Intelligence
            </a>

            <a href="#how-it-works" onClick={() => setMobileOpen(false)}>
              How it works
            </a>

            <Link to="/login">
              <Button variant="outline" className="w-full">
                Sign in
              </Button>
            </Link>

            <Link to="/signup">
              <Button className="w-full">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

/* =========================================================
   DASHBOARD PREVIEW
========================================================= */

const DashboardPreview = () => {
  return (
    <div className="relative mx-auto w-full max-w-[650px]">
      {/* Outer glow */}
      <div className="absolute -inset-10 rounded-[32px] bg-violet-500/[0.08] blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.10] bg-[#0d1117] shadow-2xl shadow-black/50">
        {/* Browser header */}
        <div className="flex h-11 items-center justify-between border-b border-white/[0.06] bg-[#10141b] px-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
          </div>

          <div className="rounded-md border border-white/[0.05] bg-white/[0.03] px-20 py-1 text-[9px] text-zinc-600">
            app.apivue.dev
          </div>

          <div className="h-4 w-4" />
        </div>

        <div className="relative p-5">
          {/* Fake sidebar */}
          <div className="absolute bottom-0 left-0 top-0 hidden w-40 border-r border-white/[0.05] bg-[#0b0f14] p-4 sm:block">
            <div className="mb-7 flex items-center gap-2">
              <div className="h-5 w-5 rounded bg-violet-500/20" />
              <div className="h-2 w-12 rounded bg-white/10" />
            </div>

            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className={`h-7 rounded-md ${
                    item === 1
                      ? 'bg-violet-500/10'
                      : 'bg-white/[0.025]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Fake dashboard */}
          <div className="sm:ml-40">
            <div className="mb-5">
              <div className="h-5 w-28 rounded bg-white/10" />
              <div className="mt-2 h-2 w-48 rounded bg-white/[0.05]" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {[
                ['Development', '247'],
                ['DSA / CP', '134'],
                ['Security', '18'],
                ['Learning', '36'],
                ['Projects', '5'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border border-white/[0.05] bg-white/[0.025] p-2.5"
                >
                  <div className="text-[7px] uppercase tracking-wide text-zinc-600">
                    {label}
                  </div>

                  <div className="mt-1 text-sm font-bold text-zinc-400">
                    {value}
                  </div>

                  <div className="mt-1 h-1 w-8 rounded bg-emerald-500/30" />
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div className="col-span-2 h-40 rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
                <div className="h-2 w-24 rounded bg-white/[0.08]" />

                <div className="mt-7 flex h-20 items-end gap-2">
                  {[35, 48, 42, 62, 54, 72, 65, 82].map(
                    (height, index) => (
                      <div
                        key={index}
                        className="flex-1 rounded-t bg-violet-500/25"
                        style={{ height: `${height}%` }}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="h-40 rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
                <div className="h-2 w-20 rounded bg-white/[0.08]" />

                <div className="mt-6 flex justify-center">
                  <div className="h-20 w-20 rounded-full border-[12px] border-emerald-500/25 border-r-orange-400/30 border-t-red-500/20" />
                </div>
              </div>
            </div>

            {/* Activity */}
            <div className="mt-3 h-24 rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
              <div className="mb-3 h-2 w-24 rounded bg-white/[0.08]" />

              <div className="space-y-2">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2"
                  >
                    <div className="h-2 w-2 rounded-full bg-violet-400/50" />
                    <div className="h-1.5 w-40 rounded bg-white/[0.06]" />
                    <div className="ml-auto h-1.5 w-10 rounded bg-white/[0.04]" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Lock overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-[#080a0f]/35 backdrop-blur-[2px]">
            <div className="mx-5 rounded-2xl border border-white/[0.10] bg-[#0d1117]/95 p-6 text-center shadow-2xl">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10">
                <Lock className="h-5 w-5 text-violet-400" />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-white">
                Your personal dashboard
              </h3>

              <p className="mt-1 max-w-xs text-xs leading-relaxed text-zinc-500">
                Connect your accounts to unlock your real progress,
                history and AI insights.
              </p>

              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-zinc-600">
                <Shield className="h-3 w-3" />
                Your data stays private
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   DEMO MODAL
========================================================= */

const DemoModal = ({
  step,
  setStep,
  onClose,
}: {
  step: number;
  setStep: (step: number) => void;
  onClose: () => void;
}) => {
  const current = demoSteps[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-white/[0.10] bg-[#0c1016] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-400" />
            <span className="text-sm font-medium">
              APIVue interactive tour
            </span>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/[0.05] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid md:grid-cols-[1.5fr_1fr]">
          {/* Preview */}
          <div className="relative min-h-[360px] border-b border-white/[0.06] bg-[#080a0f] p-5 md:border-b-0 md:border-r">
            <div className="absolute inset-0 opacity-[0.035]">
              <div
                className="h-full w-full"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)',
                  backgroundSize: '35px 35px',
                }}
              />
            </div>

            <div className="relative h-full overflow-hidden rounded-xl border border-white/[0.08] bg-[#0d1117]">
              <div className="flex h-9 items-center gap-1.5 border-b border-white/[0.06] px-3">
                <span className="h-2 w-2 rounded-full bg-red-500/60" />
                <span className="h-2 w-2 rounded-full bg-yellow-500/60" />
                <span className="h-2 w-2 rounded-full bg-green-500/60" />
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold">
                      {current.highlight}
                    </div>
                    <div className="mt-1 text-xs text-zinc-600">
                      APIVue personal intelligence
                    </div>
                  </div>

                  <div className="rounded-md border border-white/[0.06] px-3 py-1.5 text-[10px] text-zinc-500">
                    Apr 7, 2026
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[
                    ['Development', '247'],
                    ['DSA / CP', '134'],
                    ['Security', '18'],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-lg border border-white/[0.06] bg-white/[0.025] p-3"
                    >
                      <div className="text-[9px] text-zinc-600">
                        {label}
                      </div>
                      <div className="mt-1 text-xl font-bold">
                        {value}
                      </div>
                      <div className="mt-1 text-[9px] text-emerald-500">
                        +8.4%
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 h-36 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <div className="text-[10px] text-zinc-500">
                    Activity over time
                  </div>

                  <div className="mt-5 flex h-20 items-end gap-2">
                    {[30, 45, 38, 56, 48, 70, 62, 78, 72].map(
                      (height, i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-t transition-all duration-500 ${
                            i === step + 1
                              ? 'bg-violet-400/70'
                              : 'bg-violet-500/15'
                          }`}
                          style={{ height: `${height}%` }}
                        />
                      )
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="h-16 rounded-lg border border-white/[0.06] bg-white/[0.02]" />
                  <div className="h-16 rounded-lg border border-white/[0.06] bg-white/[0.02]" />
                </div>
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="flex flex-col justify-between p-6 md:p-8">
            <div>
              <div className="text-xs font-medium text-violet-400">
                STEP {step + 1} / {demoSteps.length}
              </div>

              <h2 className="mt-4 text-2xl font-bold tracking-tight">
                {current.title}
              </h2>

              <p className="mt-4 text-sm leading-7 text-zinc-400">
                {current.description}
              </p>

              <div className="mt-7 rounded-xl border border-violet-500/15 bg-violet-500/[0.05] p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-violet-300">
                  <Radar className="h-4 w-4" />
                  What APIVue does
                </div>

                <p className="mt-2 text-xs leading-6 text-zinc-500">
                  It turns activity from your connected sources into
                  structured data, historical analytics and personalized
                  guidance.
                </p>
              </div>
            </div>

            <div className="mt-8">
              {/* Progress */}
              <div className="mb-5 flex gap-1.5">
                {demoSteps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setStep(index)}
                    className={`h-1.5 flex-1 rounded-full transition ${
                      index === step
                        ? 'bg-violet-400'
                        : 'bg-white/[0.08]'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() =>
                    setStep(Math.max(0, step - 1))
                  }
                  disabled={step === 0}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>

                {step === demoSteps.length - 1 ? (
                  <Link to="/signup">
                    <Button className="gap-2 transition-[transform,box-shadow] duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-violet-500/10">
                      Start with APIVue
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    onClick={() =>
                      setStep(
                        Math.min(
                          demoSteps.length - 1,
                          step + 1
                        )
                      )
                    }
                    className="gap-2 transition-[transform,box-shadow] duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-violet-500/10"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   HERO
========================================================= */

const Hero = ({
  onDemo,
}: {
  onDemo: () => void;
}) => {
  const reveal = useReveal();

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 pb-24 pt-20 lg:px-8 lg:pb-32 lg:pt-28">
        <div
          ref={reveal.ref}
          className={`${reveal.className} grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]`}
        >
          {/* ==================== LEFT: HERO CONTENT ==================== */}
          <div>
            <Badge
              variant="outline"
              className="border-violet-500/20 bg-violet-500/[0.06] px-3 py-1 text-violet-300"
            >
              <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
              Personal Progress Intelligence
            </Badge>

            <h1 className="mt-7 max-w-3xl text-5xl font-bold leading-[1.05] tracking-[-0.04em] text-white sm:text-6xl lg:text-[68px]">
              Your work.
              <br />

              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-orange-300 bg-clip-text text-transparent">
                One intelligence layer.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-zinc-400 sm:text-lg">
              APIVue brings your development, DSA, cybersecurity,
              learning and project activity together — then turns
              your history into insights about where you are and
              what you should do next.
            </p>

            {/* ==================== ACTION BUTTONS ==================== */}
            <div className="mt-9 flex flex-wrap gap-3">
              {/* Start Tracking */}
              <Link to="/signup">
                <Button
                  size="lg"
                  className="
                    h-12 gap-2
                    bg-white
                    px-6
                    text-black
                    transition-[transform,box-shadow]
                    duration-300
                    hover:scale-[1.02]
                    hover:bg-zinc-200
                    hover:shadow-lg
                    hover:shadow-white/10
                  "
                >
                  Start tracking

                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>

              {/* Interactive Demo */}
              <Button
                size="lg"
                variant="outline"
                onClick={onDemo}
                className="
                  group
                  relative
                  h-12
                  gap-2
                  overflow-hidden
                  border-white/[0.10]
                  bg-white/[0.02]
                  px-6
                  transition-[transform,box-shadow,background-color]
                  duration-300
                  hover:scale-[1.02]
                  hover:bg-white/[0.06]
                  hover:shadow-lg
                  hover:shadow-violet-500/10
                "
              >
                {/* Periodic diagonal shine */}
                <span
                  aria-hidden="true"
                  className="
                    pointer-events-none
                    absolute
                    inset-0
                    -translate-x-[130%]
                    skew-x-[-20deg]
                    bg-gradient-to-r
                    from-transparent
                    via-white/30
                    to-transparent
                    animate-demo-shine
                  "
                />

                {/* Soft hover glow */}
                <span
                  aria-hidden="true"
                  className="
                    pointer-events-none
                    absolute
                    inset-0
                    rounded-[inherit]
                    opacity-0
                    shadow-[inset_0_0_18px_rgba(139,92,246,0.12)]
                    transition-opacity
                    duration-300
                    group-hover:opacity-100
                  "
                />

                {/* Icon */}
                <Sparkles
                  className="
                    relative
                    z-10
                    h-4
                    w-4
                    text-violet-400
                    transition-transform
                    duration-300
                    group-hover:rotate-12
                    group-hover:scale-110
                  "
                />

                {/* Text */}
                <span className="relative z-10">
                  See interactive demo
                </span>
              </Button>
            </div>

            {/* ==================== TRUST POINTS ==================== */}
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs text-zinc-500">
              <span className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Free beta
              </span>

              <span className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Open source
              </span>

              <span className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Privacy first
              </span>
            </div>
          </div>

          {/* ==================== RIGHT: DASHBOARD PREVIEW ==================== */}
          <div>
            <CursorCard className="rounded-[1rem]">
              <DashboardPreview />
            </CursorCard>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-zinc-600">
              <Lock className="h-3 w-3" />
              Dashboard data is only available after authentication
            </div>
          </div>
        </div>
      </div>

      {/* ==================== BOTTOM FADE ==================== */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#080a0f] to-transparent" />
    </section>
  );
};

/* =========================================================
   INTEGRATIONS
========================================================= */

const Integrations = () => {
  const reveal = useReveal();

  return (
    <section
      id="integrations"
      className="border-y border-white/[0.06] bg-white/[0.015]"
    >
      <div
        ref={reveal.ref}
        className={`${reveal.className} mx-auto max-w-7xl px-5 py-20 lg:px-8`}
      >
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">
            Connect your ecosystem
          </p>

          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Your tools already contain the data.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-500">
            APIVue is designed to bring the activity you already
            create across your favourite platforms into one place.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {integrations.map((item, index) => {
            const Icon = item.icon;

            return (
              <CursorCard
                key={item.name}
                className="rounded-xl border border-white/[0.06] bg-[#0d1117]/70 p-4 text-center shadow-lg shadow-black/10 backdrop-blur-md hover:border-violet-300/25 hover:bg-violet-500/[0.06] hover:shadow-violet-500/10"
                style={{
                  transitionDelay: `${index * 40}ms`,
                }}
              >
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.025]">
                  <Icon className="h-5 w-5 text-zinc-500 transition-colors group-hover:text-violet-400" />
                </div>

                <div className="mt-3 text-xs font-medium text-zinc-300">
                  {item.name}
                </div>

                <div className="mt-1 hidden text-[9px] leading-4 text-zinc-600 lg:block">
                  {item.description}
                </div>
              </CursorCard>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* =========================================================
   PLATFORM AREAS
========================================================= */

const Platform = () => {
  const reveal = useReveal();

  return (
    <section id="platform">
      <div
        ref={reveal.ref}
        className={`${reveal.className} mx-auto max-w-7xl px-5 py-24 lg:px-8`}
      >
        <div className="grid gap-14 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <Badge
              variant="outline"
              className="border-violet-500/20 text-violet-400"
            >
              The platform
            </Badge>

            <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              More than another
              <br />
              statistics dashboard.
            </h2>

            <p className="mt-5 max-w-md text-sm leading-7 text-zinc-500">
              Most platforms show you what happened on that
              platform. APIVue is designed to understand the
              bigger picture.
            </p>

            <div className="mt-8 rounded-xl border border-violet-500/10 bg-violet-500/[0.03] p-5">
              <div className="flex items-start gap-3">
                <Network className="mt-0.5 h-5 w-5 shrink-0 text-violet-400" />

                <div>
                  <div className="text-sm font-semibold">
                    Data → History → Intelligence
                  </div>

                  <p className="mt-2 text-xs leading-6 text-zinc-500">
                    APIVue is built around your activity over
                    time, not just today's snapshot.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {areas.map((area) => {
              const Icon = area.icon;

              return (
                <CursorCard
                  key={area.title}
                  className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/70 p-6 shadow-xl shadow-black/10 backdrop-blur-md hover:border-violet-300/25 hover:bg-violet-500/[0.05] hover:shadow-violet-500/10"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04]">
                      <Icon className="h-5 w-5 text-violet-400" />
                    </div>

                    <span className="rounded-md bg-white/[0.03] px-2 py-1 text-[9px] text-zinc-600">
                      {area.metric}
                    </span>
                  </div>

                  <h3 className="mt-5 text-base font-semibold">
                    {area.title}
                  </h3>

                  <p className="mt-2 text-xs leading-6 text-zinc-500">
                    {area.description}
                  </p>
                </CursorCard>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

/* =========================================================
   INTELLIGENCE
========================================================= */

const Intelligence = () => {
  const reveal = useReveal();

  const items = [
    {
      icon: TrendingUp,
      number: '01',
      title: 'Historical intelligence',
      description:
        'A single number tells you where you are. History tells you whether you are actually improving.',
    },
    {
      icon: Radar,
      number: '02',
      title: 'Cross-domain patterns',
      description:
        'See relationships between areas instead of treating every activity source as an isolated statistic.',
    },
    {
      icon: Brain,
      number: '03',
      title: 'AI guidance',
      description:
        'Give AI structured APIVue analytics so it can explain your progress and suggest useful next actions.',
    },
  ];

  return (
    <section
      id="intelligence"
      className="border-y border-white/[0.06] bg-[#0b0e13]"
    >
      <div
        ref={reveal.ref}
        className={`${reveal.className} mx-auto max-w-7xl px-5 py-24 lg:px-8`}
      >
        <div className="mx-auto max-w-2xl text-center">
          <Badge
            variant="outline"
            className="border-violet-500/20 text-violet-400"
          >
            Intelligence layer
          </Badge>

          <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            From activity to understanding.
          </h2>

          <p className="mt-4 text-sm leading-7 text-zinc-500">
            APIVue isn't meant to be a prettier collection of
            statistics. The goal is to understand your trajectory.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.number}
                className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0d1117] p-7"
              >
                <div className="absolute right-5 top-4 text-5xl font-bold text-white/[0.025]">
                  {item.number}
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10">
                  <Icon className="h-5 w-5 text-violet-400" />
                </div>

                <h3 className="mt-6 text-lg font-semibold">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-zinc-500">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* =========================================================
   HOW IT WORKS
========================================================= */

const HowItWorks = () => {
  const reveal = useReveal();

  const steps = [
    {
      number: '01',
      title: 'Connect',
      description:
        'Connect the platforms where your work and learning already happen.',
      icon: Network,
    },
    {
      number: '02',
      title: 'Collect',
      description:
        'APIVue normalizes your activity into a consistent progress model.',
      icon: BarChart3,
    },
    {
      number: '03',
      title: 'Understand',
      description:
        'Historical analytics reveal trends, consistency and changes.',
      icon: TrendingUp,
    },
    {
      number: '04',
      title: 'Act',
      description:
        'Use insights and AI guidance to decide what deserves your attention next.',
      icon: Rocket,
    },
  ];

  return (
    <section id="how-it-works">
      <div
        ref={reveal.ref}
        className={`${reveal.className} mx-auto max-w-7xl px-5 py-24 lg:px-8`}
      >
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">
              How it works
            </p>

            <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              Simple input.
              <br />
              Useful output.
            </h2>

            <p className="mt-5 max-w-md text-sm leading-7 text-zinc-500">
              You keep doing the work. APIVue handles the difficult
              part of connecting the dots.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <CursorCard
                  key={step.number}
                  className="rounded-2xl border border-white/[0.06] bg-[#0d1117]/80 p-6 shadow-xl shadow-black/10 backdrop-blur-md hover:border-violet-300/25 hover:bg-violet-500/[0.04] hover:shadow-violet-500/10"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-violet-400">
                      {step.number}
                    </span>

                    <Icon className="h-4 w-4 text-zinc-700 transition-colors group-hover:text-violet-400" />
                  </div>

                  <h3 className="mt-8 font-semibold">
                    {step.title}
                  </h3>

                  <p className="mt-2 text-xs leading-6 text-zinc-500">
                    {step.description}
                  </p>
                </CursorCard>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

/* =========================================================
   CTA
========================================================= */

const CTA = () => {
  const reveal = useReveal();

  return (
    <section>
      <div
        ref={reveal.ref}
        className={`${reveal.className} mx-auto max-w-7xl px-5 py-20 lg:px-8`}
      >
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0d1117] px-6 py-16 text-center sm:px-12">
          <div className="absolute left-1/2 top-0 h-56 w-96 -translate-x-1/2 rounded-full bg-violet-500/[0.10] blur-[100px]" />

          <div className="relative">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10">
              <Zap className="h-5 w-5 text-violet-400" />
            </div>

            <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              Stop collecting activity.
              <br />
              Start understanding it.
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-zinc-500">
              Build a complete picture of your technical and
              personal progress with APIVue.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/signup">
                <Button
                  size="lg"
                  className="gap-2 bg-white px-6 text-black transition-[transform,box-shadow] duration-300 hover:scale-[1.02] hover:bg-zinc-200 hover:shadow-lg hover:shadow-white/10"
                >
                  Get started free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link to="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/[0.10] transition-[transform,box-shadow] duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-violet-500/10"
                >
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* =========================================================
   FOOTER
========================================================= */

const Footer = () => {
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo />

            <p className="mt-4 max-w-sm text-xs leading-6 text-zinc-600">
              APIVue is a personal progress intelligence platform
              designed to turn scattered activity into useful
              understanding.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Product
            </h4>

            <div className="mt-4 space-y-3 text-xs text-zinc-600">
              <a
                href="#platform"
                className="block hover:text-zinc-300"
              >
                Platform
              </a>

              <a
                href="#integrations"
                className="block hover:text-zinc-300"
              >
                Integrations
              </a>

              <a
                href="#intelligence"
                className="block hover:text-zinc-300"
              >
                Intelligence
              </a>

              <a
                href="#how-it-works"
                className="block hover:text-zinc-300"
              >
                How it works
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Account
            </h4>

            <div className="mt-4 space-y-3 text-xs text-zinc-600">
              <Link
                to="/login"
                className="block hover:text-zinc-300"
              >
                Sign in
              </Link>

              <Link
                to="/signup"
                className="block hover:text-zinc-300"
              >
                Create account
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Principles
            </h4>

            <div className="mt-4 space-y-3 text-xs text-zinc-600">
              <div>Open source</div>
              <div>Privacy first</div>
              <div>Data driven</div>
              <div>AI assisted</div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-6 text-xs text-zinc-700 sm:flex-row">
          <span>© 2026 APIVue. Built for progress.</span>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3 w-3" />
              Privacy first
            </span>

            <span className="flex items-center gap-1.5">
              <Github className="h-3 w-3" />
              Open source
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

/* =========================================================
   MAIN LANDING PAGE
========================================================= */

export const LandingPage = () => {
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  const openDemo = () => {
    setDemoStep(0);
    setDemoOpen(true);
  };

  useEffect(() => {
    if (!demoOpen) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDemoOpen(false);
      }

      if (event.key === 'ArrowRight') {
        setDemoStep((current) =>
          Math.min(demoSteps.length - 1, current + 1)
        );
      }

      if (event.key === 'ArrowLeft') {
        setDemoStep((current) =>
          Math.max(0, current - 1)
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [demoOpen]);

  return (
    <div className="min-h-screen bg-[#080a0f] text-white">
      <Background />
      <CursorGlow />

      <Navbar />

      <main>
        <Hero onDemo={openDemo} />

        <Integrations />

        <Platform />

        <Intelligence />

        <HowItWorks />

        <CTA />
      </main>

      <Footer />

      {demoOpen && (
        <DemoModal
          step={demoStep}
          setStep={setDemoStep}
          onClose={() => setDemoOpen(false)}
        />
      )}
    </div>
  );
};

export default LandingPage;

function setStyle(arg0: { transform: string; boxShadow: string; }) {
  throw new Error('Function not implemented.');
}
