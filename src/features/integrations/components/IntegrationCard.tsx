import type { ReactNode } from 'react';

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
    <div className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition hover:border-white/15 hover:bg-white/[0.035]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white">
            {icon}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-white">
                {name}
              </h3>

              {connected && (
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                  Connected
                </span>
              )}
            </div>

            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-violet-300/70">
              {category}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-5 text-sm leading-relaxed text-white/50">
        {description}
      </p>

      <div className="mt-5">
        {children}
      </div>
    </div>
  );
}