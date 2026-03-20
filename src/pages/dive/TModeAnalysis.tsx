// src/pages/TModeAnalysis.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Brain, AlertCircle, TrendingUp, Lightbulb, AlertTriangle } from 'lucide-react';
import NetworkBackground from '../components/NetworkBackground';
import MessageBubble from '../components/chat/MessageBubble';
import { ChatMessage } from '../types';
import { T_MODE_RESPONSES } from '../utils/constants';
import { openaiService, ChatMessage as OpenAIChatMessage } from '../services/openai';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { challengeService } from '../services/challengeService';

interface TModeAnalysisProps {
  onNavigate: (screen: string) => void;
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

interface AnalysisResult {
  emotion?: string;
  conflict?: string;
  pattern?: string;
  solutions?: string[];
  warnings?: string[];
}

const TModeAnalysis: React.FC<TModeAnalysisProps> = ({
  onNavigate,
  chatMessages,
  setChatMessages
}) => {
  const [currentMessage, setCurrentMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const aiConfigured = openaiService.isConfigured();
    setUseAI(aiConfigured);
    if (!aiConfigured) {
      console.warn('OpenAI not configured. Using fallback responses.');
    }
  }, []);

  useEffect(() => {
    if (user) {
      createSession();
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, analysisResult]);

  const createSession = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          mode: 'T',
          title: 'T모드 분석',
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

  const parseAnalysis = (text: string): AnalysisResult => {
    const result: AnalysisResult = {};

    // 감정 분석 추출
    const emotionMatch = text.match(/📊\s*\*\*감정 분석\*\*\s*\n([^\n🔍]+)/);
    if (emotionMatch) {
      result.emotion = emotionMatch[1].trim();
    }

    // 핵심 갈등 추출
    const conflictMatch = text.match(/🔍\s*\*\*핵심 갈등\*\*\s*\n([^\n🔄]+)/);
    if (conflictMatch) {
      result.conflict = conflictMatch[1].trim();
    }

    // 패턴 분석 추출
    const patternMatch = text.match(/🔄\s*\*\*패턴 분석\*\*\s*\n([^\n💡]+)/);
    if (patternMatch) {
      result.pattern = patternMatch[1].trim();
    }

    // 해결책 추출
    const solutionsMatch = text.match(/💡\s*\*\*해결책\*\*\s*\n([\s\S]*?)(?=⚠️|$)/);
    if (solutionsMatch) {
      const solutionsText = solutionsMatch[1];
      result.solutions = solutionsText
        .split(/\n/)
        .filter(line => line.match(/^[A-C]안:/))
        .map(line => line.replace(/^[A-C]안:\s*/, '').trim());
    }

    // 주의사항 추출
    const warningsMatch = text.match(/⚠️\s*\*\*주의사항\*\*\s*\n([\s\S]+)/);
    if (warningsMatch) {
      const warningsText = warningsMatch[1];
      result.warnings = warningsText
        .split(/\n/)
        .filter(line => line.trim().length > 0 && !line.includes('말투:'))
        .map(line => line.replace(/^[-•]\s*/, '').trim());
    }

    return result;
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    await saveMessage('user', userMessage.content);

    try {
      let aiResponse: string;

      if (useAI) {
        const conversationHistory: OpenAIChatMessage[] = chatMessages.map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

        aiResponse = await openaiService.getTModeResponse(
          currentMessage,
          conversationHistory
        );
      } else {
        await new Promise(resolve => setTimeout(resolve, 2000));
        aiResponse = T_MODE_RESPONSES[Math.floor(Math.random() * T_MODE_RESPONSES.length)];
      }

      const aiMessage: ChatMessage = {
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiMessage]);
      await saveMessage('assistant', aiResponse);

      // 분석 결과 파싱
      const analysis = parseAnalysis(aiResponse);
      setAnalysisResult(analysis);

      // 챌린지 진행도 자동 기록
      if (user && sessionId) {
        try {
          await challengeService.recordConsultationAction(user.id, sessionId, 'T');
        } catch (challengeErr) {
          console.error('Failed to record challenge action:', challengeErr);
        }
      }
    } catch (err: any) {
      console.error('Failed to get AI response:', err);
      setError(err.message || 'AI 응답을 받아오는데 실패했습니다.');

      const fallbackMessage: ChatMessage = {
        type: 'ai',
        content: '죄송해요, 잠시 문제가 생겼어요. 다시 시도해주시면 분석해드릴게요.',
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());

        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('마이크 권한이 필요합니다.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    if (!useAI) {
      setError('음성 인식은 OpenAI API 키가 필요합니다.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const transcribedText = await openaiService.transcribeAudio(audioBlob);
      setCurrentMessage(transcribedText);
    } catch (err: any) {
      console.error('Failed to transcribe audio:', err);
      setError(err.message || '음성 인식에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
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
              <h1 className="text-sm font-light text-white opacity-90">T모드 분석</h1>
              <p className="text-xs text-gray-400 opacity-70">
                논리적 분석과 해결책 {useAI && '• AI 분석'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-blue-300">객관적 분석</span>
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
              <MessageBubble key={index} message={message} />
            ))}

            {/* 구조화된 분석 결과 */}
            {analysisResult && Object.keys(analysisResult).length > 0 && (
              <div className="space-y-3">
                {/* 감정 분석 */}
                {analysisResult.emotion && (
                  <div className="border border-blue-400 border-opacity-30 bg-blue-500 bg-opacity-5 p-4 rounded">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp size={14} className="text-blue-400" />
                      <h3 className="text-xs font-medium text-blue-300">감정 분석</h3>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">{analysisResult.emotion}</p>
                  </div>
                )}

                {/* 핵심 갈등 */}
                {analysisResult.conflict && (
                  <div className="border border-yellow-400 border-opacity-30 bg-yellow-500 bg-opacity-5 p-4 rounded">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle size={14} className="text-yellow-400" />
                      <h3 className="text-xs font-medium text-yellow-300">핵심 갈등</h3>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">{analysisResult.conflict}</p>
                  </div>
                )}

                {/* 패턴 분석 */}
                {analysisResult.pattern && (
                  <div className="border border-purple-400 border-opacity-30 bg-purple-500 bg-opacity-5 p-4 rounded">
                    <div className="flex items-center space-x-2 mb-2">
                      <Brain size={14} className="text-purple-400" />
                      <h3 className="text-xs font-medium text-purple-300">패턴 분석</h3>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">{analysisResult.pattern}</p>
                  </div>
                )}

                {/* 해결책 */}
                {analysisResult.solutions && analysisResult.solutions.length > 0 && (
                  <div className="border border-green-400 border-opacity-30 bg-green-500 bg-opacity-5 p-4 rounded">
                    <div className="flex items-center space-x-2 mb-3">
                      <Lightbulb size={14} className="text-green-400" />
                      <h3 className="text-xs font-medium text-green-300">해결책</h3>
                    </div>
                    <div className="space-y-2">
                      {analysisResult.solutions.map((solution, idx) => (
                        <div key={idx} className="flex items-start space-x-2">
                          <span className="text-xs text-green-400 font-medium mt-0.5">
                            {String.fromCharCode(65 + idx)}안:
                          </span>
                          <p className="text-xs text-gray-300 leading-relaxed flex-1">{solution}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 주의사항 */}
                {analysisResult.warnings && analysisResult.warnings.length > 0 && (
                  <div className="border border-red-400 border-opacity-30 bg-red-500 bg-opacity-5 p-4 rounded">
                    <div className="flex items-center space-x-2 mb-3">
                      <AlertTriangle size={14} className="text-red-400" />
                      <h3 className="text-xs font-medium text-red-300">주의사항</h3>
                    </div>
                    <div className="space-y-1">
                      {analysisResult.warnings.map((warning, idx) => (
                        <p key={idx} className="text-xs text-gray-300 leading-relaxed">• {warning}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 타이핑 인디케이터 */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white bg-opacity-5 text-gray-400 backdrop-blur-sm p-4 rounded-lg max-w-xs">
                  <div className="flex items-center space-x-2">
                    <Brain size={14} className="text-blue-400" />
                    <span className="text-xs">분석 중...</span>
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
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
            {/* 빠른 분석 주제 버튼들 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {['대화 내용 분석해줘', '이 상황 어떻게 봐?', '패턴을 찾아줘', '해결책 알려줘'].map((quickAnalysis) => (
                <button
                  key={quickAnalysis}
                  onClick={() => setCurrentMessage(quickAnalysis)}
                  disabled={isLoading}
                  className="text-xs px-3 py-1 bg-white bg-opacity-5 border border-white border-opacity-20 text-gray-300 hover:bg-opacity-10 hover:text-white transition-all duration-200 disabled:opacity-50"
                >
                  {quickAnalysis}
                </button>
              ))}
            </div>

            <div className="flex space-x-3">
              <textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="분석하고 싶은 상황이나 대화를 자세히 설명해주세요..."
                rows={2}
                disabled={isLoading}
                className="flex-1 bg-white bg-opacity-5 border border-white border-opacity-20 text-white placeholder-gray-400 font-light text-sm px-4 py-3 focus:outline-none focus:border-opacity-40 resize-none disabled:opacity-50"
                style={{ minHeight: '60px' }}
              />
              <div className="flex flex-col space-y-2">
                <button
                  onClick={toggleRecording}
                  disabled={isLoading}
                  className={`p-2 transition-colors duration-200 ${
                    isRecording ? 'text-red-400 animate-pulse' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
                <button
                  onClick={sendMessage}
                  disabled={!currentMessage.trim() || isLoading}
                  className={`p-2 transition-colors duration-200 ${
                    currentMessage.trim() && !isLoading ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>

            {/* 상담 안내 */}
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500 opacity-70">
                T모드는 객관적 분석에 집중합니다. 상황을 논리적으로 해석해요
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TModeAnalysis;
