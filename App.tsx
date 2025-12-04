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
  Train, Car, PartyPopper, Paperclip, Star, Smile,
  ChevronLeft, Clock, Trash2, Filter, Search, RotateCw,
  TrendingUp, CalendarCheck, MapPinned
} from 'lucide-react';

// --- 类型定义 & 模拟数据 ---

type TripType = 'tourism' | 'business' | 'family' | 'other';

interface Trip {
  id: string;
  title: string;
  location: string;
  date: string;
  status: '准备中' | '已完成';
  type: TripType;
  image: string;
  isCoop?: boolean;
  // New fields for Trip Tab details
  days: number;
  people: number;
  checkedItems: number;
  totalItems: number;
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
    days: 2,
    people: 3,
    checkedItems: 5,
    totalItems: 12
  },
  { 
    id: '2', 
    title: '三亚 · 海边度假', 
    location: '海南省·三亚市', 
    date: '12月15日 - 20日', 
    status: '准备中',
    type: 'tourism',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=600',
    days: 6,
    people: 2,
    checkedItems: 20,
    totalItems: 20
  },
  {
    id: '3',
    title: '回老家 · 团圆饭', 
    location: '湖南省·长沙市',
    date: '1月20日 - 28日',
    status: '准备中',
    type: 'family',
    image: 'https://images.unsplash.com/photo-1516083692468-b769f36f9661?auto=format&fit=crop&q=80&w=600',
    days: 9,
    people: 5,
    checkedItems: 0,
    totalItems: 35
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
    days: 5,
    people: 4,
    checkedItems: 45,
    totalItems: 45
  }
];

// --- 辅助组件 ---

// 1. 模拟微信小程序顶部导航栏 (Capsule Navigation Bar)
const WeChatNavBar = ({ title, layoutMode }: { title: string, layoutMode: LayoutMode }) => {
  // 根据主题动态调整导航栏样式
  const bgStyle = 
    layoutMode === 'neo' ? 'bg-[#ffdc00] border-b-2 border-black' :
    layoutMode === 'zen' ? 'bg-[#fafaf9]/95 backdrop-blur-md' :
    layoutMode === 'paper' ? 'bg-[#fffdf5]/95 backdrop-blur-md border-b-2 border-dashed border-gray-300' :
    layoutMode === 'wanderlust' ? 'bg-white/80 backdrop-blur-md border-b border-gray-100' :
    'bg-[#f5f7fa]/95 backdrop-blur-md'; // Classic

  const textStyle = 
    layoutMode === 'neo' ? 'text-black font-black italic' :
    layoutMode === 'wanderlust' ? 'text-slate-800 font-bold tracking-tight' :
    layoutMode === 'paper' ? 'text-gray-800 font-bold' :
    layoutMode === 'zen' ? 'text-[#44403c] font-serif font-bold tracking-wide' :
    'text-[#303133] font-semibold';

  const capsuleStyle = 
    layoutMode === 'neo' ? 'border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' :
    layoutMode === 'wanderlust' ? 'border border-gray-200 bg-white/50 text-slate-800' :
    'border border-gray-200 bg-white/60 backdrop-blur-md text-black';

  return (
    <div className={`fixed top-0 left-0 right-0 z-[60] flex flex-col transition-all duration-300 ${bgStyle}`}>
      {/* 模拟状态栏高度 (iPhone notch) */}
      <div className="h-[44px] w-full"></div> 
      
      {/* 导航栏内容区 (标准高度 44px) */}
      <div className="h-[44px] w-full flex items-center justify-center relative px-4">
         {/* 模拟返回按钮 */}
         <div className="absolute left-4 flex items-center gap-1 cursor-pointer hover:opacity-70">
            {layoutMode === 'wanderlust' && (
               <div className="flex items-center gap-1">
                 <span className="text-sm font-bold text-slate-900">探索</span>
               </div>
            )}
            {layoutMode !== 'wanderlust' && layoutMode !== 'classic' && (
               <ChevronLeft size={24} className={textStyle.split(' ')[0]} />
            )}
         </div>
         
         {/* 标题 */}
         <div className={`text-[17px] ${textStyle}`}>
            {title}
         </div>

         {/* 微信胶囊按钮 (Capsule Button) */}
         <div className={`absolute right-[7px] top-1/2 -translate-y-1/2 w-[87px] h-[32px] rounded-full flex items-center justify-evenly ${capsuleStyle}`}>
            <MoreHorizontal size={16} />
            <div className={`w-[1px] h-[18px] ${layoutMode === 'wanderlust' ? 'bg-gray-300' : 'bg-gray-200'}`}></div>
            <div className="w-[16px] h-[16px] rounded-full border-2 border-current flex items-center justify-center">
              <div className="w-[4px] h-[4px] bg-current rounded-full"></div>
            </div>
         </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 状态控制：默认锁定 Wanderlust 模式
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('wanderlust'); 
  const [theme, setTheme] = useState<Theme>('wanderlust');
  const [activeTab, setActiveTab] = useState('home');

  // 行程列表页面的筛选状态
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 布局模式改变时，同步更新聊天气泡等内部主题
    if (layoutMode === 'neo') setTheme('neo');
    else if (layoutMode === 'zen') setTheme('zen');
    else if (layoutMode === 'paper') setTheme('paper');
    else if (layoutMode === 'wanderlust') setTheme('wanderlust');
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
    // 如果在行程页点击，可能需要跳转回首页对话框
    setActiveTab('home');
    setTimeout(() => {
        handleSendMessage(`查验 ${tripTitle} 的物品清单`);
    }, 100);
  };

  // --- 视觉风格配置系统 ---

  const getTripVisuals = (type: TripType, layout: LayoutMode) => {
    const icons = {
      tourism: { classic: Palmtree, neo: Camera, zen: Mountain, paper: Camera },
      business: { classic: BriefcaseBusiness, neo: Building2, zen: PenLine, paper: BriefcaseBusiness },
      family: { classic: Home, neo: Heart, zen: Coffee, paper: Home },
      other: { classic: Map, neo: Sparkles, zen: Compass, paper: Map }
    };
    const layoutKey = layout === 'wanderlust' ? 'classic' : layout;
    const selectedIcon = icons[type][layoutKey] || icons[type].classic;
    return { Icon: selectedIcon };
  };

  // --- 组件渲染器 ---

  // 1. 首页 - 探索模式布局
  const renderWanderlustHome = () => (
    <div className="animate-fade-in">
      <div className="px-1 mb-6 mt-2">
         <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-2">Hello, Traveler</h2>
         <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-[1.1]">
            探索你的<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">下一站旅程</span>
         </h1>
      </div>
      
      {/* Hero Card */}
      <div 
         onClick={() => handleQuickAction("我要去北京，帮我规划")}
         className="relative w-full h-[280px] rounded-[32px] overflow-hidden mb-10 group cursor-pointer shadow-2xl shadow-cyan-900/10 ring-1 ring-slate-900/5 active:scale-[0.99] transition-all duration-500"
      >
        <img src="https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&q=80&w=800" alt="Featured" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10 flex flex-col justify-end p-8 text-white">
           <div className="flex items-center gap-2 mb-3">
              <span className="bg-cyan-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg">Featured</span>
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold border border-white/20">5天后出发</span>
           </div>
           <h3 className="text-3xl font-bold leading-none mb-2">北京 · 文化溯源</h3>
           <div className="flex items-center gap-2 text-sm text-gray-200 opacity-90">
              <MapPin size={14} /> <span>北京, 中国</span>
              <span className="w-1 h-1 rounded-full bg-white/50"></span>
              <span>深度游</span>
           </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4 px-1">旅行工具箱</h3>
        <div className="grid grid-cols-4 gap-2">
           {[
             {icon: Plus, t1: '新建行程', t2: '开始规划', color: 'cyan', bg: 'bg-cyan-50', text: 'text-cyan-600'}, 
             {icon: Ticket, t1: '加入行程', t2: '扫码口令', color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-600'},
             {icon: Handshake, t1: '好友协作', t2: '邀请好友', color: 'violet', bg: 'bg-violet-50', text: 'text-violet-600'}, 
             {icon: Compass, t1: '灵感探索', t2: '热门模板', color: 'amber', bg: 'bg-amber-50', text: 'text-amber-600'}
           ].map((item, idx) => (
             <button 
                key={idx} 
                onClick={() => handleQuickAction(item.t1)} 
                className="flex flex-col items-center justify-center bg-white rounded-2xl py-4 px-1 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100 active:scale-95 transition-all hover:border-cyan-100"
             >
                <div className={`w-10 h-10 rounded-full ${item.bg} ${item.text} flex items-center justify-center mb-2`}>
                   <item.icon size={20} strokeWidth={2.5} />
                </div>
                <div className="text-center w-full">
                   <span className="block text-[12px] font-bold text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis">{item.t1}</span>
                   <span className="text-[9px] text-slate-400 mt-0.5 block whitespace-nowrap overflow-hidden text-ellipsis">{item.t2}</span>
                </div>
             </button>
           ))}
        </div>
      </div>

      <div className="flex justify-between items-end mb-4 mt-8 px-1">
        <h2 className="text-lg font-bold text-slate-800 leading-none tracking-tight">最近行程</h2>
        <button onClick={() => setActiveTab('trips')} className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 transition-colors flex items-center gap-0.5">
           查看全部 <ChevronLeft size={12} className="rotate-180" />
        </button>
      </div>

      {/* Large Cards for Home Page - Restored & Improved with Frosted Glass */}
      {MOCK_TRIPS.slice(0, 2).map((trip) => {
        const { Icon } = getTripVisuals(trip.type, layoutMode);
        return (
        <div key={trip.id} className="relative h-56 rounded-[28px] overflow-hidden mb-6 group shadow-xl shadow-slate-200/50 active:scale-[0.98] transition-all duration-300 ring-1 ring-black/5">
          <img src={trip.image} className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${trip.status === '已完成' ? 'grayscale' : ''}`} alt={trip.title} />
          
          {/* Base Gradient Overlay for general readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20"></div>

          {/* Frosted Glass Layer at the Bottom */}
          {/* Using backdrop-blur-md with a gradient to create the "faintly see city" effect */}
          <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-slate-900/90 via-slate-900/60 to-transparent backdrop-blur-[6px]"></div>
          
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
             {trip.isCoop ? (
                <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                   <Users size={12} /> <span>伙伴同行</span>
                </div>
             ) : <div></div>}
             <div className={`backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold border border-white/20 shadow-sm tracking-wide uppercase ${
                trip.status === '准备中' ? 'bg-cyan-500/80 text-white' : 'bg-black/60 text-white/70'
             }`}>
                {trip.status}
             </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-between items-end z-10">
             <div className="flex-1 pr-4">
               <div className="flex items-center gap-2 mb-1.5">
                  <Icon size={14} className="text-cyan-300" />
                  <span className="text-xs text-cyan-200 font-bold tracking-widest uppercase">{trip.type}</span>
               </div>
               <h3 className="text-2xl font-bold text-white leading-tight mb-1">{trip.title}</h3>
               <div className="flex items-center gap-2 text-white/70 text-xs font-medium">
                  <span className="flex items-center gap-1"><MapPin size={12} /> {trip.location}</span>
                  <span className="w-1 h-1 rounded-full bg-white/40"></span>
                  <span>{trip.date}</span>
               </div>
             </div>
             <button onClick={() => handleCheckTrip(trip.title)} className="bg-white text-slate-900 w-11 h-11 rounded-full flex items-center justify-center hover:bg-cyan-50 transition-colors shadow-lg shadow-black/20 group-hover:scale-105 active:scale-95 duration-200">
                <ArrowRight size={20} strokeWidth={2.5} />
             </button>
          </div>
        </div>
        );
      })}
    </div>
  );

  // 2. 行程页 - 高级杂志风格设计 (Redesigned)
  const renderTripsTab = () => {
    return (
      <div className="animate-fade-in pb-20">
         
         {/* Top Header & Stats (仪表盘风格) */}
         <div className="pt-2 px-1 mb-6">
            <div className="flex justify-between items-end mb-6">
               <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1">旅行日志</h1>
                  <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase">Travel Passport</p>
               </div>
               <button className="bg-slate-900 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg shadow-slate-900/30 hover:scale-105 transition-transform active:scale-95">
                  <Plus size={20} />
               </button>
            </div>

            {/* Stats Cards - Horizontal Scroll */}
            <div className="flex gap-3 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide">
               <div className="min-w-[120px] bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between h-28">
                  <div className="w-8 h-8 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center">
                     <TrendingUp size={16} strokeWidth={2.5} />
                  </div>
                  <div>
                     <div className="text-2xl font-black text-slate-800">85<span className="text-sm text-slate-400 font-bold">%</span></div>
                     <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Ready to Go</div>
                  </div>
               </div>
               <div className="min-w-[120px] bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between h-28">
                  <div className="w-8 h-8 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center">
                     <MapPinned size={16} strokeWidth={2.5} />
                  </div>
                  <div>
                     <div className="text-2xl font-black text-slate-800">4</div>
                     <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Upcoming Trips</div>
                  </div>
               </div>
               <div className="min-w-[120px] bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between h-28">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                     <CalendarCheck size={16} strokeWidth={2.5} />
                  </div>
                  <div>
                     <div className="text-2xl font-black text-slate-800">12</div>
                     <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Days Left</div>
                  </div>
               </div>
            </div>
         </div>

         {/* Floating Search & Filter Bar (悬浮岛设计) */}
         <div className="sticky top-[80px] z-30 mb-8">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-2 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/50 ring-1 ring-black/5 flex items-center gap-2">
               <div className="flex-1 flex items-center h-10 bg-slate-50/50 rounded-xl px-3 border border-slate-100 focus-within:bg-white focus-within:border-cyan-200 transition-all group">
                  <Search size={16} className="text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
                  <input 
                     type="text" 
                     placeholder="搜索我的足迹..." 
                     className="w-full bg-transparent border-none focus:ring-0 text-xs font-bold text-slate-700 placeholder:text-slate-400 h-full"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
               <div className="flex gap-1">
                  <button className="h-10 px-3 rounded-xl bg-slate-50 text-slate-500 text-xs font-bold border border-slate-100 hover:bg-slate-100 transition-colors">
                     状态
                  </button>
                  <button className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/10">
                     <Filter size={16} />
                  </button>
               </div>
            </div>
         </div>

         {/* Immersive Trip Cards (杂志风格大卡片) */}
         <div className="space-y-8">
            {MOCK_TRIPS.map((trip) => {
               const { Icon } = getTripVisuals(trip.type, layoutMode);
               const progress = Math.round((trip.checkedItems / trip.totalItems) * 100);
               const isReady = trip.status === '准备中';
               
               return (
                  <div key={trip.id} className="group relative bg-white rounded-[32px] p-2 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] border border-slate-100 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12)] transition-all duration-500">
                     
                     {/* 1. Immersive Image Area */}
                     <div className="relative h-64 w-full rounded-[28px] overflow-hidden">
                        <img src={trip.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-90"></div>
                        
                        {/* Status Badge (Glassmorphism) */}
                        <div className="absolute top-4 left-4">
                           <div className={`backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold border border-white/10 shadow-lg tracking-wide uppercase flex items-center gap-1.5 ${
                              isReady ? 'bg-cyan-500/20 text-white' : 'bg-slate-800/40 text-slate-300'
                           }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isReady ? 'bg-cyan-400 animate-pulse' : 'bg-slate-400'}`}></span>
                              {trip.status}
                           </div>
                        </div>

                        {/* Title Overlay */}
                        <div className="absolute bottom-0 left-0 w-full p-6">
                           <div className="flex items-center gap-2 mb-2">
                               <Icon size={14} className="text-white/80" />
                               <span className="text-[10px] font-bold text-white/80 tracking-widest uppercase opacity-80">{trip.type.toUpperCase()} TRIP</span>
                           </div>
                           <h3 className="text-3xl font-black text-white leading-tight mb-2 shadow-sm">{trip.title}</h3>
                           <div className="flex items-center gap-2 text-white/70 text-xs font-medium">
                              <MapPin size={12} /> {trip.location}
                           </div>
                        </div>
                     </div>

                     {/* 2. Info & Action Area */}
                     <div className="px-5 pt-5 pb-3">
                        {/* Info Grid */}
                        <div className="flex justify-between items-center mb-6">
                           <div className="flex gap-6">
                              <div className="flex flex-col">
                                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Date</span>
                                 <span className="text-sm font-bold text-slate-700">{trip.date.split(' - ')[0]}</span>
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Duration</span>
                                 <span className="text-sm font-bold text-slate-700">{trip.days} Days</span>
                              </div>
                           </div>
                           
                           {/* Mini Avatars */}
                           <div className="flex -space-x-2">
                              {[...Array(Math.min(3, trip.people))].map((_, i) => (
                                 <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm">
                                    {String.fromCharCode(65+i)}
                                 </div>
                              ))}
                              {trip.people > 3 && (
                                 <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 shadow-sm">
                                    +{trip.people - 3}
                                 </div>
                              )}
                           </div>
                        </div>

                        {/* Integrated Progress Bar & Action */}
                        <div className="bg-slate-50 rounded-2xl p-1.5 flex items-center gap-3 pr-2 border border-slate-100">
                           <div className="flex-1 pl-3 py-1">
                              <div className="flex justify-between items-end mb-1.5">
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Checklist</span>
                                 <span className="text-xs font-black text-cyan-600">{progress}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                 <div 
                                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${progress}%` }}
                                 ></div>
                              </div>
                           </div>
                           <button 
                              onClick={() => handleCheckTrip(trip.title)}
                              className="h-10 px-5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg shadow-slate-900/20 hover:bg-black transition-colors flex items-center gap-2 group-hover:scale-105 duration-300"
                           >
                              查验 <ArrowRight size={14} className="opacity-70" />
                           </button>
                        </div>
                     </div>
                  </div>
               )
            })}
         </div>
      </div>
    );
  };

  const renderProfileTab = () => (
     <div className="flex flex-col items-center justify-center h-full pt-20 text-slate-400">
        <UserCircle size={64} strokeWidth={1} className="mb-4 text-slate-200" />
        <p className="text-sm font-medium">个人中心开发中...</p>
     </div>
  );

  const bgColors = {
    classic: 'bg-[#f5f7fa] text-slate-800',
    wanderlust: 'bg-[#f8fafc] text-slate-800',
    neo: 'bg-[#fff] text-black',
    zen: 'bg-[#fafaf9] text-[#44403c]',
    paper: 'bg-[#fffdf5] text-gray-800',
  };

  const renderBottomNav = () => {
     // Wanderlust Navigation Style
     if (layoutMode === 'wanderlust') {
        return (
          <div className="fixed bottom-6 left-6 right-6 h-[72px] bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] rounded-[32px] flex justify-around items-center z-50 px-2 ring-1 ring-black/5">
             <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-all p-2 rounded-2xl ${activeTab === 'home' ? 'text-cyan-600 bg-cyan-50' : 'text-slate-400 hover:text-slate-600'}`}>
                <Home size={24} strokeWidth={2.5} />
             </button>
             <button onClick={() => setActiveTab('trips')} className={`flex flex-col items-center gap-1 transition-all p-2 rounded-2xl ${activeTab === 'trips' ? 'text-cyan-600 bg-cyan-50' : 'text-slate-400 hover:text-slate-600'}`}>
                <Calendar size={24} strokeWidth={2.5} />
             </button>
             <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 transition-all p-2 rounded-2xl ${activeTab === 'profile' ? 'text-cyan-600 bg-cyan-50' : 'text-slate-400 hover:text-slate-600'}`}>
                <UserCircle size={24} strokeWidth={2.5} />
             </button>
          </div>
        );
     }
     return null;
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-700 ${bgColors[layoutMode]}`}>
      
      {/* 1. WeChat Capsule Navigation Bar */}
      <WeChatNavBar title={activeTab === 'trips' ? '我的行程' : activeTab === 'profile' ? '个人中心' : APP_TITLE} layoutMode={layoutMode} />

      {/* Main Content */}
      <main className={`flex-1 w-full max-w-3xl mx-auto px-5 pt-[100px] pb-[140px]`}>
        
        {/* Render Logic based on Active Tab */}
        {activeTab === 'home' && (
           <>
              <div className="mb-4">
                 {renderWanderlustHome()}
              </div>
              {/* Chat History - Only on Home Tab */}
              {messages.length > 0 && (
                <div className="mt-8 pt-8 border-t border-dashed border-slate-200">
                   <div className="flex justify-between items-center mb-6 px-2">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                        AI 助手对话
                      </h3>
                      <button onClick={handleClearChat} className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-red-500 transition-colors font-medium bg-slate-50 px-2 py-1 rounded-full">
                        <RotateCcw size={12} /> 清空记录
                      </button>
                   </div>
                   {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} theme={theme} />
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
           </>
        )}

        {activeTab === 'trips' && renderTripsTab()}
        {activeTab === 'profile' && renderProfileTab()}

      </main>

      {/* Input Area (Floating) - Only on Home Tab */}
      <div className={`fixed bottom-[110px] left-0 right-0 z-40 transition-all duration-300 ${activeTab !== 'home' ? 'translate-y-[200px] opacity-0 pointer-events-none' : 'pointer-events-none'}`}>
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