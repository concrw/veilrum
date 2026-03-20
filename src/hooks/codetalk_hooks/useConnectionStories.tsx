import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface ConnectionStory {
  id: string;
  connection_id: string;
  user_id: string;
  keyword: string;
  definition: string;
  memory: string;
  reactions: number;
  created_at: string;
  updated_at: string;
}

export const useConnectionStories = (connectionId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: stories = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['connection-stories', connectionId],
    queryFn: async () => {
      if (!user?.id || !connectionId) throw new Error('Missing user or connection ID');
      
      const { data, error } = await supabase
        .from('connection_stories')
        .select('*')
        .eq('connection_id', connectionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!connectionId,
  });

  const createStory = useMutation({
    mutationFn: async (newStory: {
      keyword: string;
      definition: string;
      memory: string;
    }) => {
      if (!user?.id || !connectionId) throw new Error('Missing user or connection ID');

      const { data, error } = await supabase
        .from('connection_stories')
        .insert({
          connection_id: connectionId,
          user_id: user.id,
          keyword: newStory.keyword,
          definition: newStory.definition,
          memory: newStory.memory,
        })
        .select();

      if (error) throw error;
      
      const storyData = data?.[0];
      if (!storyData) throw new Error('Failed to create story');
      
      return storyData;
    },
    onSuccess: (newStory) => {
      // 낙관적 업데이트
      queryClient.setQueryData(['connection-stories', connectionId], (old: any[]) => {
        if (!old) return [newStory];
        return [newStory, ...old];
      });
      toast.success('스토리가 추가되었습니다');
    },
    onError: (error) => {
      console.error('Error creating story:', error);
      toast.error('스토리 추가에 실패했습니다');
    },
  });

  const updateStory = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; reactions?: number }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('connection_stories')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select();

      if (error) throw error;
      
      const updatedStoryData = data?.[0];
      if (!updatedStoryData) throw new Error('Failed to update story');
      
      return updatedStoryData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connection-stories', connectionId] });
    },
    onError: (error) => {
      console.error('Error updating story:', error);
      toast.error('스토리 업데이트에 실패했습니다');
    },
  });

  // 실시간 스토리 구독 추가
  
  useEffect(() => {
    if (!connectionId || !user?.id) return;

    const channel = supabase
      .channel(`connection-stories-${connectionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'connection_stories',
          filter: `connection_id=eq.${connectionId}`,
        },
        (payload) => {
          console.log('New story received:', payload);
          // 새 스토리가 현재 사용자가 작성한 것이 아닌 경우에만 즉시 업데이트
          if (payload.new.user_id !== user.id) {
            queryClient.setQueryData(['connection-stories', connectionId], (old: any[]) => {
              if (!old) return [payload.new];
              // 중복 방지
              const exists = old.some(story => story.id === payload.new.id);
              if (exists) return old;
              return [payload.new, ...old];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [connectionId, user?.id, queryClient]);

  return {
    stories,
    isLoading,
    error,
    createStory,
    updateStory,
  };
};