import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clipboard, ExternalLink, KeyRound, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { clearOwnershipChallenge, getOwnershipChallenge, verifyOwnership, beginOwnershipVerification, type OwnershipChallenge } from '@/lib/integrations/api';

const names = { leetcode: 'LeetCode', codewars: 'Codewars' } as const;

export function OwnershipVerificationView() {
  const { platform } = useParams<{ platform: 'leetcode' | 'codewars' }>();
  const navigate = useNavigate();
  const validPlatform = platform === 'leetcode' || platform === 'codewars' ? platform : null;
  const initialChallenge = getOwnershipChallenge();
  const [challenge, setChallenge] = useState<OwnershipChallenge | null>(() => initialChallenge);
  const [code, setCode] = useState(() => initialChallenge?.code ?? '');
  const [handle, setHandle] = useState(() => initialChallenge?.handle ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const remaining = useMemo(() => challenge ? Math.max(0, Math.ceil((new Date(challenge.expiresAt).getTime() - now) / 1000)) : 0, [challenge, now]);
  const remainingText = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;
  const name = validPlatform ? names[validPlatform] : 'Platform';
  const profileUrl = validPlatform && challenge ? (validPlatform === 'leetcode' ? `https://leetcode.com/u/${encodeURIComponent(challenge.handle)}/` : `https://www.codewars.com/users/${encodeURIComponent(challenge.handle)}`) : '#';

  const generate = async () => {
    if (!validPlatform || !handle.trim()) return;
    setBusy(true); setError(null);
    try { await beginOwnershipVerification(validPlatform, handle.trim()); } catch (err) { setError((err as Error).message); setBusy(false); }
  };
  const regenerate = async () => { if (!validPlatform || !challenge) return; setHandle(challenge.handle); setBusy(true); setError(null); try { await beginOwnershipVerification(validPlatform, challenge.handle); } catch (err) { setError((err as Error).message); setBusy(false); } };
  const verify = async () => {
    if (!validPlatform || !challenge || !code.trim()) return;
    setBusy(true); setError(null);
    try { await verifyOwnership(validPlatform, challenge.handle, code.trim()); toast({ title: `${name} ownership verified`, description: `${challenge.handle} is now connected to your APIVue account.` }); navigate('/dashboard/integrations', { replace: true }); }
    catch (err) { setError((err as Error).message); setBusy(false); }
  };

  if (!validPlatform) return <div className="mx-auto max-w-2xl p-6"><Card><CardContent className="p-6"><p className="font-semibold">Unsupported verification platform.</p><Link to="/dashboard/integrations" className="mt-3 inline-block text-sm text-primary">Back to integrations</Link></CardContent></Card></div>;

  if (!challenge) return <div className="mx-auto max-w-2xl space-y-4 p-4 sm:p-6"><Link to="/dashboard/integrations" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to integrations</Link><Card><CardHeader><CardTitle>Start {name} ownership verification</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Generate a unique one-time code, place it on your public {name} profile, and APIVue will verify that you control that profile.</p><div className="mt-4 flex flex-col gap-2 sm:flex-row"><Input value={handle} onChange={(event) => setHandle(event.target.value)} placeholder={`${name} username`} disabled={busy} autoComplete="off" spellCheck={false} /><Button onClick={() => void generate()} disabled={busy || !handle.trim()}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Generate code</Button></div>{error && <p className="mt-3 text-sm text-destructive">{error}</p>}</CardContent></Card></div>;

  return <div className="mx-auto max-w-2xl space-y-4 p-4 sm:p-6">
    <Link to="/dashboard/integrations" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to integrations</Link>
    <Card className="overflow-hidden border-primary/20">
      <CardHeader className="bg-primary/[0.04]"><div className="flex items-center justify-between gap-3"><div><Badge variant="outline" className="mb-2 gap-1"><ShieldCheck className="h-3 w-3" /> Ownership proof</Badge><CardTitle>Verify your {name} account</CardTitle><p className="mt-1 text-sm text-muted-foreground">@{challenge.handle}</p></div><div className="rounded-xl border bg-background px-3 py-2 text-right"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Code expires</p><p className="font-mono text-sm font-bold">{remaining ? remainingText : 'Expired'}</p></div></div></CardHeader>
      <CardContent className="space-y-5 p-5">
        <div className="rounded-xl border bg-muted/30 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Your unique verification code</p><p className="mt-1 break-all font-mono text-lg font-bold tracking-wide">{challenge.code}</p></div><Button variant="outline" size="icon" onClick={() => { void navigator.clipboard?.writeText(challenge.code); toast({ title: 'Code copied' }); }} title="Copy code"><Clipboard className="h-4 w-4" /></Button></div></div>
        <div className="space-y-2"><p className="text-sm font-semibold">1. Add the code to your {name} profile</p><p className="text-sm text-muted-foreground">{challenge.instructions}</p><a href={profileUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">Open {name} profile <ExternalLink className="h-3.5 w-3.5" /></a></div>
        <div className="space-y-2"><p className="text-sm font-semibold">2. Verify it here</p><div className="flex flex-col gap-2 sm:flex-row"><Input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="Paste your APIVUE-… code" className="font-mono" disabled={busy || !remaining} /><Button onClick={() => void verify()} disabled={busy || !remaining || !code.trim()} className="gap-2">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Verify ownership</Button></div></div>
        {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4"><p className="text-xs text-muted-foreground">APIVue stores only a hash of the verification code.</p><Button variant="ghost" size="sm" onClick={() => void regenerate()} disabled={busy} className="gap-1.5"><RefreshCw className="h-3.5 w-3.5" /> Generate new code</Button></div>
      </CardContent>
    </Card>
  </div>;
}
