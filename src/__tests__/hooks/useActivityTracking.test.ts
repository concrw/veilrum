import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoisted mocks
const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  insert: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: mocks.getUser,
    },
    from: () => ({
      insert: mocks.insert,
    }),
  },
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
  }),
}));

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/home/vent' }),
}));

const { trackActivity, trackConversion, useAnalytics } = await import(
  '@/hooks/useActivityTracking'
);

describe('useActivityTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exports', () => {
    it('exports trackActivity function', () => {
      expect(typeof trackActivity).toBe('function');
    });

    it('exports trackConversion function', () => {
      expect(typeof trackConversion).toBe('function');
    });

    it('exports useAnalytics hook', () => {
      expect(typeof useAnalytics).toBe('function');
    });

    it('useAnalytics returns trackActivity and trackConversion', () => {
      const analytics = useAnalytics();
      expect(analytics.trackActivity).toBe(trackActivity);
      expect(analytics.trackConversion).toBe(trackConversion);
    });
  });

  describe('trackActivity', () => {
    it('inserts activity when user is authenticated', async () => {
      mocks.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      mocks.insert.mockResolvedValue({ error: null });

      await trackActivity('page_view', { page_path: '/home/vent' });

      expect(mocks.getUser).toHaveBeenCalled();
      expect(mocks.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          activity_type: 'page_view',
          activity_data: { page_path: '/home/vent' },
        })
      );
    });

    it('does nothing when user is not authenticated', async () => {
      mocks.getUser.mockResolvedValue({
        data: { user: null },
      });

      await trackActivity('login');

      expect(mocks.insert).not.toHaveBeenCalled();
    });

    it('does not throw on error', async () => {
      mocks.getUser.mockRejectedValue(new Error('Network error'));

      await expect(trackActivity('login')).resolves.toBeUndefined();
    });
  });

  describe('trackConversion', () => {
    it('inserts conversion event when user is authenticated', async () => {
      mocks.getUser.mockResolvedValue({
        data: { user: { id: 'user-456' } },
      });
      mocks.insert.mockResolvedValue({ error: null });

      await trackConversion('signup', { source: 'organic' });

      expect(mocks.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-456',
          event_name: 'signup',
          event_data: { source: 'organic' },
        })
      );
    });

    it('does nothing when user is not authenticated', async () => {
      mocks.getUser.mockResolvedValue({
        data: { user: null },
      });

      await trackConversion('why_complete');

      expect(mocks.insert).not.toHaveBeenCalled();
    });

    it('does not throw on error', async () => {
      mocks.getUser.mockRejectedValue(new Error('DB error'));

      await expect(trackConversion('signup')).resolves.toBeUndefined();
    });
  });
});
