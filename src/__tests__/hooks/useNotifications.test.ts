import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
          eq: () => vi.fn().mockResolvedValue({ count: 0, error: null }),
        }),
      }),
      update: () => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      delete: () => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  },
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
  }),
}));

const notifModule = await import('@/hooks/useNotifications');

describe('useNotifications exports', () => {
  it('exports useNotifications hook', () => {
    expect(typeof notifModule.useNotifications).toBe('function');
  });

  it('exports useUnreadNotificationsCount hook', () => {
    expect(typeof notifModule.useUnreadNotificationsCount).toBe('function');
  });

  it('exports useMarkNotificationAsRead hook', () => {
    expect(typeof notifModule.useMarkNotificationAsRead).toBe('function');
  });

  it('exports useMarkAllNotificationsAsRead hook', () => {
    expect(typeof notifModule.useMarkAllNotificationsAsRead).toBe('function');
  });

  it('exports useDeleteNotification hook', () => {
    expect(typeof notifModule.useDeleteNotification).toBe('function');
  });

  it('exports useClearAllNotifications hook', () => {
    expect(typeof notifModule.useClearAllNotifications).toBe('function');
  });
});

describe('Notification interface shape', () => {
  it('Notification has required fields', () => {
    const notif: notifModule.Notification = {
      id: 'notif-1',
      user_id: 'user-1',
      type: 'match_request',
      title: 'New Match',
      message: 'Someone wants to match with you',
      data: { match_id: 'match-1' },
      is_read: false,
      created_at: '2024-06-01T12:00:00Z',
      read_at: null,
    };
    expect(notif.id).toBe('notif-1');
    expect(notif.type).toBe('match_request');
    expect(notif.is_read).toBe(false);
    expect(notif.read_at).toBeNull();
  });

  it('Notification supports all notification types', () => {
    const types: notifModule.NotificationType[] = [
      'match_request',
      'match_accepted',
      'match_declined',
      'group_invite',
      'group_post',
      'group_comment',
      'group_event',
      'system',
    ];
    expect(types).toHaveLength(8);
    // Just ensure each type is assignable
    for (const t of types) {
      const notif: notifModule.Notification = {
        id: 'test',
        user_id: 'u',
        type: t,
        title: '',
        message: '',
        data: {},
        is_read: false,
        created_at: '',
        read_at: null,
      };
      expect(notif.type).toBe(t);
    }
  });
});
