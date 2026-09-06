import { useStore } from "@/lib/store";
import { Bell, CheckCheck, Ticket, Clock, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function NotificationDropdown() {
  const notifications = useStore((s) => s.notifications);
  const markNotificationRead = useStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useStore((s) => s.markAllNotificationsRead);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "assigned": return <Ticket className="h-3.5 w-3.5 text-info" />;
      case "sprint_ending": return <Clock className="h-3.5 w-3.5 text-warning" />;
      case "sprint_completed": return <Flag className="h-3.5 w-3.5 text-success" />;
      default: return <Bell className="h-3.5 w-3.5" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-card border-border" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsRead}
              className="text-[10px] text-primary hover:underline flex items-center gap-1"
            >
              <CheckCheck className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-64 overflow-y-auto scrollbar-thin">
          {notifications.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No notifications</p>
          ) : (
            notifications.slice(0, 10).map((n) => (
              <button
                key={n.id}
                className={`w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors flex gap-3 ${
                  !n.read ? "bg-primary/5" : ""
                }`}
                onClick={() => markNotificationRead(n.id)}
              >
                <div className="mt-0.5">{getIcon(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${!n.read ? "font-semibold" : "font-medium text-muted-foreground"}`}>{n.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{n.description}</p>
                  <p className="text-[9px] text-muted-foreground/60 mt-1">
                    {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-1 shrink-0" />}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
