import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface IntegrationCardProps {
  name: string;
  description: string;
  category: string;
  connected: boolean;
  icon: ReactNode;
  children: ReactNode;
}

export function IntegrationCard({
  name,
  description,
  category,
  connected,
  icon,
  children,
}: IntegrationCardProps) {
  return (
    <Card className="group flex flex-col border-border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <CardContent className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted text-foreground">
              {icon}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-foreground">{name}</h3>

                {connected && (
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  >
                    Connected
                  </Badge>
                )}
              </div>

              <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-primary/70">
                {category}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>

        <div className="mt-5">{children}</div>
      </CardContent>
    </Card>
  );
}