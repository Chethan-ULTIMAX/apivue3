import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Kanban, LayoutDashboard, TrendingUp, Sparkles } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

export default function LoginPage() {
  const { signIn, signInWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const rawNext = params.get("next");
  const next = rawNext && /^\/(?!\/)/.test(rawNext) ? rawNext : "/dashboard";

  useEffect(() => {
    if (!loading && user) {
      navigate(next, { replace: true });
    }
  }, [user, loading, navigate, next]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Please enter a valid email";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setError("");
    try {
      await signIn(email, password);
      navigate(next);
    } catch (err: any) {
      setError(err?.message || "Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const signedIn = await signInWithGoogle(next);
      if (signedIn) navigate(next, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Google sign-in failed");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex relative flex-col justify-between p-12 text-white overflow-hidden">
        {/* Cinematic background */}
        <div
          className="absolute inset-0 bg-cover bg-center animate-[heroZoom_24s_ease-in-out_infinite_alternate]"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/70 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,transparent_20%,black_95%)]" />
        <div
          className="absolute inset-0 opacity-[0.06] mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>\")" }}
        />

        {/* Top: brand */}
        <div className="relative z-10 flex items-center gap-2.5 opacity-0 animate-[fadeDown_0.7s_ease-out_forwards]">
          <Kanban className="h-6 w-6" strokeWidth={2.25} />
          <span className="text-lg font-semibold tracking-tight">Sprint Board</span>
        </div>

        {/* Middle: headline + feature pills */}
        <div className="relative z-10 space-y-8 max-w-md">
          <div className="space-y-4 opacity-0 animate-[heroRise_1s_cubic-bezier(0.16,1,0.3,1)_0.1s_forwards]">
            <h1 className="text-5xl font-semibold tracking-[-0.03em] leading-[1.02]">
              Ship sprints<br />with clarity.
            </h1>
            <p className="text-base text-white/65 font-light leading-relaxed max-w-sm">
              Plan, track, and deliver work across your team — boards, backlog, analytics, and roadmap in one place.
            </p>
          </div>

          <div className="space-y-2.5 opacity-0 animate-[heroRise_1s_cubic-bezier(0.16,1,0.3,1)_0.35s_forwards]">
            {[
              { icon: LayoutDashboard, label: "Kanban board with real-time updates" },
              { icon: TrendingUp, label: "Burndown and velocity tracking" },
              { icon: Sparkles, label: "AI-assisted sprint planning" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3 text-sm text-white/75">
                <div className="h-7 w-7 rounded-md bg-white/10 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                  <f.icon className="h-3.5 w-3.5" />
                </div>
                {f.label}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: meta */}
        <div className="relative z-10 flex items-center justify-between text-xs text-white/50 opacity-0 animate-[heroRise_1s_cubic-bezier(0.16,1,0.3,1)_0.55s_forwards]">
          <p>© {new Date().getFullYear()} Sprint Board</p>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
          </div>


        <Button
          variant="outline"
          className="w-full h-11 bg-card border-border hover:bg-accent"
          onClick={handleGoogleSignIn}
        >
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">or</span></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && <p className="text-sm text-destructive text-center bg-destructive/10 rounded-lg py-2">{error}</p>}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" placeholder="you@company.com" value={email}
                onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: "" })); }}
                className={`pl-9 h-11 bg-card border-border ${fieldErrors.email ? "border-destructive" : ""}`}
                aria-invalid={!!fieldErrors.email} aria-describedby={fieldErrors.email ? "email-error" : undefined} />
            </div>
            {fieldErrors.email && <p id="email-error" className="text-[11px] text-destructive">{fieldErrors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs text-muted-foreground">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="password" type="password" placeholder="••••••••" value={password}
                onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: "" })); }}
                className={`pl-9 h-11 bg-card border-border ${fieldErrors.password ? "border-destructive" : ""}`}
                aria-invalid={!!fieldErrors.password} aria-describedby={fieldErrors.password ? "password-error" : undefined} />
            </div>
            {fieldErrors.password && <p id="password-error" className="text-[11px] text-destructive">{fieldErrors.password}</p>}
          </div>

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
          </div>

          <Button type="submit" className="w-full h-11" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to={rawNext ? `/signup?next=${encodeURIComponent(next)}` : "/signup"} className="text-primary hover:underline font-medium">Sign up</Link>
        </p>
        </div>
      </div>
    </div>

  );
}
