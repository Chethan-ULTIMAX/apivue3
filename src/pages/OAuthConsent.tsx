import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export const OAuthConsent = () => {
  const [searchParams] = useSearchParams();
  const clientName = searchParams.get("client_name") || "an application";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleConsent = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      // Redirect handled by OAuth flow
    } catch (err: any) {
      setError(err.message || "Failed to start OAuth flow");
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <img src="/favicon.ico" alt="APIVue" className="h-9 w-9 object-contain" />
            </div>
          </div>
          <CardTitle className="text-xl">Authorization request</CardTitle>
          <CardDescription>
            {clientName} is requesting access to your APIVue account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <p className="text-sm text-muted-foreground">
            This will allow {clientName} to view your public profile data and activity.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleConsent} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Authorize
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};