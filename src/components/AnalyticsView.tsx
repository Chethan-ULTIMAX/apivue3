import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { SkeletonChart } from "./TicketBadges";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from "recharts";
import { BarChart3, Inbox } from "lucide-react";

export function AnalyticsView() {
  const tickets = useStore((s) => s.tickets);
  const sprints = useStore((s) => s.sprints);
  const members = useStore((s) => s.members);
  const activeSprint = useStore((s) => s.activeSprint);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const velocityData = sprints.map((sprint) => {
    const sprintTickets = tickets.filter((t) => t.sprintId === sprint.id);
    const committed = sprintTickets.reduce((sum, t) => sum + t.storyPoints, 0);
    const completed = sprintTickets.filter((t) => t.status === "done").reduce((sum, t) => sum + t.storyPoints, 0);
    return { name: sprint.name, committed, completed };
  });

  const burndownData = (() => {
    if (!activeSprint) return [];
    const sprintTickets = tickets.filter((t) => t.sprintId === activeSprint.id);
    const totalPoints = sprintTickets.reduce((sum, t) => sum + t.storyPoints, 0);
    if (totalPoints === 0) return [];
    const days = 10;
    const idealDecrement = totalPoints / days;
    return Array.from({ length: days + 1 }, (_, i) => {
      const idealRemaining = Math.max(0, totalPoints - idealDecrement * i);
      const actualFactor = i <= 3 ? 0.7 : i <= 6 ? 1.0 : 1.3;
      const actualRemaining = Math.max(0, totalPoints - idealDecrement * i * actualFactor);
      return { day: `Day ${i}`, ideal: Math.round(idealRemaining), actual: Math.round(actualRemaining) };
    });
  })();

  const cycleTimeData = (() => {
    const completedTickets = tickets.filter((t) => t.completedAt);
    if (completedTickets.length === 0) return [];
    const buckets: Record<string, number> = { "1-2 days": 0, "3-4 days": 0, "5-7 days": 0, "8+ days": 0 };
    completedTickets.forEach((t) => {
      const created = new Date(t.createdAt).getTime();
      const completed = new Date(t.completedAt!).getTime();
      const days = Math.max(1, Math.ceil((completed - created) / 86400000));
      if (days <= 2) buckets["1-2 days"]++;
      else if (days <= 4) buckets["3-4 days"]++;
      else if (days <= 7) buckets["5-7 days"]++;
      else buckets["8+ days"]++;
    });
    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  })();

  const throughputData = members.map((m) => {
    const memberTickets = tickets.filter((t) => t.assigneeId === m.id && t.status === "done");
    return { name: m.name.split(" ")[0], tickets: memberTickets.length, points: memberTickets.reduce((s, t) => s + t.storyPoints, 0) };
  });

  const chartStyle = { fontSize: 11, fill: "hsl(220, 10%, 50%)" };
  const tooltipStyle = { backgroundColor: "hsl(228, 14%, 13%)", border: "1px solid hsl(228, 14%, 20%)", borderRadius: 8, fontSize: 12 };

  const hasNoData = velocityData.length === 0 && burndownData.length === 0 && cycleTimeData.length === 0;

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-8 max-w-5xl">
        <h1 className="text-lg font-semibold">Velocity & Analytics</h1>
        <SkeletonChart />
        <SkeletonChart />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6"><SkeletonChart /><SkeletonChart /></div>
      </div>
    );
  }

  function EmptyChart({ message }: { message: string }) {
    return (
      <div className="h-[240px] flex flex-col items-center justify-center text-center">
        <BarChart3 className="h-8 w-8 text-muted-foreground/30 mb-2" />
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
    );
  }

  if (hasNoData) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl">
        <h1 className="text-lg font-semibold mb-8">Velocity & Analytics</h1>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h2 className="text-base font-medium mb-1">No analytics data yet</h2>
          <p className="text-sm text-muted-foreground">Complete your first sprint to see velocity, burndown, and cycle time charts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-8 max-w-5xl">
      <h1 className="text-lg font-semibold">Velocity & Analytics</h1>

      {/* Velocity */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="text-sm font-semibold mb-4">Sprint Velocity</h2>
        {velocityData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={velocityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 14%, 20%)" />
              <XAxis dataKey="name" tick={chartStyle} axisLine={false} />
              <YAxis tick={chartStyle} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="committed" fill="hsl(228, 14%, 30%)" radius={[4, 4, 0, 0]} name="Committed" />
              <Bar dataKey="completed" fill="hsl(243, 75%, 59%)" radius={[4, 4, 0, 0]} name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="No sprint data available" />
        )}
      </div>

      {/* Burndown */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="text-sm font-semibold mb-4">Sprint Burndown</h2>
        {burndownData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={burndownData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 14%, 20%)" />
              <XAxis dataKey="day" tick={chartStyle} axisLine={false} />
              <YAxis tick={chartStyle} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="ideal" stroke="hsl(228, 14%, 40%)" fill="hsl(228, 14%, 20%)" strokeDasharray="5 5" name="Ideal" />
              <Area type="monotone" dataKey="actual" stroke="hsl(243, 75%, 59%)" fill="hsl(243, 75%, 30%)" fillOpacity={0.3} name="Actual" />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message={activeSprint ? "No tickets in current sprint" : "No active sprint"} />
        )}
      </div>

      {/* Two column: Cycle Time + Throughput */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-sm font-semibold mb-4">Cycle Time Distribution</h2>
          {cycleTimeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={cycleTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 14%, 20%)" />
                <XAxis dataKey="range" tick={chartStyle} axisLine={false} />
                <YAxis tick={chartStyle} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} name="Tickets" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No completed tickets yet" />
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-sm font-semibold mb-4">Team Throughput</h2>
          {throughputData.some((d) => d.tickets > 0) ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={throughputData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 14%, 20%)" />
                <XAxis dataKey="name" tick={chartStyle} axisLine={false} />
                <YAxis tick={chartStyle} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="tickets" fill="hsl(199, 89%, 48%)" radius={[4, 4, 0, 0]} name="Tickets" />
                <Bar dataKey="points" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} name="Points" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No completed tickets by team members" />
          )}
        </div>
      </div>
    </div>
  );
}
