import { useToast } from '@/hooks/use-toast';
import { parseSupabaseError, ERRORS } from '@/constants/errors';

/**
 * 일관된 에러 처리를 위한 훅
 *
 * @example
 * const { handleError, handleSuccess } = useErrorHandler();
 *
 * try {
 *   await someAsyncOperation();
 *   handleSuccess('저장되었습니다');
 * } catch (error) {
 *   handleError(error, '저장에 실패했습니다');
 * }
 */
export const useErrorHandler = () => {
  const { toast } = useToast();

  /**
   * 에러를 처리하고 사용자에게 토스트 메시지를 표시합니다
   *
   * @param error - 발생한 에러 객체
   * @param customMessage - 커스텀 에러 메시지 (선택사항)
   * @param shouldLog - 콘솔에 에러를 로깅할지 여부 (기본: true)
   */
  const handleError = (
    error: any,
    customMessage?: string,
    shouldLog = true
  ) => {
    if (shouldLog) {
      console.error('❌ Error:', error);
    }

    const errorMessage = customMessage || parseSupabaseError(error);

    toast({
      title: '오류',
      description: errorMessage,
      variant: 'destructive',
    });
  };

  /**
   * 성공 메시지를 표시합니다
   *
   * @param message - 표시할 성공 메시지
   * @param title - 토스트 제목 (기본: '성공')
   */
  const handleSuccess = (message: string, title = '성공') => {
    toast({
      title,
      description: message,
    });
  };

  /**
   * 경고 메시지를 표시합니다
   *
   * @param message - 표시할 경고 메시지
   * @param title - 토스트 제목 (기본: '알림')
   */
  const handleWarning = (message: string, title = '알림') => {
    toast({
      title,
      description: message,
      variant: 'default',
    });
  };

  /**
   * 인증 에러를 처리하고 로그인 페이지로 리다이렉트합니다
   *
   * @param navigate - react-router-dom의 navigate 함수
   */
  const handleAuthError = (navigate: (path: string) => void) => {
    toast({
      title: ERRORS.AUTH.LOGIN_REQUIRED,
      description: ERRORS.AUTH.SESSION_EXPIRED,
      variant: 'destructive',
    });
    navigate('/auth');
  };

  return {
    handleError,
    handleSuccess,
    handleWarning,
    handleAuthError,
  };
};
