import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  explorePublicProfile,
  type PublicDataResult,
  type PublicPlatform,
} from '@/lib/public-data';

import { PlatformSelector } from './components/PlatformSelector';
import { ProfileSearch } from './components/ProfileSearch';
import { PublicProfileCard } from './components/PublicProfileCard';
import { PublicDataOverview } from './components/PublicDataOverview';
import { Button } from '@/components/ui/button';
import { BarChart3, GitCompareArrows } from 'lucide-react';

export function ExploreView() {
  const navigate = useNavigate();
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

  const handleAnalyze = () => {
    if (!data) return;
    navigate('/dashboard/analytics', {
      state: { exploreProfile: data },
    });
  };

  const handleCompare = () => {
    if (!data) return;
    navigate('/dashboard/compare', {
      state: { exploreProfile: data },
    });
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

          <Button
            type="button"
            onClick={handleExplore}
            disabled={loading}
            className="rounded-xl bg-violet-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Exploring...' : 'Explore'}
          </Button>
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
            <Button
              type="button"
              onClick={handleAnalyze}
              className="rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-2.5 text-sm font-medium text-blue-300 hover:bg-blue-500/20 transition flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Analyze profile
            </Button>

            <Button
              type="button"
              onClick={handleCompare}
              className="rounded-xl bg-violet-500/10 border border-violet-500/20 px-4 py-2.5 text-sm font-medium text-violet-300 hover:bg-violet-500/20 transition flex items-center gap-2"
            >
              <GitCompareArrows className="h-4 w-4" />
              Compare profile
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}