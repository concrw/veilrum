import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, veilrumDb } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface DmRoom {
  id: string;
  user_a_id: string;
  user_b_id: string;
  is_active: boolean;
  consent_a: boolean;
  consent_b: boolean;
  created_at: string;
  [key: string]: unknown;
}

interface DmMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  is_deleted: boolean;
  is_flagged?: boolean;
  flag_reason?: string;
  created_at: string;
  [key: string]: unknown;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

async function checkMessageSafety(message: string): Promise<{ flagged: boolean; reason?: string }> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/dm-message-filter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) return { flagged: false };
    const data = await res.json();
    return { flagged: data.flagged ?? false, reason: data.reason };
  } catch {
    return { flagged: false };
  }
}

export default function DmPage() {
  const { user, primaryMask } = useAuth();
  const qc = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState<DmRoom | null>(null);
  const [newMsg, setNewMsg] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // 내 DM 룸 목록 (양쪽 동의 완료된 룸만)
  const { data: rooms } = useQuery({
    queryKey: ['dm-rooms', user?.id],
    queryFn: async () => {
      const { data } = await veilrumDb.from('dm_rooms')
        .select('*')
        .or(`user_a_id.eq.${user!.id},user_b_id.eq.${user!.id}`)
        .eq('is_active', true)
        .eq('consent_a', true)
        .eq('consent_b', true)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  // 동의 대기 중인 룸 (상대방이 요청했으나 내가 아직 동의 안 한 룸)
  const { data: pendingRooms, refetch: refetchPending } = useQuery({
    queryKey: ['dm-pending', user?.id],
    queryFn: async () => {
      const { data } = await veilrumDb.from('dm_rooms')
        .select('*')
        .eq('user_b_id', user!.id)
        .eq('consent_a', true)
        .eq('consent_b', false)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const consentMutation = useMutation({
    mutationFn: async ({ roomId, accept }: { roomId: string; accept: boolean }) => {
      if (accept) {
        await veilrumDb.from('dm_rooms').update({ consent_b: true }).eq('id', roomId);
      } else {
        await veilrumDb.from('dm_rooms').update({ is_active: false }).eq('id', roomId);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dm-rooms'] });
      qc.invalidateQueries({ queryKey: ['dm-pending'] });
    },
  });

  // 선택된 룸의 메시지
  const { data: messages } = useQuery({
    queryKey: ['dm-messages', selectedRoom?.id],
    queryFn: async () => {
      const { data } = await veilrumDb.from('dm_messages')
        .select('*')
        .eq('room_id', selectedRoom.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });
      return data ?? [];
    },
    enabled: !!selectedRoom,
    refetchInterval: 5000, // 5초마다 폴링
  });

  // 읽음 처리
  useEffect(() => {
    if (!selectedRoom || !messages || !user) return;
    const unread = messages.filter((m: DmMessage) => m.sender_id !== user.id && !m.is_read);
    if (unread.length === 0) return;
    veilrumDb.from('dm_messages')
      .update({ is_read: true })
      .in('id', unread.map((m: DmMessage) => m.id));
  }, [messages, selectedRoom, user]);

  // 스크롤 하단
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      // AI 유해 메시지 필터
      const { flagged, reason } = await checkMessageSafety(newMsg);
      if (flagged) {
        // 플래그된 메시지는 DB에 저장하되 is_flagged=true로 표시
        await veilrumDb.from('dm_messages').insert({
          room_id: selectedRoom.id,
          sender_id: user!.id,
          content: newMsg,
          is_read: false,
          is_flagged: true,
          flag_reason: reason ?? 'policy_violation',
        });
        throw new Error(reason ?? '이 메시지는 커뮤니티 가이드라인에 맞지 않아 전송되지 않았습니다.');
      }
      await veilrumDb.from('dm_messages').insert({
        room_id: selectedRoom.id,
        sender_id: user!.id,
        content: newMsg,
        is_read: false,
      });
    },
    onSuccess: () => {
      setNewMsg('');
      qc.invalidateQueries({ queryKey: ['dm-messages', selectedRoom?.id] });
    },
    onError: (err: Error) => {
      toast({ title: '전송 실패', description: err.message, variant: 'destructive' });
    },
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (newMsg.trim()) sendMutation.mutate();
    }
  };

  const otherUserId = (room: DmRoom) =>
    room.user_a_id === user?.id ? room.user_b_id : room.user_a_id;

  /* ── 채팅 뷰 ── */
  if (selectedRoom) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] max-w-sm mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-3 px-4 py-4 border-b">
          <button onClick={() => setSelectedRoom(null)}
            className="text-xs text-muted-foreground">←</button>
          <div>
            <p className="text-sm font-medium">익명 대화</p>
            <p className="text-xs text-muted-foreground">{otherUserId(selectedRoom).slice(0, 8)}...</p>
          </div>
        </div>

        {/* 메시지 목록 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages?.map((m: DmMessage) => {
            const isMe = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                  ${isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border rounded-bl-sm'}`}>
                  {m.content}
                </div>
              </div>
            );
          })}
          {messages?.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-8">첫 메시지를 보내보세요</p>
          )}
          <div ref={bottomRef} />
        </div>

        {/* 입력창 */}
        <div className="px-4 py-3 border-t flex items-center gap-2">
          <Input
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지 입력..."
            className="flex-1 text-sm"
          />
          <Button size="sm" onClick={() => sendMutation.mutate()}
            disabled={!newMsg.trim() || sendMutation.isPending}>
            전송
          </Button>
        </div>
      </div>
    );
  }

  /* ── 룸 목록 뷰 ── */
  return (
    <div className="px-4 py-6 max-w-sm mx-auto space-y-5">
      <div>
        <h2 className="text-lg font-semibold">1:1 메시지</h2>
        <p className="text-sm text-muted-foreground mt-1">커뮤니티에서 연결된 대화</p>
      </div>

      {/* 동의 대기 배너 */}
      {pendingRooms && pendingRooms.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">대화 요청</p>
          {pendingRooms.map((room: DmRoom) => (
            <div key={room.id} className="bg-card border border-primary/30 rounded-xl p-4 space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">새 대화 요청</p>
                <p className="text-xs text-muted-foreground">
                  익명 사용자가 1:1 대화를 요청했습니다. 수락하면 메시지를 주고받을 수 있습니다.
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 text-xs"
                  onClick={() => consentMutation.mutate({ roomId: room.id, accept: false })}
                  disabled={consentMutation.isPending}>
                  거절
                </Button>
                <Button size="sm" className="flex-1 text-xs"
                  onClick={() => consentMutation.mutate({ roomId: room.id, accept: true })}
                  disabled={consentMutation.isPending}>
                  수락
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {rooms && rooms.length > 0 ? (
        <div className="space-y-2">
          {rooms.map((room: DmRoom) => {
            const other = otherUserId(room);
            return (
              <button key={room.id}
                onClick={() => setSelectedRoom(room)}
                className="w-full text-left bg-card border rounded-xl p-4 hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    {other.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">익명 사용자</p>
                    <p className="text-xs text-muted-foreground">{other.slice(0, 8)}...</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="bg-card border rounded-2xl p-8 text-center space-y-2">
          <p className="text-muted-foreground text-sm">아직 대화가 없습니다</p>
          <p className="text-xs text-muted-foreground">커뮤니티에서 다른 사용자와 연결되면 여기에 나타납니다</p>
        </div>
      )}
    </div>
  );
}
