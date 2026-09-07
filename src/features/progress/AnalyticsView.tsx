import { useEffect, useState } from "react";
import { useTrackedProfiles } from "@/hooks/use-profiles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export const AnalyticsView = () => {
  const { data: profiles, isLoading } = useTrackedProfiles();
  const [trendData, setTrendData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  useEffect(() => {
    // Here you would call your analytics engine (e.g., from lib/analytics/progress.ts)
    // For now we use dummy data that mirrors the OverviewView
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

    setCategoryData([
      { category: 'Development', value: 247 },
      { category: 'DSA / CP', value: 134 },
      { category: 'Cybersecurity', value: 18 },
      { category: 'Learning', value: 36 },
    ]);
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Deep dive into your progress metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Activity Trends</CardTitle>
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
            <CardTitle>Overall Activity by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c2128" />
                <XAxis dataKey="category" stroke="#8b949e" />
                <YAxis stroke="#8b949e" />
                <Tooltip contentStyle={{ backgroundColor: '#0d1117', border: '1px solid #30363d' }} />
                <Bar dataKey="value" fill="#58a6ff" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Additional Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Connect more platforms to see detailed analytics here.</p>
          {/* You can add more charts from the real analytics engine here */}
        </CardContent>
      </Card>
    </div>
  );
};