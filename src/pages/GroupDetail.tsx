import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Users,
  MessageSquare,
  Calendar,
  Heart,
  Send,
  MoreHorizontal,
  Clock,
  MapPin,
  UserPlus,
  LogOut,
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface GroupDetail {
  id: string;
  name: string;
  description: string | null;
  theme: string | null;
  creator_id: string;
  member_count: number;
  avg_sync_rate: number | null;
  created_at: string;
}

interface GroupMember {
  id: string;
  user_id: string;
  role: "member" | "admin";
  joined_at: string;
  profile?: {
    email: string;
    display_name?: string;
  };
}

interface GroupPost {
  id: string;
  author_id: string;
  content: string;
  post_type: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  author_profile?: {
    email: string;
    display_name?: string;
  };
  user_liked?: boolean;
}

interface GroupEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
  is_online: boolean;
  max_participants: number | null;
  participants_count: number;
  creator_id: string;
  is_registered?: boolean;
}

const postTypeLabels: Record<string, string> = {
  discussion: "토론",
  announcement: "공지",
  question: "질문",
  resource: "자료",
  event: "이벤트",
};

const eventTypeLabels: Record<string, string> = {
  meetup: "모임",
  workshop: "워크숍",
  webinar: "웨비나",
  challenge: "챌린지",
  other: "기타",
};

const GroupDetail = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState("posts");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostType, setNewPostType] = useState("discussion");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth/login");
    }
  }, [loading, user, navigate]);

  // Fetch group details
  const { data: group, isLoading: groupLoading } = useQuery<GroupDetail>({
    queryKey: ["group-detail", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_groups")
        .select("*")
        .eq("id", groupId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!groupId && !!user,
  });

  // Check if current user is a member
  const { data: membership } = useQuery({
    queryKey: ["group-membership", groupId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", groupId)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!groupId && !!user,
  });

  const isMember = !!membership;
  const isCreator = group?.creator_id === user?.id;

  // Fetch group members
  const { data: members, isLoading: membersLoading } = useQuery<GroupMember[]>({
    queryKey: ["group-members", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_members")
        .select("id, user_id, role, joined_at")
        .eq("group_id", groupId)
        .order("joined_at", { ascending: true });
      if (error) throw error;

      // Fetch profiles for members
      const userIds = data.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, display_name")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return data.map((m) => ({
        ...m,
        profile: profileMap.get(m.user_id),
      }));
    },
    enabled: !!groupId && !!user,
  });

  // Fetch group posts
  const { data: posts, isLoading: postsLoading } = useQuery<GroupPost[]>({
    queryKey: ["group-posts", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_posts")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch profiles for authors
      const authorIds = [...new Set(data.map((p) => p.author_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, display_name")
        .in("id", authorIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      // Check which posts user has liked
      const { data: userLikes } = await supabase
        .from("group_post_likes")
        .select("post_id")
        .eq("user_id", user!.id)
        .in(
          "post_id",
          data.map((p) => p.id)
        );

      const likedPostIds = new Set(userLikes?.map((l) => l.post_id) || []);

      return data.map((p) => ({
        ...p,
        author_profile: profileMap.get(p.author_id),
        user_liked: likedPostIds.has(p.id),
      }));
    },
    enabled: !!groupId && !!user,
  });

  // Fetch group events
  const { data: events, isLoading: eventsLoading } = useQuery<GroupEvent[]>({
    queryKey: ["group-events", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_events")
        .select("*")
        .eq("group_id", groupId)
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true });
      if (error) throw error;

      // Check user registrations
      const { data: registrations } = await supabase
        .from("group_event_participants")
        .select("event_id")
        .eq("user_id", user!.id)
        .in(
          "event_id",
          data.map((e) => e.id)
        );

      const registeredEventIds = new Set(
        registrations?.map((r) => r.event_id) || []
      );

      return data.map((e) => ({
        ...e,
        is_registered: registeredEventIds.has(e.id),
      }));
    },
    enabled: !!groupId && !!user,
  });

  // Join group mutation
  const joinGroup = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("group_members").insert({
        group_id: groupId,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "그룹 참여 완료" });
      qc.invalidateQueries({ queryKey: ["group-membership", groupId] });
      qc.invalidateQueries({ queryKey: ["group-members", groupId] });
      qc.invalidateQueries({ queryKey: ["group-detail", groupId] });
    },
    onError: (error: any) => {
      toast({
        title: "참여 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Leave group mutation
  const leaveGroup = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "그룹 탈퇴 완료" });
      qc.invalidateQueries({ queryKey: ["group-membership", groupId] });
      qc.invalidateQueries({ queryKey: ["group-members", groupId] });
      qc.invalidateQueries({ queryKey: ["group-detail", groupId] });
    },
    onError: (error: any) => {
      toast({
        title: "탈퇴 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create post mutation
  const createPost = useMutation({
    mutationFn: async () => {
      if (!newPostContent.trim()) throw new Error("내용을 입력하세요");
      const { error } = await supabase.from("group_posts").insert({
        group_id: groupId,
        author_id: user!.id,
        content: newPostContent.trim(),
        post_type: newPostType,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "게시글 작성 완료" });
      setNewPostContent("");
      setNewPostType("discussion");
      qc.invalidateQueries({ queryKey: ["group-posts", groupId] });
    },
    onError: (error: any) => {
      toast({
        title: "작성 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle like mutation
  const toggleLike = useMutation({
    mutationFn: async (postId: string) => {
      const post = posts?.find((p) => p.id === postId);
      if (post?.user_liked) {
        const { error } = await supabase
          .from("group_post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("group_post_likes").insert({
          post_id: postId,
          user_id: user!.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["group-posts", groupId] });
    },
  });

  // Register for event mutation
  const registerEvent = useMutation({
    mutationFn: async (eventId: string) => {
      const event = events?.find((e) => e.id === eventId);
      if (event?.is_registered) {
        const { error } = await supabase
          .from("group_event_participants")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("group_event_participants")
          .insert({
            event_id: eventId,
            user_id: user!.id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["group-events", groupId] });
    },
  });

  if (loading || groupLoading) {
    return (
      <main className="min-h-screen bg-background text-foreground px-4 pb-24 pt-6">
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-xs">그룹 정보를 불러오는 중...</p>
        </div>
      </main>
    );
  }

  if (!group) {
    return (
      <main className="min-h-screen bg-background text-foreground px-4 pb-24 pt-6">
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">
            그룹을 찾을 수 없습니다
          </p>
          <Button
            variant="link"
            className="mt-2"
            onClick={() => navigate("/community")}
          >
            커뮤니티로 돌아가기
          </Button>
        </div>
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>{group.name} | PRIPER 커뮤니티</title>
        <meta name="description" content={group.description || group.name} />
      </Helmet>

      <main className="min-h-screen bg-background text-foreground px-4 pb-24 pt-6">
        {/* Navigation */}
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/community")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            커뮤니티로 돌아가기
          </Button>
        </div>

        {/* Group Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  {group.theme && (
                    <Badge variant="secondary" className="text-xs">
                      {group.theme}
                    </Badge>
                  )}
                </div>
                {group.description && (
                  <p className="text-sm text-muted-foreground">
                    {group.description}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {isMember ? (
                  !isCreator && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => leaveGroup.mutate()}
                      disabled={leaveGroup.isPending}
                    >
                      <LogOut className="w-4 h-4 mr-1" />
                      탈퇴
                    </Button>
                  )
                ) : (
                  <Button
                    size="sm"
                    onClick={() => joinGroup.mutate()}
                    disabled={joinGroup.isPending}
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    참여하기
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 text-xs text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{group.member_count}명</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>
                  {format(new Date(group.created_at), "PPP", { locale: ko })}{" "}
                  생성
                </span>
              </div>
              {group.avg_sync_rate && (
                <div className="flex items-center gap-2">
                  <span>평균 매칭률:</span>
                  <Progress value={group.avg_sync_rate} className="w-20 h-1" />
                  <span className="font-medium">{group.avg_sync_rate}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="posts" className="text-xs">
              <MessageSquare className="w-3 h-3 mr-1" />
              게시판
            </TabsTrigger>
            <TabsTrigger value="events" className="text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              이벤트
            </TabsTrigger>
            <TabsTrigger value="members" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              멤버
            </TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-4 mt-4">
            {/* New Post Form */}
            {isMember && (
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Select value={newPostType} onValueChange={setNewPostType}>
                      <SelectTrigger className="w-24 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(postTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value} className="text-xs">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="그룹 멤버들과 나누고 싶은 이야기를 작성해보세요"
                    className="text-xs min-h-20"
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => createPost.mutate()}
                      disabled={
                        createPost.isPending || !newPostContent.trim()
                      }
                      className="text-xs"
                    >
                      <Send className="w-3 h-3 mr-1" />
                      게시하기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Posts List */}
            {postsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="pt-4">
                      <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                      <div className="h-12 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/6"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : posts && posts.length > 0 ? (
              <div className="space-y-3">
                {posts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {postTypeLabels[post.post_type] || post.post_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {post.author_profile?.display_name ||
                              post.author_profile?.email?.split("@")[0] ||
                              "사용자"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(post.created_at), "PPp", {
                              locale: ko,
                            })}
                          </span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreHorizontal className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <button
                          onClick={() => toggleLike.mutate(post.id)}
                          className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
                            post.user_liked ? "text-red-500" : ""
                          }`}
                        >
                          <Heart
                            className={`w-3 h-3 ${
                              post.user_liked ? "fill-current" : ""
                            }`}
                          />
                          <span>{post.likes_count}</span>
                        </button>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          <span>{post.comments_count}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    아직 게시글이 없습니다
                  </p>
                  {isMember && (
                    <p className="text-xs text-muted-foreground mt-1">
                      첫 번째 글을 작성해보세요
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4 mt-4">
            {eventsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="pt-4">
                      <div className="h-5 bg-muted rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/4 mb-2"></div>
                      <div className="h-8 bg-muted rounded w-20"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : events && events.length > 0 ? (
              <div className="space-y-3">
                {events.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {eventTypeLabels[event.event_type] ||
                                event.event_type}
                            </Badge>
                            <span className="text-sm font-medium">
                              {event.title}
                            </span>
                          </div>
                          {event.description && (
                            <p className="text-xs text-muted-foreground">
                              {event.description}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant={event.is_registered ? "outline" : "default"}
                          onClick={() => registerEvent.mutate(event.id)}
                          disabled={
                            registerEvent.isPending ||
                            (!event.is_registered &&
                              event.max_participants !== null &&
                              event.participants_count >=
                                event.max_participants)
                          }
                          className="text-xs"
                        >
                          {event.is_registered ? "취소" : "참가"}
                        </Button>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {format(new Date(event.start_time), "PPP p", {
                              locale: ko,
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {event.is_online
                              ? "온라인"
                              : event.location || "장소 미정"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>
                            {event.participants_count}명
                            {event.max_participants &&
                              ` / ${event.max_participants}명`}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    예정된 이벤트가 없습니다
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  멤버 목록 ({members?.length || 0}명)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {membersLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="animate-pulse flex items-center gap-3 p-2"
                      >
                        <div className="w-8 h-8 bg-muted rounded-full"></div>
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                      </div>
                    ))}
                  </div>
                ) : members && members.length > 0 ? (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {(
                                member.profile?.display_name ||
                                member.profile?.email ||
                                "?"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium flex items-center gap-2">
                              {member.profile?.display_name ||
                                member.profile?.email?.split("@")[0] ||
                                "사용자"}
                              {member.role === "admin" && (
                                <Badge variant="default" className="text-xs">
                                  관리자
                                </Badge>
                              )}
                              {member.user_id === group?.creator_id && (
                                <Badge variant="secondary" className="text-xs">
                                  생성자
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(member.joined_at), "PPP", {
                                locale: ko,
                              })}{" "}
                              가입
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    멤버가 없습니다
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
};

export default GroupDetail;
