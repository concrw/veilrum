import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface ConnectionMessage {
  id: string;
  connection_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
}

export const useConnectionMessages = (connectionId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: messages = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['connection-messages', connectionId],
    queryFn: async () => {
      if (!user?.id || !connectionId) throw new Error('Missing user or connection ID');
      
      const { data, error } = await supabase
        .from('connection_messages')
        .select('*')
        .eq('connection_id', connectionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!connectionId,
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id || !connectionId) throw new Error('Missing user or connection ID');

      const { data, error } = await supabase
        .from('connection_messages')
        .insert({
          connection_id: connectionId,
          sender_id: user.id,
          content: content,
          message_type: 'text',
        })
        .select();

      if (error) throw error;
      
      const messageData = data?.[0];
      if (!messageData) throw new Error('Failed to create message');

      
      // 메시지 전송 후 last_seen 업데이트
      await updateLastSeen();
      
      return messageData;
    },
    onSuccess: (newMessage) => {
      // 낙관적 업데이트
      queryClient.setQueryData(['connection-messages', connectionId], (old: Record<string, unknown>[]) => {
        if (!old) return [newMessage];
        return [...old, newMessage];
      });
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast({ title: '메시지 전송에 실패했습니다', variant: 'destructive' });
    },
  });

  // 실시간 메시지 구독
  useEffect(() => {
    if (!connectionId || !user?.id) return;

    const channel = supabase
      .channel(`connection-messages-${connectionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'connection_messages',
          filter: `connection_id=eq.${connectionId}`,
        },
        (payload) => {
          console.log('New message received:', payload);
          // 새 메시지가 현재 사용자가 보낸 것이 아닌 경우에만 즉시 업데이트
          if (payload.new.sender_id !== user.id) {
            queryClient.setQueryData(['connection-messages', connectionId], (old: Record<string, unknown>[]) => {
              if (!old) return [payload.new];
              // 중복 방지
              const exists = old.some(msg => msg.id === payload.new.id);
              if (exists) return old;
              return [...old, payload.new];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [connectionId, user?.id, queryClient]);

  // 사용자 활동 업데이트 (메시지 전송시)
  const updateLastSeen = async () => {
    try {
      await supabase.rpc('update_my_last_seen');
    } catch (error) {
      console.error('Error updating last seen:', error);
    }
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
  };
};