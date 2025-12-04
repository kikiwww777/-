import React, { useState } from 'react';
import { Message, Role, Theme } from '../types';
import { User, AlertCircle, Sparkles, Leaf, Pen, Check, Square, CheckSquare, Circle, CheckCircle } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  theme: Theme;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, theme }) => {
  const isUser = message.role === Role.USER;
  const [checkedIndices, setCheckedIndices] = useState<Set<number>>(new Set());

  // Theme-specific styles map
  const themeStyles = {
    default: {
      userAvatar: 'bg-gradient-to-br from-[#4f7cff] to-[#9a8dff] text-white',
      botAvatar: 'bg-white text-[#4f7cff] shadow-blue-glow',
      userBubble: 'bg-gradient-to-r from-[#4f7cff] via-[#6a88ff] to-[#9a8dff] text-white shadow-blue-glow rounded-2xl rounded-tr-none',
      botBubble: 'bg-white text-[#303133] shadow-[0_4px_12px_rgba(0,0,0,0.05)] rounded-2xl rounded-tl-none',
      time: 'text-[#909399]',
      checkbox: {
        unchecked: 'text-slate-300 hover:text-blue-500',
        checked: 'text-blue-500',
        textChecked: 'line-through text-slate-400 decoration-blue-500/50'
      }
    },
    neo: {
      userAvatar: 'bg-[#ff90e8] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
      botAvatar: 'bg-[#23a094] text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
      userBubble: 'bg-[#ff90e8] text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold rounded-lg rounded-tr-none',
      botBubble: 'bg-white text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-medium rounded-lg rounded-tl-none',
      time: 'text-black font-bold opacity-60',
      checkbox: {
        unchecked: 'text-black hover:text-[#23a094]',
        checked: 'text-[#23a094]',
        textChecked: 'line-through decoration-4 decoration-black/20 text-black/50'
      }
    },
    zen: {
      userAvatar: 'bg-[#57534e] text-[#f5f5f4]',
      botAvatar: 'bg-[#e7e5e4] text-[#57534e] border border-[#d6d3d1]',
      userBubble: 'bg-[#57534e] text-[#f5f5f4] rounded-2xl rounded-tr-sm shadow-sm',
      botBubble: 'bg-[#f5f5f4] text-[#44403c] border border-[#e7e5e4] rounded-2xl rounded-tl-sm shadow-[0_2px_8px_rgba(0,0,0,0.02)]',
      time: 'text-[#a8a29e]',
      checkbox: {
        unchecked: 'text-[#d6d3d1] hover:text-[#78716c]',
        checked: 'text-[#57534e]',
        textChecked: 'line-through text-[#a8a29e] italic decoration-[#d6d3d1]'
      }
    },
    paper: {
      userAvatar: 'bg-blue-400 text-white border-2 border-black border-dashed',
      botAvatar: 'bg-white text-black border-2 border-black',
      userBubble: 'bg-blue-100 text-blue-900 border-2 border-black rounded-xl rounded-tr-none shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] font-medium',
      botBubble: 'bg-white text-gray-800 border-2 border-black border-dashed rounded-xl rounded-tl-none font-medium',
      time: 'text-gray-500 font-bold',
      checkbox: {
        unchecked: 'text-gray-400 hover:text-blue-500',
        checked: 'text-blue-600',
        textChecked: 'line-through decoration-wavy decoration-red-400 text-gray-400'
      }
    }
  };

  const currentStyle = themeStyles[theme];

  const getIcon = () => {
     if (isUser) return <User size={18} />;
     if (message.isError) return <AlertCircle size={18} />;
     if (theme === 'zen') return <Leaf size={18} />;
     if (theme === 'paper') return <Pen size={16} />;
     return <Sparkles size={18} />;
  };

  const toggleCheck = (idx: number) => {
    const newSet = new Set(checkedIndices);
    if (newSet.has(idx)) {
      newSet.delete(idx);
    } else {
      newSet.add(idx);
    }
    setCheckedIndices(newSet);
  };

  // Improved markdown rendering specifically for checklists
  const renderMessageContent = (text: string) => {
    // If it's a user message, just return text
    if (isUser) return text;

    return text.split('\n').map((line, idx) => {
      // Check for markdown checkbox pattern "- [ ] " or "- [x] "
      const checkboxMatch = line.match(/^-\s\[([ x])\]\s(.*)/);

      if (checkboxMatch) {
        const isChecked = checkedIndices.has(idx) || checkboxMatch[1] === 'x';
        const content = checkboxMatch[2];

        // Choose icon based on theme
        const CheckIcon = theme === 'neo' ? Square : theme === 'zen' ? Circle : theme === 'paper' ? Square : Square;
        const CheckedIcon = theme === 'neo' ? CheckSquare : theme === 'zen' ? CheckCircle : theme === 'paper' ? CheckSquare : CheckSquare;
        const IconComponent = isChecked ? CheckedIcon : CheckIcon;

        return (
          <div 
            key={idx} 
            className="flex items-start gap-2.5 py-1 cursor-pointer group"
            onClick={() => toggleCheck(idx)}
          >
            <div className={`mt-0.5 transition-colors ${isChecked ? currentStyle.checkbox.checked : currentStyle.checkbox.unchecked}`}>
              <IconComponent size={theme === 'neo' ? 20 : 18} strokeWidth={theme === 'neo' ? 2.5 : 2} />
            </div>
            <span className={`transition-all duration-300 ${isChecked ? currentStyle.checkbox.textChecked : ''}`}>
              {content}
            </span>
          </div>
        );
      }
      
      // Regular text formatting (simple bold/italic support)
      // Note: For a full markdown parser we would need a library, but this covers basic bolding often used by Gemini
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <div key={idx} className={`${line.trim() === '' ? 'h-2' : 'min-h-[1.5em]'}`}>
          {parts.map((part, pIdx) => {
             if (part.startsWith('**') && part.endsWith('**')) {
               return <strong key={pIdx} className={theme === 'neo' ? 'font-black' : 'font-bold'}>{part.slice(2, -2)}</strong>;
             }
             return <span key={pIdx}>{part}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[90%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
          theme === 'neo' ? 'rounded-none' : '' 
        } ${
          isUser 
            ? currentStyle.userAvatar 
            : message.isError 
              ? 'bg-red-100 text-red-600' 
              : currentStyle.botAvatar
        }`}>
          {getIcon()}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}>
          <div className={`px-5 py-3.5 text-sm md:text-base leading-relaxed transition-all duration-300 ${
             currentStyle.userBubble || currentStyle.botBubble
          } ${isUser && theme !== 'neo' ? 'rounded-tr-none' : ''} ${!isUser && theme !== 'neo' ? 'rounded-tl-none' : ''} ${!isUser ? 'w-full' : ''}`}>
            {renderMessageContent(message.text)}
          </div>
          <span className={`text-xs mt-1.5 px-1 font-medium ${currentStyle.time}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};