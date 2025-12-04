import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, Role, Theme, LayoutMode } from './types';
import { APP_TITLE } from './constants';
import { geminiService } from './services/geminiService';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { 
  Handshake, Plus, PenLine, FileText, RotateCcw, 
  LayoutTemplate, Compass, Layout, 
  MapPin, UserCircle, Home, Heart,
  Zap, Feather, Coffee, Camera, Mountain,
  Pen, Highlighter, Scissors, Sticker,
  CheckCircle2, Calendar, Users, ArrowRight,
  Sparkles, Anchor, Plane, Briefcase, Map,
  Luggage, Globe2, Tent, Ticket, Landmark,
  ShoppingBag, Palmtree, Building2, Gift, 
  MoreHorizontal, Stamp, Tag, BriefcaseBusiness,
  Train, Car, PartyPopper, Paperclip, Star, Smile
} from 'lucide-react';

// --- TYPES & MOCK DATA ---

/* CURSOR_GUIDE: Define 4 distinct trip types to handle visual branching */
type TripType = 'tourism' | 'business' | 'family' | 'other';

interface Trip {
  id: string;
  title: string;
  location: string;
  date: string;
  status: '准备中' | '已完成'; // CURSOR_UPDATE: Simplified status options
  type: TripType;
  image: string; // Used only for Wanderlust layout
  isCoop?: boolean;
}

const MOCK_TRIPS: Trip[] = [
  { 
    id: '1', 
    title: '上海 · 陆家嘴会议', 
    location: '上海市·浦东新区', 
    date: '12月5日 - 6日', 
    status: '准备中',
    type: 'business',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600',
  },
  { 
    id: '2', 
    title: '三亚 · 海边度假', 
    location: '海南省·三亚市', 
    date: '12月15日 - 20日', 
    status: '准备中',
    type: 'tourism',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: '3',
    title: '回老家 · 团圆饭',
    location: '湖南省·长沙市',
    date: '1月20日 - 28日',
    status: '准备中',
    type: 'family',
    image: 'https://images.unsplash.com/photo-1516083692468-b769f36f9661?auto=format&fit=crop&q=80&w=600'
  },
  { 
    id: '4', 
    title: '未知目的地 · 探索', 
    location: '云南省·香格里拉', 
    date: '去年春季', 
    status: '已完成', 
    type: 'other',
    isCoop: true,
    image: 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?auto=format&fit=crop&q=80&w=600',
  }
];

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // State to control layout/theme
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('wanderlust'); 
  const [theme, setTheme] = useState<Theme>('default');
  const [activeTab, setActiveTab] = useState('home');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Sync theme with layout mode
    if (layoutMode === 'neo') setTheme('neo');
    else if (layoutMode === 'zen') setTheme('zen');
    else if (layoutMode === 'paper') setTheme('paper');
    else if (layoutMode === 'wanderlust') setTheme('default');
    else if (layoutMode === 'classic') setTheme('default');
  }, [layoutMode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = useCallback(async (text: string) => {
    const userMessage: Message = {
      id: uuidv4(),
      role: Role.USER,
      text: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const botMessageId = uuidv4();
    const botMessage: Message = {
      id: botMessageId,
      role: Role.MODEL,
      text: '', 
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, botMessage]);

    try {
      let currentText = '';
      await geminiService.sendMessageStream(text, (chunk) => {
        currentText += chunk;
        setMessages(prev => 
          prev.map(msg => 
            msg.id === botMessageId ? { ...msg, text: currentText } : msg
          )
        );
      });
    } catch (error) {
      console.error("Failed to generate response", error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === botMessageId ? { ...msg, text: "网络连接异常，请重试。", isError: true } : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleClearChat = () => {
    geminiService.resetSession();
    setMessages([]);
  };

  const handleQuickAction = (action: string) => {
    handleSendMessage(action);
  };

  const handleCheckTrip = (tripTitle: string) => {
    handleSendMessage(`查验 ${tripTitle} 的物品清单`);
  };

  // --- VISUAL HELPERS ---

  /* 
     CURSOR_GUIDE: 
     Visual Styling Logic for Trip Types:
     1. Tourism: Represents leisure. Use Green/Teal colors, PalmTree/Camera icons.
     2. Business: Represents work. Use Blue/Slate colors, Briefcase/Building icons.
     3. Family: Represents connection. Use Orange/Warm colors, Home/Heart icons.
     4. Other: Represents mystery/misc. Use Purple/Violet colors, Map/Sparkles icons.
  */
  const getTripVisuals = (type: TripType, layout: LayoutMode) => {
    // 1. Icons Configuration
    const icons = {
      tourism: {
        classic: Palmtree,   // Classic App Style
        neo: Camera,         // Pop Art Style
        zen: Mountain,       // Minimalist Style
        paper: Camera        // Sketch/Sticker Style (Changed to Camera for holiday feel)
      },
      business: {
        classic: BriefcaseBusiness,
        neo: Building2,
        zen: PenLine,
        paper: BriefcaseBusiness
      },
      family: {
        classic: Home,
        neo: Heart,
        zen: Coffee,
        paper: Home
      },
      other: {
        classic: Map,
        neo: Sparkles,
        zen: Compass,
        paper: Map
      }
    };

    // 2. Color Classes Configuration (Backgrounds & Text)
    const colors = {
      classic: {
        tourism: 'bg-emerald-50 text-emerald-600',
        business: 'bg-blue-50 text-blue-600',
        family: 'bg-orange-50 text-orange-600',
        other: 'bg-violet-50 text-violet-600'
      },
      neo: {
        tourism: 'bg-[#ffdc00]', // Bright Yellow
        business: 'bg-[#23a094]', // Teal
        family: 'bg-[#ff90e8]', // Pink
        other: 'bg-white'         // Stark White
      },
      paper: {
        // CURSOR_FIX: Paper colors should be softer, like highlighters or sticky notes
        tourism: 'text-emerald-700',
        business: 'text-blue-700',
        family: 'text-orange-700',
        other: 'text-purple-700'
      }
    };

    // Fallback logic
    const layoutKey = layout === 'wanderlust' ? 'classic' : layout;
    const selectedIcon = icons[type][layoutKey] || icons[type].classic;
    
    // Determine colors
    let colorClass = '';
    if (layout === 'classic') colorClass = colors.classic[type];
    else if (layout === 'neo') colorClass = colors.neo[type];
    else if (layout === 'paper') colorClass = colors.paper[type];
    else if (layout === 'zen') {
       // Zen uses text colors mostly, backgrounds are subtle
       if (type === 'tourism') colorClass = 'text-emerald-600 bg-emerald-50/50';
       if (type === 'business') colorClass = 'text-slate-600 bg-slate-50/50';
       if (type === 'family') colorClass = 'text-amber-600 bg-amber-50/50';
       if (type === 'other') colorClass = 'text-violet-600 bg-violet-50/50';
    }

    return { Icon: selectedIcon, colorClass };
  };

  // --- TRIP CARD RENDERER ---
  const renderTripCard = (trip: Trip) => {
    const { Icon, colorClass } = getTripVisuals(trip.type, layoutMode);

    /* 
       CURSOR_GUIDE: 
       Layout Specific Render Logic:
       - Ensure Status Badge uses ONLY '准备中' (Active) or '已完成' (Inactive) states.
    */

    // 1. CLASSIC: Standard App UI (WeChat Style)
    if (layoutMode === 'classic') {
      const statusColor = trip.status === '准备中' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500';
      
      return (
        <div key={trip.id} className="bg-white rounded-[16px] p-4 mb-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-gray-100 flex justify-between items-center active:bg-gray-50 transition-colors">
          <div className="flex gap-4 items-center">
             {/* Icon: Rounded Squircle */}
             <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 ${colorClass} ${trip.status === '已完成' ? 'opacity-50 grayscale' : ''}`}>
               <Icon size={22} />
             </div>
             <div>
               <div className="flex items-center gap-2 mb-1">
                 <h3 className={`text-[15px] font-bold tracking-tight ${trip.status === '已完成' ? 'text-gray-400' : 'text-[#333]'}`}>{trip.title}</h3>
                 {trip.isCoop && <span className="bg-indigo-50 text-indigo-600 px-1.5 py-[2px] rounded text-[10px] font-bold border border-indigo-100">协作</span>}
               </div>
               <div className="flex items-center gap-2">
                 {/* Status: Standard Pill Badge */}
                 <span className={`px-2 py-[2px] rounded-[4px] text-[10px] font-medium ${statusColor}`}>{trip.status}</span>
                 <span className="text-xs text-gray-400">{trip.date}</span>
               </div>
             </div>
          </div>
          <button onClick={() => handleCheckTrip(trip.title)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
             trip.status === '已完成' ? 'bg-gray-50 text-gray-300' : 'bg-gray-50 text-gray-400 hover:bg-[#07c160] hover:text-white'
          }`}>
            <ArrowRight size={16} />
          </button>
        </div>
      );
    }

    // 2. WANDERLUST: Immersive Image UI
    if (layoutMode === 'wanderlust') {
      return (
        <div key={trip.id} className="relative h-48 rounded-[24px] overflow-hidden mb-5 group shadow-lg shadow-blue-900/10 active:scale-[0.98] transition-all duration-300">
          <img src={trip.image} className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${trip.status === '已完成' ? 'grayscale' : ''}`} alt={trip.title} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          
          {/* Top Bar */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
             {trip.isCoop ? (
                <div className="bg-white/20 backdrop-blur-md border border-white/20 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                   <Users size={12} /> 伙伴同行
                </div>
             ) : <div></div>}
             
             {/* Status Badge: Glassmorphism Pill */}
             <div className={`backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/20 shadow-sm ${
                trip.status === '准备中' ? 'bg-blue-500/80 text-white' : 'bg-black/60 text-white/70'
             }`}>
                {trip.status}
             </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-5 flex justify-between items-end bg-white/10 backdrop-blur-sm border-t border-white/10">
             <div>
               <div className="flex items-center gap-2 mb-1">
                  {/* Small Type Icon */}
                  <Icon size={12} className="text-blue-200" />
                  <span className="text-xs text-blue-200 font-medium tracking-wide uppercase">{trip.type} Trip</span>
               </div>
               <h3 className="text-xl font-bold text-white leading-tight">{trip.title}</h3>
               <div className="flex items-center gap-1 text-white/60 text-xs mt-1"><MapPin size={10} /> {trip.location}</div>
             </div>
             <button onClick={() => handleCheckTrip(trip.title)} className="bg-white text-blue-600 w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-50 transition-colors shadow-lg">
                <ArrowRight size={20} strokeWidth={3} />
             </button>
          </div>
        </div>
      );
    }

    // 3. NEO: Brutalist / Retro PC
    if (layoutMode === 'neo') {
      return (
        <div key={trip.id} className={`bg-white border-2 border-black mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex relative overflow-hidden group ${
            trip.status === '已完成' ? 'opacity-60' : ''
        }`}>
          
          {/* Status Bar: Vertical Text Sidebar */}
          <div className={`w-8 border-r-2 border-black flex items-center justify-center py-2 ${
             trip.status === '准备中' ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'
          }`}>
             <span className="text-[10px] font-black tracking-widest uppercase rotate-180" style={{ writingMode: 'vertical-rl' }}>{trip.status}</span>
          </div>

          {/* Icon Box: Large & Bold */}
          <div className={`w-20 ${colorClass} border-r-2 border-black flex items-center justify-center shrink-0`}>
             <Icon size={32} strokeWidth={2.5} className={`text-black drop-shadow-sm ${trip.status === '准备中' ? 'group-hover:scale-110' : ''} transition-transform`} />
          </div>
          
          <div className="flex-1 p-3 flex flex-col justify-between bg-white">
             <div className="flex justify-between items-start">
                <h3 className="text-lg font-black italic text-black leading-tight pr-2">{trip.title}</h3>
                {trip.isCoop && <Zap size={16} fill="black" />}
             </div>
             
             <div className="mt-3 flex justify-between items-end">
                <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-gray-500 uppercase">DATE_LOG</span>
                   <span className={`text-xs font-bold px-1 inline-block ${trip.status === '准备中' ? 'bg-black text-white' : 'bg-gray-300 text-gray-600'}`}>{trip.date}</span>
                </div>
                <button onClick={() => handleCheckTrip(trip.title)} className="text-xs font-black border-b-2 border-black hover:bg-black hover:text-white transition-colors uppercase">
                   {trip.status === '准备中' ? 'Start Check' : 'Review'}
                </button>
             </div>
          </div>
        </div>
      );
    }

    // 4. ZEN: Minimalist / Muji Style
    if (layoutMode === 'zen') {
      return (
        <div key={trip.id} className="bg-[#fff] p-5 mb-4 rounded-sm shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center gap-5 group hover:bg-[#fafaf9] transition-colors border-l-2 border-transparent hover:border-[#a8a29e]">
           {/* Icon: Simple Line Art, Subtle Background */}
           <div className={`w-12 h-12 flex items-center justify-center rounded-full ${trip.status === '已完成' ? 'bg-gray-100 text-gray-400' : colorClass} shrink-0`}>
              <Icon size={20} strokeWidth={1.5} />
           </div>
           
           <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                 <h3 className={`text-lg font-serif tracking-wide ${trip.status === '已完成' ? 'text-gray-400 line-through' : 'text-[#44403c]'}`}>{trip.title}</h3>
                 
                 {/* Status: Minimalist Dot Indicator */}
                 <div className={`flex items-center gap-1.5 border px-2 py-0.5 rounded-full ${
                     trip.status === '准备中' ? 'border-[#e7e5e4]' : 'border-gray-200'
                 }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${trip.status === '准备中' ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                    <span className="text-[10px] text-[#78716c] font-serif">{trip.status}</span>
                 </div>
              </div>
              
              <div className="text-xs text-[#78716c] font-serif italic mb-3 opacity-80">{trip.date}</div>
              
              <div className="flex justify-between items-center border-t border-[#f5f5f4] pt-2">
                 <span className="text-[10px] tracking-[0.15em] uppercase text-[#d6d3d1]">{trip.type}</span>
                 <button onClick={() => handleCheckTrip(trip.title)} className="text-[#57534e] text-xs hover:text-black transition-colors flex items-center gap-1 border-b border-[#e7e5e4] pb-0.5">
                    查看清单
                 </button>
              </div>
           </div>
        </div>
      );
    }

    // 5. PAPER: Sticker / Journal Style
    if (layoutMode === 'paper') {
      /* 
         CURSOR_FIX: 
         - "Scrapbook" Aesthetic: Added Washi Tape visuals and Hand-drawn elements.
         - "Stamp" Status: Status is now a rotated stamp instead of a pill.
         - "Doodles": Added random star decorations.
         - CURSOR_FIX_UPDATE: Removed "hanging photo" form entirely. Replaced with hand-drawn cartoon sticker/pattern.
      */
      
      // Determine background color based on type for variety
      const cardBg = trip.status === '已完成' ? 'bg-gray-100' : 
                     trip.type === 'tourism' ? 'bg-[#f0fdf4]' : // green-50ish
                     trip.type === 'business' ? 'bg-[#eff6ff]' : // blue-50ish
                     trip.type === 'family' ? 'bg-[#fff7ed]' : 'bg-[#faf5ff]'; // orange/purple

      // Random-ish rotation for the stamp
      const stampRotation = trip.id === '1' ? 'rotate-12' : trip.id === '2' ? '-rotate-6' : 'rotate-3';

      return (
        <div key={trip.id} className={`relative border border-gray-300 p-4 mb-6 shadow-[3px_3px_0px_rgba(0,0,0,0.05)] rounded-sm hover:shadow-[5px_5px_0px_rgba(0,0,0,0.1)] transition-all group overflow-hidden ${cardBg} ${
            trip.status === '已完成' ? 'opacity-80' : ''
        }`}>
          
          {/* Visual Decor: Washi Tape on Top Left */}
          <div className="absolute -top-3 -left-8 w-24 h-6 bg-yellow-200/60 -rotate-45 opacity-70"></div>
          
          {/* Visual Decor: Doodle Star */}
          <div className="absolute bottom-2 right-1 text-gray-300/50 transform rotate-12 pointer-events-none">
             <Star size={40} strokeWidth={1} />
          </div>

          {/* Status: Hand-Stamped Effect */}
          <div className={`absolute top-2 right-2 border-[3px] border-double rounded-lg px-2 py-0.5 text-[10px] font-black tracking-widest uppercase transform ${stampRotation} opacity-80 ${
             trip.status === '准备中' ? 'border-red-500 text-red-600' : 'border-gray-500 text-gray-500'
          }`}>
             {trip.status}
          </div>

          <div className="flex items-start gap-4 mt-2 relative z-10">
             {/* Icon: Hand-drawn Cartoon Sticker (No more Polaroid frame) */}
             <div className="shrink-0 relative group-hover:rotate-6 transition-transform duration-300">
                <div className={`w-16 h-16 flex items-center justify-center rounded-full border-2 border-gray-800 shadow-[2px_2px_0px_rgba(0,0,0,0.1)] ${
                    trip.type === 'tourism' ? 'bg-[#bbf7d0]' : 
                    trip.type === 'business' ? 'bg-[#bfdbfe]' : 
                    trip.type === 'family' ? 'bg-[#fed7aa]' : 'bg-[#e9d5ff]'
                }`}>
                   <Icon size={32} strokeWidth={2.5} className="text-gray-800" />
                </div>
                {/* Sparkle deco */}
                <div className="absolute -top-1 -right-1 text-yellow-400 drop-shadow-sm">
                   <Sparkles size={14} fill="currentColor" />
                </div>
             </div>

             <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                   <h3 className="text-lg font-bold text-gray-800 leading-tight font-sans truncate pr-8">
                      {trip.title}
                   </h3>
                </div>
                
                {/* Hand-drawn underline style */}
                <div className="w-full h-1 bg-transparent border-b-2 border-gray-300 border-dotted my-2 opacity-50"></div>

                <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-gray-500 mb-3 font-mono">
                   {/* Restored location here since it was removed from photo */}
                   <span className="flex items-center gap-1"><MapPin size={12} /> {trip.location.split('·')[1] || trip.location}</span>
                   <span className="flex items-center gap-1"><Calendar size={12} /> {trip.date}</span>
                   {trip.isCoop && <span className="flex items-center gap-1 text-purple-500 bg-purple-100 px-1 rounded-sm border border-purple-200 transform -rotate-2"><Users size={12} /> Team</span>}
                </div>

                <div className="flex justify-end">
                   <button onClick={() => handleCheckTrip(trip.title)} className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full border transition-colors ${
                      trip.status === '准备中' 
                        ? 'text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100' 
                        : 'text-gray-500 border-gray-200 bg-gray-50'
                   }`}>
                      <span>{trip.status === '准备中' ? '打开检查表' : '回顾行程'}</span> 
                      <ArrowRight size={12} />
                   </button>
                </div>
             </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderSectionHeader = (title: string, linkText: string = "查看全部 >") => {
     // Custom headers for each theme
     if (layoutMode === 'wanderlust') {
        return (
          <div className="flex justify-between items-end mb-5 mt-10 px-1">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 leading-none">{title}</h2>
              <div className="h-1 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-2"></div>
            </div>
            <button className="text-xs font-semibold text-slate-400 hover:text-blue-600 transition-colors">{linkText}</button>
          </div>
        );
     }

     if (layoutMode === 'neo') {
        return (
          <div className="flex justify-between items-center mb-4 mt-10 border-b-4 border-black pb-1 bg-white px-2">
             <h2 className="text-xl font-black italic bg-black text-white px-2 py-1 transform -skew-x-12 translate-y-2">{title}</h2>
             <button className="text-xs font-bold bg-[#ffdc00] border-2 border-black px-2 py-0.5 hover:bg-black hover:text-white transition-colors">{linkText}</button>
          </div>
        );
     }

     if (layoutMode === 'zen') {
        return (
           <div className="flex flex-col items-center mb-8 mt-12">
              <Feather size={16} className="text-[#a8a29e] mb-2" />
              <h2 className="text-lg font-serif tracking-widest text-[#44403c]">{title}</h2>
              <button className="text-[10px] text-[#a8a29e] mt-2 border-b border-[#e7e5e4] hover:border-[#a8a29e] transition-colors">{linkText}</button>
           </div>
        );
     }

     if (layoutMode === 'paper') {
        /* CURSOR_FIX: Notebook Header Style */
        return (
          <div className="flex justify-between items-end mb-6 mt-10 border-b-2 border-gray-300 border-dashed pb-2 relative">
             <div className="absolute -left-2 top-0 text-yellow-400 animate-pulse">
                <Sparkles size={16} />
             </div>
             <div className="flex items-center gap-2 pl-4">
                <h2 className="text-xl font-bold text-gray-800 font-sans tracking-tight">{title}</h2>
             </div>
             <button className="text-xs font-bold text-gray-400 hover:text-gray-700 font-mono">{linkText}</button>
          </div>
        );
     }

     // Classic default
     return (
        <div className="flex justify-between items-center mb-4 mt-8 px-1 border-l-4 border-[#4f7cff] pl-3">
           <h2 className="text-lg font-bold text-slate-800">{title}</h2>
           <button className="text-xs text-slate-400 hover:text-blue-500 font-medium">{linkText}</button>
        </div>
     );
  };

  // --- RENDERERS FOR DIFFERENT LAYOUTS ---

  // 1. CLASSIC (WeChat Style)
  const renderClassicLayout = () => (
    <div className="animate-fade-in-down">
       <div className="relative rounded-[28px] overflow-hidden p-8 text-center mb-8 transition-transform hover:scale-[1.01] duration-300 bg-gradient-to-br from-[#5b80ff] to-[#9a8dff] shadow-header-glow text-white">
          <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-[-20px] left-[-10px] w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="relative z-10 flex flex-col items-center">
            <h1 className="text-2xl font-bold tracking-wide mb-3 drop-shadow-sm">{APP_TITLE}</h1>
            <p className="text-sm mb-8 font-medium tracking-wide opacity-90 text-blue-100">智能推荐、一键查验</p>
            <button onClick={() => handleQuickAction("新建行程")} className="px-8 py-3.5 rounded-full font-semibold active:scale-95 transition-all duration-200 w-48 bg-[#07c160] hover:bg-[#06ad56] text-white shadow-green-900/10">创建新行程</button>
          </div>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2 px-2 mb-8">
        {[
          { label: '合作', icon: Handshake, bg: 'bg-[#fff6e6]', text: 'text-[#d48806]' },
          { label: '加入', icon: Plus, bg: 'bg-[#f3e8ff]', text: 'text-[#9333ea]' },
          { label: '新建', icon: PenLine, bg: 'bg-[#e6f7ff]', text: 'text-[#409eff]' },
          { label: '模板', icon: FileText, bg: 'bg-[#f4f4f5]', text: 'text-[#71717a]' },
        ].map((item, idx) => (
          <button key={idx} onClick={() => handleQuickAction(`打开${item.label}行程`)} className="flex flex-col items-center gap-2 group">
            <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center shadow-sm group-active:scale-95 transition-all duration-300 ${item.bg} ${item.text}`}>
              <item.icon size={24} strokeWidth={2.5} />
            </div>
            <span className="text-xs font-medium text-[#606266] opacity-80">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Trips Sections */}
      {renderSectionHeader("最近行程")}
      {MOCK_TRIPS.filter(t => !t.isCoop).map(trip => renderTripCard(trip))}

      {renderSectionHeader("最近合作行程")}
      {MOCK_TRIPS.filter(t => t.isCoop).map(trip => renderTripCard(trip))}
    </div>
  );

  // 2. WANDERLUST (Airbnb Style)
  const renderWanderlustLayout = () => (
    <div className="animate-fade-in px-1">
      <div className="flex justify-between items-center mb-6">
         <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">早安, 旅行者</h2>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">准备好开启<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">下一段旅程</span>了吗？</h1>
         </div>
         <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-md"><UserCircle size={40} className="text-gray-400 relative top-0 left-0" /></div>
      </div>
      {/* CURSOR_NOTE: This component uses images intentionally for the immersive effect */}
      <div className="relative w-full h-48 rounded-[32px] overflow-hidden mb-8 group cursor-pointer shadow-xl shadow-blue-900/10">
        <img src="https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?auto=format&fit=crop&q=80&w=800" alt="Travel" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6 text-white">
           <div className="flex items-center gap-2 mb-2"><span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-white/20">5天后出发</span></div>
           <h3 className="text-xl font-bold">北京文化之旅</h3>
           <div className="flex items-center gap-1 text-sm text-gray-200 mt-1"><MapPin size={14} /> <span>北京, 中国</span></div>
        </div>
      </div>
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 px-1">旅行工具箱</h3>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
           {[{icon: Plus, t1: '新建', t2: '开始规划', color: 'blue'}, {icon: Handshake, t1: '协作', t2: '邀请好友', color: 'orange'}, {icon: Compass, t1: '灵感', t2: '热门模板', color: 'purple'}].map((item, idx) => (
             <button key={idx} onClick={() => handleQuickAction(item.t1 + "行程")} className="flex-shrink-0 w-32 h-36 bg-white rounded-2xl p-4 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:border-blue-200 transition-all group">
                <div className={`w-10 h-10 rounded-full bg-${item.color}-50 text-${item.color}-500 flex items-center justify-center group-hover:scale-110 transition-transform`}><item.icon size={20} strokeWidth={3} /></div>
                <div className="text-left"><span className="block text-sm font-bold text-slate-800">{item.t1}</span><span className="text-xs text-slate-400">{item.t2}</span></div>
             </button>
           ))}
        </div>
      </div>

       {/* Trips Sections */}
       {renderSectionHeader("最近行程")}
      {MOCK_TRIPS.filter(t => !t.isCoop).map(trip => renderTripCard(trip))}

      {renderSectionHeader("最近合作行程")}
      {MOCK_TRIPS.filter(t => t.isCoop).map(trip => renderTripCard(trip))}
    </div>
  );

  // 3. NEO-BRUTALIST (Refined Pop Style)
  const renderNeoLayout = () => (
    <div className="animate-bounce-in">
       {/* Hero Section */}
       <div className="border-2 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 relative overflow-hidden">
          <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-[#ff90e8] rounded-full border-2 border-black"></div>
          
          <div className="relative z-10">
             <h1 className="text-4xl font-black tracking-tighter mb-2 italic">拒绝丢三落四</h1>
             <p className="font-bold border-b-2 border-black inline-block mb-6 text-slate-800">你的智能出行管家</p>
             <button 
                onClick={() => handleQuickAction("我要创建一个去北京的行程")}
                className="w-full bg-[#ffdc00] border-2 border-black py-4 font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
             >
                立即开始 <span className="text-2xl">→</span>
             </button>
          </div>
       </div>

       {/* Grid Actions */}
       <div className="grid grid-cols-2 gap-4 mb-8">
          <div onClick={() => handleQuickAction("合作行程")} className="cursor-pointer bg-[#23a094] text-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all flex flex-col justify-between h-32">
             <Handshake size={32} />
             <div className="font-bold text-lg">多人<br/>协作</div>
          </div>
          <div onClick={() => handleQuickAction("加入行程")} className="cursor-pointer bg-[#ff90e8] text-black border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all flex flex-col justify-between h-32">
             <Plus size={32} />
             <div className="font-bold text-lg">加入<br/>行程</div>
          </div>
          <div onClick={() => handleQuickAction("行程模板")} className="col-span-2 cursor-pointer bg-white border-2 border-black p-4 flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all">
             <div className="font-bold text-lg">查看热门模板库</div>
             <div className="bg-black text-white rounded-full p-1"><FileText size={20} /></div>
          </div>
       </div>

        {/* Trips Sections */}
      {renderSectionHeader("最近行程")}
      {MOCK_TRIPS.filter(t => !t.isCoop).map(trip => renderTripCard(trip))}

      {renderSectionHeader("最近合作行程")}
      {MOCK_TRIPS.filter(t => t.isCoop).map(trip => renderTripCard(trip))}
    </div>
  );

  // 4. ZEN (Nature/Journal Style - Localized)
  const renderZenLayout = () => (
    <div className="animate-fade-in text-[#44403c]">
       {/* Top Nav (Simulated) */}
       <div className="flex justify-between items-center mb-8 pt-2">
          <Feather size={24} className="text-[#57534e]" />
          <span className="font-serif italic text-lg text-[#78716c]">旅行手账</span>
          <div className="w-8 h-8 rounded-full bg-[#e7e5e4] flex items-center justify-center border border-[#d6d3d1]">
             <UserCircle size={18} className="text-[#78716c]" />
          </div>
       </div>

       {/* Hero / Date Display */}
       <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[#a8a29e] mb-3">今日</p>
          <h1 className="font-serif text-4xl mb-2 text-[#292524]">整理行囊</h1>
          <p className="font-serif text-[#78716c] italic">"千里之行，始于足下。"</p>
       </div>

       {/* Cards Grid */}
       <div className="grid grid-cols-1 gap-6 mb-8">
          <button 
             onClick={() => handleQuickAction("新建行程")}
             className="relative h-40 rounded-xl overflow-hidden group shadow-sm hover:shadow-md transition-all"
          >
             <img src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&q=80&w=800" alt="Landscape" className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" />
             <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
             <div className="absolute bottom-0 left-0 p-6 text-white text-left">
                <span className="block text-xs uppercase tracking-widest opacity-80 mb-1">新的旅程</span>
                <span className="font-serif text-2xl italic">开始规划</span>
             </div>
             <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white">
                <Plus size={20} />
             </div>
          </button>

          <div className="grid grid-cols-2 gap-4">
             <button onClick={() => handleQuickAction("合作行程")} className="bg-[#fff] p-5 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all text-left group">
                <div className="mb-3 text-[#78716c] group-hover:text-[#57534e] transition-colors"><Coffee size={24} strokeWidth={1.5} /></div>
                <div className="font-serif text-lg text-[#44403c] mb-1">结伴同行</div>
                <div className="text-xs text-[#a8a29e]">与好友协作</div>
             </button>
             
             <button onClick={() => handleQuickAction("行程模板")} className="bg-[#fff] p-5 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all text-left group">
                <div className="mb-3 text-[#78716c] group-hover:text-[#57534e] transition-colors"><Mountain size={24} strokeWidth={1.5} /></div>
                <div className="font-serif text-lg text-[#44403c] mb-1">探索灵感</div>
                <div className="text-xs text-[#a8a29e]">查看模板</div>
             </button>
          </div>
       </div>

        {/* Trips Sections */}
       {renderSectionHeader("最近行程")}
      {MOCK_TRIPS.filter(t => !t.isCoop).map(trip => renderTripCard(trip))}

      {renderSectionHeader("最近合作行程")}
      {MOCK_TRIPS.filter(t => t.isCoop).map(trip => renderTripCard(trip))}
    </div>
  );

  // 5. PAPER (Cartoon/Doodle Style)
  const renderPaperLayout = () => (
    <div className="animate-bounce-in text-gray-800">
       {/* CURSOR_FIX: Redesigned Hero to look like a Spiral Notebook */}
       <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-8 shadow-sm relative overflow-visible group ml-4">
          {/* Spiral Binding Visual */}
          <div className="absolute -left-3 top-4 bottom-4 w-4 flex flex-col justify-evenly z-20">
             {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 w-6 bg-gray-300 rounded-full border border-gray-400 shadow-sm -rotate-6"></div>
             ))}
          </div>

          <div className="pl-4">
             <div className="flex justify-between items-start mb-4 relative">
                <div className="absolute -top-6 -right-4 text-blue-300 opacity-50 rotate-12">
                   <CloudDoodle />
                </div>
                <h1 className="text-3xl font-bold font-sans text-gray-800 tracking-tight z-10">涂鸦笔记</h1>
                <Pen size={24} className="text-gray-400 group-hover:text-blue-500 group-hover:rotate-12 transition-all" />
             </div>
             
             <div className="h-px w-full bg-blue-100 mb-6"></div>

             <p className="mb-6 font-medium text-gray-500 italic relative">
                "别忘了带牙刷！还有心情！"
                <span className="absolute -bottom-2 right-0 text-3xl opacity-20 rotate-12">✏️</span>
             </p>

             <button onClick={() => handleQuickAction("新建行程")} className="w-full py-3 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-bold rounded-md border-2 border-transparent hover:border-yellow-300 transition-all flex items-center justify-center gap-2 relative group/btn">
                <Plus size={20} /> 
                <span>记下一笔新旅程</span>
                {/* Hand drawn arrow visual */}
                <div className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover/btn:opacity-100 transition-opacity text-gray-400">
                   <ArrowRight size={20} strokeWidth={3} className="animate-bounce" />
                </div>
             </button>
          </div>
       </div>

       {/* CURSOR_FIX: Quick Actions as 'Sticky Notes' with Washi Tape */}
       <div className="grid grid-cols-2 gap-4 mb-8">
          <button onClick={() => handleQuickAction("合作行程")} className="bg-pink-50 p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 relative overflow-hidden group">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-4 bg-pink-200/60 -rotate-2"></div>
             <Highlighter className="text-pink-500 mb-2 relative z-10" />
             <div className="font-bold text-pink-700 relative z-10">朋友一起</div>
             <div className="absolute bottom-[-10px] right-[-10px] text-pink-100 opacity-50 group-hover:scale-110 transition-transform"><Smile size={48} /></div>
          </button>
          <button onClick={() => handleQuickAction("查验清单")} className="bg-green-50 p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 relative overflow-hidden group">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-4 bg-green-200/60 rotate-2"></div>
             <Scissors className="text-green-600 mb-2 relative z-10" />
             <div className="font-bold text-green-800 relative z-10">检查装备</div>
             <div className="absolute bottom-[-10px] right-[-10px] text-green-100 opacity-50 group-hover:scale-110 transition-transform"><CheckCircle2 size={48} /></div>
          </button>
          <button onClick={() => handleQuickAction("行程模板")} className="bg-purple-50 p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 relative col-span-2 flex items-center justify-between overflow-hidden">
             <div className="absolute top-0 left-4 w-8 h-4 bg-purple-200/60 rotate-0"></div>
             <div className="relative z-10 flex items-center">
                <Sticker className="text-purple-500 mb-1" />
                <span className="font-bold text-purple-800 ml-2">偷懒用模板</span>
             </div>
             <div className="text-2xl opacity-50 relative z-10">👀</div>
          </button>
       </div>

       {/* Trips Sections */}
       {renderSectionHeader("最近行程")}
      {MOCK_TRIPS.filter(t => !t.isCoop).map(trip => renderTripCard(trip))}

      {renderSectionHeader("最近合作行程")}
      {MOCK_TRIPS.filter(t => t.isCoop).map(trip => renderTripCard(trip))}
    </div>
  );

  // Helper for doodle cloud
  const CloudDoodle = () => (
     <svg width="40" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.5 19c0-3.037-2.463-5.5-5.5-5.5S6.5 15.963 6.5 19" />
        <path d="M11.5 13.5C11.5 10.463 9.037 8 6 8s-5.5 2.463-5.5 5.5" />
        <path d="M22 13.5c0-2.485-2.015-4.5-4.5-4.5s-4.5 2.015-4.5 4.5" />
     </svg>
  );

  // Background color mapping
  const bgColors = {
    classic: 'bg-[#f5f7fa] text-slate-800',
    wanderlust: 'bg-[#f8fafc] text-slate-800',
    neo: 'bg-[#fff] text-black',
    zen: 'bg-[#fafaf9] text-[#44403c]',
    paper: 'bg-[#fffdf5] text-gray-800', // Creamy paper color
  };

  // Bottom Nav Render
  const renderBottomNav = () => {
     const navStyles = {
        classic: 'bg-white border-t border-slate-100 text-slate-400 active-text-blue-600',
        neo: 'bg-white border-t-2 border-black text-black active-text-black',
        zen: 'bg-[#fafaf9] border-t border-[#e7e5e4] text-[#a8a29e] active-text-[#57534e]',
        paper: 'bg-[#fffdf5] border-t-2 border-dashed border-gray-300 text-gray-400 active-text-gray-800'
     };
     
     // default fallback
     const s = navStyles[layoutMode === 'wanderlust' ? 'classic' : layoutMode] || navStyles.classic;
     const activeClass = layoutMode === 'neo' ? 'bg-yellow-300 border-2 border-black rounded-md p-1 translate-y-[-4px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'text-blue-600 scale-110';
     const zenActiveClass = 'text-[#44403c] font-bold';

     /* CURSOR_FIX: Specific active state for Paper mode (Circle marker) */
     const paperActiveClass = 'text-gray-800 font-bold relative after:absolute after:bottom-[-4px] after:w-1 after:h-1 after:bg-gray-800 after:rounded-full';

     const getActive = (name: string) => {
        if (activeTab === name) {
           if (layoutMode === 'neo') return activeClass;
           if (layoutMode === 'zen') return zenActiveClass;
           if (layoutMode === 'paper') return paperActiveClass;
           return 'text-blue-600';
        }
        return '';
     };

     return (
         <div className={`fixed bottom-0 left-0 right-0 pb-safe pt-2 px-6 flex justify-around items-center z-50 h-[70px] transition-all duration-300 ${s}`}>
            <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-all ${getActive('home')}`}>
               <Home size={24} strokeWidth={layoutMode === 'neo' ? 2.5 : 2} />
               <span className="text-[10px] font-bold">首页</span>
            </button>
            <button onClick={() => setActiveTab('trips')} className={`flex flex-col items-center gap-1 transition-all ${getActive('trips')}`}>
               <Calendar size={24} strokeWidth={layoutMode === 'neo' ? 2.5 : 2} />
               <span className="text-[10px] font-medium">行程</span>
            </button>
            <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 transition-all ${getActive('profile')}`}>
               <UserCircle size={24} strokeWidth={layoutMode === 'neo' ? 2.5 : 2} />
               <span className="text-[10px] font-medium">我的</span>
            </button>
         </div>
     );
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-700 ${bgColors[layoutMode]}`}>
      
      {/* Layout Switcher */}
      <div className="fixed top-4 right-4 z-50 flex flex-wrap justify-end gap-1 max-w-[90%]">
        <div className={`flex gap-1 backdrop-blur-md p-1.5 rounded-lg border shadow-sm ${
           layoutMode === 'zen' ? 'bg-[#e7e5e4]/50 border-[#d6d3d1]' : 
           layoutMode === 'paper' ? 'bg-[#fffdf5] border-black border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]' :
           'bg-white/80 border-slate-200'
        }`}>
          <button onClick={() => setLayoutMode('classic')} className="p-2 rounded-md hover:bg-gray-100/50" title="经典">
             <Layout size={16} className={layoutMode === 'zen' ? 'text-[#78716c]' : 'text-blue-600'} />
          </button>
          <button onClick={() => setLayoutMode('wanderlust')} className="p-2 rounded-md hover:bg-gray-100/50" title="探索">
             <Compass size={16} className={layoutMode === 'zen' ? 'text-[#78716c]' : 'text-purple-600'} />
          </button>
          <button onClick={() => setLayoutMode('zen')} className="p-2 rounded-md hover:bg-gray-100/50" title="森系">
             <Feather size={16} className={layoutMode === 'zen' ? 'text-[#44403c]' : 'text-emerald-600'} />
          </button>
          <button onClick={() => setLayoutMode('paper')} className="p-2 rounded-md hover:bg-gray-100/50" title="绘纸">
             <Pen size={16} className={layoutMode === 'paper' ? 'text-black' : 'text-orange-500'} />
          </button>
          <div className={`w-px mx-1 ${layoutMode === 'zen' ? 'bg-[#d6d3d1]' : layoutMode === 'paper' ? 'bg-black' : 'bg-slate-300'}`}></div>
          <button onClick={() => setLayoutMode('neo')} className="p-2 rounded-md hover:bg-gray-100/50" title="波普">
             <Zap size={16} className={layoutMode === 'zen' ? 'text-[#78716c]' : 'text-yellow-600'} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className={`flex-1 w-full max-w-3xl mx-auto px-4 ${layoutMode === 'wanderlust' ? 'pt-6' : 'pt-8'} pb-[180px]`}>
        
        {/* Dynamic Header */}
        <div className="mb-4">
           {layoutMode === 'classic' && renderClassicLayout()}
           {layoutMode === 'wanderlust' && renderWanderlustLayout()}
           {layoutMode === 'neo' && renderNeoLayout()}
           {layoutMode === 'zen' && renderZenLayout()}
           {layoutMode === 'paper' && renderPaperLayout()}
        </div>

        {/* Chat History */}
        {messages.length > 0 && (
          <div className={`mt-4 pt-6 ${
            layoutMode === 'zen' ? 'border-t border-[#e7e5e4]' : 
            layoutMode === 'paper' ? 'border-t-2 border-black border-dashed' :
            layoutMode === 'neo' ? 'border-t-2 border-black border-dashed' : 
            layoutMode === 'wanderlust' ? '' : 'border-t border-dashed border-slate-200'
          }`}>
             <div className="flex justify-between items-center mb-4 px-2">
                <h3 className={`text-sm font-bold uppercase tracking-wider ${
                  layoutMode === 'zen' ? 'text-[#a8a29e] font-serif tracking-widest' : 
                  layoutMode === 'paper' ? 'text-gray-500 font-medium' :
                  layoutMode === 'neo' ? 'text-black italic' : 'text-slate-400'
                }`}>
                  {layoutMode === 'zen' ? '旅行手账' : layoutMode === 'paper' ? '涂鸦记录' : '历史记录'}
                </h3>
                <button onClick={handleClearChat} className={`text-xs flex items-center gap-1 ${
                  layoutMode === 'zen' ? 'text-[#a8a29e] hover:text-[#78716c]' : 
                  layoutMode === 'paper' ? 'text-gray-500 hover:text-red-500' :
                  'text-slate-400 hover:text-red-500'
                }`}>
                  <RotateCcw size={12} /> {layoutMode === 'zen' ? '重置' : '清空'}
                </button>
             </div>
             {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} theme={theme} />
            ))}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area (Floating above Bottom Nav) */}
      <div className="fixed bottom-[70px] left-0 right-0 z-40 pointer-events-none">
          <div className="pointer-events-auto">
             <ChatInput onSend={handleSendMessage} isLoading={isLoading} theme={theme} />
          </div>
      </div>

      {/* Bottom Nav */}
      {renderBottomNav()}

    </div>
  );
};

export default App;