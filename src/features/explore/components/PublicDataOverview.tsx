import type { PublicDataResult } from '@/lib/public-data';

interface PublicDataOverviewProps {
  data: PublicDataResult;
}

function formatDate(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return date.toLocaleString();
}

export function PublicDataOverview({
  data,
}: PublicDataOverviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">
          Public data overview
        </h2>

        <p className="mt-1 text-sm text-white/40">
          Information APIVue collected from the platform's public
          API.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-white/35">
              {metric.label}
            </p>

            <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
              {metric.value}
            </p>

            {metric.description && (
              <p className="mt-2 text-xs text-white/40">
                {metric.description}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-medium text-white">
              Recent public activity
            </h3>

            <p className="mt-1 text-xs text-white/40">
              {data.activity.length} activities returned by the
              public API
            </p>
          </div>
        </div>

        {data.activity.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-white/10 px-5 py-8 text-center">
            <p className="text-sm text-white/50">
              No recent public activity was returned.
            </p>
          </div>
        ) : (
          <div className="mt-5 divide-y divide-white/[0.06]">
            {data.activity.map((activity) => (
              <div
                key={activity.id}
                className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  {activity.url ? (
                    <a
                      href={activity.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-white transition hover:text-violet-300"
                    >
                      {activity.title}
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-white">
                      {activity.title}
                    </p>
                  )}

                  {activity.description && (
                    <p className="mt-1 text-xs text-white/40">
                      {activity.description}
                    </p>
                  )}
                </div>

                <time
                  dateTime={activity.timestamp}
                  className="shrink-0 text-xs text-white/30"
                >
                  {formatDate(activity.timestamp)}
                </time>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-white/25">
        Data fetched:{' '}
        {formatDate(data.fetchedAt)}
      </p>
    </div>
  );
}