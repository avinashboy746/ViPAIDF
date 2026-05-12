/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { useUser } from './hooks/useUser';
import { LogOut, CheckCircle, Shield, User as UserIcon, Lock, Globe, Cpu, ShieldCheck, Settings,
  Menu,
  X,
  Search,
  Plus,
  Trash2,
  Moon,
  ChevronRight,
  Zap,
  Palette,
  FileText,
  Info,
  ChevronLeft,
  ChevronDown,
  Layout,
  Mail,
  Smartphone,
  CreditCard,
  History,
  Sparkles,
  Mic,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || '';
  return new GoogleGenAI({ apiKey });
};

// Types
interface ChatSession {
  id: string;
  title: string;
  messages: { role: 'user' | 'bot'; text: string }[];
}

export default function App() {
  const { user, loading, logout } = useUser();
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  
  // App Navigation State
  const [sidebarOpen, setSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth > 1024 : true);
  const [showSettings, setShowSettings] = useState(false);
  
  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isTyping]);

  const activeChat = chatHistory.find(c => c.id === currentChatId);
  const messages = activeChat?.messages || [];

  const startNewChat = () => {
    const newChat: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: []
    };
    setChatHistory(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  };

  const handleLogin = async (provider: 'discord' | 'google') => {
    try {
      const endpoint = provider === 'discord' ? '/api/auth/url' : '/api/auth/google/url';
      const res = await fetch(endpoint);
      const { url } = await res.json();
      window.open(url, `${provider}_oauth`, 'width=600,height=800');
    } catch (err) {
      console.error('Login Error:', err);
    }
  };

  const handleVerify = async () => {
    if (!user) return;
    if (user.provider === 'google') {
      setVerificationResult({ success: true, message: 'Google verification successful! Account linked.' });
      setTimeout(() => setIsVerified(true), 1500);
      return;
    }
    
    setVerifying(true);
    setVerificationResult(null);
    try {
      const res = await fetch('/api/verify', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setVerificationResult({ success: true, message: data.message });
        setTimeout(() => setIsVerified(true), 1500);
      } else {
        setVerificationResult({ success: false, message: data.error });
      }
    } catch (err) {
      setVerificationResult({ success: false, message: 'An error occurred during verification.' });
    } finally {
      setVerifying(false);
    }
  };

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    // Clean text from markdown for better speech
    const cleanText = text.replace(/```[\s\S]*?```/g, 'Code block follows.').replace(/[*_#]/g, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setChatInput(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    if (!currentChatId) {
      const newId = Date.now().toString();
      const newChat: ChatSession = {
        id: newId,
        title: chatInput.slice(0, 30) + (chatInput.length > 30 ? '...' : ''),
        messages: [{ role: 'user', text: chatInput }]
      };
      setChatHistory(prev => [newChat, ...prev]);
      setCurrentChatId(newId);
      setChatInput('');
      processAIResponse(newId, chatInput);
    } else {
      const userMsg = chatInput;
      setChatHistory(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? { ...chat, messages: [...chat.messages, { role: 'user', text: userMsg }] } 
          : chat
      ));
      setChatInput('');
      processAIResponse(currentChatId, userMsg);
    }
  };

  const processAIResponse = async (chatId: string, prompt: string) => {
    setIsTyping(true);
    try {
      const ai = getAI();
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          maxOutputTokens: 2500,
          temperature: 0.8,
          systemInstruction: "You are VIP AI (VIP CHAT 4.2), a master-level developer engine. You specialize in creating advanced Discord bots and high-performance websites. \n\nWhen a user asks for code:\n1. Provide the code in markdown blocks.\n2. Ensure the code is production-ready and modern.\n3. Add brief comments.\n\nBe highly professional and concise."
        }
      });
      
      const botResponse = result.text || 'Error: No response generated.';
      setChatHistory(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, messages: [...chat.messages, { role: 'bot', text: botResponse }] } 
          : chat
      ));
      speak(botResponse);
    } catch (err) {
      setChatHistory(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, messages: [...chat.messages, { role: 'bot', text: 'Error: AI service is currently unavailable.' }] } 
          : chat
      ));
    } finally {
      setIsTyping(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadCode = (code: string) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'oxai_code_snippet.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Auto-verify on login
  useEffect(() => {
    if (user && !isVerified) {
      setIsVerified(true);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="flex flex-col items-center">
           <div className="relative mb-8 group">
              {/* Premium Loading Animation */}
              <div className="absolute -inset-8 border border-blue-500/10 rounded-[60px] animate-[spin_8s_linear_infinite] opacity-30"></div>
              <div className="absolute -inset-4 border border-white/5 rounded-[44px] animate-[spin_12s_linear_infinite_reverse] opacity-20"></div>
              
              <div className="w-32 h-32 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 rounded-[38px] flex items-center justify-center shadow-[0_20px_50px_rgba(37,99,235,0.4)] relative overflow-hidden ring-1 ring-white/20">
                 <img 
                   src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHpwaG54Znp4eW54Znp4eW54Znp4eW54Znp4eW54Znp4eW54Znp4eW54Znp4eW54JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCheckZzJmlkPTEwUEY2bERjZlR0dnImY3Q9Zw/10PF6lDcfTtvvG/giphy.gif" 
                   alt="VIP Logo" 
                   className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay" 
                 />
                 <span className="text-5xl font-black italic text-white z-10 drop-shadow-2xl animate-pulse">VIP</span>
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
           </div>
           <div className="flex flex-col items-center gap-3">
              <h1 className="text-2xl font-black tracking-[0.2em] italic uppercase text-white/40">VIP <span className="text-blue-500">SYSTEM</span></h1>
              <div className="flex gap-1.5 item-center">
                 <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                 <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                 <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  // Render Chat Interface if logged in
  if (user) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-white font-sans flex relative overflow-hidden">
        {/* Settings Modal */}
        <AnimatePresence>
          {showSettings && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md bg-[#111113] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl flex flex-col"
              >
                {/* Modal Header */}
                <div className="flex items-center gap-4 p-8 border-b border-white/5">
                  <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className="text-xl font-bold tracking-tight">Settings</h2>
                </div>

                {/* Modal Content */}
                <div className="flex-1 p-8 space-y-8 overflow-y-auto custom-scrollbar">
                  {/* Profile Section */}
                  <div className="bg-[#18181B] p-5 rounded-[32px] border border-white/5 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg relative overflow-hidden ring-2 ring-white/10">
                        <img 
                          src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}`}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <div className="text-xl font-black tracking-tightest">{user.username}</div>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-black uppercase tracking-wider">
                          <span className="text-blue-500">✦</span> Free · {user.provider === 'discord' ? 'Discord' : 'Google'}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-white/20 group-hover:text-white transition-colors" />
                  </div>

                  {/* Settings Groups */}
                  <div className="space-y-6">
                    <section className="space-y-3">
                       <div className="text-[10px] font-black text-gray-700 uppercase tracking-[0.2em] px-2">Preferences</div>
                       <div className="space-y-1">
                          <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all group">
                             <div className="flex items-center gap-4 text-gray-400 group-hover:text-white">
                                <UserIcon size={18} />
                                <span className="font-bold text-sm">Profile</span>
                             </div>
                             <ChevronRight size={18} className="text-white/10" />
                          </button>
                          <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all group">
                             <div className="flex items-center gap-4 text-gray-400 group-hover:text-white">
                                <Palette size={18} />
                                <span className="font-bold text-sm">Appearance</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 font-bold">Dark</span>
                                <ChevronRight size={18} className="text-white/10" />
                             </div>
                          </button>
                       </div>
                    </section>

                    <section className="space-y-3">
                       <div className="text-[10px] font-black text-gray-700 uppercase tracking-[0.2em] px-2">Legal</div>
                       <div className="space-y-1">
                          <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all group">
                             <div className="flex items-center gap-4 text-gray-400 group-hover:text-white">
                                <Shield size={18} />
                                <span className="font-bold text-sm">Privacy Policy</span>
                             </div>
                             <ChevronRight size={18} className="text-white/10" />
                          </button>
                          <button onClick={logout} className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all group">
                             <div className="flex items-center gap-4 text-gray-400 group-hover:text-white">
                                <LogOut size={18} />
                                <span className="font-bold text-sm">Sign Out</span>
                             </div>
                             <ChevronRight size={18} className="text-white/10" />
                          </button>
                          <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-red-500/10 transition-all group">
                             <div className="flex items-center gap-4 text-red-500/50 group-hover:text-red-500">
                                <Trash2 size={18} />
                                <span className="font-bold text-sm">Delete Account</span>
                             </div>
                             <ChevronRight size={18} className="text-red-500/10" />
                          </button>
                       </div>
                    </section>
                  </div>
                </div>

                {/* Footer Credits */}
                <div className="p-10 text-center space-y-4 bg-black/20 border-t border-white/5">
                  <p className="text-[10px] text-gray-600 font-bold tracking-wide">
                    AI can make mistakes. Verify important info.
                    <br/>
                    <span className="text-gray-700">{user.email}</span>
                  </p>
                  <p className="text-[10px] text-gray-800 font-black tracking-[0.3em] uppercase">VIP AI v4.2 · © 2025 TuZhi Studio</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar Structure */}
        <motion.aside 
          initial={false}
          animate={{ width: sidebarOpen ? 300 : 0, opacity: sidebarOpen ? 1 : 0 }}
          className="bg-[#080809] border-r border-white/5 flex flex-col h-full relative z-40 overflow-hidden"
        >
          <div className="p-6 flex flex-col h-full min-w-[300px]">
             {/* Sidebar Header */}
             <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-blue-700 to-indigo-800 border border-white/10 flex items-center justify-center relative overflow-hidden group">
                    <img 
                      src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHpwaG54Znp4eW54Znp4eW54Znp4eW54Znp4eW54Znp4eW54Znp4eW54JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCheckZzJmlkPTEwUEY2bERjZlR0dnImY3Q9Zw/10PF6lDcfTtvvG/giphy.gif" 
                      alt="VIP Logo" 
                      className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform mix-blend-overlay" 
                    />
                    <span className="text-[14px] font-black italic text-white leading-none z-10 drop-shadow-lg scale-110">VIP</span>
                 </div>
                 <div className="flex flex-col">
                   <h1 className="text-lg font-black tracking-tightest uppercase italic leading-none">VIP AI</h1>
                   <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest mt-1">TuZhi Studio</span>
                 </div>
               </div>
               <button onClick={() => startNewChat()} className="p-2.5 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all">
                 <Plus size={20} />
               </button>
             </div>

             {/* New Chat Button */}
             <button 
                onClick={startNewChat}
                className="w-full py-4 px-6 mb-6 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 hover:bg-white/10 hover:border-white/20 transition-all font-bold text-sm group"
             >
                <Plus size={18} className="text-blue-500 group-hover:rotate-90 transition-transform duration-300" />
                <span>New Chat</span>
             </button>

             {/* Search */}
             <div className="relative mb-8">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700" />
                <input 
                  type="text" 
                  placeholder="Search"
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold text-white placeholder:text-gray-700 outline-none focus:border-white/10 transition-all"
                />
             </div>

             {/* Workspaces Section */}
             <button className="w-full p-4 mb-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-all group">
                <div className="flex items-center gap-3">
                   <Layout size={18} className="text-gray-500 group-hover:text-blue-500" />
                   <span className="text-xs font-bold text-gray-400 group-hover:text-white uppercase tracking-widest">Workspaces</span>
                </div>
                <ChevronRight size={16} className="text-gray-700" />
             </button>

             {/* Dynamic History List */}
             <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-2 mb-6">
                <div className="text-[10px] font-black text-gray-800 uppercase tracking-[0.3em] mb-4 pl-2 underline decoration-blue-500/30 underline-offset-8">Recent Protocols</div>
                {chatHistory.length > 0 ? (
                  chatHistory.map((chat) => (
                    <button 
                      key={chat.id}
                      onClick={() => setCurrentChatId(chat.id)}
                      className={`w-full text-left p-4 rounded-2xl text-xs font-bold truncate transition-all ${
                        currentChatId === chat.id ? 'bg-white/10 text-white border border-white/10 shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {chat.title}
                    </button>
                  ))
                ) : (
                  <div className="py-12 text-center">
                     <p className="text-[10px] font-black uppercase tracking-widest text-gray-800">No Archives Found</p>
                  </div>
                )}
             </div>

             {/* Sidebar User Profile */}
             <div className="pt-6 border-t border-white/5">
                <div 
                  onClick={() => setShowSettings(true)}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-blue-600 p-[2px] ring-2 ring-white/5 flex items-center justify-center overflow-hidden">
                        <img 
                          src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}`} 
                          className="w-full h-full rounded-[10px] object-cover"
                          referrerPolicy="no-referrer"
                        />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-xs font-black text-white truncate max-w-[120px]">{user.username}</span>
                        <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">✦ Free Member</span>
                     </div>
                  </div>
                  <Settings size={18} className="text-gray-700 group-hover:text-blue-500 transition-colors" />
                </div>
             </div>
          </div>
        </motion.aside>

        {/* Dashboard Area */}
        <main className="flex-1 flex flex-col h-full bg-[#050505] relative overflow-hidden">
          {/* Header Bar */}
          <header className={`px-6 py-5 flex items-center justify-between border-b border-white/5 transition-all duration-500 sticky top-0 z-40 ${messages.length > 0 ? 'bg-[#050505]/95 backdrop-blur-3xl' : 'bg-transparent'}`}>
             <div className="flex items-center gap-4">
               <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2.5 hover:bg-white/5 rounded-xl transition-all border border-white/5 text-gray-500 hover:text-white">
                 <Menu size={20} />
               </button>
               <h2 className="text-xl font-black italic tracking-tightest uppercase italic leading-none">VIP <span className="text-blue-500">AI</span></h2>
             </div>
             <button onClick={startNewChat} className="p-2.5 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 text-gray-500 hover:text-white transition-all">
                <Plus size={20} />
             </button>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            {!currentChatId || activeChat?.messages.length === 0 ? (
              <div className="max-w-3xl mx-auto w-full px-6 py-24 flex flex-col space-y-20">
                {/* Visual Identity Section */}
                <div className="space-y-10 group">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-900 border border-white/10 rounded-[32px] flex items-center justify-center text-white shadow-[0_20px_60px_rgba(37,99,235,0.3)] backdrop-blur-3xl relative overflow-hidden group-hover:shadow-[0_20px_100px_rgba(37,99,235,0.4)] transition-all duration-700 mt-10">
                       <img 
                         src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHpwaG54Znp4eW54Znp4eW54Znp4eW54Znp4eW54Znp4eW54Znp4eW54JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCheckZzJmlkPTEwUEY2bERjZlR0dnImY3Q9Zw/10PF6lDcfTtvvG/giphy.gif" 
                         alt="VIP Logo" 
                         className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none mix-blend-overlay" 
                       />
                       <span className="text-5xl font-black italic text-white tracking-tighter drop-shadow-2xl z-10">VIP</span>
                       <div className="absolute top-3 right-3 text-white/50 animate-pulse"><Sparkles size={20} /></div>
                    </div>
                   
                   <div className="space-y-4">
                      <h3 className="text-white/40 text-xl font-bold uppercase tracking-[0.4em] translate-x-1">System Pulse: Online 👋</h3>
                      <h2 className="text-5xl sm:text-8xl font-black tracking-tighter italic uppercase leading-[0.8] bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/10 py-2">
                        What's on <br/> your mind?
                      </h2>
                      <p className="text-gray-700 font-black uppercase tracking-[0.6em] text-[10px] pt-4 pl-1">VIP Core 4.2 · Neural compute optimized</p>
                   </div>
                </div>

                {/* Intelligent Prompt Rails */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <button onClick={() => setChatInput("Write a high-performance Discord bot in discord.js")} className="p-8 bg-[#0D0D0F] border border-white/5 rounded-[44px] text-left hover:border-yellow-500/40 hover:bg-white/5 transition-all group relative overflow-hidden shadow-2xl">
                      <div className="flex items-center justify-between mb-8">
                         <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-2xl group-hover:scale-110 transition-transform"><Zap size={24} /></div>
                         <ChevronRight size={18} className="text-white/5 group-hover:text-white/20 transition-colors" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 mb-2">Protocol: Build</p>
                      <p className="font-bold text-sm text-white/70 leading-relaxed">Write a high-performance Discord bot in discord.js</p>
                   </button>
                   <button onClick={() => setChatInput("Concept for a minimal VIP-inspired landing page")} className="p-8 bg-[#0D0D0F] border border-white/5 rounded-[44px] text-left hover:border-blue-500/40 hover:bg-white/5 transition-all group relative overflow-hidden shadow-2xl">
                      <div className="flex items-center justify-between mb-8">
                         <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl group-hover:scale-110 transition-transform"><Palette size={24} /></div>
                         <ChevronRight size={18} className="text-white/5 group-hover:text-white/20 transition-colors" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 mb-2">Protocol: Design</p>
                      <p className="font-bold text-sm text-white/70 leading-relaxed">Concept for a minimal VIP-inspired landing page</p>
                   </button>
                   <button onClick={() => setChatInput("Research scalable neural architecture trends 2025")} className="p-8 bg-[#0D0D0F] border border-white/5 rounded-[44px] text-left hover:border-purple-500/40 hover:bg-white/5 transition-all group relative overflow-hidden shadow-2xl">
                      <div className="flex items-center justify-between mb-8">
                         <div className="p-3 bg-purple-500/10 text-purple-500 rounded-2xl group-hover:scale-110 transition-transform"><Cpu size={24} /></div>
                         <ChevronRight size={18} className="text-white/5 group-hover:text-white/20 transition-colors" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 mb-2">Protocol: Ideas</p>
                      <p className="font-bold text-sm text-white/70 leading-relaxed">Research scalable neural architecture trends 2025</p>
                   </button>
                   <button onClick={() => setChatInput("Audit security protocols for decentralized app nodes")} className="p-8 bg-[#0D0D0F] border border-white/5 rounded-[44px] text-left hover:border-green-500/40 hover:bg-white/5 transition-all group relative overflow-hidden shadow-2xl">
                      <div className="flex items-center justify-between mb-8">
                         <div className="p-3 bg-green-500/10 text-green-500 rounded-2xl group-hover:scale-110 transition-transform"><ShieldCheck size={24} /></div>
                         <ChevronRight size={18} className="text-white/5 group-hover:text-white/20 transition-colors" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 mb-2">Protocol: Security</p>
                      <p className="font-bold text-sm text-white/70 leading-relaxed">Audit security protocols for decentralized app nodes</p>
                   </button>
                </div>

                {/* Dashboard Footer Section */}
                <div className="pt-20 pb-40 flex flex-col items-center justify-center space-y-8">
                   <div className="flex items-center gap-6 text-[10px] font-black text-gray-800 uppercase tracking-[0.5em]">
                      <span>Mumbai · India</span>
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full"></div>
                      <span>TuZhi Studio</span>
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full"></div>
                      <span>VIP Core 4.2</span>
                   </div>
                   <p className="text-[10px] text-gray-900 font-black uppercase tracking-widest text-center max-w-sm leading-loose opacity-50 px-8">
                      Neural Interface is strictly monitored. Unauthorized extraction of proprietary code sequences will result in node termination.
                   </p>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto w-full p-6 sm:p-14 space-y-16 pb-60">
                {messages.map((msg, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 100 }}
                    key={idx} 
                    className={`flex gap-8 ${msg.role === 'user' ? 'justify-end' : ''}`}
                  >
                    {msg.role === 'bot' && (
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 flex-shrink-0 flex items-center justify-center shadow-2xl border border-white/10 mt-3 relative overflow-hidden">
                         <img 
                           src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHpwaG54Znp4eW54Znp4eW54Znp4eW54Znp4eW54Znp4eW54Znp4eW54Znp4eW54JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCheckZzJmlkPTEwUEY2bERjZlR0dnImY3Q9Zw/10PF6lDcfTtvvG/giphy.gif" 
                           className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none" 
                         />
                         <span className="text-[11px] font-black text-white italic relative z-10">VIP</span>
                      </div>
                    )}
                    <div className={`p-10 rounded-[56px] max-w-[85%] shadow-2xl border border-white/5 relative overflow-hidden ${
                      msg.role === 'user' 
                        ? 'bg-[#121214] text-white rounded-tr-none border-white/10' 
                        : 'bg-white/5 rounded-tl-none text-white/95'
                    }`}>
                      {msg.role === 'user' && (
                        <div className="absolute inset-0 bg-blue-500/[0.03] pointer-events-none"></div>
                      )}
                      <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap font-bold tracking-tight leading-relaxed relative z-10">
                         {msg.text.split(/(```[\s\S]*?```)/g).map((part, pIdx) => {
                          if (part.startsWith('```')) {
                            const codeArr = part.match(/```(\w*)\n?([\s\S]*?)```/);
                            const code = codeArr?.[2] || '';
                            return (
                              <div key={pIdx} className="my-10 relative group">
                                <div className="absolute top-6 right-6 flex gap-3 z-10 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                  <button onClick={() => copyToClipboard(code)} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-2xl text-[11px] font-black uppercase text-white transition-all backdrop-blur-2xl border border-white/10">
                                    Copy Script
                                  </button>
                                  <button onClick={() => downloadCode(code)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-2xl text-[11px] font-black uppercase text-white transition-all shadow-2xl">
                                    Download File
                                  </button>
                                </div>
                                <pre className="p-10 rounded-[44px] overflow-x-auto text-[14px] font-mono leading-relaxed bg-black/80 border border-white/5 shadow-inner">
                                  <code className="block">{code}</code>
                                </pre>
                              </div>
                            );
                          }
                          return <span key={pIdx} className="opacity-90">{part}</span>;
                        })}
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {isTyping && (
                  <div className="flex gap-8">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex-shrink-0 flex items-center justify-center shadow-2xl border border-white/10 relative overflow-hidden">
                       <img 
                         src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHpwaG54Znp4eW54Znp4eW54Znp4eW54Znp4eW54Znp4eW54Znp4eW54Znp4eW54JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCheckZzJmlkPTEwUEY2bERjZlR0dnImY3Q9Zw/10PF6lDcfTtvvG/giphy.gif" 
                         className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none" 
                       />
                       <span className="text-[11px] font-black text-white italic z-10">VIP</span>
                    </div>
                    <div className="bg-white/5 p-8 rounded-[40px] rounded-tl-none flex gap-2.5 items-center backdrop-blur-3xl border border-white/5">
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} className="h-20" />
              </div>
            )}
          </div>

          {/* Unified AI Input Bar */}
          <div className="px-10 pb-10 pt-4 bg-gradient-to-t from-[#050505] via-[#050505]/98 to-transparent sticky bottom-0 z-50">
             <div className="max-w-4xl mx-auto w-full flex items-end gap-5">
                <div className="flex-1 relative bg-[#0D0D0F] border border-white/5 rounded-[50px] shadow-3xl backdrop-blur-[60px] transition-all p-4 flex flex-col focus-within:border-white/10 group ring-1 ring-white/5">
                   <div className="flex items-center gap-2">
                      <button className="p-4 text-gray-700 hover:text-white hover:bg-white/5 rounded-full transition-all group/btn">
                        <Plus size={24} className="group-hover/btn:rotate-90 transition-transform" />
                      </button>
                      <textarea 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder={`Message VIP AI`}
                        className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-4 text-white font-bold placeholder:text-gray-800 max-h-48 text-lg tracking-tight"
                        rows={1}
                      />
                      <div className="flex items-center gap-3 pr-2">
                         <button 
                            onClick={toggleListening}
                            className={`p-4 rounded-[28px] transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-700 hover:text-blue-500 hover:bg-blue-500/10'}`}
                          >
                            <Mic size={26} />
                         </button>
                         <button 
                            onClick={handleSendMessage}
                            disabled={!chatInput.trim() || isTyping}
                            className={`p-4 rounded-[28px] transition-all shadow-3xl border border-white/5 ${
                               chatInput.trim() ? 'bg-blue-600 text-white shadow-blue-600/30' : 'bg-white/5 text-gray-800'
                            }`}
                          >
                            <Send size={26} className={isTyping ? 'animate-pulse' : ''} />
                         </button>
                      </div>
                   </div>
                </div>
             </div>
             
             {/* Bottom Brand Ribbon */}
             <div className="mt-8 flex flex-col items-center gap-3 opacity-20">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-[1px] bg-white rounded-full"></div>
                  <p className="text-[10px] font-black uppercase tracking-[0.8em] text-white">Neural Interface 4.2</p>
                  <div className="w-16 h-[1px] bg-white rounded-full"></div>
                </div>
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-loose text-center">
                  Created by TuZhi Studio · Built with Premium Standards
                </p>
             </div>
          </div>
        </main>

        <style dangerouslySetInnerHTML={{ __html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.03);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255,255,255,0.1);
          }
        `}} />
      </div>
    );
  }

  // Verification Screen
  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans selection:bg-blue-500/30 flex items-center justify-center p-4">
      {/* Premium Master Theme Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-blue-600/5 blur-[140px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-purple-600/5 blur-[140px] rounded-full animate-pulse [animation-delay:2s]"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-[500px] bg-black/40 backdrop-blur-[40px] border border-white/10 rounded-[60px] p-10 sm:p-14 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/5"
      >
        {/* Master Logo Section with GIF */}
                 <div className="flex flex-col items-center mb-14">
           <div className="relative mb-10 group">
              {/* Animated Outer Ring */}
              <div className="absolute -inset-6 border border-white/5 rounded-[50px] animate-[spin_10s_linear_infinite] opacity-30"></div>
              <div className="absolute -inset-3 border border-white/10 rounded-[44px] animate-[spin_15s_linear_infinite_reverse] opacity-20"></div>
              
              <div className="w-28 h-28 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 rounded-[32px] flex items-center justify-center shadow-[0_20px_50px_rgba(37,99,235,0.4)] relative overflow-hidden ring-1 ring-white/20">
                 <img 
                   src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHpwaG54Znp4eW54Znp4eW54Znp4eW54Znp4eW54Znp4eW54Znp4eW54JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCheckZzJmlkPTEwUEY2bERjZlR0dnImY3Q9Zw/10PF6lDcfTtvvG/giphy.gif" 
                   alt="VIP Logo" 
                   className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay" 
                 />
                 <span className="text-5xl font-black italic text-white z-10 drop-shadow-2xl">VIP</span>
              </div>
           </div>
           
           <h1 className="text-5xl sm:text-6xl font-black tracking-tightest uppercase italic text-center mb-5 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40 drop-shadow-sm">
             VIP <span className="text-blue-500">AI</span>
           </h1>
           <p className="text-gray-500 text-center max-w-[300px] text-sm leading-relaxed font-bold uppercase tracking-widest opacity-60">
             Authenticated Access Required for <br/> <span className="text-white/80">Next-Gen Intelligent Systems</span>
           </p>
         </div>

        {/* Action Section */}
        <div className="space-y-4 mb-8">
          {!user ? (
            <>
              <button 
                onClick={() => handleLogin('google')}
                className="w-full bg-white hover:bg-gray-100 text-black py-5 rounded-[24px] font-bold flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-lg group"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                <span>Continue with Google</span>
              </button>
              
              <button 
                onClick={() => handleLogin('discord')}
                className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white py-5 rounded-[24px] font-bold flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-[#5865F2]/20 group"
              >
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.947 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"/>
                </svg>
                <span>Continue with Discord</span>
              </button>
            </>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                <img 
                  src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}`} 
                  alt="User" 
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl shadow-lg ring-1 ring-white/20" 
                />
                <div className="flex-1 overflow-hidden">
                  <div className="text-sm font-bold truncate">{user.username}</div>
                  <div className="text-[10px] uppercase font-black tracking-widest text-gray-500">Connected via {user.provider}</div>
                </div>
                <button onClick={logout} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                  <LogOut size={18} />
                </button>
              </div>

              <button
                onClick={handleVerify}
                disabled={verifying}
                className="w-full py-5 bg-white text-black hover:bg-gray-200 disabled:opacity-50 rounded-[24px] font-bold transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
              >
                {verifying ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-black"></div>
                ) : (
                  <>
                    <ShieldCheck size={24} className="group-hover:scale-110 transition-transform" />
                    <span>Complete Verification</span>
                  </>
                )}
              </button>

              <AnimatePresence>
                {verificationResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`p-4 rounded-2xl text-xs font-bold text-center border ${
                      verificationResult.success 
                        ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                        : 'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}
                  >
                    {verificationResult.message}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer Links */}
        <div className="text-center mb-12">
            <a href="#" className="text-xs text-[#2F73E3] hover:underline font-medium">Having trouble? Open in new tab</a>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-12">
          <div className="h-[1px] flex-1 bg-white/5"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700">Secure Access</span>
          <div className="h-[1px] flex-1 bg-white/5"></div>
        </div>

        {/* Bottom Icons */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center gap-3 px-2">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500 border border-white/5">
              <Globe size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Global</span>
          </div>
          <div className="flex flex-col items-center gap-3 px-2">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500 border border-white/5">
              <Cpu size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Neural</span>
          </div>
          <div className="flex flex-col items-center gap-3 px-2">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500 border border-white/5">
              <Lock size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Secure</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
