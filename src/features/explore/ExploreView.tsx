import { useState } from 'react';
import {
  explorePublicProfile,
  type PublicDataResult,
  type PublicPlatform,
} from '@/lib/public-data';

import { PlatformSelector } from './components/PlatformSelector';
import { ProfileSearch } from './components/ProfileSearch';
import { PublicProfileCard } from './components/PublicProfileCard';
import { PublicDataOverview } from './components/PublicDataOverview';

export function ExploreView() {
  const [platform, setPlatform] = useState<PublicPlatform>('github');
  const [username, setUsername] = useState('');
  const [data, setData] = useState<PublicDataResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleExplore = async () => {
    if (!username.trim()) {
      setError('Enter a username or handle.');
      return;
    }

    setLoading(true);
    setError('');
    setData(null);

    try {
      const result = await explorePublicProfile(
        platform,
        username
      );

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch public profile.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-violet-400">
          Explore
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Explore public profiles
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-white/50">
          Explore publicly available data without connecting
          an account.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="grid gap-4 md:grid-cols-[220px_1fr_auto]">
          <PlatformSelector
            value={platform}
            onChange={setPlatform}
          />

          <ProfileSearch
            value={username}
            onChange={setUsername}
            onSubmit={handleExplore}
            loading={loading}
            platform={platform}
          />

          <button
            type="button"
            onClick={handleExplore}
            disabled={loading}
            className="rounded-xl bg-violet-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Exploring...' : 'Explore'}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
      </div>

      {data && (
        <div className="space-y-6">
          <PublicProfileCard data={data} />

          <PublicDataOverview data={data} />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium transition hover:bg-white/[0.07]"
            >
              Analyze profile
            </button>

            <button
              type="button"
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium transition hover:bg-white/[0.07]"
            >
              Compare profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}