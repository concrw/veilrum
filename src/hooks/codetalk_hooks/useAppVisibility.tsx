import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export const useAppVisibility = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        // 앱이 다시 포커스를 받았을 때 중요한 데이터들을 새로고침
        queryClient.invalidateQueries({ queryKey: ['connections'] });
        queryClient.invalidateQueries({ queryKey: ['user-role'] });
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
        queryClient.invalidateQueries({ queryKey: ['current-keyword'] });
        queryClient.invalidateQueries({ queryKey: ['stories'] });
        queryClient.invalidateQueries({ queryKey: ['connection-details'] });
      }
    };

    const handleFocus = () => {
      if (user) {
        // 윈도우가 포커스를 받았을 때도 새로고침
        queryClient.invalidateQueries({ queryKey: ['connections'] });
        queryClient.invalidateQueries({ queryKey: ['user-role'] });
      }
    };

    const handleOnline = () => {
      if (user) {
        // 네트워크가 다시 연결되었을 때 전체 캐시 새로고침
        queryClient.invalidateQueries();
      }
    };

    // 이벤트 리스너 등록
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [queryClient, user]);
};