// src/components/chat/MessageBubble.tsx
import React from 'react';
import { ChatMessage } from '../../types';

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.type === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs p-4 backdrop-blur-sm ${
        isUser 
          ? 'bg-white bg-opacity-10 text-gray-200' 
          : 'bg-white bg-opacity-5 text-gray-300'
      }`}>
        <p className="text-xs leading-relaxed font-light">
          {message.content}
        </p>
        <div className="mt-2 text-xs text-gray-500 opacity-70">
          {message.timestamp.toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;