export type PublicPlatform = 'github' | 'codeforces';

export interface PublicProfile {
  platform: PublicPlatform;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  profileUrl: string;
  bio: string | null;
  location: string | null;
  joinedAt: string | null;
}

export interface PublicMetric {
  label: string;
  value: string | number;
  description?: string;
}

export interface PublicActivity {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  url?: string;
  type: string;
}

export interface PublicDataResult {
  platform: PublicPlatform;
  profile: PublicProfile;
  metrics: PublicMetric[];
  activity: PublicActivity[];
  fetchedAt: string;
  source: 'public-api';
}

export interface PublicDataFetcher {
  platform: PublicPlatform;

  fetchProfile(username: string): Promise<PublicDataResult>;
}