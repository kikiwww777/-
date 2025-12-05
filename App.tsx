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
  Flame, Baby, Aperture, Backpack, Palette, Rocket, Music, Utensils,
  ChevronRight, Check, ChevronDown, SlidersHorizontal, ArrowUpRight
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
  countdown: number; // Added countdown field
}

// 预设的演示数据
const DEMO_TRIPS: Trip[] = [
  { 
    id: '1', 
    title: '上海 · 陆家嘴金融峰会', 
    location: '上海市·浦东新区', 
    date: '12月5日 - 6日', 
    status: '准备中',
    type: 'business',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800',
    days: 2,
    people: 3,
    checkedItems: 5,
    totalItems: 12,
    countdown: 3
  },
  { 
    id: '2', 
    title: '三亚 · 热带海滨度假', 
    location: '海南省·三亚市', 
    date: '12月15日 - 20日', 
    status: '准备中',
    type: 'tourism',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=800',
    days: 6,
    people: 2,
    checkedItems: 20,
    totalItems: 20,
    countdown: 12
  }
];

// 预设模板列表
const TEMPLATE_OPTIONS = [
    { id: 'custom', label: '【自定义】智能生成' },
    { id: 'classic', label: '经典通用旅行模板' },
    { id: 'business_short', label: '国内短途商务差旅' },
    { id: 'business_long', label: '国际长途商务差旅' },
    { id: 'city_walk', label: 'City Walk 城市漫步' },
    { id: 'hiking', label: '户外徒步登山' },
    { id: 'beach', label: '海滨度假休闲' },
    { id: 'skiing', label: '滑雪运动装备' },
    { id: 'camping', label: '露营野炊' },
    { id: 'photography', label: '摄影采风' },
    { id: 'baby', label: '亲子带娃出行' },
    { id: 'pet', label: '宠物同行' }
];

// --- 辅助组件 ---

// 1. 模拟微信小程序顶部导航栏 (Capsule Navigation Bar)
const WeChatNavBar = ({ 
  title, 
  layoutMode, 
  onBack, 
  showBack,
  transparent = false,
  darkMode = false
}: { 
  title: string, 
  layoutMode: LayoutMode, 
  onBack?: () => void, 
  showBack?: boolean,
  transparent?: boolean,
  darkMode?: boolean
}) => {
  // 根据主题动态调整导航栏样式
  const bgStyle = transparent 
    ? 'bg-transparent'
    : layoutMode === 'neo' ? 'bg-[#ffdc00] border-b-2 border-black' :
      layoutMode === 'zen' ? 'bg-[#fafaf9]/95 backdrop-blur-md' :
      layoutMode === 'paper' ? 'bg-[#fffdf5]/95 backdrop-blur-md border-b-2 border-dashed border-gray-300' :
      layoutMode === 'wanderlust' ? 'bg-[#F5F6F8]/90 backdrop-blur-xl' :
      'bg-[#f0f4f8]/90 backdrop-blur-md'; 

  // Decide text color
  let textColorClass = 'text-[#303133]';
  if (darkMode) textColorClass = 'text-white';
  else if (layoutMode === 'neo') textColorClass = 'text-black';
  else if (layoutMode === 'paper') textColorClass = 'text-gray-800';

  const textStyle = `${textColorClass} ${layoutMode === 'zen' ? 'font-serif tracking-wide' : 'font-bold'}`;

  // Capsule
  let capsuleBorder = 'border-gray-200';
  let capsuleBg = 'bg-white/60';
  let capsuleIcon = 'text-black';

  if (darkMode) {
      capsuleBorder = 'border-white/20';
      capsuleBg = 'bg-white/10 backdrop-blur-md';
      capsuleIcon = 'text-white';
  } else if (layoutMode === 'neo') {
      capsuleBorder = 'border-black';
      capsuleBg = 'bg-white';
      capsuleIcon = 'text-black';
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-[60] flex flex-col transition-all duration-300 ${bgStyle}`}>
      {/* 模拟状态栏高度 (iPhone notch) */}
      <div className="h-[44px] w-full"></div> 
      
      {/* 导航栏内容区 (标准高度 44px) */}
      <div className="h-[44px] w-full flex items-center justify-center relative px-4">
         {/* 模拟返回按钮 */}
         <div className="absolute left-2 flex items-center gap-1 cursor-pointer active:opacity-50 transition-opacity pl-2 pr-4 py-2" onClick={onBack}>
            {(showBack || (layoutMode !== 'wanderlust' && layoutMode !== 'classic')) && (
               <div className={`w-8 h-8 rounded-full flex items-center justify-center ${transparent && !darkMode ? 'bg-black/20 backdrop-blur-lg text-white border border-white/10' : ''}`}>
                   <ChevronLeft size={24} className={textStyle} strokeWidth={2.5} />
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
         <div className={`absolute right-[7px] top-1/2 -translate-y-1/2 w-[87px] h-[32px] rounded-full border flex items-center justify-evenly ${capsuleBorder} ${capsuleBg} ${capsuleIcon} shadow-sm`}>
            <MoreHorizontal size={16} />
            <div className={`w-[1px] h-[18px] ${darkMode ? 'bg-white/20' : 'bg-black/10'}`}></div>
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
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedTripType, setSelectedTripType] = useState<string>('tourism');
  const [travelerCount, setTravelerCount] = useState(1);

  // Template Sheet State
  const [isTemplateSheetOpen, setIsTemplateSheetOpen] = useState(false);
  const [tempSelectedTemplateId, setTempSelectedTemplateId] = useState<string>('');


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

  const handleOpenTemplateSheet = () => {
      setTempSelectedTemplateId(selectedTemplateId);
      setIsTemplateSheetOpen(true);
  };

  const handleConfirmTemplate = () => {
      setSelectedTemplateId(tempSelectedTemplateId);
      setIsTemplateSheetOpen(false);
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

  // --- 4. 创建行程页面 (Bold Layout + Wanderlust Theme) ---
  const renderCreateTrip = () => {
    return (
      <div className="animate-slide-up min-h-screen bg-[#F5F6F8] selection:bg-sky-200 selection:text-slate-900">
         {/* 1. Dynamic Background - Light Aurora */}
         <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-100/60 rounded-full blur-[120px] mix-blend-multiply animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-50/60 rounded-full blur-[100px] mix-blend-multiply"></div>
            <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[90%] h-[50%] bg-white/40 rounded-full blur-[150px] mix-blend-overlay"></div>
         </div>
         
         <div className="relative z-10 pb-40 pt-[100px] px-6">
            
            {/* 1. HERO: Destination Input (Bold & Transparent) */}
            <div className="mb-10">
               <label className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <MapPin size={12} className="text-sky-500" /> 目的地 <span className="text-[10px] opacity-50">DESTINATION</span>
               </label>
               <div className="relative group">
                   <input 
                      type="text" 
                      placeholder="准备去哪儿？" 
                      className="w-full bg-transparent text-5xl font-black text-slate-900 placeholder:text-slate-200 outline-none border-b-2 border-slate-200 pb-4 focus:border-sky-500 transition-all duration-500"
                      autoFocus
                   />
                   <div className="absolute right-0 bottom-6 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500">
                      <div className="bg-sky-500 text-white text-[10px] font-bold px-2 py-1 rounded-sm shadow-md">
                         确认
                      </div>
                   </div>
               </div>
            </div>

            {/* 2. CONTROL DECK: Dates & Travelers (Merged White Panel) */}
            <div className="mb-10">
               <div className="bg-white/80 backdrop-blur-xl rounded-[24px] border border-white p-1 flex flex-col divide-y divide-slate-100 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)]">
                  {/* Top Row: Dates */}
                  <div className="flex divide-x divide-slate-100 h-20">
                     <div className="flex-1 p-4 hover:bg-slate-50 transition-colors cursor-pointer group rounded-tl-[20px]">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-sky-500 transition-colors">出发 <span className="opacity-50 scale-75 inline-block origin-left">START</span></span>
                        <div className="flex items-center gap-2 text-xl font-bold text-slate-800">
                           <span>12.24</span>
                           <ChevronDown size={14} className="text-slate-400" />
                        </div>
                     </div>
                     <div className="flex-1 p-4 hover:bg-slate-50 transition-colors cursor-pointer group rounded-tr-[20px]">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-sky-500 transition-colors">返程 <span className="opacity-50 scale-75 inline-block origin-left">END</span></span>
                        <div className="flex items-center gap-2 text-xl font-bold text-slate-800">
                           <span>12.30</span>
                           <ChevronDown size={14} className="text-slate-400" />
                        </div>
                     </div>
                  </div>
                  {/* Bottom Row: Travelers */}
                  <div className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors rounded-b-[20px]">
                      <div>
                         <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">同行伙伴 <span className="opacity-50 scale-75 inline-block origin-left">TRAVELERS</span></span>
                         <span className="text-slate-800 font-medium text-sm">与谁同行</span>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-100 rounded-full px-3 py-1.5 border border-slate-200">
                          <button onClick={() => setTravelerCount(Math.max(1, travelerCount - 1))} className="w-6 h-6 rounded-full bg-white flex items-center justify-center hover:bg-slate-50 text-slate-600 shadow-sm">-</button>
                          <span className="text-lg font-bold text-slate-900 w-4 text-center">{travelerCount}</span>
                          <button onClick={() => setTravelerCount(travelerCount + 1)} className="w-6 h-6 rounded-full bg-white flex items-center justify-center hover:bg-slate-50 text-slate-600 shadow-sm">+</button>
                      </div>
                  </div>
               </div>
            </div>

            {/* 3. TRIP TYPE: Clean Pills */}
            <div className="mb-10">
               <label className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Compass size={12} className="text-sky-500" /> 出行类型 <span className="text-[10px] opacity-50">MODE</span>
               </label>
               <div className="grid grid-cols-4 gap-2">
                  {[
                     { id: 'tourism', label: '旅游', icon: Palmtree },
                     { id: 'business', label: '商务', icon: Briefcase },
                     { id: 'family', label: '探亲', icon: House },
                     { id: 'other', label: '其他', icon: MoreHorizontal }
                  ].map((type) => {
                     const isSelected = selectedTripType === type.id;
                     return (
                     <button
                        key={type.id}
                        onClick={() => setSelectedTripType(type.id)}
                        className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all duration-300 relative overflow-hidden group ${
                           isSelected 
                           ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/20' 
                           : 'bg-white border-transparent text-slate-400 hover:bg-white hover:text-slate-600 shadow-sm hover:shadow-md'
                        }`}
                     >
                        <type.icon size={20} strokeWidth={2.5} className={`relative z-10 transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`} />
                        <span className="text-[10px] font-bold relative z-10">{type.label}</span>
                     </button>
                  )})}
               </div>
            </div>

            {/* 4. TEMPLATE: Ticket (Light) */}
            <div className="mb-10">
               <label className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <LayoutTemplate size={12} className="text-sky-500" /> 行程模板 <span className="text-[10px] opacity-50">TEMPLATE</span>
               </label>
               
               <div 
                  onClick={handleOpenTemplateSheet}
                  className="relative h-20 bg-white border-l-4 border-sky-500 rounded-r-xl cursor-pointer hover:shadow-lg transition-all group overflow-hidden shadow-sm"
               >  
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"></div>
                  <div className="absolute inset-0 flex items-center justify-between px-6 z-10">
                     <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">已选方案 <span className="opacity-50 scale-90 inline-block">SELECTED</span></span>
                        <div className="text-lg font-bold text-slate-900 flex items-center gap-2">
                           {selectedTemplateId 
                              ? TEMPLATE_OPTIONS.find(t => t.id === selectedTemplateId)?.label 
                              : "选择行程模板"}
                        </div>
                     </div>
                     <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:border-sky-200 transition-colors">
                        <SlidersHorizontal size={18} className="text-sky-500" />
                     </div>
                  </div>
               </div>
            </div>

            {/* 5. INPUTS: Clean Textareas */}
            <div className="grid grid-cols-1 gap-6 mb-10">
               <div className="relative">
                  <div className="absolute top-4 left-4 text-slate-400"><FileText size={18} /></div>
                  <textarea 
                     className="w-full h-32 bg-white rounded-2xl p-4 pl-12 text-sm font-medium text-slate-700 placeholder:text-slate-300 outline-none resize-none border border-transparent shadow-sm focus:border-sky-200 focus:shadow-md transition-all"
                     placeholder="行程描述：例如具体的会议时间、想去的景点..."
                  ></textarea>
               </div>
               <div className="relative">
                   <div className="absolute top-4 left-4 text-rose-400"><Heart size={18} /></div>
                   <textarea 
                     className="w-full h-32 bg-white rounded-2xl p-4 pl-12 text-sm font-medium text-slate-700 placeholder:text-slate-300 outline-none resize-none border border-transparent shadow-sm focus:border-rose-200 focus:shadow-md transition-all"
                     placeholder="特殊需求：例如需要婴儿车、晕车药、过敏源..."
                  ></textarea>
               </div>
            </div>

            {/* 6. IMAGE PORTAL */}
             <div className="mb-24">
               <div className="w-full h-48 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-white/40 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-sky-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-3 shadow-sm border border-slate-100 relative z-10">
                     <ImageIcon size={24} className="text-slate-300 group-hover:text-sky-500 transition-colors" />
                  </div>
                  <p className="text-xs font-bold text-slate-400 relative z-10">等待目的地确认 <span className="opacity-50 text-[10px]">PENDING...</span></p>
               </div>
            </div>

         </div>

         {/* FLOAT ACTION: The Launch Button */}
         <div className="fixed bottom-8 left-6 right-6 z-40 animate-slide-up">
            <button 
               onClick={() => {
                  setIsCreating(false);
                  setActiveTab('home');
                  handleSendMessage("我创建了一个去东莞的商务行程，请帮我生成清单");
               }}
               className="w-full h-[72px] bg-slate-900 text-white rounded-[24px] shadow-[0_20px_50px_-12px_rgba(15,23,42,0.4)] flex items-center justify-between px-8 hover:scale-[1.02] active:scale-[0.98] transition-all font-black tracking-wide group hover:bg-black"
            >
               <div className="flex flex-col items-start">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">AI READY</span>
                  <span className="text-xl">生成行程清单</span>
               </div>
               <ArrowRight size={28} className="group-hover:translate-x-1 transition-transform text-sky-400" />
            </button>
         </div>

         {/* --- TEMPLATE BOTTOM SHEET (Action Sheet Style) --- */}
         {isTemplateSheetOpen && (
             <>
                 <div 
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity animate-fade-in"
                    onClick={() => setIsTemplateSheetOpen(false)}
                 ></div>
                 
                 <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-[101] rounded-t-[24px] overflow-hidden shadow-2xl animate-slide-up-fast text-slate-900">
                     {/* Header */}
                     <div className="flex justify-between items-center px-6 py-4 border-b border-slate-50 bg-white">
                         <button 
                            onClick={() => setIsTemplateSheetOpen(false)}
                            className="text-slate-400 text-sm font-bold hover:text-slate-600 transition-colors"
                         >
                            取消
                         </button>
                         <span className="text-sm font-black uppercase tracking-wider text-slate-800">选择行程模板</span>
                         <button 
                            onClick={handleConfirmTemplate}
                            className="text-sky-600 text-sm font-bold hover:text-sky-700 transition-colors"
                         >
                            确定
                         </button>
                     </div>

                     {/* Picker List */}
                     <div className="overflow-y-auto max-h-[40vh] py-4 bg-white">
                        {TEMPLATE_OPTIONS.map((tpl) => (
                           <div 
                              key={tpl.id}
                              onClick={() => setTempSelectedTemplateId(tpl.id)}
                              className={`py-4 px-6 text-center text-sm transition-all cursor-pointer flex justify-center items-center relative ${
                                  tempSelectedTemplateId === tpl.id 
                                  ? 'text-sky-600 font-bold bg-sky-50 text-lg' 
                                  : 'text-slate-500 font-medium hover:text-slate-800'
                              }`}
                           >
                              {tpl.label}
                              {tempSelectedTemplateId === tpl.id && (
                                  <div className="absolute right-6 w-2 h-2 rounded-full bg-sky-500 shadow-sm"></div>
                              )}
                           </div>
                        ))}
                     </div>
                     <div className="h-8 w-full bg-white"></div>
                 </div>
             </>
         )}

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

            {/* Stats Cards - Cleaner Grid Layout */}
            <div className="grid grid-cols-3 gap-3">
               <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center h-24">
                  <div className="text-2xl font-black text-slate-800 mb-1">85<span className="text-xs text-slate-400 font-bold">%</span></div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">准备就绪</div>
               </div>
               <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center h-24">
                  <div className="text-2xl font-black text-slate-800 mb-1">4</div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">即将出发</div>
               </div>
               <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center h-24">
                  <div className="text-2xl font-black text-slate-800 mb-1">12</div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">剩余天数</div>
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

         {/* Immersive Trip Cards (Refined Magazine V2 Style) */}
         <div className="space-y-6">
            {trips.length > 0 ? (
               trips.map((trip) => {
                  const { Icon } = getTripVisuals(trip.type, layoutMode);
                  const progress = Math.round((trip.checkedItems / trip.totalItems) * 100);
                  const isReady = trip.status === '准备中';
                  
                  return (
                     <div key={trip.id} className="group flex flex-col bg-white rounded-[32px] shadow-[0_15px_30px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] transition-all duration-500 transform hover:-translate-y-1">
                        
                        {/* 1. Clean Image Area (Top 60%) */}
                        <div className="relative h-48 w-full overflow-hidden">
                           <img src={trip.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80"></div>
                           
                           {/* Top Left Status */}
                           <div className="absolute top-4 left-4">
                              <div className={`backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold border border-white/20 shadow-lg tracking-wide uppercase flex items-center gap-1.5 ${
                                 isReady ? 'bg-sky-500/90 text-white' : 'bg-slate-800/80 text-white'
                              }`}>
                                 {trip.status}
                              </div>
                           </div>

                           {/* Big Countdown Overlay (Visual Anchor) */}
                           <div className="absolute bottom-4 left-5 text-white">
                               <div className="flex items-baseline gap-1">
                                  <span className="text-6xl font-black tracking-tighter leading-none shadow-black/20 drop-shadow-lg">{trip.countdown}</span>
                                  <span className="text-sm font-bold opacity-80 uppercase tracking-widest">Days Left</span>
                               </div>
                               <div className="flex items-center gap-1.5 text-white/90 text-xs font-medium mt-1">
                                   <MapPin size={12} className="text-sky-300" />
                                   <span>{trip.location}</span>
                               </div>
                           </div>
                        </div>

                        {/* 2. Clean Info Panel (Bottom 40%) - No nested cards, just clean layout */}
                        <div className="p-5 bg-white flex flex-col justify-between flex-1 relative">
                           {/* Floating Type Icon */}
                           <div className="absolute -top-6 right-6 w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center text-sky-500 border border-slate-50 z-10">
                              <Icon size={24} strokeWidth={2} />
                           </div>

                           <div className="mb-4">
                              <div className="flex items-center gap-2 mb-1">
                                 <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded text-center">{tripTypeToChinese(trip.type)}</span>
                              </div>
                              <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 truncate">{trip.title}</h3>
                              <div className="flex items-center justify-between">
                                  <div className="flex flex-col">
                                     <span className="text-[10px] text-slate-400 font-bold uppercase">出发日期</span>
                                     <span className="text-sm font-bold text-slate-700">{trip.date.split(' - ')[0]}</span>
                                  </div>
                                  <div className="flex flex-col pr-16">
                                     <span className="text-[10px] text-slate-400 font-bold uppercase">行程天数</span>
                                     <span className="text-sm font-bold text-slate-700">{trip.days} 天</span>
                                  </div>
                              </div>
                           </div>

                           {/* Bottom Action Row */}
                           <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-50">
                              <div className="flex-1">
                                 <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[10px] font-bold text-slate-400">清单完成度</span>
                                    <span className="text-xs font-black text-slate-900">{progress}%</span>
                                 </div>
                                 <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                       className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                          progress === 100 ? 'bg-emerald-500' : 'bg-slate-900'
                                       }`}
                                       style={{ width: `${progress}%` }}
                                    ></div>
                                 </div>
                              </div>
                              
                              <button 
                                 onClick={() => handleCheckTrip(trip.title)}
                                 className="h-10 pl-5 pr-4 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg shadow-slate-900/20 hover:bg-black transition-all flex items-center gap-2 group/btn"
                              >
                                 立即查验 <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
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
          darkMode={isCreating}
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