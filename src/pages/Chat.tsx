import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  MessageSquare,
  Send,
  User,
} from "lucide-react";
import {
  useChatRooms,
  useChatMessages,
  useSendMessage,
  useMarkMessagesAsRead,
  ChatRoom,
} from "@/hooks/useChat";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

const Chat = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedRoomId = searchParams.get("room");

  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: rooms, isLoading: roomsLoading } = useChatRooms();
  const { data: messages, isLoading: messagesLoading } = useChatMessages(selectedRoomId);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkMessagesAsRead();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (selectedRoomId) {
      markAsRead.mutate(selectedRoomId);
    }
  }, [selectedRoomId, messages]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth/login");
    }
  }, [loading, user, navigate]);

  const selectedRoom = rooms?.find((r) => r.id === selectedRoomId);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedRoomId) return;

    sendMessage.mutate(
      { roomId: selectedRoomId, content: messageInput },
      {
        onSuccess: () => {
          setMessageInput("");
        },
      }
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return format(date, "p", { locale: ko });
    }
    return format(date, "M/d p", { locale: ko });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 pb-24 pt-6">
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-xs">로딩 중...</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>메시지 | PRIPER</title>
        <meta name="description" content="PRIPER 메시지" />
      </Helmet>

      <main className="min-h-screen bg-background">
        <div className="flex h-screen">
          {/* Chat Room List */}
          <div
            className={`${
              selectedRoomId ? "hidden md:flex" : "flex"
            } flex-col w-full md:w-80 border-r`}
          >
            <div className="p-4 border-b">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <h1 className="text-sm font-medium">메시지</h1>
              </div>
            </div>

            <ScrollArea className="flex-1">
              {roomsLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-1/2 mb-1" />
                        <div className="h-3 bg-muted rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !rooms || rooms.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-1">
                    대화가 없습니다
                  </p>
                  <p className="text-xs text-muted-foreground">
                    커뮤니티에서 매칭된 사람과 대화를 시작해보세요
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 text-xs"
                    onClick={() => navigate("/community")}
                  >
                    커뮤니티 가기
                  </Button>
                </div>
              ) : (
                <div className="p-2">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        room.id === selectedRoomId
                          ? "bg-muted"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSearchParams({ room: room.id })}
                    >
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">
                            {room.other_user?.display_name ||
                              room.other_user?.email?.split("@")[0] ||
                              "사용자"}
                          </span>
                          {room.last_message_at && (
                            <span className="text-xs text-muted-foreground">
                              {formatMessageTime(room.last_message_at)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground truncate">
                            {room.last_message || "대화를 시작해보세요"}
                          </p>
                          {room.unread_count > 0 && (
                            <Badge
                              variant="destructive"
                              className="h-5 min-w-5 px-1.5 text-xs"
                            >
                              {room.unread_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Messages */}
          <div
            className={`${
              selectedRoomId ? "flex" : "hidden md:flex"
            } flex-col flex-1`}
          >
            {selectedRoom ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden"
                    onClick={() => setSearchParams({})}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-medium">
                      {selectedRoom.other_user?.display_name ||
                        selectedRoom.other_user?.email?.split("@")[0] ||
                        "사용자"}
                    </h2>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-xs text-muted-foreground">로딩 중...</p>
                    </div>
                  ) : !messages || messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                          대화를 시작해보세요
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((message) => {
                        const isMe = message.sender_id === user?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                                isMe
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                              <p
                                className={`text-xs mt-1 ${
                                  isMe
                                    ? "text-primary-foreground/70"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {formatMessageTime(message.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex items-center gap-2">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="메시지를 입력하세요..."
                      className="flex-1 text-sm"
                      disabled={sendMessage.isPending}
                    />
                    <Button
                      size="sm"
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || sendMessage.isPending}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    대화를 선택하세요
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default Chat;
