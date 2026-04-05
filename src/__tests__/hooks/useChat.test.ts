import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: () => ({
      select: () => ({
        or: () => ({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
        eq: () => ({
          order: () => ({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
        in: () => ({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
          neq: () => ({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
      insert: () => ({
        select: () => ({
          single: vi.fn().mockResolvedValue({ data: {}, error: null }),
        }),
      }),
      update: () => ({
        eq: () => ({
          neq: () => ({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      }),
    }),
    channel: () => ({
      on: () => ({
        subscribe: vi.fn(),
      }),
    }),
    removeChannel: vi.fn(),
    rpc: vi.fn().mockResolvedValue({ data: 'room-id', error: null }),
  },
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
  }),
}));

const chatModule = await import('@/hooks/useChat');

describe('useChat exports', () => {
  it('exports useChatRooms hook', () => {
    expect(typeof chatModule.useChatRooms).toBe('function');
  });

  it('exports useChatMessages hook', () => {
    expect(typeof chatModule.useChatMessages).toBe('function');
  });

  it('exports useSendMessage hook', () => {
    expect(typeof chatModule.useSendMessage).toBe('function');
  });

  it('exports useMarkMessagesAsRead hook', () => {
    expect(typeof chatModule.useMarkMessagesAsRead).toBe('function');
  });

  it('exports useGetOrCreateChatRoom hook', () => {
    expect(typeof chatModule.useGetOrCreateChatRoom).toBe('function');
  });

  it('exports useUnreadMessagesCount hook', () => {
    expect(typeof chatModule.useUnreadMessagesCount).toBe('function');
  });
});

describe('ChatRoom interface shape', () => {
  it('ChatRoom type has expected fields', () => {
    const room: chatModule.ChatRoom = {
      id: 'room-1',
      participant_1: 'user-a',
      participant_2: 'user-b',
      last_message_at: null,
      created_at: '2024-01-01',
    };
    expect(room.id).toBe('room-1');
    expect(room.participant_1).toBe('user-a');
    expect(room.participant_2).toBe('user-b');
  });

  it('ChatRoom supports optional fields', () => {
    const room: chatModule.ChatRoom = {
      id: 'room-2',
      participant_1: 'user-a',
      participant_2: 'user-b',
      last_message_at: '2024-06-01T12:00:00Z',
      created_at: '2024-01-01',
      other_user: { id: 'user-b', email: 'b@test.com', display_name: 'User B' },
      last_message: 'Hello',
      unread_count: 3,
    };
    expect(room.other_user?.display_name).toBe('User B');
    expect(room.unread_count).toBe(3);
  });
});

describe('ChatMessage interface shape', () => {
  it('ChatMessage has required fields', () => {
    const msg: chatModule.ChatMessage = {
      id: 'msg-1',
      room_id: 'room-1',
      sender_id: 'user-a',
      content: 'Hello!',
      is_read: false,
      created_at: '2024-06-01T12:00:00Z',
    };
    expect(msg.content).toBe('Hello!');
    expect(msg.is_read).toBe(false);
  });
});
