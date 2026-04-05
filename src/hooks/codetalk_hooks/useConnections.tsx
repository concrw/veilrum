import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface Connection {
  id: string;
  requester_id: string;
  requested_id: string;
  requester_name_for_requested: string;
  relationship_type: 'couple' | 'business' | 'custom';
  status: 'pending' | 'active' | 'rejected';
  custom_relationship_name?: string;
  requester_notes?: string;
  accepter_notes?: string;
  created_at: string;
  updated_at: string;
  responded_at?: string;
  
  // UI에서 사용할 추가 필드들
  name?: string;
  avatar_url?: string;
  recent_keyword?: string;
  shared_days?: number;
  connected_user_id?: string;
}

export const useConnections = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: connections = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['connections', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // 내가 요청한 연결들과 받은 연결들을 모두 조회 (삭제되지 않은 것만)
      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .or(`requester_id.eq.${user.id},requested_id.eq.${user.id}`)
        .in('status', ['active', 'pending'])
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // UI에 맞게 데이터 변환
      const transformedData = (data || []).map((conn) => ({
        ...conn,
        // 상대방의 정보를 name으로 설정
        name: conn.requester_id === user.id 
          ? '요청된 사용자'
          : conn.requester_name_for_requested,
        // connected_user_id는 상대방의 ID
        connected_user_id: conn.requester_id === user.id ? conn.requested_id : conn.requester_id
      }));
      
      return transformedData;
    },
    enabled: !!user?.id,
  });

  // 실시간 연결 상태 업데이트 구독
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`user-connections-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connections',
          filter: `or(requester_id.eq.${user.id},requested_id.eq.${user.id})`,
        },
        (payload) => {
          console.log('Connection status changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['connections', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const createConnection = useMutation({
    mutationFn: async (newConnection: {
      requested_id: string;
      requester_name_for_requested: string;
      relationship_type: 'couple' | 'business' | 'custom';
      custom_relationship_name?: string;
      requester_notes?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await (supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> })
        .from('connections')
        .insert({
          requester_id: user.id,
          requested_id: newConnection.requested_id,
          requester_name_for_requested: newConnection.requester_name_for_requested,
          relationship_type: newConnection.relationship_type,
          status: 'pending',
          custom_relationship_name: newConnection.custom_relationship_name,
          requester_notes: newConnection.requester_notes,
        })
        .select();

      if (error) throw error;
      return data?.[0] || null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections', user?.id] });
      toast({ title: '연결 요청이 발송되었습니다' });
    },
    onError: (error) => {
      console.error('Error creating connection:', error);
      toast({ title: '연결 요청 발송에 실패했습니다', variant: 'destructive' });
    },
  });

  const updateConnection = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; accepter_notes?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('connections')
        .update({
          ...updates,
          responded_at: updates.status === 'active' ? new Date().toISOString() : undefined
        })
        .eq('id', id)
        .or(`requester_id.eq.${user.id},requested_id.eq.${user.id}`)
        .select();

      if (error) throw error;
      return data?.[0] || null;
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: ['connections', user?.id] });
      const previousConnections = queryClient.getQueryData<Connection[]>(['connections', user?.id]);

      queryClient.setQueryData<Connection[]>(['connections', user?.id], (old = []) =>
        old.map(conn => conn.id === id ? { ...conn, ...updates } : conn)
      );

      return { previousConnections };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections', user?.id] });
      toast({ title: '연결이 업데이트되었습니다' });
    },
    onError: (error, variables, context) => {
      if (context?.previousConnections) {
        queryClient.setQueryData(['connections', user?.id], context.previousConnections);
      }
      console.error('Error updating connection:', error);
      toast({ title: '연결 업데이트에 실패했습니다', variant: 'destructive' });
    },
  });

  const deleteConnection = useMutation({
    mutationFn: async (connectionId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('connections')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', connectionId)
        .or(`requester_id.eq.${user.id},requested_id.eq.${user.id}`)
        .is('deleted_at', null);

      if (error) throw error;
    },
    onMutate: async (connectionId) => {
      await queryClient.cancelQueries({ queryKey: ['connections', user?.id] });
      const previousConnections = queryClient.getQueryData<Connection[]>(['connections', user?.id]);

      queryClient.setQueryData<Connection[]>(['connections', user?.id], (old = []) =>
        old.filter(conn => conn.id !== connectionId)
      );

      return { previousConnections };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections', user?.id] });
      toast({ title: '연결이 삭제되었습니다' });
    },
    onError: (error, variables, context) => {
      if (context?.previousConnections) {
        queryClient.setQueryData(['connections', user?.id], context.previousConnections);
      }
      console.error('Error deleting connection:', error);
      toast({ title: '연결 삭제에 실패했습니다', variant: 'destructive' });
    },
  });

  return {
    connections,
    isLoading,
    error,
    createConnection,
    updateConnection,
    deleteConnection,
  };
};