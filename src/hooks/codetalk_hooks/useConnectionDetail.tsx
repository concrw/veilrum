import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ConnectionDetail {
  id: string;
  requester_id: string;
  requested_id: string;
  requester_name_for_requested: string;
  relationship_type: 'couple' | 'business' | 'custom';
  custom_relationship_name?: string;
  status: string;
  created_at: string;
  requester_nickname_for_requested?: string;
  requested_nickname_for_requester?: string;
  
  // 연결된 사용자 정보
  connected_user_id: string;
  connected_user_email?: string;
  connected_user_name?: string;
  shared_days: number;
}

export const useConnectionDetail = (connectionId: string) => {
  const { user } = useAuth();

  const {
    data: connection,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['connection-detail', connectionId],
    queryFn: async () => {
      if (!user?.id || !connectionId) throw new Error('Missing user or connection ID');
      
      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .eq('id', connectionId)
        .eq('status', 'active')
        .or(`requester_id.eq.${user.id},requested_id.eq.${user.id}`);

      if (error) throw error;
      
      const connectionData = data?.[0];
      if (!connectionData) throw new Error('Connection not found');

      // 상대방 정보 계산
      const isRequester = connectionData.requester_id === user.id;
      const connectedUserId = isRequester ? connectionData.requested_id : connectionData.requester_id;
      
      // 상대방 프로필 정보 가져오기
      const { data: partnerPublic, error: profileError } = await supabase
        .rpc('get_public_profile', { p_user_id: connectedUserId });
      
      const partnerProfile = partnerPublic?.[0];

      const connectedUserName = isRequester 
        ? (partnerProfile?.display_name || '상대방')
        : connectionData.requester_name_for_requested;

      const connectedUserEmail = undefined;

      // 공유 일수 계산 - 연결이 수락된 시점(responded_at)부터 계산
      const sharedStartDate = connectionData.responded_at ? new Date(connectionData.responded_at) : new Date(connectionData.created_at);
      const sharedDays = Math.floor(
        (new Date().getTime() - sharedStartDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        ...connectionData,
        connected_user_id: connectedUserId,
        connected_user_name: connectedUserName,
        connected_user_email: connectedUserEmail,
        shared_days: sharedDays,
      } as ConnectionDetail;
    },
    enabled: !!user?.id && !!connectionId,
  });

  return {
    connection,
    isLoading,
    error,
    refetch,
  };
};