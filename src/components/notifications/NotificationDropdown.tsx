import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  Check,
  CheckCheck,
  Heart,
  Users,
  MessageSquare,
  Calendar,
  Info,
  Trash2,
} from "lucide-react";
import {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  Notification,
} from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "match_request":
    case "match_accepted":
    case "match_declined":
      return <Heart className="w-4 h-4 text-red-500" />;
    case "group_invite":
    case "group_post":
      return <Users className="w-4 h-4 text-blue-500" />;
    case "group_comment":
      return <MessageSquare className="w-4 h-4 text-green-500" />;
    case "group_event":
      return <Calendar className="w-4 h-4 text-purple-500" />;
    default:
      return <Info className="w-4 h-4 text-gray-500" />;
  }
};

const getNotificationRoute = (notification: Notification): string | null => {
  const { type, data } = notification;

  switch (type) {
    case "match_request":
    case "match_accepted":
    case "match_declined":
      return "/community";
    case "group_post":
    case "group_event":
    case "group_invite":
      return data?.group_id ? `/community/group/${data.group_id}` : "/community";
    default:
      return null;
  }
};

export const NotificationDropdown = () => {
  const navigate = useNavigate();
  const { data: notifications, isLoading } = useNotifications();
  const { data: unreadCount } = useUnreadNotificationsCount();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }

    // Navigate if applicable
    const route = getNotificationRoute(notification);
    if (route) {
      navigate(route);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0">
          <Bell className="h-4 w-4" />
          {unreadCount && unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <h4 className="text-sm font-medium">알림</h4>
          {unreadCount && unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              모두 읽음
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="py-8 text-center">
            <p className="text-xs text-muted-foreground">로딩 중...</p>
          </div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="py-8 text-center">
            <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">알림이 없습니다</p>
          </div>
        ) : (
          <ScrollArea className="h-80">
            <div className="space-y-1 p-1">
              {notifications.slice(0, 20).map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    notification.is_read
                      ? "hover:bg-muted/50"
                      : "bg-muted/30 hover:bg-muted/50"
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-xs leading-relaxed ${
                          notification.is_read
                            ? "text-muted-foreground"
                            : "font-medium"
                        }`}
                      >
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.is_read && (
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification.mutate(notification.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {notifications && notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => navigate("/notifications")}
              >
                모든 알림 보기
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
