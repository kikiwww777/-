import React, { useState } from 'react';
import { Message, Role, Theme } from '../types';
import { User, AlertCircle, Sparkles, Leaf, Pen, Check, Square, CheckSquare, Circle, CheckCircle, Plane } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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
    },
    wanderlust: {
      userAvatar: 'bg-gradient-to-tr from-sky-400 to-blue-500 text-white shadow-lg shadow-sky-500/30',
      botAvatar: 'bg-white text-sky-600 border border-sky-100 shadow-[0_4px_12px_rgba(0,186,216,0.15)]',
      userBubble: 'bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/20 rounded-2xl rounded-tr-none border border-white/10',
      botBubble: 'bg-white/80 backdrop-blur-sm text-slate-700 border border-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl rounded-tl-none',
      time: 'text-sky-900/40 font-medium',
      checkbox: {
        unchecked: 'text-sky-200 hover:text-sky-500',
        checked: 'text-sky-500',
        textChecked: 'line-through text-slate-400 decoration-sky-300'
      }
    }
  };

  const currentStyle = themeStyles[theme];

  const handleCheck = (index: number) => {
    setCheckedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Custom renderer for lists to handle checkboxes
  const components = {
    li: ({ children, ...props }: any) => {
      // Check if this list item starts with a checkbox pattern roughly
      // We will rely on simple index-based tracking for demo purposes in ReactMarkdown
      // However, ReactMarkdown doesn't easily expose index in a stable way for interactivity without plugins.
      // For a robust checklist, we'd parse the text manually. 
      // HERE, we will assume standard markdown list items.
      
      // If the child is text that looks like a checklist item from Gemini:
      return (
        <li className="flex items-start gap-2 mb-2 leading-relaxed" {...props}>
          <span className="mt-1.5 block w-1.5 h-1.5 rounded-full bg-current opacity-40 shrink-0" />
          <span>{children}</span>
        </li>
      );
    }
  };

  // Simple parser to make checkboxes interactive if the model returns markdown checklists
  const renderContent = () => {
    // If the message contains markdown checkboxes like "- [ ] item" or "- [x] item"
    const lines = message.text.split('\n');
    return lines.map((line, idx) => {
      // Match standard markdown checkbox
      const checkboxMatch = line.match(/^(\s*)-\s*\[([ x])\]\s*(.*)/);
      
      if (checkboxMatch) {
        const isChecked = checkedIndices.has(idx) || checkboxMatch[2].toLowerCase() === 'x';
        const content = checkboxMatch[3];
        const indent = checkboxMatch[1].length;

        return (
          <div 
            key={idx} 
            className={`flex items-start gap-3 py-1.5 group cursor-pointer transition-all duration-300 ${indent > 0 ? 'ml-6' : ''}`}
            onClick={() => !isUser && handleCheck(idx)}
          >
             <div className={`mt-0.5 shrink-0 transition-all duration-300 ${isChecked ? currentStyle.checkbox.checked : currentStyle.checkbox.unchecked} group-hover:scale-110`}>
                {isChecked ? (
                   theme === 'neo' || theme === 'paper' ? <CheckSquare size={18} strokeWidth={2.5} /> : <CheckCircle size={18} strokeWidth={2.5} />
                ) : (
                   theme === 'neo' || theme === 'paper' ? <Square size={18} strokeWidth={2} /> : <Circle size={18} strokeWidth={2} />
                )}
             </div>
             <span className={`transition-all duration-300 ${isChecked ? currentStyle.checkbox.textChecked : ''}`}>
               {content}
             </span>
          </div>
        );
      }

      // Headers styling
      if (line.startsWith('### ')) {
         return <h3 key={idx} className="text-sm font-bold mt-4 mb-2 uppercase tracking-wider opacity-80 flex items-center gap-2">
            {theme === 'wanderlust' && <Sparkles size={12} />}
            {line.replace('### ', '')}
         </h3>;
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <strong key={idx} className="block mt-4 mb-2 font-bold">{line.replace(/\*\*/g, '')}</strong>;
      }

      // Empty lines
      if (!line.trim()) return <div key={idx} className="h-2" />;

      // Regular text
      return <p key={idx} className="mb-1 leading-relaxed whitespace-pre-wrap">{line}</p>;
    });
  };

  return (
    <div className={`flex w-full mb-6 animate-slide-up ${isUser ? 'justify-end' : 'justify-start'}`}>
      
      {/* Avatar (Left for Bot) */}
      {!isUser && (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 shrink-0 select-none ${currentStyle.botAvatar}`}>
           {theme === 'wanderlust' ? <Sparkles size={16} /> : <Sparkles size={16} />}
        </div>
      )}

      <div className={`max-w-[85%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* Name & Time */}
        <div className={`flex items-center gap-2 mb-1.5 px-1 ${currentStyle.time} text-[10px]`}>
           <span>{isUser ? '我' : 'AI 助手'}</span>
           <span>•</span>
           <span>
             {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
           </span>
        </div>

        {/* Bubble */}
        <div className={`px-5 py-3.5 relative group transition-all duration-300 ${isUser ? currentStyle.userBubble : currentStyle.botBubble}`}>
           {message.isError && (
              <div className="flex items-center gap-2 text-red-500 mb-2 font-bold">
                 <AlertCircle size={16} />
                 <span>出错了</span>
              </div>
           )}
           <div className="text-sm">
              {renderContent()}
           </div>
        </div>
      </div>

      {/* Avatar (Right for User) */}
      {isUser && (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ml-3 shrink-0 select-none ${currentStyle.userAvatar}`}>
           <User size={16} />
        </div>
      )}
    </div>
  );
};