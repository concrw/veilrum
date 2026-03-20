// src/pages/FModeChat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Send, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import NetworkBackground from '../components/NetworkBackground';
import MessageBubble from '../components/chat/MessageBubble';
import VoiceInput from '../components/voice/VoiceInput';
import TTSButton from '../components/voice/TTSButton';
import { ChatMessage } from '../types';
import { F_MODE_RESPONSES } from '../utils/constants';
import { openaiService, ChatMessage as OpenAIChatMessage } from '../services/openai';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { challengeService } from '../services/challengeService';
import { audioService } from '../services/audioService';

interface FModeChatProps {
  onNavigate: (screen: string) => void;
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const FModeChat: React.FC<FModeChatProps> = ({
  onNavigate,
  chatMessages,
  setChatMessages
}) => {
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoTTS, setAutoTTS] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Check if OpenAI is configured
  useEffect(() => {
    const aiConfigured = openaiService.isConfigured();
    setUseAI(aiConfigured);
    if (!aiConfigured) {
      console.warn('OpenAI not configured. Using fallback responses.');
    }
  }, []);

  // Create session when component mounts
  useEffect(() => {
    if (user) {
      createSession();
    }
  }, [user]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const createSession = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          mode: 'F',
          title: 'F모드 상담',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      setSessionId(data.id);
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  const saveMessage = async (role: 'user' | 'assistant', content: string) => {
    if (!sessionId || !user) return;

    try {
      await supabase.from('messages').insert({
        session_id: sessionId,
        role,
        content,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to save message:', err);
    }
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || currentMessage;
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      type: 'user',
      content: text,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);
    setError(null);

    // Save user message
    await saveMessage('user', userMessage.content);

    try {
      let aiResponse: string;

      if (useAI) {
        // Use OpenAI API
        const conversationHistory: OpenAIChatMessage[] = chatMessages.map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

        aiResponse = await openaiService.getFModeResponse(
          text,
          conversationHistory
        );
      } else {
        // Fallback to random responses
        await new Promise(resolve => setTimeout(resolve, 1500));
        aiResponse = F_MODE_RESPONSES[Math.floor(Math.random() * F_MODE_RESPONSES.length)];
      }

      const aiMessage: ChatMessage = {
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiMessage]);

      // Save AI message
      await saveMessage('assistant', aiResponse);

      // Auto TTS if enabled
      if (autoTTS && audioService.isVoiceEnabled()) {
        audioService.speak(aiResponse);
      }

      // 챌린지 진행도 자동 기록
      if (user && sessionId) {
        try {
          await challengeService.recordConsultationAction(user.id, sessionId, 'F');
        } catch (challengeErr) {
          console.error('Failed to record challenge action:', challengeErr);
        }
      }
    } catch (err: any) {
      console.error('Failed to get AI response:', err);
      setError(err.message || 'AI 응답을 받아오는데 실패했습니다.');

      // Fallback response on error
      const fallbackMessage: ChatMessage = {
        type: 'ai',
        content: '죄송해요, 잠시 문제가 생겼어요. 계속 말씀해주시면 다시 답변드릴게요.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setCurrentMessage(text);
    // Optionally auto-send after voice input
    // sendMessage(text);
  };

  const handleVoiceError = (errorMsg: string) => {
    setError(errorMsg);
  };

  return (
    <div className="min-h-screen relative pb-20">
      <NetworkBackground />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="border-b border-white border-opacity-10 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center">
            <button onClick={() => onNavigate('main')} className="text-gray-400 hover:text-white mr-4">
              ←
            </button>
            <div className="flex-1">
              <h1 className="text-sm font-light text-white opacity-90">F모드 상담</h1>
              <p className="text-xs text-gray-400 opacity-70">
                감정적 위로와 공감 {useAI && '• AI 상담'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Auto TTS Toggle */}
              {audioService.isVoiceEnabled() && (
                <button
                  onClick={() => setAutoTTS(!autoTTS)}
                  className={`p-2 rounded-full transition-colors ${
                    autoTTS ? 'bg-pink-500/20 text-pink-400' : 'text-gray-500 hover:text-gray-300'
                  }`}
                  title={autoTTS ? '자동 읽기 켜짐' : '자동 읽기 꺼짐'}
                >
                  {autoTTS ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
              )}
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-red-300">당신 편이에요</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto px-6 py-4">
          <div className="max-w-lg mx-auto space-y-4">
            {error && (
              <div className="bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 p-3 rounded-lg flex items-start space-x-2">
                <AlertCircle size={16} className="text-red-400 mt-0.5" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}

            {chatMessages.map((message, index) => (
              <div key={index} className="relative group">
                <MessageBubble message={message} />
                {/* TTS Button for AI messages */}
                {message.type === 'ai' && audioService.isVoiceEnabled() && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <TTSButton text={message.content} size="sm" />
                  </div>
                )}
              </div>
            ))}

            {/* 타이핑 인디케이터 */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white bg-opacity-5 text-gray-400 backdrop-blur-sm p-4 rounded-lg max-w-xs">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* 입력 영역 */}
        <div className="border-t border-white border-opacity-10 p-4 backdrop-blur-sm">
          <div className="max-w-lg mx-auto">
            {/* 빠른 응답 버튼들 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {['힘들어요', '속상해요', '화가 나요', '울고 싶어요'].map((quickReply) => (
                <button
                  key={quickReply}
                  onClick={() => setCurrentMessage(quickReply)}
                  className="text-xs px-3 py-1 bg-white bg-opacity-5 border border-white border-opacity-20 text-gray-300 hover:bg-opacity-10 hover:text-white transition-all duration-200"
                  disabled={isLoading}
                >
                  {quickReply}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-3">
              <textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="무엇이든 편하게 말씀해주세요..."
                rows={1}
                disabled={isLoading}
                className="flex-1 bg-white bg-opacity-5 border border-white border-opacity-20 text-white placeholder-gray-400 font-light text-sm px-4 py-3 focus:outline-none focus:border-opacity-40 resize-none disabled:opacity-50"
                style={{ minHeight: '44px' }}
              />

              {/* Voice Input */}
              <VoiceInput
                onTranscript={handleVoiceTranscript}
                onError={handleVoiceError}
                disabled={isLoading}
              />

              <button
                onClick={() => sendMessage()}
                disabled={!currentMessage.trim() || isLoading}
                className={`p-3 transition-colors duration-200 ${
                  currentMessage.trim() && !isLoading ? 'text-white' : 'text-gray-500'
                }`}
              >
                <Send size={18} />
              </button>
            </div>

            {/* 상담 안내 */}
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500 opacity-70">
                F모드는 감정적 위로에 집중합니다. 당신의 마음을 이해해요
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FModeChat;
