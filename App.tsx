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
  MapPin, CircleUser, House, Heart,
  Zap, Feather, Coffee, Camera, Mountain,
  Pen, Highlighter, Scissors, Sticker,
  CheckCircle2, CalendarDays, Users, ArrowRight,
  Sparkles, Anchor, Plane, Briefcase, Map,
  Luggage, Globe2, Tent, Ticket, Landmark,
  ShoppingBag, Palmtree, Building2, Gift, 
  MoreHorizontal, Stamp, Tag, BriefcaseBusiness,
  Train, Car, PartyPopper, Paperclip, Star, Smile,
  ChevronLeft, Clock, Trash2, Filter, Search, RotateCw,
  TrendingUp, CalendarCheck, MapPinned,
  QrCode, GripHorizontal, Sun, Moon, Cloud, Image as ImageIcon,
  Flame, Baby, Aperture, Backpack, Palette, Rocket, Music, Utensils
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

// 预设的演示数据
const DEMO_TRIPS: Trip[] = [
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
  }
];

// --- 辅助组件 ---

// 1. 模拟微信小程序顶部导航栏 (Capsule Navigation Bar)
const WeChatNavBar = ({ 
  title, 
  layoutMode, 
  onBack, 
  showBack,
  transparent = false
}: { 
  title: string, 
  layoutMode: LayoutMode, 
  onBack?: () => void, 
  showBack?: boolean,
  transparent?: boolean
}) => {
  // 根据主题动态调整导航栏样式
  const bgStyle = transparent 
    ? 'bg-transparent'
    : layoutMode === 'neo' ? 'bg-[#ffdc00] border-b-2 border-black' :
      layoutMode === 'zen' ? 'bg-[#fafaf9]/95 backdrop-blur-md' :
      layoutMode === 'paper' ? 'bg-[#fffdf5]/95 backdrop-blur-md border-b-2 border-dashed border-gray-300' :
      layoutMode === 'wanderlust' ? 'bg-[#F5F6F8]/90 backdrop-blur-xl' :
      'bg-[#f0f4f8]/90 backdrop-blur-md'; 

  const textStyle = 
    layoutMode === 'neo' ? 'text-black font-black italic' :
    layoutMode === 'wanderlust' ? 'text-[#1F2937] font-bold tracking-tight' :
    layoutMode === 'paper' ? 'text-gray-800 font-bold' :
    layoutMode === 'zen' ? 'text-[#44403c] font-serif font-bold tracking-wide' :
    'text-[#303133] font-semibold';

  const capsuleStyle = 
    layoutMode === 'neo' ? 'border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' :
    layoutMode === 'wanderlust' ? 'border border-black/5 bg-white/60 backdrop-blur-md text-slate-900' :
    'border border-gray-200 bg-white/60 backdrop-blur-md text-black';

  return (
    <div className={`fixed top-0 left-0 right-0 z-[60] flex flex-col transition-all duration-300 ${bgStyle}`}>
      {/* 模拟状态栏高度 (iPhone notch) */}
      <div className="h-[44px] w-full"></div> 
      
      {/* 导航栏内容区 (标准高度 44px) */}
      <div className="h-[44px] w-full flex items-center justify-center relative px-4">
         {/* 模拟返回按钮 */}
         <div className="absolute left-2 flex items-center gap-1 cursor-pointer active:opacity-50 transition-opacity pl-2 pr-4 py-2" onClick={onBack}>
            {(showBack || (layoutMode !== 'wanderlust' && layoutMode !== 'classic')) && (
               <div className={`w-8 h-8 rounded-full flex items-center justify-center ${transparent ? 'bg-black/20 backdrop-blur-lg text-white border border-white/10' : ''}`}>
                   <ChevronLeft size={24} className={transparent ? 'text-white' : textStyle.split(' ')[0]} strokeWidth={2.5} />
               </div>
            )}
             {/* 仅在非创建模式且为 Wanderlust 主题时显示 "探索" */}
            {!showBack && layoutMode === 'wanderlust' && !transparent && (
               <div className="flex items-center gap-1">
                 <span className="text-sm font-bold text-slate-900">探索</span>
               </div>
            )}
         </div>
         
         {/* 标题 */}
         <div className={`text-[17px] ${textStyle} ${transparent ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
            {title}
         </div>

         {/* 微信胶囊按钮 (Capsule Button) */}
         <div className={`absolute right-[7px] top-1/2 -translate-y-1/2 w-[87px] h-[32px] rounded-full flex items-center justify-evenly ${capsuleStyle}`}>
            <MoreHorizontal size={16} />
            <div className={`w-[1px] h-[18px] ${layoutMode === 'wanderlust' ? 'bg-black/10' : 'bg-gray-200'}`}></div>
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
  const [isCreating, setIsCreating] = useState(false); // New state for Create Trip view

  // 行程列表页面的筛选状态
  const [searchQuery, setSearchQuery] = useState('');
  const [tripFilter, setTripFilter] = useState<'upcoming' | 'past'>('upcoming');

  // 行程数据状态 (用于 UI 调试切换)
  const [trips, setTrips] = useState<Trip[]>([]);

  // Selected Template State
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedTripType, setSelectedTripType] = useState<string>('tourism');
  const [travelerCount, setTravelerCount] = useState(1);


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

  const toggleDemoData = () => {
    setTrips(prev => prev.length > 0 ? [] : DEMO_TRIPS);
  };

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
      family: { classic: House, neo: Heart, zen: Coffee, paper: House },
      other: { classic: Map, neo: Sparkles, zen: Compass, paper: Map }
    };
    const layoutKey = layout === 'wanderlust' ? 'classic' : layout;
    const selectedIcon = icons[type][layoutKey] || icons[type].classic;
    return { Icon: selectedIcon };
  };

  // --- 3. 空状态组件 (New Premium Empty State) ---
  const renderEmptyState = (type: 'home' | 'list') => (
    <div className={`flex flex-col items-center justify-center ${type === 'home' ? 'py-12' : 'py-20'} animate-fade-in`}>
        <div className="relative mb-6 group cursor-pointer" onClick={() => setIsCreating(true)}>
            {/* Glow effect */}
            <div className="absolute inset-0 bg-sky-400/20 blur-2xl rounded-full group-hover:bg-sky-400/30 transition-all duration-500"></div>
            
            {/* Icon Container */}
            <div className="relative w-24 h-24 bg-white/80 backdrop-blur-xl rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-white group-hover:scale-105 transition-transform duration-300">
                {type === 'home' ? (
                     <MapPinned size={40} className="text-sky-500 opacity-90" strokeWidth={1.5} />
                ) : (
                     <Luggage size={40} className="text-indigo-500 opacity-90" strokeWidth={1.5} />
                )}
            </div>

            {/* Floating Action Badge */}
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-white border-[3px] border-white shadow-lg group-hover:scale-110 transition-transform">
                <Plus size={18} />
            </div>
        </div>
        
        <h3 className="text-lg font-bold text-slate-800 mb-2">
            {type === 'home' ? '暂无近期行程' : '行程箱是空的'}
        </h3>
        <p className="text-slate-500 text-xs text-center max-w-[220px] leading-relaxed mb-8">
            {type === 'home' 
                ? '还没有出行计划？告诉 AI 你的目的地，一键生成专属清单。' 
                : '记录每一次出发。无论是商务差旅还是休闲度假，都值得被认真规划。'}
        </p>

        <div className="flex flex-col gap-3 w-full max-w-[200px]">
            <button 
                onClick={() => setIsCreating(true)}
                className="w-full h-11 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-500/30 hover:shadow-sky-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
                <Sparkles size={14} /> 创建新行程
            </button>
            <button 
                onClick={() => handleQuickAction("推荐一些热门旅行地")}
                className="w-full h-11 bg-white text-slate-600 rounded-xl text-xs font-bold border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-800 transition-all flex items-center justify-center gap-2"
            >
                <Compass size={14} /> 浏览热门模板
            </button>
        </div>
    </div>
  );

  // --- 4. 创建行程页面 (The Ultimate Redesign) ---
  const renderCreateTrip = () => {
    return (
      <div className="animate-slide-up bg-[#F5F6F8] min-h-screen">
         {/* Artistic Background - Soft Aurora */}
         <div className="fixed top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-[#E0E7FF] via-[#F0F9FF] to-[#F5F6F8] pointer-events-none z-0"></div>
         
         <div className="relative z-10 pb-32 pt-[100px] px-5">
            
            {/* 1. HERO QUESTION: Destination */}
            <div className="mb-8">
               <h1 className="text-3xl font-black text-slate-900 leading-tight mb-4">
                  准备去哪儿<br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">探索世界？</span>
               </h1>
               
               <div className="bg-white rounded-[32px] p-2 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.08)] ring-1 ring-black/5 flex items-center">
                   <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                      <Search size={24} strokeWidth={2.5} />
                   </div>
                   <input 
                      type="text" 
                      placeholder="输入城市或国家" 
                      className="flex-1 h-14 bg-transparent text-xl font-bold text-slate-800 placeholder:text-slate-300 outline-none px-4"
                      autoFocus
                   />
               </div>
            </div>

            {/* 2. TRIP CONFIG: Date Range & People */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Start Date */}
                <div className="bg-white rounded-[28px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] active:scale-95 transition-transform cursor-pointer border border-transparent hover:border-blue-100 group">
                   <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <CalendarDays size={20} strokeWidth={2.5} />
                   </div>
                   <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">出发日期</div>
                   <div className="text-base font-black text-slate-800">12月 24日</div>
                </div>

                {/* End Date */}
                 <div className="bg-white rounded-[28px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] active:scale-95 transition-transform cursor-pointer border border-transparent hover:border-indigo-100 group">
                   <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <CalendarCheck size={20} strokeWidth={2.5} />
                   </div>
                   <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">返回日期</div>
                   <div className="text-base font-black text-slate-800">12月 30日</div>
                </div>
            </div>

            {/* Travelers Card (Full Width) */}
            <div className="bg-white rounded-[28px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-transparent hover:border-violet-100 group mb-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Users size={20} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">同行人数</div>
                            <div className="text-base font-black text-slate-800">出行伙伴</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 rounded-full px-3 py-1.5 border border-slate-100">
                        <button onClick={() => setTravelerCount(Math.max(1, travelerCount - 1))} className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm text-slate-600 active:scale-90 transition-transform hover:text-slate-900 font-bold">-</button>
                        <span className="w-6 text-center text-sm font-black text-slate-800">{travelerCount}</span>
                        <button onClick={() => setTravelerCount(travelerCount + 1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-900 text-white shadow-sm active:scale-90 transition-transform hover:bg-black font-bold">+</button>
                    </div>
                </div>
            </div>

            {/* 3. TRIP STYLE: Horizontal Pills */}
            <div className="mb-8">
               <div className="flex justify-between items-center mb-4 px-1">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                     <Compass size={16} /> 出行类型
                  </h3>
               </div>
               <div className="flex gap-3 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide">
                  {[
                     { id: 'tourism', label: '休闲度假', icon: Palmtree, color: 'text-orange-500', bg: 'bg-orange-50' },
                     { id: 'business', label: '商务差旅', icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-50' },
                     { id: 'family', label: '家庭亲子', icon: Baby, color: 'text-pink-500', bg: 'bg-pink-50' },
                     { id: 'outdoor', label: '户外探险', icon: Mountain, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                     { id: 'foodie', label: '美食之旅', icon: Utensils, color: 'text-yellow-500', bg: 'bg-yellow-50' }
                  ].map((type) => (
                     <button
                        key={type.id}
                        onClick={() => setSelectedTripType(type.id)}
                        className={`flex-shrink-0 h-14 pl-2 pr-5 rounded-full flex items-center gap-3 border transition-all duration-300 ${
                           selectedTripType === type.id 
                           ? 'bg-slate-800 border-slate-800 text-white shadow-lg shadow-slate-900/20 scale-105' 
                           : 'bg-white border-transparent text-slate-600 shadow-sm'
                        }`}
                     >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedTripType === type.id ? 'bg-white/20 text-white' : `${type.bg} ${type.color}`}`}>
                           <type.icon size={18} strokeWidth={2.5} />
                        </div>
                        <span className="text-sm font-bold whitespace-nowrap">{type.label}</span>
                     </button>
                  ))}
               </div>
            </div>

            {/* 4. TEMPLATES: Poster Flow (Renamed Title) */}
            <div className="mb-8">
               <div className="flex justify-between items-center mb-4 px-1">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                     <LayoutTemplate size={16} /> 选择行程模板 <span className="text-xs font-normal text-slate-400">(可选)</span>
                  </h3>
               </div>
               <div className="flex gap-4 overflow-x-auto pb-6 -mx-5 px-5 scrollbar-hide perspective-1000">
                  {[
                     { id: 'city', title: 'City Walk', sub: '城市漫步指南', bg: 'bg-gradient-to-br from-slate-800 to-slate-900', img: 'https://images.unsplash.com/photo-1449824913929-2b3a6e547270?auto=format&fit=crop&q=80&w=400' },
                     { id: 'beach', title: 'Island Time', sub: '海岛躺平计划', bg: 'bg-gradient-to-br from-blue-400 to-cyan-300', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=400' },
                     { id: 'camp', title: 'Glamping', sub: '精致露营', bg: 'bg-gradient-to-br from-green-700 to-emerald-600', img: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&q=80&w=400' },
                     { id: 'ski', title: 'Snow White', sub: '滑雪装备', bg: 'bg-gradient-to-br from-indigo-300 to-blue-200', img: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&q=80&w=400' }
                  ].map((tpl) => (
                     <div 
                        key={tpl.id}
                        onClick={() => setSelectedTemplate(tpl.id)}
                        className={`relative flex-shrink-0 w-[160px] h-[220px] rounded-[24px] overflow-hidden cursor-pointer transition-all duration-300 group shadow-lg ${
                           selectedTemplate === tpl.id ? 'ring-4 ring-offset-2 ring-slate-900 scale-105 shadow-xl' : 'scale-100'
                        }`}
                     >
                        <img src={tpl.img} className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-110" alt="" />
                        <div className={`absolute inset-0 opacity-40 mix-blend-overlay ${tpl.bg}`}></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        
                        <div className="absolute top-3 right-3">
                           <div className={`w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center border transition-colors ${
                              selectedTemplate === tpl.id ? 'bg-slate-900 text-white border-transparent' : 'bg-white/20 text-white border-white/30'
                           }`}>
                              {selectedTemplate === tpl.id ? <CheckCircle2 size={16} /> : <Plus size={16} />}
                           </div>
                        </div>

                        <div className="absolute bottom-4 left-4 right-4">
                           <h4 className="text-white font-black text-xl leading-none mb-1">{tpl.title}</h4>
                           <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider">{tpl.sub}</p>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* 5. DETAILS: Description & Special Needs (Separate Cards) */}
            <div className="space-y-4 mb-8">
               {/* Trip Description */}
               <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-transparent hover:border-slate-100 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-900 flex items-center justify-center">
                        <FileText size={20} />
                     </div>
                     <h3 className="font-bold text-slate-900">行程描述</h3>
                  </div>
                  <textarea 
                     className="w-full h-24 bg-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 placeholder:text-slate-300 outline-none resize-none focus:ring-2 focus:ring-slate-100 transition-all"
                     placeholder="简单描述一下这次行程的目的和计划..."
                  ></textarea>
               </div>

               {/* Special Needs */}
               <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-transparent hover:border-rose-100 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                        <Heart size={20} />
                     </div>
                     <h3 className="font-bold text-slate-900">特殊需求</h3>
                  </div>
                  <textarea 
                     className="w-full h-24 bg-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 placeholder:text-slate-300 outline-none resize-none focus:ring-2 focus:ring-rose-100 transition-all"
                     placeholder="如：过敏体质、轮椅出行、宠物同行等特殊需求"
                  ></textarea>
               </div>
            </div>

            {/* 6. Destination Image Placeholder */}
             <div className="mb-24">
               <div className="flex justify-between items-center mb-4 px-1">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                     <ImageIcon size={16} /> 目的城市图片
                  </h3>
               </div>
               <div className="bg-white rounded-[32px] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-100">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-2">
                     <MapPin size={24} />
                  </div>
                  <p className="text-xs font-bold text-slate-400">请先选择目的地以查看城市图片</p>
               </div>
            </div>

         </div>

         {/* FLOAT ACTION BAR (Smart Island Style) */}
         <div className="fixed bottom-8 left-5 right-5 z-50 animate-slide-up">
            <button 
               onClick={() => {
                  setIsCreating(false);
                  setActiveTab('home');
                  handleSendMessage("我创建了一个去东莞的商务行程，请帮我生成清单");
               }}
               className="w-full h-[72px] bg-slate-900 text-white rounded-[28px] shadow-[0_20px_50px_-12px_rgba(15,23,42,0.5)] flex items-center justify-between px-2 pl-6 active:scale-[0.98] transition-all hover:shadow-[0_20px_50px_-12px_rgba(15,23,42,0.7)]"
            >
               <div className="flex flex-col items-start">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AI Ready</span>
                  <span className="text-lg font-bold">生成专属清单</span>
               </div>
               <div className="w-[56px] h-[56px] rounded-[22px] bg-white/10 flex items-center justify-center">
                  <ArrowRight size={24} />
               </div>
            </button>
         </div>

      </div>
    );
  };

  // --- 组件渲染器 ---

  // 1. 首页 - 探索模式布局
  const renderWanderlustHome = () => {
    const hasTrips = trips.length > 0;

    return (
    <div className="animate-fade-in">
      <div className="px-1 mb-6 mt-2">
         <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">你好，旅行者</h2>
            <button 
              onClick={toggleDemoData}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                hasTrips 
                  ? 'bg-rose-50 text-rose-400 border-rose-100 hover:bg-rose-100' 
                  : 'bg-emerald-50 text-emerald-500 border-emerald-100 hover:bg-emerald-100'
              }`}
            >
              {hasTrips ? '调试: 清空' : '调试: 加载'}
            </button>
         </div>
         <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-[1.1]">
            {hasTrips ? (
               <>
                 准备好<br/>
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">出发了吗？</span>
               </>
            ) : (
               <>
                 探索你的<br/>
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">下一站旅程</span>
               </>
            )}
         </h1>
      </div>
      
      {/* Dynamic Hero Card */}
      {hasTrips ? (
          // Case A: Has Trips - Show the first trip as "Next Trip"
          <div 
             onClick={() => handleCheckTrip(trips[0].title)}
             className="relative w-full h-[280px] rounded-[32px] overflow-hidden mb-10 group cursor-pointer shadow-2xl shadow-sky-900/10 ring-1 ring-slate-900/5 active:scale-[0.99] transition-all duration-500"
          >
            <img src={trips[0].image} alt="Next Trip" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10 flex flex-col justify-end p-8 text-white">
               <div className="flex items-center gap-2 mb-3">
                  <span className="bg-sky-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg">下一站</span>
                  <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold border border-white/20 flex items-center gap-1">
                     <Clock size={10} /> {trips[0].date.split(' - ')[0]} 出发
                  </span>
               </div>
               <h3 className="text-3xl font-bold leading-none mb-2">{trips[0].title}</h3>
               <div className="flex items-center gap-2 text-sm text-gray-200 opacity-90">
                  <MapPin size={14} /> <span>{trips[0].location}</span>
                  <span className="w-1 h-1 rounded-full bg-white/50"></span>
                  <span>{tripTypeToChinese(trips[0].type)}</span>
               </div>
            </div>
          </div>
      ) : (
          // Case B: No Trips - Show Generic Inspiration
          <div 
             onClick={() => setIsCreating(true)}
             className="relative w-full h-[280px] rounded-[32px] overflow-hidden mb-10 group cursor-pointer shadow-2xl shadow-sky-900/10 ring-1 ring-slate-900/5 active:scale-[0.99] transition-all duration-500"
          >
            <img src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=800" alt="Inspiration" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-90" />
            
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/10 flex flex-col justify-end p-8 text-white">
               <div className="flex items-center gap-2 mb-3">
                  <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold border border-white/20 flex items-center gap-1 shadow-lg">
                     <Sparkles size={10} /> 灵感推荐
                  </span>
               </div>
               <h3 className="text-3xl font-bold leading-none mb-2">世界那么大</h3>
               <p className="text-sm text-gray-200 opacity-90 mb-1 font-medium">不妨去看看？让 AI 为你寻找灵感。</p>
            </div>
             {/* Floating Button inside Hero */}
             <div className="absolute bottom-8 right-8 w-10 h-10 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <ArrowRight size={20} strokeWidth={2.5} />
             </div>
          </div>
      )}

      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4 px-1">旅行工具箱</h3>
        <div className="grid grid-cols-4 gap-2">
           {[
             {icon: Plus, t1: '新建行程', t2: '开始规划', color: 'sky', bg: 'bg-sky-50', text: 'text-sky-600', action: () => setIsCreating(true)}, 
             {icon: Ticket, t1: '加入行程', t2: '扫码口令', color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-600', action: () => handleQuickAction('加入行程')},
             {icon: Handshake, t1: '好友协作', t2: '邀请好友', color: 'violet', bg: 'bg-violet-50', text: 'text-violet-600', action: () => handleQuickAction('好友协作')}, 
             {icon: Compass, t1: '灵感探索', t2: '热门模板', color: 'amber', bg: 'bg-amber-50', text: 'text-amber-600', action: () => handleQuickAction('灵感探索')}
           ].map((item, idx) => (
             <button 
                key={idx} 
                onClick={item.action} 
                className="flex flex-col items-center justify-center bg-white rounded-2xl py-4 px-1 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100 active:scale-95 transition-all hover:border-sky-200"
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
        <h2 className="text-lg font-bold text-slate-800 leading-none tracking-tight">
             {hasTrips ? "最近行程" : "开始规划"}
        </h2>
        {hasTrips && (
            <button onClick={() => setActiveTab('trips')} className="text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors flex items-center gap-0.5">
            查看全部 <ChevronLeft size={12} className="rotate-180" />
            </button>
        )}
      </div>

      {/* Conditional Rendering for Trips / Empty State */}
      {hasTrips ? (
          trips.slice(0, 2).map((trip) => {
            const { Icon } = getTripVisuals(trip.type, layoutMode);
            return (
            <div key={trip.id} className="relative h-56 rounded-[28px] overflow-hidden mb-6 group shadow-xl shadow-slate-200/50 active:scale-[0.98] transition-all duration-300 ring-1 ring-black/5">
              <img src={trip.image} className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${trip.status === '已完成' ? 'grayscale' : ''}`} alt={trip.title} />
              
              {/* Base Gradient Overlay for general readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20"></div>

              {/* Frosted Glass Layer at the Bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-slate-900/90 via-slate-900/60 to-transparent backdrop-blur-[6px]"></div>
              
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                 {trip.isCoop ? (
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                       <Users size={12} /> <span>伙伴同行</span>
                    </div>
                 ) : <div></div>}
                 <div className={`backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold border border-white/20 shadow-sm tracking-wide uppercase ${
                    trip.status === '准备中' ? 'bg-sky-500/80 text-white' : 'bg-black/60 text-white/70'
                 }`}>
                    {trip.status}
                 </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-between items-end z-10">
                 <div className="flex-1 pr-4">
                   <div className="flex items-center gap-2 mb-1.5">
                      <Icon size={14} className="text-sky-300" />
                      <span className="text-xs text-sky-200 font-bold tracking-widest uppercase">{tripTypeToChinese(trip.type)}</span>
                   </div>
                   <h3 className="text-2xl font-bold text-white leading-tight mb-1">{trip.title}</h3>
                   <div className="flex items-center gap-2 text-white/70 text-xs font-medium">
                      <span className="flex items-center gap-1"><MapPin size={12} /> {trip.location}</span>
                      <span className="w-1 h-1 rounded-full bg-white/40"></span>
                      <span>{trip.date}</span>
                   </div>
                 </div>
                 <button onClick={() => handleCheckTrip(trip.title)} className="bg-white text-slate-900 w-11 h-11 rounded-full flex items-center justify-center hover:bg-sky-50 transition-colors shadow-lg shadow-black/20 group-hover:scale-105 active:scale-95 duration-200">
                    <ArrowRight size={20} strokeWidth={2.5} />
                 </button>
              </div>
            </div>
            );
          })
      ) : (
          renderEmptyState('home')
      )}
    </div>
    );
  };

  // 2. 行程页 - 高级杂志风格设计 (Restored & Localized)
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
               <button onClick={() => setIsCreating(true)} className="bg-slate-800 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg shadow-slate-900/20 hover:scale-105 transition-transform active:scale-95">
                  <Plus size={20} />
               </button>
            </div>

            {/* Stats Cards - Horizontal Scroll */}
            <div className="flex gap-3 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide">
               <div className="min-w-[120px] bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between h-28">
                  <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                     <TrendingUp size={16} strokeWidth={2.5} />
                  </div>
                  <div>
                     <div className="text-2xl font-black text-slate-800">85<span className="text-sm text-slate-400 font-bold">%</span></div>
                     <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">准备就绪</div>
                  </div>
               </div>
               <div className="min-w-[120px] bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between h-28">
                  <div className="w-8 h-8 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center">
                     <MapPinned size={16} strokeWidth={2.5} />
                  </div>
                  <div>
                     <div className="text-2xl font-black text-slate-800">4</div>
                     <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">即将出发</div>
                  </div>
               </div>
               <div className="min-w-[120px] bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between h-28">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                     <CalendarCheck size={16} strokeWidth={2.5} />
                  </div>
                  <div>
                     <div className="text-2xl font-black text-slate-800">12</div>
                     <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">剩余天数</div>
                  </div>
               </div>
            </div>
         </div>

         {/* Floating Search & Filter Bar (悬浮岛设计) */}
         <div className="sticky top-[80px] z-30 mb-8">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-2 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/50 ring-1 ring-black/5 flex items-center gap-2">
               <div className="flex-1 flex items-center h-10 bg-slate-50/50 rounded-xl px-3 border border-slate-100 focus-within:bg-white focus-within:border-sky-200 transition-all group">
                  <Search size={16} className="text-slate-400 group-focus-within:text-sky-500 transition-colors" />
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
                  <button className="h-10 w-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-lg shadow-slate-900/10">
                     <Filter size={16} />
                  </button>
               </div>
            </div>
         </div>

         {/* Immersive Trip Cards (杂志风格大卡片) */}
         <div className="space-y-8">
            {trips.length > 0 ? (
               trips.map((trip) => {
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
                                 isReady ? 'bg-sky-500/20 text-white' : 'bg-slate-800/40 text-slate-300'
                              }`}>
                                 <span className={`w-1.5 h-1.5 rounded-full ${isReady ? 'bg-sky-400 animate-pulse' : 'bg-slate-400'}`}></span>
                                 {trip.status}
                              </div>
                           </div>

                           {/* Title Overlay */}
                           <div className="absolute bottom-0 left-0 w-full p-6">
                              <div className="flex items-center gap-2 mb-2">
                                  <Icon size={14} className="text-white/80" />
                                  <span className="text-[10px] font-bold text-white/80 tracking-widest uppercase opacity-80">{tripTypeToChinese(trip.type)}之旅</span>
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
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">出发日期</span>
                                    <span className="text-sm font-bold text-slate-700">{trip.date.split(' - ')[0]}</span>
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">行程天数</span>
                                    <span className="text-sm font-bold text-slate-700">{trip.days} 天</span>
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
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">清单进度</span>
                                    <span className="text-xs font-black text-sky-600">{progress}%</span>
                                 </div>
                                 <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                    <div 
                                       className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full transition-all duration-1000 ease-out"
                                       style={{ width: `${progress}%` }}
                                    ></div>
                                 </div>
                              </div>
                              <button 
                                 onClick={() => handleCheckTrip(trip.title)}
                                 className="h-10 px-5 bg-slate-800 text-white rounded-xl text-xs font-bold shadow-lg shadow-slate-900/20 hover:bg-black transition-colors flex items-center gap-2 group-hover:scale-105 duration-300"
                              >
                                 查验 <ArrowRight size={14} className="opacity-70" />
                              </button>
                           </div>
                        </div>
                     </div>
                  )
               })
            ) : (
               renderEmptyState('list')
            )}
         </div>
      </div>
    );
  };

  const renderProfileTab = () => (
     <div className="flex flex-col items-center justify-center h-full pt-20 text-slate-400">
        <CircleUser size={64} strokeWidth={1} className="mb-4 text-slate-200" />
        <p className="text-sm font-medium">个人中心开发中...</p>
     </div>
  );

  const bgColors = {
    classic: 'bg-[#f5f7fa] text-slate-800',
    wanderlust: 'bg-[#f0f4f8] text-slate-800',
    neo: 'bg-[#fff] text-black',
    zen: 'bg-[#fafaf9] text-[#44403c]',
    paper: 'bg-[#fffdf5] text-gray-800',
  };

  const renderBottomNav = () => {
     // Wanderlust Navigation Style
     // 隐藏底部导航栏当处于创建行程页面时
     if (isCreating) return null;

     if (layoutMode === 'wanderlust') {
        return (
          <div className="fixed bottom-6 left-6 right-6 h-[72px] bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] rounded-[32px] flex justify-around items-center z-50 px-2 ring-1 ring-black/5">
             <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-all p-2 rounded-2xl ${activeTab === 'home' ? 'text-sky-600 bg-sky-50' : 'text-slate-400 hover:text-slate-600'}`}>
                <House size={24} strokeWidth={2.5} />
             </button>
             <button onClick={() => setActiveTab('trips')} className={`flex flex-col items-center gap-1 transition-all p-2 rounded-2xl ${activeTab === 'trips' ? 'text-sky-600 bg-sky-50' : 'text-slate-400 hover:text-slate-600'}`}>
                <CalendarDays size={24} strokeWidth={2.5} />
             </button>
             <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 transition-all p-2 rounded-2xl ${activeTab === 'profile' ? 'text-sky-600 bg-sky-50' : 'text-slate-400 hover:text-slate-600'}`}>
                <CircleUser size={24} strokeWidth={2.5} />
             </button>
          </div>
        );
     }
     return null;
  };

  // Helper for translating trip types
  const tripTypeToChinese = (type: TripType) => {
      const map = {
          tourism: '休闲度假',
          business: '商务差旅',
          family: '家庭出游',
          other: '其他行程'
      };
      return map[type] || '旅行';
  };

  // 动态导航栏标题
  const navTitle = isCreating 
      ? '创建行程' 
      : activeTab === 'trips' ? '我的行程' : activeTab === 'profile' ? '个人中心' : APP_TITLE;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-700 ${bgColors[layoutMode]}`}>
      
      {/* 1. WeChat Capsule Navigation Bar */}
      <WeChatNavBar 
          title={navTitle} 
          layoutMode={layoutMode} 
          showBack={isCreating}
          onBack={() => isCreating && setIsCreating(false)}
          transparent={isCreating}
      />

      {/* Main Content */}
      <main className={`flex-1 w-full max-w-3xl mx-auto ${isCreating ? '' : 'px-5 pt-[100px] pb-[140px]'}`}>
        
        {/* If Creating, show create form, else show tabs */}
        {isCreating ? renderCreateTrip() : (
           <>
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
           </>
        )}

      </main>

      {/* Bottom Nav */}
      {renderBottomNav()}

    </div>
  );
};

export default App;