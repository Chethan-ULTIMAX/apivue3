import type {
  PublicBreakdown,
  PublicDataResult,
  PublicRepository,
} from '@/lib/public-data';

interface PublicDataOverviewProps {
  data: PublicDataResult;
}

function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatRelativeDate(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffDays < 1) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/* ============================================================
 * Sub-sections
 * ============================================================ */

function MetricsGrid({ metrics }: { metrics: PublicDataResult['metrics'] }) {
  if (metrics.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-2xl border border-border bg-card/40 p-5 transition hover:border-primary/30"
        >
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {metric.label}
          </p>

          <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            {typeof metric.value === 'number'
              ? metric.value.toLocaleString()
              : metric.value}
          </p>

          {metric.description && (
            <p className="mt-2 text-xs text-muted-foreground">
              {metric.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function BreakdownSection({ breakdown }: { breakdown: PublicBreakdown }) {
  if (breakdown.items.length === 0) return null;

  const max = Math.max(...breakdown.items.map((i) => i.value), 1);

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5">
      <h3 className="text-sm font-semibold text-foreground">
        {breakdown.label}
      </h3>

      <ul className="mt-4 space-y-3">
        {breakdown.items.map((item) => {
          const widthPct = Math.max((item.value / max) * 100, 2);
          return (
            <li key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">
                  {item.label}
                </span>
                <span className="text-muted-foreground">
                  {item.value.toLocaleString()}
                  {item.percentage !== undefined
                    ? ` · ${item.percentage}%`
                    : ''}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/70"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RepositoriesSection({ repos }: { repos: PublicRepository[] }) {
  if (repos.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Top repositories
        </h3>
        <span className="text-xs text-muted-foreground">
          {repos.length} shown
        </span>
      </div>

      <ul className="mt-4 divide-y divide-border">
        {repos.map((repo) => (
          <li key={repo.url} className="py-3 first:pt-0 last:pb-0">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-foreground transition hover:text-primary"
                >
                  {repo.name}
                </a>

                {repo.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {repo.description}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {repo.language && (
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-primary/70" />
                      {repo.language}
                    </span>
                  )}
                  <span>★ {repo.stars.toLocaleString()}</span>
                  <span>⑂ {repo.forks.toLocaleString()}</span>
                  {repo.openIssues > 0 && (
                    <span>! {repo.openIssues.toLocaleString()} issues</span>
                  )}
                  {repo.isArchived && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider">
                      Archived
                    </span>
                  )}
                </div>
              </div>

              {repo.updatedAt && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatRelativeDate(repo.updatedAt)}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActivitySection({ data }: { data: PublicDataResult }) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Recent public activity
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {data.activity.length} item
            {data.activity.length === 1 ? '' : 's'} from the public API
          </p>
        </div>
      </div>

      {data.activity.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-border px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            No recent public activity was returned.
          </p>
        </div>
      ) : (
        <ul className="mt-5 divide-y divide-border">
          {data.activity.map((activity) => (
            <li
              key={activity.id}
              className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                {activity.url ? (
                  <a
                    href={activity.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-foreground transition hover:text-primary"
                  >
                    {activity.title}
                  </a>
                ) : (
                  <p className="text-sm font-medium text-foreground">
                    {activity.title}
                  </p>
                )}

                {activity.description && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {activity.description}
                  </p>
                )}
              </div>

              <time
                dateTime={activity.timestamp}
                className="shrink-0 text-xs text-muted-foreground"
                title={formatDateTime(activity.timestamp)}
              >
                {formatRelativeDate(activity.timestamp)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ============================================================
 * Main
 * ============================================================ */

export function PublicDataOverview({ data }: PublicDataOverviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Public data overview
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Information APIVue collected from the platform's public API.
        </p>
      </div>

      <MetricsGrid metrics={data.metrics} />

      {data.breakdowns && data.breakdowns.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.breakdowns.map((breakdown) => (
            <BreakdownSection
              key={breakdown.label}
              breakdown={breakdown}
            />
          ))}
        </div>
      )}

      {data.repositories && data.repositories.length > 0 && (
        <RepositoriesSection repos={data.repositories} />
      )}

      <ActivitySection data={data} />

      <p className="text-xs text-muted-foreground">
        Data fetched: {formatDateTime(data.fetchedAt)}
      </p>
    </div>
  );
}