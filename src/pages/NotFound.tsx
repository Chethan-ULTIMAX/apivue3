import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <img
          src="/favicon.ico"
          alt=""
          className="h-12 w-12 object-contain"
        />
      </div>

      <h1 className="mt-6 text-4xl font-bold tracking-tight">404</h1>
      <p className="mt-2 text-lg text-muted-foreground">Page not found</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back
        </Button>

        <Button asChild className="gap-1.5">
          <Link to="/">
            <Home className="h-4 w-4" />
            Home
          </Link>
        </Button>
      </div>
    </div>
  );
}