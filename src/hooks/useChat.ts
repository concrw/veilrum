import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface ChatRoom {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string | null;
  created_at: string;
  other_user?: {
    id: string;
    email: string;
    display_name: string | null;
  };
  last_message?: string;
  unread_count?: number;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export function useChatRooms() {
  const { user } = useAuth();

  return useQuery<ChatRoom[]>({
    queryKey: ["chat-rooms", user?.id],
    queryFn: async () => {
      // Get all rooms where user is a participant
      const { data: rooms, error } = await supabase
        .from("chat_rooms")
        .select("*")
        .or(`participant_1.eq.${user!.id},participant_2.eq.${user!.id}`)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (error) throw error;
      if (!rooms || rooms.length === 0) return [];

      // Get other participants' profiles
      const otherUserIds = rooms.map((room) =>
        room.participant_1 === user!.id ? room.participant_2 : room.participant_1
      );

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, display_name")
        .in("id", otherUserIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      // Get last message for each room
      const roomIds = rooms.map((r) => r.id);
      const { data: lastMessages } = await supabase
        .from("chat_messages")
        .select("room_id, content")
        .in("room_id", roomIds)
        .order("created_at", { ascending: false });

      const lastMessageMap = new Map<string, string>();
      lastMessages?.forEach((msg) => {
        if (!lastMessageMap.has(msg.room_id)) {
          lastMessageMap.set(msg.room_id, msg.content);
        }
      });

      // Get unread count for each room
      const { data: unreadCounts } = await supabase
        .from("chat_messages")
        .select("room_id")
        .in("room_id", roomIds)
        .neq("sender_id", user!.id)
        .eq("is_read", false);

      const unreadMap = new Map<string, number>();
      unreadCounts?.forEach((msg) => {
        unreadMap.set(msg.room_id, (unreadMap.get(msg.room_id) || 0) + 1);
      });

      return rooms.map((room) => {
        const otherUserId =
          room.participant_1 === user!.id ? room.participant_2 : room.participant_1;
        return {
          ...room,
          other_user: profileMap.get(otherUserId),
          last_message: lastMessageMap.get(room.id),
          unread_count: unreadMap.get(room.id) || 0,
        };
      });
    },
    enabled: !!user,
  });
}

export function useChatMessages(roomId: string | null) {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Subscribe to realtime messages
  useEffect(() => {
    if (!roomId || !user) return;

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          qc.setQueryData<ChatMessage[]>(
            ["chat-messages", roomId],
            (old) => [...(old || []), payload.new as ChatMessage]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, user, qc]);

  return useQuery<ChatMessage[]>({
    queryKey: ["chat-messages", roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!roomId && !!user,
  });
}

export function useSendMessage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, content }: { roomId: string; content: string }) => {
      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          room_id: roomId,
          sender_id: user!.id,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["chat-rooms"] });
    },
  });
}

export function useMarkMessagesAsRead() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      const { error } = await supabase
        .from("chat_messages")
        .update({ is_read: true })
        .eq("room_id", roomId)
        .neq("sender_id", user!.id)
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-rooms"] });
    },
  });
}

export function useGetOrCreateChatRoom() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (otherUserId: string) => {
      const { data, error } = await supabase.rpc("get_or_create_chat_room", {
        p_user_1: user!.id,
        p_user_2: otherUserId,
      });

      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-rooms"] });
    },
  });
}

export function useUnreadMessagesCount() {
  const { user } = useAuth();

  return useQuery<number>({
    queryKey: ["unread-messages-count", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("chat_messages")
        .select("*", { count: "exact", head: true })
        .neq("sender_id", user!.id)
        .eq("is_read", false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}
