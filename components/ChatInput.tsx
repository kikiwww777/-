import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, ListChecks, PenTool, Sticker, Search } from 'lucide-react';
import { Theme } from '../types';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  theme: Theme;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading, theme }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const themeStyles = {
    default: {
      container: 'pb-4 pt-2 px-4', 
      wrapper: 'bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[#eff2f6] rounded-2xl focus-within:border-[#9ec5ff] focus-within:shadow-blue-glow',
      icon: 'text-[#909399]',
      input: 'text-[#303133] placeholder:text-[#909399]',
      button: 'bg-gradient-to-r from-[#4f7cff] to-[#9a8dff] shadow-blue-glow rounded-xl'
    },
    neo: {
      container: 'pb-4 pt-2 px-4',
      wrapper: 'bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg focus-within:translate-x-[1px] focus-within:translate-y-[1px] focus-within:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
      icon: 'text-black',
      input: 'text-black placeholder:text-black/50 font-bold',
      button: 'bg-[#ffdc00] border-2 border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none rounded-md'
    },
    zen: {
      container: 'pb-4 pt-2 px-4',
      wrapper: 'bg-[#fff] border border-[#d6d3d1] focus-within:border-[#a8a29e] focus-within:ring-1 focus-within:ring-[#d6d3d1] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)]',
      icon: 'text-[#78716c]',
      input: 'text-[#44403c] placeholder:text-[#a8a29e] font-serif tracking-wide',
      button: 'bg-[#57534e] text-[#fafaf9] hover:bg-[#44403c] rounded-lg shadow-sm'
    },
    paper: {
      container: 'pb-4 pt-2 px-4',
      wrapper: 'bg-white border-2 border-black rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)] focus-within:shadow-[3px_3px_0px_0px_rgba(59,130,246,0.3)]',
      icon: 'text-blue-500',
      input: 'text-gray-800 placeholder:text-gray-400 font-medium',
      button: 'bg-blue-400 text-white border-2 border-black hover:bg-blue-500 rounded-md'
    },
    wanderlust: {
      container: 'pb-4 pt-2 px-6',
      wrapper: 'bg-white/80 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-full focus-within:bg-white focus-within:shadow-[0_8px_40px_rgba(0,180,216,0.15)] focus-within:border-cyan-100 ring-1 ring-black/5',
      icon: 'text-cyan-600',
      input: 'text-slate-800 placeholder:text-slate-400 font-medium',
      button: 'bg-gradient-to-tr from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30 rounded-full hover:scale-105 active:scale-95'
    }
  };

  const currentStyle = themeStyles[theme];

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  const getIcon = () => {
      if (theme === 'zen') return <PenTool size={20} />;
      if (theme === 'paper') return <Sticker size={22} />;
      if (theme === 'wanderlust') return <Search size={22} />;
      return <ListChecks size={22} />;
  }

  return (
    <div className={`transition-colors duration-500 ${currentStyle.container}`}>
      <div className="max-w-3xl mx-auto relative">
        <form 
          onSubmit={handleSubmit} 
          className={`relative flex items-end gap-2 transition-all duration-300 overflow-hidden ${currentStyle.wrapper}`}
        >
          <div className={`pl-5 py-4 ${currentStyle.icon}`}>
             {getIcon()}
          </div>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={theme === 'wanderlust' ? "告诉我目的地，为您规划行程..." : "输入目的地，创建新行程..."}
            className={`w-full py-4 pr-14 bg-transparent border-none focus:ring-0 resize-none max-h-[150px] text-base ${currentStyle.input}`}
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`absolute right-2 bottom-2 p-2.5 transition-all duration-300 ${currentStyle.button} ${
                !input.trim() || isLoading 
                ? 'opacity-50 cursor-not-allowed shadow-none grayscale'
                : 'hover:opacity-90'
            }`}
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
};