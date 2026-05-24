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
  Sun,
  ChevronRight,
  Zap,
  Palette,
  FileText,
  Download,
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
  Send,
  Volume2,
  Copy,
  Check,
  Activity,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  
  // Discord Bot Configurations
  const [showBotDashboard, setShowBotDashboard] = useState(false);
  const [botConfig, setBotConfig] = useState({
    welcomeEnabled: true,
    welcomeMessage: "Welcome @{user} to the elite workspace! VIP AI Core is active. How can our neural logic assist you? 🚀",
    ticketEnabled: true,
    ticketHelpMessage: "🎟️ Open a support ticket by typing `!ticket` or clicking on the secure help portal.",
    aiChannelId: ""
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // App Navigation State
  const [sidebarOpen, setSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth > 1024 : true);
  const [showSettings, setShowSettings] = useState(false);
  const [themeMode, setThemeMode] = useState<'black' | 'white'>('black');
  
  // Widget Sandbox States
  const [sandboxMessages, setSandboxMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: 'Welcome to your embedded website AI sandbox preview! Try typing below to test my secure Gemini responses.' }
  ]);
  const [sandboxInput, setSandboxInput] = useState('');
  const [sandboxTyping, setSandboxTyping] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(() => {
    const saved = localStorage.getItem('speechRate');
    return saved ? parseFloat(saved) : 1.0;
  });
  const [speechPitch, setSpeechPitch] = useState<number>(() => {
    const saved = localStorage.getItem('speechPitch');
    return saved ? parseFloat(saved) : 1.0;
  });

  useEffect(() => {
    localStorage.setItem('speechRate', speechRate.toString());
  }, [speechRate]);

  useEffect(() => {
    localStorage.setItem('speechPitch', speechPitch.toString());
  }, [speechPitch]);

  const fetchBotConfig = async () => {
    try {
      const res = await fetch('/api/bot/config');
      if (res.ok) {
        const data = await res.json();
        setBotConfig(data);
      }
    } catch (err) {
      console.error('Failed to load bot config:', err);
    }
  };

  const saveBotConfiguration = async () => {
    setSavingConfig(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/bot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(botConfig)
      });
      if (res.ok) {
        const data = await res.json();
        setBotConfig(data);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save bot config:', err);
    } finally {
      setSavingConfig(false);
    }
  };

  useEffect(() => {
    if (showSettings) {
      fetchBotConfig();
    }
  }, [showSettings]);
  
  // Login accounting ledgers database logs store
  const [loginRecords, setLoginRecords] = useState<any[]>([]);

  const fetchLoginRecords = async () => {
    try {
      const res = await fetch('/api/admin/login-records');
      if (res.ok) {
        const data = await res.json();
        setLoginRecords(data);
      }
    } catch (err) {
      console.error('Failed to load login records from server:', err);
    }
  };

  useEffect(() => {
    fetchLoginRecords();
    const interval = setInterval(fetchLoginRecords, 12000);
    return () => clearInterval(interval);
  }, []);

  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [copiedCodePartIndex, setCopiedCodePartIndex] = useState<string | null>(null);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
  
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

  const handleSendSandbox = async () => {
    if (!sandboxInput.trim()) return;
    const msg = sandboxInput;
    setSandboxInput('');
    setSandboxMessages(prev => [...prev, { role: 'user', text: msg }]);
    setSandboxTyping(true);
    try {
      const res = await fetch('/api/widget/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      if (res.ok) {
        const data = await res.json();
        setSandboxMessages(prev => [...prev, { role: 'bot', text: data.text }]);
      } else {
        setSandboxMessages(prev => [...prev, { role: 'bot', text: 'Error in secure neural pipe callback.' }]);
      }
    } catch (err) {
      setSandboxMessages(prev => [...prev, { role: 'bot', text: 'Failed to connect to backend endpoint.' }]);
    } finally {
      setSandboxTyping(false);
    }
  };

  const speak = (text: string, index?: number) => {
    if (!window.speechSynthesis) return;
    
    // Toggle check
    if (typeof index === 'number' && speakingMessageIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingMessageIndex(null);
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    
    // Clean text from markdown for better speech
    const cleanText = text.replace(/```[\s\S]*?```/g, 'Code block follows.').replace(/[*_#]/g, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    utterance.onstart = () => {
      setIsSpeaking(true);
      if (typeof index === 'number') {
        setSpeakingMessageIndex(index);
      }
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMessageIndex(null);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingMessageIndex(null);
    };
    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const testSpeech = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("This is a preview of my new voice.");
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setSpeakingMessageIndex(null);
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
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      });

      if (!res.ok) {
        const errDetails = await res.json().catch(() => ({ error: 'Communication error' }));
        throw new Error(errDetails.error || 'Failed to generate content from secure AI core');
      }

      const data = await res.json();
      const botResponse = data.text || 'Error: No response generated.';
      
      setChatHistory(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, messages: [...chat.messages, { role: 'bot', text: botResponse }] } 
          : chat
      ));
      speak(botResponse);
    } catch (err: any) {
      console.error('Core AI connection failed:', err);
      setChatHistory(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, messages: [...chat.messages, { role: 'bot', text: `Error: Gemini AI service is currently unavailable. Please verify GEMINI_API_KEY environment variable is configured in settings. (${err.message})` }] } 
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

  const exportAsJSON = () => {
    if (!activeChat || activeChat.messages.length === 0) return;
    const dataStr = JSON.stringify(activeChat, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeChat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_session.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsTXT = () => {
    if (!activeChat || activeChat.messages.length === 0) return;
    let txtContent = `VIP AI Chat Conversation\n`;
    txtContent += `Session Title: ${activeChat.title}\n`;
    txtContent += `Session ID: ${activeChat.id}\n`;
    txtContent += `Generated On: ${new Date().toLocaleString()}\n`;
    txtContent += `========================================================================\n\n`;

    activeChat.messages.forEach((msg, idx) => {
      const sender = msg.role === 'user' ? 'USER' : 'VIP AI';
      txtContent += `[${sender}]:\n${msg.text}\n\n`;
      txtContent += `------------------------------------------------------------------------\n\n`;
    });

    const blob = new Blob([txtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeChat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_session.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Auto-verify and auto-create default chat session on login
  useEffect(() => {
    if (user) {
      setIsVerified(true);
      fetchBotConfig();

      if (chatHistory.length === 0) {
        const defaultChatId = 'default-vip-ai-session';
        const defaultChat: ChatSession = {
          id: defaultChatId,
          title: 'VIP AI Live Console',
          messages: [
            { 
              role: 'bot', 
              text: '### VIP CHAT 4.2 · Neural Engine Operational\nWelcome back, **' + user.username + '**! I am **VIP AI (VIP CHAT 4.2)**, designed by **Avinash Boy**.\n\nI specialize in generating high-performance website code, mobile applications (iOS/Android), and resolving complex technical configurations.\n\nType and ask me anything, or configure your live Discord bot commands & Web Widgets by clicking the **Bot Workspace** button on the left sidebar! Let\'s build the future. 🚀' 
            }
          ]
        };
        setChatHistory([defaultChat]);
        setCurrentChatId(defaultChatId);
      }
    }
  }, [user, chatHistory.length]);

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
      <div className={`min-h-screen font-sans flex relative overflow-hidden transition-colors duration-300 ${
        themeMode === 'black' ? 'bg-[#050505] text-white' : 'bg-[#FAFAFC] text-black'
      }`}>
        {/* Settings Modal */}
        <AnimatePresence>
          {showSettings && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`w-full max-w-md rounded-[40px] overflow-hidden shadow-2xl flex flex-col border transition-all ${
                  themeMode === 'black' ? 'bg-[#111113] border-white/5 text-white' : 'bg-white border-black/10 text-black'
                }`}
              >
                {/* Modal Header */}
                <div className={`flex items-center gap-4 p-8 border-b ${
                  themeMode === 'black' ? 'border-white/5' : 'border-black/5'
                }`}>
                  <button onClick={() => setShowSettings(false)} className={`p-2 rounded-full transition-colors ${
                    themeMode === 'black' ? 'hover:bg-white/5' : 'hover:bg-black/5'
                  }`}>
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className="text-xl font-bold tracking-tight">Settings</h2>
                </div>

                {/* Modal Content */}
                <div className="flex-1 p-8 space-y-8 overflow-y-auto custom-scrollbar">
                  {/* Profile Section */}
                  <div className={`p-5 rounded-[32px] border flex items-center justify-between group cursor-pointer transition-all ${
                    themeMode === 'black' 
                      ? 'bg-[#18181B] border-white/5 hover:bg-white/10 text-white' 
                      : 'bg-[#F1F1F4] border-black/5 hover:bg-gray-200 text-black'
                  }`}>
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
                    <ChevronRight size={18} className={`${themeMode === 'black' ? 'text-white/20 group-hover:text-white' : 'text-black/30 group-hover:text-black'} transition-colors`} />
                  </div>

                  {/* Settings Groups */}
                  <div className="space-y-6">
                    <section className="space-y-3">
                       <div className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 ${themeMode === 'black' ? 'text-gray-600' : 'text-gray-400'}`}>Preferences</div>
                       <div className="space-y-1">
                          <button className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${
                            themeMode === 'black' ? 'hover:bg-white/5' : 'hover:bg-black/5'
                          }`}>
                             <div className={`flex items-center gap-4 group-hover:text-blue-500 ${themeMode === 'black' ? 'text-gray-400' : 'text-gray-700'}`}>
                                <UserIcon size={18} />
                                <span className="font-bold text-sm">Profile</span>
                             </div>
                             <ChevronRight size={18} className="opacity-40" />
                          </button>
                          <button 
                             onClick={() => setThemeMode(themeMode === 'black' ? 'white' : 'black')}
                             className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${
                               themeMode === 'black' ? 'hover:bg-white/5' : 'hover:bg-black/5'
                             }`}
                          >
                             <div className={`flex items-center gap-4 group-hover:text-blue-500 ${themeMode === 'black' ? 'text-gray-400' : 'text-gray-700'}`}>
                                <Palette size={18} />
                                <span className="font-bold text-sm">Appearance</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <span className="text-xs font-bold capitalize">{themeMode}</span>
                                <ChevronRight size={18} className="opacity-40" />
                             </div>
                          </button>
                       </div>
                    </section>

                    <section className="space-y-3">
                       <div className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 ${themeMode === 'black' ? 'text-gray-600' : 'text-gray-400'}`}>Voice Settings</div>
                       <div className={`p-5 rounded-3xl border space-y-4 ${
                         themeMode === 'black' ? 'bg-[#18181B]/50 border-white/5' : 'bg-[#F1F1F4] border-black/5 text-black'
                       }`}>
                          {/* Rate Control */}
                          <div className="space-y-1">
                             <div className="flex justify-between items-center text-xs">
                                <span className={`font-bold ${themeMode === 'black' ? 'text-gray-400' : 'text-gray-700'}`}>Speed ({speechRate.toFixed(1)}x)</span>
                                <span className="opacity-70 font-mono text-[10px]">0.5 - 2.5</span>
                             </div>
                             <input 
                               type="range" 
                               min="0.5" 
                               max="2.5" 
                               step="0.1" 
                               value={speechRate} 
                               onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                               className="w-full h-1 bg-blue-600/20 rounded-lg appearance-none cursor-pointer accent-blue-600"
                             />
                          </div>

                          {/* Pitch Control */}
                          <div className="space-y-1">
                             <div className="flex justify-between items-center text-xs">
                                <span className={`font-bold ${themeMode === 'black' ? 'text-gray-400' : 'text-gray-700'}`}>Pitch ({speechPitch.toFixed(1)})</span>
                                <span className="opacity-70 font-mono text-[10px]">0.5 - 2.0</span>
                             </div>
                             <input 
                               type="range" 
                               min="0.5" 
                               max="2.0" 
                               step="0.1" 
                               value={speechPitch} 
                               onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                               className="w-full h-1 bg-blue-600/20 rounded-lg appearance-none cursor-pointer accent-blue-600"
                             />
                          </div>

                          {/* Preview / Test button */}
                          <button 
                             onClick={testSpeech}
                             className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95"
                          >
                             <Volume2 size={16} />
                             <span>Test Voice Synthesis</span>
                          </button>
                       </div>
                    </section>

                    {/* Discord Bot Settings Section */}
                    {user && (
                      <section className="space-y-3">
                        <div className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 ${
                          themeMode === 'black' ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          Discord Bot Configuration
                        </div>
                        <div className={`p-5 rounded-3xl border space-y-4 ${
                          themeMode === 'black' ? 'bg-[#18181B]/50 border-white/5 text-white' : 'bg-[#F1F1F4] border-black/5 text-black'
                        }`}>
                          {/* AI Active Channel ID Input */}
                          <div className="space-y-1.5">
                            <label className={`text-xs font-bold block ${themeMode === 'black' ? 'text-gray-400' : 'text-gray-700'}`}>
                              AI Active Channel ID
                            </label>
                            <p className="text-[10px] text-gray-500 leading-normal mb-1">
                              Insert the Discord Channel ID here. The bot will automatically speak in that channel using Gemini!
                            </p>
                            <input 
                              type="text"
                              placeholder="e.g. 1122334455667788"
                              value={botConfig.aiChannelId || ''}
                              onChange={(e) => setBotConfig(prev => ({ ...prev, aiChannelId: e.target.value }))}
                              className={`w-full text-xs font-bold p-3 rounded-xl border outline-none transition-all ${
                                themeMode === 'black' 
                                  ? 'bg-black/40 border-white/5 focus:border-blue-500 text-white' 
                                  : 'bg-white border-black/10 focus:border-blue-500 text-black'
                              }`}
                            />
                          </div>

                          {/* Welcome Messages */}
                          <div className="space-y-2 pt-2 border-t border-white/5">
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-bold ${themeMode === 'black' ? 'text-gray-400' : 'text-gray-700'}`}>
                                Welcome Messages
                              </span>
                              <button 
                                onClick={() => setBotConfig(prev => ({ ...prev, welcomeEnabled: !prev.welcomeEnabled }))}
                                className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${
                                  botConfig.welcomeEnabled ? 'bg-blue-600' : 'bg-gray-700'
                                }`}
                              >
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
                                  botConfig.welcomeEnabled ? 'translate-x-4' : 'translate-x-0'
                                }`} />
                              </button>
                            </div>
                            {botConfig.welcomeEnabled && (
                              <textarea
                                rows={2}
                                value={botConfig.welcomeMessage || ''}
                                onChange={(e) => setBotConfig(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                                placeholder="Welcome @{user} to our server! VIP AI is active."
                                className={`w-full text-xs font-bold p-3 rounded-xl border outline-none resize-none transition-all ${
                                  themeMode === 'black' 
                                    ? 'bg-black/40 border-white/5 focus:border-blue-500 text-white' 
                                    : 'bg-white border-black/10 focus:border-blue-500 text-black'
                                }`}
                              />
                            )}
                          </div>

                          {/* Secure Support Ticket Portal */}
                          <div className="space-y-2 pt-2 border-t border-white/5">
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-bold ${themeMode === 'black' ? 'text-gray-400' : 'text-gray-700'}`}>
                                Ticket Support System (`!ticket`)
                              </span>
                              <button 
                                onClick={() => setBotConfig(prev => ({ ...prev, ticketEnabled: !prev.ticketEnabled }))}
                                className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${
                                  botConfig.ticketEnabled ? 'bg-blue-600' : 'bg-gray-700'
                                }`}
                              >
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
                                  botConfig.ticketEnabled ? 'translate-x-4' : 'translate-x-0'
                                }`} />
                              </button>
                            </div>
                            {botConfig.ticketEnabled && (
                              <textarea
                                rows={2}
                                value={botConfig.ticketHelpMessage || ''}
                                onChange={(e) => setBotConfig(prev => ({ ...prev, ticketHelpMessage: e.target.value }))}
                                placeholder="🎟️ Open a support ticket by typing `!ticket` and our bot will spawns support desk for help."
                                className={`w-full text-xs font-bold p-3 rounded-xl border outline-none resize-none transition-all ${
                                  themeMode === 'black' 
                                    ? 'bg-black/40 border-white/5 focus:border-blue-500 text-white' 
                                    : 'bg-white border-black/10 focus:border-blue-500 text-black'
                                }`}
                              />
                            )}
                          </div>

                          {/* Save Changes Button */}
                          <button 
                            onClick={saveBotConfiguration}
                            disabled={savingConfig}
                            className="w-full bg-blue-600 hover:bg-blue-700 duration-200 text-white p-3 rounded-xl text-xs font-bold transition-all disabled:opacity-50 active:scale-95"
                          >
                            {savingConfig ? "Saving Configuration..." : "Save Bot Settings"}
                          </button>
                          {saveSuccess && (
                            <p className="text-[10px] text-green-500 font-bold text-center">
                              ✓ Bot parameters synchronized successfully!
                            </p>
                          )}
                        </div>
                      </section>
                    )}

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
                  <p className="text-[10px] text-gray-800 font-black tracking-[0.3em] uppercase">VIP AI v4.2 · © 2025 Avinash Boy</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar Structure */}
        <motion.aside 
          initial={false}
          animate={{ width: sidebarOpen ? 300 : 0, opacity: sidebarOpen ? 1 : 0 }}
          className={`border-r flex flex-col h-full relative z-40 overflow-hidden transition-all duration-300 ${
            themeMode === 'black' ? 'bg-[#080809] border-white/5' : 'bg-[#F2F2F5] border-black/10'
          }`}
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
                   <h1 className={`text-lg font-black tracking-tightest uppercase italic leading-none ${themeMode === 'black' ? 'text-white' : 'text-black'}`}>VIP AI</h1>
                   <span className={`text-[8px] font-black uppercase tracking-widest mt-1 ${themeMode === 'black' ? 'text-gray-600' : 'text-gray-400'}`}>Avinash Boy</span>
                 </div>
               </div>
               <button onClick={() => startNewChat()} className="p-2.5 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all">
                 <Plus size={20} />
               </button>
             </div>

             {/* New Chat Button */}
             <button 
                onClick={startNewChat}
                className={`w-full py-4 px-6 mb-6 border rounded-2xl flex items-center gap-3 transition-all font-bold text-sm group ${themeMode === 'black' ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white' : 'bg-white border-black/15 hover:bg-gray-50 hover:border-black/30 text-black shadow-sm'}`}
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
                  className={`w-full rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold outline-none transition-all ${themeMode === 'black' ? 'bg-white/5 border border-white/5 text-white placeholder:text-gray-700 focus:border-white/10' : 'bg-black/5 border border-black/5 text-black placeholder:text-gray-400 focus:border-black/10'}`}
                />
             </div>

             {/* Workspaces Section */}
             <button 
                onClick={() => setShowBotDashboard(!showBotDashboard)}
                className={`w-full p-4 mb-4 rounded-2xl flex items-center justify-between transition-all border group ${
                  showBotDashboard 
                    ? 'bg-blue-600/10 border-blue-500/30' 
                    : (themeMode === 'black' ? 'bg-white/5 border border-white/5 hover:bg-white/10' : 'bg-black/5 border border-black/5 hover:bg-black/10')
                }`}
             >
                <div className="flex items-center gap-3">
                   <Layout size={18} className={showBotDashboard ? 'text-blue-500 animate-pulse' : 'text-gray-500 group-hover:text-blue-500'} />
                   <span className={`text-xs font-bold uppercase tracking-widest ${
                     showBotDashboard 
                       ? 'text-blue-500' 
                       : (themeMode === 'black' ? 'text-gray-400 group-hover:text-white' : 'text-gray-650 group-hover:text-black')
                   }`}>Bot Workspace</span>
                </div>
                <ChevronRight size={16} className={`transition-transform duration-300 ${showBotDashboard ? 'text-blue-500 rotate-90' : 'text-gray-700'}`} />
             </button>

             {/* Dynamic History List */}
             <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-2 mb-6">
                <div className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 pl-2 underline decoration-blue-500/30 underline-offset-8 ${themeMode === 'black' ? 'text-gray-800' : 'text-gray-400'}`}>Recent Protocols</div>
                {chatHistory.length > 0 ? (
                  chatHistory.map((chat) => (
                    <button 
                      key={chat.id}
                      onClick={() => setCurrentChatId(chat.id)}
                      className={`w-full text-left p-4 rounded-2xl text-xs font-bold truncate transition-all ${
                        currentChatId === chat.id 
                          ? (themeMode === 'black' ? 'bg-white/10 text-white border border-white/10 shadow-lg' : 'bg-white text-black border border-black/15 shadow-sm ring-1 ring-black/5') 
                          : (themeMode === 'black' ? 'text-gray-500 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-black hover:bg-black/5')
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

             {/* Record User Account & Logon Accounts Ledger */}
             <div className="flex flex-col mt-auto mb-4 border-t border-dashed border-white/5 pt-4">
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-1">
                    <History size={11} className="text-blue-505 animate-pulse" />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${themeMode === 'black' ? 'text-gray-400' : 'text-gray-650'}`}>Logon Accounts Ledger</span>
                  </div>
                  <span className="text-[9px] text-gray-550 font-mono font-bold animate-pulse">● LIVE NODE</span>
                </div>
                
                <div className="max-h-[140px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                  {loginRecords && loginRecords.length > 0 ? (
                    loginRecords.slice(0, 5).map((record, index) => (
                      <div 
                        key={index} 
                        className={`p-2.5 rounded-xl flex flex-col gap-1 border text-[9px] font-bold ${
                          themeMode === 'black' 
                            ? 'bg-white/5 border-white/5 text-gray-350 bg-[#0c0c0e]' 
                            : 'bg-white border-black/5 text-gray-750 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-blue-500 font-extrabold truncate max-w-[130px]">{record.username}</span>
                          <span className={`${record.provider === 'discord' ? 'text-[#5865F2]' : 'text-[#EA4335]'} font-extrabold capitalize text-[8px]`}>
                            {record.provider}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[8px] text-gray-500 font-mono">
                          <span>IP: {record.ip}</span>
                          <span>{new Date(record.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-2 text-center text-gray-700 text-[9px] tracking-widest uppercase">No Active Logons Registered</div>
                  )}
                </div>
             </div>

             {/* Sidebar User Profile */}
             <div className={`pt-6 border-t transition-all ${themeMode === 'black' ? 'border-white/5' : 'border-black/10'}`}>
                <div 
                  onClick={() => setShowSettings(true)}
                  className={`flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer group ${themeMode === 'black' ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
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
                        <span className={`text-xs font-black truncate max-w-[120px] ${themeMode === 'black' ? 'text-white' : 'text-black'}`}>{user.username}</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${themeMode === 'black' ? 'text-gray-700' : 'text-gray-450'}`}>✦ Free Member</span>
                     </div>
                  </div>
                  <Settings size={18} className="text-gray-700 group-hover:text-blue-500 transition-colors" />
                </div>
             </div>
          </div>
        </motion.aside>

        {/* Dashboard Area */}
        <main className={`flex-1 flex flex-col h-full relative overflow-hidden transition-colors duration-300 ${themeMode === 'black' ? 'bg-[#050505]' : 'bg-[#FAFAFD]'}`}>
          {/* Header Bar */}
          <header className={`px-6 py-5 flex items-center justify-between border-b transition-all duration-500 sticky top-0 z-40 ${
            themeMode === 'black' ? 'border-white/5' : 'border-black/5'
          } ${
            messages.length > 0 
              ? (themeMode === 'black' ? 'bg-[#050505]/95 backdrop-blur-3xl text-white' : 'bg-[#FAFAFD]/95 backdrop-blur-3xl text-black') 
              : 'bg-transparent'
          }`}>
             <div className="flex items-center gap-4">
               <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`p-2.5 rounded-xl transition-all border ${themeMode === 'black' ? 'hover:bg-white/5 border-white/5 text-gray-400 hover:text-white' : 'hover:bg-black/5 border-black/10 text-gray-600 hover:text-black shadow-sm bg-white'}`}>
                 <Menu size={20} />
               </button>
               <h2 className={`text-xl font-black italic tracking-tightest uppercase leading-none ${themeMode === 'black' ? 'text-white' : 'text-black'}`}>VIP <span className="text-blue-500">AI</span></h2>
             </div>
             
             <div className="flex items-center gap-3">
               {messages.length > 0 && (
                 <div className="flex items-center gap-2">
                   {/* EXPORT TXT BUTTON */}
                   <button 
                     onClick={exportAsTXT} 
                     title="Export Chat as Text (.txt)"
                     className="p-2.5 bg-white/5 text-gray-400 hover:text-white rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all flex items-center gap-1.5 text-xs font-bold tracking-tight"
                   >
                     <FileText size={16} />
                     <span className="hidden md:inline">Export TXT</span>
                   </button>
                   {/* EXPORT JSON BUTTON */}
                   <button 
                     onClick={exportAsJSON} 
                     title="Export Chat as JSON (.json)"
                     className="p-2.5 bg-blue-600/15 text-blue-400 hover:text-blue-300 rounded-xl border border-blue-500/15 hover:border-blue-500/30 hover:bg-blue-600/25 transition-all flex items-center gap-1.5 text-xs font-bold tracking-tight"
                   >
                     <Download size={16} />
                     <span className="hidden md:inline">Export JSON</span>
                   </button>
                 </div>
               )}
               <button onClick={startNewChat} className="p-2.5 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 text-gray-500 hover:text-white transition-all" title="New Chat">
                  <Plus size={20} />
               </button>
             </div>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar relative animate-fade-in">
            {showBotDashboard ? (
              <div className="max-w-7xl mx-auto w-full px-6 py-12 flex flex-col space-y-10">
                {/* Dashboard Banner Header */}
                <div className="bg-gradient-to-r from-blue-900/40 via-blue-950/20 to-black/40 border border-blue-500/10 rounded-[44px] p-8 sm:p-12 relative overflow-hidden backdrop-blur-3xl shadow-[0_22px_60px_-15px_rgba(0,0,0,0.6)]">
                  <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-blue-600/10 blur-[90px] rounded-full animate-pulse"></div>
                  <div className="flex items-start gap-6 relative z-10 flex-col md:flex-row">
                    <div className="p-4 bg-blue-600/10 rounded-3xl border border-blue-500/25 text-blue-400">
                      <Layout size={38} className="animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black italic uppercase tracking-tight text-white mb-2 font-sans">
                        VIP <span className="text-blue-500">BOT WORKSPACE</span>
                      </h2>
                      <p className="text-xs text-gray-400 max-w-2xl font-bold leading-relaxed">
                        Orchestrate elite Discord integrations, welcome templates, support tickets, and live website chat widgets. Keep your instances fully synchronized in one unified neural panel.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Main Settings Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Discord Bot config */}
                  <div className="bg-[#0B0B0D] border border-white/5 rounded-[44px] p-8 sm:p-10 space-y-8 relative overflow-hidden flex flex-col">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                      <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl">
                        <Activity size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Discord Integration</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Manage Discord Command Rules</p>
                      </div>
                    </div>

                    {/* Discord Welcome Greet Settings */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-black text-white uppercase tracking-wider">Join Greet Command</label>
                        <button 
                          onClick={() => setBotConfig(prev => ({ ...prev, welcomeEnabled: !prev.welcomeEnabled }))}
                          className={`w-14 h-8 rounded-full transition-all flex items-center p-1 cursor-pointer ${botConfig.welcomeEnabled ? 'bg-blue-600 justify-end' : 'bg-white/10 justify-start'}`}
                        >
                          <div className="w-6 h-6 rounded-full bg-white shadow-md"></div>
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-500 font-bold leading-relaxed">
                        Triggered on Discord member join event. Greets them in Discord with elite custom-tailored greeting.
                      </p>
                      {botConfig.welcomeEnabled && (
                        <textarea
                          value={botConfig.welcomeMessage}
                          onChange={(e) => setBotConfig(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                          placeholder="Welcome @{user} to our workspace!"
                          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-blue-500 transition-colors"
                          rows={3}
                        />
                      )}
                    </div>

                    {/* Discord Tickets config */}
                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-black text-white uppercase tracking-wider">Support Thread Tickets</label>
                        <button 
                          onClick={() => setBotConfig(prev => ({ ...prev, ticketEnabled: !prev.ticketEnabled }))}
                          className={`w-14 h-8 rounded-full transition-all flex items-center p-1 cursor-pointer ${botConfig.ticketEnabled ? 'bg-blue-600 justify-end' : 'bg-white/10 justify-start'}`}
                        >
                          <div className="w-6 h-6 rounded-full bg-white shadow-md"></div>
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-500 font-bold leading-relaxed">
                        Allows members to type `!ticket` to spin up live support channels instantly on your Discord host.
                      </p>
                      {botConfig.ticketEnabled && (
                        <textarea
                          value={botConfig.ticketHelpMessage}
                          onChange={(e) => setBotConfig(prev => ({ ...prev, ticketHelpMessage: e.target.value }))}
                          placeholder="🎟️ Open a support ticket by typing `!ticket`"
                          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-blue-500 transition-colors"
                          rows={2}
                        />
                      )}
                    </div>

                    {/* Interactive chat channel ID */}
                    <div className="space-y-4 pt-4 border-t border-white/5 flex-1">
                      <label className="text-sm font-black text-white uppercase tracking-wider block">AI Responder Channel ID</label>
                      <p className="text-[11px] text-gray-500 font-bold leading-relaxed">
                        Enter your active Discord Channel ID. The core bot listens to every single message inside this channel and replies utilizing Gemini.
                      </p>
                      <input 
                        type="text"
                        value={botConfig.aiChannelId}
                        onChange={(e) => setBotConfig(prev => ({ ...prev, aiChannelId: e.target.value }))}
                        placeholder="e.g. 11985739502948"
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-blue-500 transition-colors font-mono"
                      />
                    </div>
                  </div>

                  {/* Right Column: Embedded web widget & emulator preview */}
                  <div className="bg-[#0B0B0D] border border-white/5 rounded-[44px] p-8 sm:p-10 space-y-8 relative overflow-hidden flex flex-col">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                      <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl">
                        <Globe size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Website Embed Script</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Integrate AI Customer Support</p>
                      </div>
                    </div>

                    {/* Embedding instructions */}
                    <div className="space-y-4">
                      <p className="text-[11px] text-gray-400 font-bold leading-relaxed">
                        Copy and paste this script token link anywhere in your static HTML footer to enable a floating VIP helper instantly:
                      </p>
                      
                      {/* Interactive block card */}
                      <div className="relative group">
                        <pre className="bg-[#050505] border border-white/5 rounded-2xl p-5 text-[10px] font-mono text-gray-400 overflow-x-auto select-all pr-24">
                          {`<script src="${window.location.origin}/api/widget.js" defer></script>`}
                        </pre>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`<script src="${window.location.origin}/api/widget.js" defer></script>`);
                            setScriptCopied(true);
                            setTimeout(() => setScriptCopied(false), 2000);
                          }}
                          className="absolute top-1/2 -translate-y-1/2 right-4 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-black uppercase transition-all shadow-md cursor-pointer"
                        >
                          {scriptCopied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    {/* Dynamic live sandbox emulator */}
                    <div className="border border-white/5 rounded-3xl bg-[#060607] flex flex-col h-[320px] overflow-hidden flex-1">
                      {/* Emulator Header */}
                      <div className="bg-[#111113] border-b border-white/5 px-5 py-3 flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-gray-400">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                          <span>Interactive Live Web Widget Emulator</span>
                        </div>
                        <span className="text-gray-650">Preview</span>
                      </div>

                      {/* Messages scroll area */}
                      <div className="flex-1 p-5 overflow-y-auto space-y-3 custom-scrollbar flex flex-col text-xs font-bold font-sans">
                        {sandboxMessages.map((msg, idx) => (
                          <div 
                            key={idx} 
                            className={`p-3.5 max-w-[80%] rounded-2xl ${
                              msg.role === 'user' 
                                ? 'bg-blue-600 text-white self-end rounded-tr-none' 
                                : 'bg-white/5 text-gray-350 self-start rounded-tl-none border border-white/5'
                            }`}
                          >
                            {msg.text}
                          </div>
                        ))}
                        {sandboxTyping && (
                          <div className="bg-white/5 border border-white/5 text-gray-550 self-start rounded-2xl rounded-tl-none p-3.5 max-w-[80%] flex items-center gap-1.5 animate-pulse">
                            <span className="text-[10px] text-gray-400 font-bold">VIP Neural response pipeline thinking...</span>
                          </div>
                        )}
                      </div>

                      {/* Input container */}
                      <div className="bg-[#111113] border-t border-white/5 p-3 flex gap-2">
                        <input
                          type="text"
                          value={sandboxInput}
                          onChange={(e) => setSandboxInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSendSandbox();
                          }}
                          placeholder="Type a sandbox tester message..."
                          className="flex-1 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-750 outline-none focus:border-blue-500 transition-colors"
                        />
                        <button 
                          onClick={handleSendSandbox}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Apply Settings Bottom Bar */}
                <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/5">
                  <button 
                    onClick={() => setShowBotDashboard(false)}
                    className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white rounded-2xl transition-colors border border-white/5 cursor-pointer"
                  >
                    Back to Chat
                  </button>
                  <button 
                    onClick={saveBotConfiguration}
                    disabled={savingConfig}
                    className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-black uppercase tracking-widest text-white rounded-2xl transition-all shadow-xl shadow-blue-600/25 flex items-center gap-2 cursor-pointer"
                  >
                    {savingConfig ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>Apply Settings</span>
                      </>
                    )}
                  </button>
                </div>

                {saveSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-600/10 border border-green-500/20 text-green-400 font-bold px-6 py-4 rounded-2xl text-[10px] uppercase tracking-widest text-center"
                  >
                    Settings successfully applied to current production bot & web instances! ✨
                  </motion.div>
                )}
              </div>
            ) : (
              !currentChatId || activeChat?.messages.length === 0 ? (
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
                      <h3 className={`text-xl font-bold uppercase tracking-[0.4em] translate-x-1 ${themeMode === 'black' ? 'text-white/40' : 'text-black/40'}`}>System Pulse: Online 👋</h3>
                      <h2 className={`text-5xl sm:text-8xl font-black tracking-tighter italic uppercase leading-[0.8] bg-clip-text text-transparent py-2 ${
                        themeMode === 'black' 
                          ? 'bg-gradient-to-b from-white via-white to-white/10' 
                          : 'bg-gradient-to-b from-black via-black/90 to-black/20'
                      }`}>
                        What's on <br/> your mind?
                      </h2>
                      <p className={`font-black uppercase tracking-[0.6em] text-[10px] pt-4 pl-1 ${themeMode === 'black' ? 'text-gray-700' : 'text-gray-400'}`}>VIP Core 4.2 · Neural compute optimized</p>
                   </div>
                </div>

                {/* Intelligent Prompt Rails */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <button onClick={() => setChatInput("Write a high-performance Discord bot in discord.js")} className={`p-8 border rounded-[44px] text-left transition-all group relative overflow-hidden shadow-2xl ${themeMode === 'black' ? 'bg-[#0D0D0F] border-white/5 hover:border-yellow-500/40 hover:bg-white/5 text-white' : 'bg-white border-black/10 hover:border-yellow-500/30 hover:bg-gray-50 text-black shadow-sm'}`}>
                      <div className="flex items-center justify-between mb-8">
                         <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-2xl group-hover:scale-110 transition-transform"><Zap size={24} /></div>
                         <ChevronRight size={18} className="text-white/5 group-hover:text-white/20 transition-colors" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 mb-2">Protocol: Build</p>
                      <p className="font-bold text-sm text-white/70 leading-relaxed">Write a high-performance Discord bot in discord.js</p>
                   </button>
                   <button onClick={() => setChatInput("Concept for a minimal VIP-inspired landing page")} className={`p-8 border rounded-[44px] text-left transition-all group relative overflow-hidden shadow-2xl ${themeMode === 'black' ? 'bg-[#0D0D0F] border-white/5 hover:border-blue-500/40 hover:bg-white/5 text-white' : 'bg-white border-black/10 hover:border-blue-500/30 hover:bg-gray-50 text-black shadow-sm'}`}>
                      <div className="flex items-center justify-between mb-8">
                         <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl group-hover:scale-110 transition-transform"><Palette size={24} /></div>
                         <ChevronRight size={18} className="text-white/5 group-hover:text-white/20 transition-colors" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 mb-2">Protocol: Design</p>
                      <p className="font-bold text-sm text-white/70 leading-relaxed">Concept for a minimal VIP-inspired landing page</p>
                   </button>
                   <button onClick={() => setChatInput("Research scalable neural architecture trends 2025")} className={`p-8 border rounded-[44px] text-left transition-all group relative overflow-hidden shadow-2xl ${themeMode === 'black' ? 'bg-[#0D0D0F] border-white/5 hover:border-purple-500/40 hover:bg-white/5 text-white' : 'bg-white border-black/10 hover:border-purple-500/30 hover:bg-gray-50 text-black shadow-sm'}`}>
                      <div className="flex items-center justify-between mb-8">
                         <div className="p-3 bg-purple-500/10 text-purple-500 rounded-2xl group-hover:scale-110 transition-transform"><Cpu size={24} /></div>
                         <ChevronRight size={18} className="text-white/5 group-hover:text-white/20 transition-colors" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 mb-2">Protocol: Ideas</p>
                      <p className="font-bold text-sm text-white/70 leading-relaxed">Research scalable neural architecture trends 2025</p>
                   </button>
                   <button onClick={() => setChatInput("Audit security protocols for decentralized app nodes")} className={`p-8 border rounded-[44px] text-left transition-all group relative overflow-hidden shadow-2xl ${themeMode === 'black' ? 'bg-[#0D0D0F] border-white/5 hover:border-green-500/40 hover:bg-white/5 text-white' : 'bg-white border-black/10 hover:border-green-500/30 hover:bg-gray-50 text-black shadow-sm'}`}>
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
                      <span>Avinash Boy</span>
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
                    <div className={`p-10 rounded-[56px] max-w-[85%] shadow-2xl relative overflow-hidden border ${
                      themeMode === 'black' ? 'border-white/5' : 'border-black/5'
                    } ${
                      msg.role === 'user' 
                        ? (themeMode === 'black' ? 'bg-[#121214] text-white rounded-tr-none border-white/10' : 'bg-[#EAEAEE] text-white rounded-tr-none border-black/10') 
                        : (themeMode === 'black' ? 'bg-white/5 rounded-tl-none text-white/95' : 'bg-white border-black/10 rounded-tl-none text-black')
                    }`}>
                      {msg.role === 'user' && (
                        <div className="absolute inset-0 bg-blue-500/[0.03] pointer-events-none"></div>
                      )}
                      
                      {/* Message Content Body */}
                      <div className={`prose prose-sm max-w-none whitespace-pre-wrap font-bold tracking-tight leading-relaxed relative z-10 ${
                        themeMode === 'black' ? 'prose-invert text-white' : 'text-black prose-gray'
                      }`}>
                         {msg.text.split(/(```[\s\S]*?```)/g).map((part, pIdx) => {
                          if (part.startsWith('```')) {
                            const codeArr = part.match(/```(\w*)\n?([\s\S]*?)```/);
                            const lang = (codeArr?.[1] || 'code').toUpperCase();
                            const code = codeArr?.[2] || '';
                            const codeKey = `${idx}-${pIdx}`;
                            const isCodeCopied = copiedCodePartIndex === codeKey;

                            return (
                              <div key={pIdx} className="my-8 rounded-[36px] overflow-hidden border border-white/10 bg-[#070709] shadow-2xl">
                                <div className="flex items-center justify-between px-8 py-4 bg-black/40 border-b border-white/5">
                                  <div className="flex items-center gap-2.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                                    <span className="text-[10px] font-mono font-black tracking-widest text-gray-400">{lang} SEQUENCE</span>
                                  </div>
                                  <div className="flex items-center gap-2.5">
                                    <button 
                                      onClick={() => {
                                        copyToClipboard(code);
                                        setCopiedCodePartIndex(codeKey);
                                        setTimeout(() => setCopiedCodePartIndex(null), 2500);
                                      }} 
                                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                                        isCodeCopied 
                                          ? 'bg-green-600/20 text-green-450 border-green-550/30 font-extrabold text-green-400' 
                                          : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                                      }`}
                                    >
                                      {isCodeCopied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
                                      <span>{isCodeCopied ? 'Copied' : 'Copy Code'}</span>
                                    </button>
                                    <button 
                                      onClick={() => downloadCode(code)} 
                                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-full text-[10px] font-black uppercase tracking-wider text-white transition-all shadow-lg"
                                    >
                                      <Download size={11} />
                                      <span>Download</span>
                                    </button>
                                  </div>
                                </div>
                                <pre className="p-8 overflow-x-auto text-[14px] font-mono leading-relaxed bg-black/80 shadow-inner">
                                  <code className="block text-gray-100">{code}</code>
                                </pre>
                              </div>
                            );
                          }
                          return <span key={pIdx} className="opacity-90">{part}</span>;
                        })}
                      </div>

                      {/* Bubble Action Controls Bar */}
                      <div className="flex flex-wrap items-center gap-3 mt-6 pt-5 border-t border-dashed border-white/10 relative z-10">
                        {/* Copy raw text button */}
                        <button 
                          onClick={() => {
                            copyToClipboard(msg.text);
                            setCopiedMessageIndex(idx);
                            setTimeout(() => setCopiedMessageIndex(null), 2500);
                          }}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                            copiedMessageIndex === idx 
                              ? 'bg-green-600/20 text-green-400 border border-green-500/25 font-bold' 
                              : (themeMode === 'black' 
                                ? 'bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white' 
                                : 'bg-black/5 hover:bg-black/10 border border-black/5 text-gray-600 hover:text-black')
                          }`}
                        >
                          {copiedMessageIndex === idx ? (
                            <>
                              <Check size={11} className="text-green-400" />
                              <span className="text-green-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={11} />
                              <span>Copy Response</span>
                            </>
                          )}
                        </button>

                        {/* Speech Synth Player button */}
                        <button 
                          onClick={() => speak(msg.text, idx)}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                            speakingMessageIndex === idx 
                              ? 'bg-blue-600/25 text-blue-400 border border-blue-500/25 font-bold animate-pulse' 
                              : (themeMode === 'black' 
                                ? 'bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white' 
                                : 'bg-black/5 hover:bg-black/10 border border-black/5 text-gray-600 hover:text-black')
                          }`}
                        >
                          {speakingMessageIndex === idx ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                              <span className="text-blue-400">Stop Speech</span>
                            </>
                          ) : (
                            <>
                              <Volume2 size={11} />
                              <span>Play Audio</span>
                            </>
                          )}
                        </button>
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
                    <div className={`p-8 rounded-[40px] rounded-tl-none flex gap-2.5 items-center border ${themeMode === 'black' ? 'bg-white/5 border-white/5' : 'bg-white border-black/10 shadow-sm'}`}>
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} className="h-20" />
              </div>
            )
          )}
          </div>

          {/* Unified AI Input Bar */}
          <div className={`px-10 pb-10 pt-4 sticky bottom-0 z-50 transition-all duration-300 ${themeMode === 'black' ? 'bg-gradient-to-t from-[#050505] via-[#050505]/98 to-transparent' : 'bg-gradient-to-t from-[#FAFAFD] via-[#FAFAFD]/98 to-transparent'}`}>
             <div className="max-w-4xl mx-auto w-full flex items-end gap-5">
                <div className={`flex-1 relative border rounded-[50px] transition-all p-4 flex flex-col group ${themeMode === 'black' ? 'bg-[#0D0D0F] border-white/5 focus-within:border-white/10 ring-1 ring-white/5 shadow-3xl' : 'bg-white border-black/15 focus-within:border-black/20 ring-1 ring-black/5 shadow-md text-black'}`}>
                   <div className="flex items-center gap-2">
                      <button className={`p-4 rounded-full transition-all group/btn ${themeMode === 'black' ? 'text-gray-500 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-black hover:bg-black/5'}`}>
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
                        className={`flex-1 bg-transparent border-none focus:ring-0 resize-none py-4 font-bold max-h-48 text-lg tracking-tight outline-none ${themeMode === 'black' ? 'text-white placeholder:text-gray-800' : 'text-black placeholder:text-gray-400'}`}
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
                  Created by Avinash Boy · Built with Premium Standards
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
