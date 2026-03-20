// src/pages/Dashboard.tsx
import React from 'react';
import { MessageCircle, Heart } from 'lucide-react';
import NetworkBackground from '../components/NetworkBackground';
import Navigation from '../components/layout/Navigation';
import { SAMPLE_POSTS } from '../utils/constants';

interface DashboardProps {
  onNavigate: (screen: string) => void;
  onStartFMode: () => void;
  onStartTMode: () => void;
  currentQuote: string;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  onNavigate, 
  onStartFMode, 
  onStartTMode, 
  currentQuote 
}) => {
  return (
    <div className="min-h-screen relative pb-20">
      <NetworkBackground />
      
      <div className="relative z-10 min-h-screen">
        <header className="border-b border-white border-opacity-10 px-6 py-4 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto flex justify-center items-center">
          </div>
        </header>

        <section className="px-6 py-8 border-b border-white border-opacity-5">
          <div className="max-w-lg mx-auto text-center">
            <p className="text-sm font-light text-gray-200 leading-relaxed mb-3 opacity-90">
              "{currentQuote}"
            </p>
            <p className="text-xs text-gray-400 font-light opacity-90">— F. 니체</p>
          </div>
        </section>

        <main className="px-6 py-8">
          <div className="max-w-lg mx-auto space-y-6">
            
            {/* 인기 커뮤니티 글 미리보기 */}
            <div className="border border-white border-opacity-10 p-6 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-light text-white opacity-90">지금 뜨고 있는 이야기</h3>
                <button 
                  onClick={() => onNavigate('community')}
                  className="text-xs text-gray-400 hover:text-gray-300 transition-colors duration-200"
                >
                  전체 보기 →
                </button>
              </div>
              <div className="space-y-4">
                {SAMPLE_POSTS.slice(0, 3).map((post) => (
                  <button 
                    key={post.id}
                    onClick={() => onNavigate('community')}
                    className="w-full text-left hover:bg-white hover:bg-opacity-5 transition-colors duration-200 p-3 -m-3 rounded"
                  >
                    <p className="text-xs text-gray-300 leading-relaxed mb-3 line-clamp-2">
                      {post.content.length > 80 ? post.content.substring(0, 80) + '...' : post.content}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-3">
                        <span className="text-xs text-gray-500">❤️ {post.reactions.heart}</span>
                        <span className="text-xs text-gray-500">💬 {post.replies}</span>
                      </div>
                      <span className="text-xs text-gray-500">{post.timeAgo}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 상담 모드 선택 */}
            <div className="border border-white border-opacity-10 p-6 backdrop-blur-sm">
              <h3 className="text-sm font-light text-white mb-4 opacity-90 text-center">상담 모드 직접 선택</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="cursor-pointer" onClick={onStartFMode}>
                  <div className="border border-white border-opacity-10 p-4 backdrop-blur-sm h-32 flex flex-col">
                    <h4 className="text-sm font-light text-white mb-2 opacity-90 text-center">F모드</h4>
                    <p className="text-xs text-gray-400 leading-relaxed font-light text-center flex-1">
                      감정적 위로와 공감
                    </p>
                    <div className="text-xs text-red-300 font-medium opacity-85 text-center mt-2">
                      "당신 편이에요"
                    </div>
                  </div>
                </div>

                <div className="cursor-pointer" onClick={onStartTMode}>
                  <div className="border border-white border-opacity-10 p-4 backdrop-blur-sm h-32 flex flex-col">
                    <h4 className="text-sm font-light text-white mb-2 opacity-90 text-center">T모드</h4>
                    <p className="text-xs text-gray-400 leading-relaxed font-light text-center flex-1">
                      논리적 분석과 해결책
                    </p>
                    <div className="text-xs text-blue-300 font-medium opacity-85 text-center mt-2">
                      "객관적 분석"
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 오늘의 상태 */}
            <div className="border border-white border-opacity-10 p-6 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-light text-white opacity-90">오늘의 상태</h3>
                <span className="text-xs text-gray-400">DIVE와 함께한 지 5일</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-300">감정 안정도</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-white bg-opacity-10 rounded-full h-1">
                      <div className="bg-blue-400 h-1 rounded-full" style={{width: '72%'}}></div>
                    </div>
                    <span className="text-xs text-gray-400">72</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-300">관계 성장도</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-white bg-opacity-10 rounded-full h-1">
                      <div className="bg-green-400 h-1 rounded-full" style={{width: '68%'}}></div>
                    </div>
                    <span className="text-xs text-gray-400">68</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => onNavigate('mypage')}
                className="w-full mt-4 py-2 text-xs text-gray-400 hover:text-gray-300 transition-colors duration-200 border-t border-white border-opacity-5 pt-3"
              >
                상세 분석 보기 →
              </button>
            </div>

            {/* 실시간 활동 */}
            <div className="border border-white border-opacity-10 p-6 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-light text-white opacity-90">지금 DIVE에서는</h3>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-300">현재 상담 중</span>
                  <span className="text-xs text-green-400">127명</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-300">오늘 새 글</span>
                  <span className="text-xs text-blue-400">43개</span>
                </div>
              </div>
            </div>

            {/* 기타 서비스 */}
            <div className="border border-white border-opacity-10 p-6 backdrop-blur-sm">
              <h3 className="text-sm font-light text-white mb-4 opacity-90">더 많은 도움</h3>
              <div className="space-y-3">
                <button className="w-full flex justify-between items-center py-3 hover:bg-white hover:bg-opacity-5 transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <MessageCircle size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-300 font-light">전문가 상담</span>
                  </div>
                  <span className="text-xs text-gray-500">7일 무료 →</span>
                </button>
                <button className="w-full flex justify-between items-center py-3 hover:bg-white hover:bg-opacity-5 transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <Heart size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-300 font-light">나만의 AI 상담사</span>
                  </div>
                  <span className="text-xs text-gray-500">프리미엄 →</span>
                </button>
              </div>
            </div>

          </div>
        </main>
      </div>

      <Navigation currentScreen="main" onNavigate={onNavigate} />
    </div>
  );
};

export default Dashboard;