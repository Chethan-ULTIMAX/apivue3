import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { AnimateOnScroll } from "@/components/AnimateOnScroll";
import {
  Kanban,
  Layers,
  CalendarRange,
  TrendingUp,
  LayoutDashboard,
  Target,
  ListChecks,
  BarChart3,
  Sparkles,
  Star,
  ArrowRight,
  CheckCircle2,
  Zap,
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const features = [
  { icon: LayoutDashboard, title: "Kanban board", desc: "Drag-and-drop tickets across customizable columns with real-time updates." },
  { icon: CalendarRange, title: "Sprint planning", desc: "Plan sprints with team capacity tracking and side-by-side backlog view." },
  { icon: ListChecks, title: "Backlog grooming", desc: "Organize tickets by epic, filter by priority, and groom with ease." },
  { icon: BarChart3, title: "Burndown charts", desc: "Track sprint progress with ideal vs. actual burndown visualization." },
  { icon: TrendingUp, title: "Velocity tracking", desc: "Monitor team velocity across sprints to improve estimation accuracy." },
  { icon: Sparkles, title: "AI sprint suggestions", desc: "Get AI-powered recommendations for which tickets to pull into your next sprint." },
];

const testimonials = [
  { name: "Sarah Nguyen", role: "VP Engineering, Streamline", avatar: "SN", quote: "Sprint Board transformed how we plan. Velocity went up 40% in three months. The burndowns finally give us clarity." },
  { name: "Marcus Chen", role: "CTO, DevForge", avatar: "MC", quote: "We replaced three tools with Sprint Board. The AI suggestions for planning are genuinely useful — not a gimmick." },
  { name: "Emily Rodriguez", role: "Engineering Lead, Pixelcraft", avatar: "ER", quote: "The cleanest sprint tool I've used. My team actually enjoys grooming now. The board is incredibly fast." },
];

const steps = [
  { icon: Layers, num: "01", title: "Shape the work", desc: "Capture epics, break them into tickets, and prioritize the backlog." },
  { icon: CalendarRange, num: "02", title: "Plan the sprint", desc: "Pull stories into a sprint with capacity tracking and AI suggestions." },
  { icon: TrendingUp, num: "03", title: "Ship & reflect", desc: "Move tickets across the board, watch the burndown, run the retro." },
];

const stats = [
  { value: "40%", label: "Faster sprint planning" },
  { value: "3×", label: "More accurate estimates" },
  { value: "12k+", label: "Sprints shipped" },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  // Force light mode on public landing without persisting user preference
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    const previousColorScheme = root.style.colorScheme;
    root.classList.remove("dark");
    root.classList.add("light");
    root.style.colorScheme = "light";
    return () => {
      root.classList.remove("light");
      if (hadDark) root.classList.add("dark");
      root.style.colorScheme = previousColorScheme;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Cinematic hero: dark image-backed, Apple-clean */}
      <section className="relative min-h-[100vh] flex flex-col text-white">
        {/* Background image with slow ken-burns */}
        <div
          className="absolute inset-0 bg-cover bg-center animate-[heroZoom_24s_ease-in-out_infinite_alternate]"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        {/* Neutral dark overlays only — no blue/purple tints */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/65 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,black_90%)]" />
        {/* Grain */}
        <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>\")" }} />

        {/* Nav */}
        <nav className="relative z-10">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5 animate-[fadeDown_0.7s_ease-out]">
              <Kanban className="h-7 w-7 text-white" strokeWidth={2.25} />
              <span className="text-lg font-semibold tracking-tight">Sprint Board</span>
            </div>
            <div className="flex items-center gap-5 animate-[fadeDown_0.7s_ease-out]">
              <Link to="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                Log in
              </Link>
              <Link to="/signup">
                <Button size="sm" className="bg-white text-black hover:bg-white/90 rounded-full font-medium px-5">
                  Get started
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero content — centered, Apple-style */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-6 pt-8 pb-32">
          <div className="max-w-4xl mx-auto w-full text-center">
            <h1
              className="text-6xl md:text-8xl lg:text-[112px] font-semibold tracking-[-0.04em] leading-[0.95] mb-7 opacity-0 animate-[heroRise_1s_cubic-bezier(0.16,1,0.3,1)_0.1s_forwards]"
            >
              Plan The Sprint.<br />Ship The Work.
            </h1>
            <p
              className="text-lg md:text-2xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed font-light opacity-0 animate-[heroRise_1s_cubic-bezier(0.16,1,0.3,1)_0.3s_forwards]"
            >
              The sprint board for teams who'd rather be shipping.
            </p>
            <div className="flex items-center justify-center gap-3 opacity-0 animate-[heroRise_1s_cubic-bezier(0.16,1,0.3,1)_0.5s_forwards]">
              <Link to="/signup">
                <Button
                  size="lg"
                  className="bg-white text-black hover:bg-white/90 rounded-full h-12 px-7 text-base font-medium hover:-translate-y-0.5 transition-all"
                >
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="ghost"
                  className="rounded-full h-12 px-6 text-base font-medium text-white hover:bg-white/10 hover:text-white"
                >
                  Log in
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats bar at bottom of hero */}
        <div className="relative z-10 border-t border-white/10 bg-black/40 backdrop-blur-md opacity-0 animate-[heroRise_1s_cubic-bezier(0.16,1,0.3,1)_0.7s_forwards]">
          <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-3 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center md:text-left">
                <div className="text-2xl md:text-3xl font-semibold tracking-tight text-white">{s.value}</div>
                <div className="text-[11px] md:text-xs text-white/55 uppercase tracking-wider mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Sprint header bar mockup transition */}
      <section className="relative py-20 px-6 bg-background">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[400px] bg-primary/[0.04] rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-6xl mx-auto relative">
          <AnimateOnScroll>
            <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <div className="w-3 h-3 rounded-full bg-success" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-background rounded-md py-1.5 px-3 text-[11px] text-muted-foreground font-mono text-center max-w-md mx-auto">
                    app.sprintboard.io/board
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between px-6 py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-foreground">Sprint 14 · Q1 push</span>
                  <span className="text-[10px] text-muted-foreground">Mar 30 – Apr 10</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Target className="h-3 w-3 text-primary" />
                    <span className="text-[10px] text-foreground font-medium">22</span>
                    <span className="text-[10px] text-muted-foreground">/ 34 pts</span>
                  </div>
                  <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-[65%] bg-primary rounded-full" />
                  </div>
                </div>
              </div>
              {/* Board */}
              <div className="p-5 overflow-x-auto bg-gradient-to-b from-card to-muted/20">
                <div className="flex gap-4 min-w-[800px]">
                  {[
                    { label: "TO DO", count: 2, items: [
                      { id: "AUTH-106", title: "Role-based access control", p: "P0", pts: "8pt", avatar: "SK", bar: "hsl(0 72% 51%)" },
                      { id: "API-104", title: "Rate limiting middleware", p: "P1", pts: "3pt", avatar: "TB", bar: "hsl(25 95% 53%)" },
                    ]},
                    { label: "IN PROGRESS", count: 3, items: [
                      { id: "AUTH-105", title: "OAuth Google sign-in", p: "P0", pts: "5pt", avatar: "AC", bar: "hsl(0 72% 51%)", sub: "2/4" },
                      { id: "DASH-105", title: "Dark mode toggle", p: "P2", pts: "3pt", avatar: "MG", bar: "hsl(220 10% 50%)" },
                      { id: "API-105", title: "Fix 500 on user delete", p: "P0", pts: "2pt", avatar: "MG", bar: "hsl(0 72% 51%)" },
                    ]},
                    { label: "IN REVIEW", count: 1, items: [
                      { id: "DASH-104", title: "Analytics charts", p: "P1", pts: "5pt", avatar: "JW", bar: "hsl(25 95% 53%)", sub: "3/4" },
                    ]},
                    { label: "DONE", count: 1, items: [
                      { id: "AUTH-107", title: "Fix token refresh loop", p: "P0", pts: "3pt", avatar: "AC", bar: "hsl(0 72% 51%)" },
                    ]},
                  ].map((col) => (
                    <div key={col.label} className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{col.label}</span>
                        <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{col.count}</span>
                      </div>
                      <div className="space-y-2">
                        {col.items.map((it) => (
                          <div key={it.id} className="relative bg-background border border-border rounded-lg p-3 pl-4 hover:border-primary/40 hover:shadow-md transition-all">
                            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg" style={{ backgroundColor: it.bar }} />
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-mono text-muted-foreground">{it.id}</span>
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: `color-mix(in srgb, ${it.bar} 15%, transparent)`, color: it.bar }}>{it.p}</span>
                            </div>
                            <p className="text-xs text-foreground font-medium mb-2">{it.title}</p>
                            {it.sub && (
                              <div className="mb-2 h-1 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: it.sub === "2/4" ? "50%" : "75%" }} />
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{it.pts}</span>
                              <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[8px] font-semibold flex items-center justify-center">{it.avatar}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-muted/40 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(228 14% 10%) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="max-w-5xl mx-auto relative">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">How it works</span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mt-3 mb-4">From idea to shipped in three moves.</h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-lg">A workflow your team actually wants to follow.</p>
            </div>
          </AnimateOnScroll>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <AnimateOnScroll key={step.num} delay={i * 120}>
                <div className="group relative bg-background border border-border rounded-2xl p-7 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 h-full">
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-muted-foreground/30 tabular-nums">{step.num}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute top-1/3 left-0 w-96 h-96 bg-primary/[0.04] rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-epic-auth/[0.04] rounded-full blur-3xl -z-10" />
        <div className="max-w-6xl mx-auto">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Features</span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mt-3 mb-4">Everything you need. Nothing you don't.</h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-lg">Designed for teams who'd rather be shipping than configuring.</p>
            </div>
          </AnimateOnScroll>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <AnimateOnScroll key={f.title} delay={i * 80}>
                <div className="group relative border border-border rounded-2xl p-6 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 bg-card hover:shadow-xl hover:shadow-primary/5 h-full">
                  <h3 className="font-semibold mb-2 text-base">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>


      {/* Final CTA - cinematic dark, Apple-clean */}
      <section className="relative py-32 px-6 overflow-hidden text-white">
        <div className="absolute inset-0 bg-black" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/85 to-black" />
        <div className="max-w-3xl mx-auto text-center relative">
          <AnimateOnScroll>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-[-0.03em] mb-5 leading-[1.02]">
              Your best sprint <br className="hidden md:block" />starts today.
            </h2>
            <p className="text-white/65 mb-10 max-w-lg mx-auto text-lg font-light">
              Set up your workspace and bring your team in.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/signup">
                <Button
                  size="lg"
                  className="bg-white text-black hover:bg-white/90 rounded-full h-12 px-8 text-base font-medium hover:-translate-y-0.5 transition-all"
                >
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="ghost"
                  className="rounded-full h-12 px-6 text-base font-medium text-white hover:bg-white/10 hover:text-white"
                >
                  Log in
                </Button>
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>


      {/* Footer */}
      <footer className="border-t border-border py-10 px-6 bg-background">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Kanban className="h-6 w-6 text-primary" />
            <span className="text-sm font-semibold">Sprint Board</span>
            <span className="text-xs text-muted-foreground ml-2">Agile done right.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/login" className="hover:text-foreground">Log in</Link>
            <Link to="/signup" className="hover:text-foreground">Get started</Link>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Sprint Board. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
