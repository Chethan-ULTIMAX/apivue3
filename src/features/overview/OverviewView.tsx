import { useEffect, useState } from 'react';
import { useTrackedProfiles } from '@/hooks/use-profiles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Activity, Brain, Code, Shield, GraduationCap, FolderOpen, TrendingUp, TrendingDown } from 'lucide-react';

// --- helper to get change indicator ---
const ChangeBadge = ({ value }: { value: number }) => {
  if (value > 0) return <Badge variant="success" className="ml-2"><TrendingUp className="h-3 w-3 mr-1" />{value}%</Badge>;
  if (value < 0) return <Badge variant="destructive" className="ml-2"><TrendingDown className="h-3 w-3 mr-1" />{Math.abs(value)}%</Badge>;
  return <Badge variant="secondary" className="ml-2">0%</Badge>;
};

export function OverviewView() {
  const { data: profiles, isLoading: profilesLoading } = useTrackedProfiles();
  // We'll assume we have analytics data from a hook – you can implement this using your existing lib/analytics
  // For now we'll use dummy data that mimics your real structure
  const [stats, setStats] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [difficultyData, setDifficultyData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any[]>([]);

  useEffect(() => {
    // This is where you'd call your analytics service.
    // For demonstration, we'll use the same dummy data from the prototype,
    // but you can replace these with real data from your store / API.
    setStats({
      development: { value: 247, change: 12, sub: '42 commits · 8 PRs · 3 repos' },
      dsa: { value: 134, change: 8, sub: '62 Easy · 48 Med · 24 Hard' },
      cybersecurity: { value: 18, change: -5, sub: '12 labs · 6 CTF challenges' },
      learning: { value: 36, change: 4, sub: '8 courses · 28 lessons' },
      projects: { value: 5, change: 1, sub: '3 active · 2 completed' },
    });

    setTrendData([
      { week: 'W1', development: 28, dsa: 12, cybersecurity: 6 },
      { week: 'W2', development: 32, dsa: 15, cybersecurity: 5 },
      { week: 'W3', development: 30, dsa: 18, cybersecurity: 8 },
      { week: 'W4', development: 35, dsa: 14, cybersecurity: 7 },
      { week: 'W5', development: 42, dsa: 20, cybersecurity: 4 },
      { week: 'W6', development: 38, dsa: 22, cybersecurity: 3 },
      { week: 'W7', development: 45, dsa: 19, cybersecurity: 5 },
      { week: 'W8', development: 47, dsa: 24, cybersecurity: 4 },
    ]);

    setDifficultyData([
      { name: 'Easy', value: 62 },
      { name: 'Medium', value: 48 },
      { name: 'Hard', value: 24 },
    ]);

    setRecentActivity([
      { icon: 'github', title: 'Pushed 3 commits to apivue3', desc: 'Updated analytics engine', time: '2h ago' },
      { icon: 'leetcode', title: 'Solved "Binary Tree Paths" on LeetCode', desc: 'Medium · Runtime 5ms', time: '4h ago' },
      { icon: 'shield', title: 'Completed PortSwigger Lab: SQL Injection', desc: 'Advanced · 2 attempts', time: 'yesterday' },
      { icon: 'learning', title: 'Finished "React Performance" module', desc: 'Frontend Masters', time: 'yesterday' },
    ]);

    setAiInsights([
      {
        question: 'What should I focus on this week?',
        answer: 'Your <strong>development</strong> activity remains strong (+12% this month), but <strong>cybersecurity</strong> practice has dropped 5% in the last two weeks. DSA progress is steady. Based on your goal of becoming a security engineer, <strong>prioritize 2–3 security labs</strong> this week while maintaining your current DSA routine.',
      },
      {
        question: 'Pattern detected',
        answer: 'You tend to code more on weekends (Saturday + Sunday account for 42% of commits). Consider scheduling focused learning sessions on weekdays to balance your week.',
      },
    ]);
  }, []);

  if (profilesLoading || !stats) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-64 col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const statConfig = [
    { key: 'development', icon: Activity, color: 'text-blue-500', label: 'Development' },
    { key: 'dsa', icon: Code, color: 'text-orange-500', label: 'DSA / CP' },
    { key: 'cybersecurity', icon: Shield, color: 'text-green-500', label: 'Cybersecurity' },
    { key: 'learning', icon: GraduationCap, color: 'text-purple-500', label: 'Learning' },
    { key: 'projects', icon: FolderOpen, color: 'text-yellow-500', label: 'Projects' },
  ];

  const COLORS = ['#3fb950', '#f0883e', '#f85149'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Your progress across all areas</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground border rounded-md px-3 py-1.5">
          <span className="i-lucide-calendar h-4 w-4" />
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statConfig.map(({ key, icon: Icon, color, label }) => {
          const stat = stats[key];
          return (
            <Card key={key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <Icon className={`h-4 w-4 ${color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stat.value}
                  <ChangeBadge value={stat.change} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Activity Trends <span className="ml-2 font-normal">Last 8 weeks</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c2128" />
                <XAxis dataKey="week" stroke="#8b949e" />
                <YAxis stroke="#8b949e" />
                <Tooltip contentStyle={{ backgroundColor: '#0d1117', border: '1px solid #30363d' }} />
                <Legend />
                <Line type="monotone" dataKey="development" stroke="#58a6ff" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="dsa" stroke="#f0883e" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="cybersecurity" stroke="#3fb950" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">DSA Difficulty Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={difficultyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {difficultyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Activity Feed + AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/30">
                  {item.icon === 'github' && <Activity className="h-4 w-4 text-blue-500" />}
                  {item.icon === 'leetcode' && <Code className="h-4 w-4 text-orange-500" />}
                  {item.icon === 'shield' && <Shield className="h-4 w-4 text-green-500" />}
                  {item.icon === 'learning' && <GraduationCap className="h-4 w-4 text-purple-500" />}
                </div>
                <div className="flex-1 space-y-0.5">
                  <p className="text-sm font-medium leading-none">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Brain className="h-4 w-4 text-orange-500" />
              AI Guidance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiInsights.map((insight, idx) => (
              <div key={idx} className="rounded-lg border-l-4 border-orange-500 bg-accent/20 p-4">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <span className="i-lucide-question h-3 w-3" />
                  {insight.question}
                </p>
                <p className="mt-1 text-sm" dangerouslySetInnerHTML={{ __html: insight.answer }} />
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <button className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent/50">
                <span className="i-lucide-refresh-cw h-3 w-3" />
                Refresh insights
              </button>
              <button className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent/50">
                <span className="i-lucide-message-circle h-3 w-3" />
                Ask AI
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="i-lucide-database h-3 w-3" />
          Data refreshed 2 minutes ago
        </span>
        <span className="flex items-center gap-1">
          <span className="i-lucide-link h-3 w-3" />
          Connected: GitHub · LeetCode · PortSwigger · Frontend Masters
        </span>
      </div>
    </div>
  );
}