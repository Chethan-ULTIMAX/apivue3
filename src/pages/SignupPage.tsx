import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, Kanban, LayoutDashboard, TrendingUp, Sparkles } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { toast } from "sonner";

export default function SignupPage() {
  const { signUp, signInWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const rawNext = params.get("next");
  const next = rawNext && /^\/(?!\/)/.test(rawNext) ? rawNext : "/dashboard";

  useEffect(() => {
    if (!loading && user) {
      navigate(next, { replace: true });
    }
  }, [user, loading, navigate, next]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    else if (name.trim().length < 2) errs.name = "Name must be at least 2 characters";
    if (!email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Please enter a valid email";
    if (!password) errs.password = "Password is required";
    else if (password.length < 8) errs.password = "Password must be at least 8 characters";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setError("");
    try {
      await signUp(email, password, name);
      toast.success("Check your email to verify your account before signing in.");
      navigate(rawNext ? `/login?next=${encodeURIComponent(next)}` : "/login");
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
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
              Start shipping<br />faster.
            </h1>
            <p className="text-base text-white/65 font-light leading-relaxed max-w-sm">
              Join teams using Sprint Board to plan, track, and deliver work with confidence.
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
            <h2 className="text-2xl font-semibold tracking-tight">Create your account</h2>
            <p className="text-sm text-muted-foreground mt-1">Get started in seconds</p>
          </div>


        <Button variant="outline" className="w-full h-11 bg-card border-border hover:bg-accent"
          onClick={handleGoogleSignIn}>
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
            <Label htmlFor="name" className="text-xs text-muted-foreground">Full name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="name" placeholder="Alex Chen" value={name}
                onChange={(e) => { setName(e.target.value); if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: "" })); }}
                className={`pl-9 h-11 bg-card border-border ${fieldErrors.name ? "border-destructive" : ""}`}
                aria-invalid={!!fieldErrors.name} />
            </div>
            {fieldErrors.name && <p className="text-[11px] text-destructive">{fieldErrors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" placeholder="you@company.com" value={email}
                onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: "" })); }}
                className={`pl-9 h-11 bg-card border-border ${fieldErrors.email ? "border-destructive" : ""}`}
                aria-invalid={!!fieldErrors.email} />
            </div>
            {fieldErrors.email && <p className="text-[11px] text-destructive">{fieldErrors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs text-muted-foreground">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="password" type="password" placeholder="8+ characters" value={password}
                onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: "" })); }}
                className={`pl-9 h-11 bg-card border-border ${fieldErrors.password ? "border-destructive" : ""}`}
                aria-invalid={!!fieldErrors.password} />
            </div>
            {fieldErrors.password && <p className="text-[11px] text-destructive">{fieldErrors.password}</p>}
          </div>

          <Button type="submit" className="w-full h-11" disabled={submitting}>
            {submitting ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to={rawNext ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
        </div>
      </div>
    </div>

  );
}
