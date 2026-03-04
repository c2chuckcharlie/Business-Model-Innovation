import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  Users, 
  Rocket, 
  BarChart3, 
  FileText, 
  ChevronRight, 
  Loader2, 
  CheckCircle2,
  Download,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Language, TeamInfo, UserStory, ElevatorPitch, AppState } from './types';
import { translations } from './constants/translations';
import { generateBusinessModel } from './services/gemini';
import { generateStructuredPDF } from './services/pdfService';
import { cn } from './lib/utils';
import jsPDF from 'jspdf';

import { GoogleGenAI } from "@google/genai";

function ChatBot({ language, teamInfo, userStory, elevatorPitch, aiData }: { language: Language, teamInfo: any, userStory: any, elevatorPitch: any, aiData: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `
          Context:
          Team Info: ${JSON.stringify(teamInfo)}
          User Story: ${JSON.stringify(userStory)}
          Elevator Pitch: ${JSON.stringify(elevatorPitch)}
          AI Business Model Data: ${JSON.stringify(aiData)}
          
          User Question: ${userMsg}
          
          Respond in ${language === 'en' ? 'English' : language === 'zh' ? 'Traditional Chinese' : 'Japanese'}.
          Be helpful, professional, and insightful.
        `,
      });
      setMessages(prev => [...prev, { role: 'ai', text: response.text || "I'm sorry, I couldn't process that." }]);
    } catch (error) {
      console.error("Chat failed", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white w-96 h-[500px] rounded-3xl shadow-2xl border border-[#141414]/10 flex flex-col overflow-hidden mb-4"
          >
            <div className="bg-[#141414] text-white p-6 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-bold uppercase tracking-widest">AI Strategy Advisor</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-[#141414]/40 mt-20">
                  <Zap className="w-10 h-10 mx-auto mb-4 opacity-20" />
                  <p className="text-sm font-medium">Ask me anything about your business model!</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[80%] p-4 rounded-2xl text-sm",
                    m.role === 'user' ? "bg-[#5A5A40] text-white" : "bg-[#F5F5F0] text-[#141414]"
                  )}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#F5F5F0] p-4 rounded-2xl">
                    <Loader2 className="w-4 h-4 animate-spin text-[#141414]/40" />
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-[#141414]/5 flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Type your question..."
                className="flex-1 bg-[#F5F5F0] border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#5A5A40]"
              />
              <button 
                onClick={handleSend}
                className="bg-[#141414] text-white p-2 rounded-xl hover:bg-[#5A5A40] transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#141414] text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:bg-[#5A5A40] hover:scale-110 transition-all"
      >
        <Zap className={cn("w-8 h-8", isOpen ? "rotate-12" : "")} />
      </button>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState<AppState>({
    language: 'en',
    step: 0, // 0: Language, 1: Team Setup, 2: Step 1, 3: Step 2, 4: Dashboard
    teamInfo: null,
    userStory: null,
    elevatorPitch: null,
    aiData: {
      bmc: null,
      valueLogic: null,
      financials: null,
      investorOutput: null,
      scores: null,
    },
    isGenerating: false,
  });

  const t = translations[state.language];

  const handleLanguageSelect = (lang: Language) => {
    setState(prev => ({ ...prev, language: lang, step: 1 }));
  };

  const handleTeamSetup = (info: TeamInfo) => {
    setState(prev => ({ ...prev, teamInfo: info, step: 2 }));
  };

  const handleUserStorySubmit = (story: UserStory) => {
    setState(prev => ({ ...prev, userStory: story, step: 3 }));
  };

  const handleElevatorPitchSubmit = async (pitch: ElevatorPitch) => {
    setState(prev => ({ ...prev, elevatorPitch: pitch, isGenerating: true, step: 4 }));
    
    try {
      const data = await generateBusinessModel(
        state.language,
        state.teamInfo!,
        state.userStory!,
        pitch
      );
      
      setState(prev => ({
        ...prev,
        aiData: data,
        isGenerating: false
      }));
    } catch (error) {
      console.error("AI Generation failed", error);
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const renderStep = () => {
    switch (state.step) {
      case 0:
        return <LanguageSelection onSelect={handleLanguageSelect} />;
      case 1:
        return <TeamSetup t={t} onSubmit={handleTeamSetup} />;
      case 2:
        return <Step1 t={t} onSubmit={handleUserStorySubmit} />;
      case 3:
        return <Step2 t={t} onSubmit={handleElevatorPitchSubmit} />;
      case 4:
        return <Dashboard state={state} t={t} setState={setState} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans selection:bg-[#5A5A40] selection:text-white">
      {state.step > 1 && state.teamInfo && (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#141414]/10 px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-[#141414] text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
              Team {state.teamInfo.teamNumber}
            </div>
            <div className="text-sm font-medium text-[#141414]/60 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {state.teamInfo.city}, {state.teamInfo.prefecture}, {state.teamInfo.country}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((s) => (
                <div 
                  key={s}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors duration-300",
                    state.step >= s + 1 ? "bg-[#5A5A40]" : "bg-[#141414]/10"
                  )}
                />
              ))}
            </div>
            <h1 className="text-lg font-serif italic font-bold text-[#5A5A40]">
              {t.title}
            </h1>
          </div>
        </header>
      )}
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </main>

      {state.step === 4 && !state.isGenerating && (
        <ChatBot 
          language={state.language} 
          teamInfo={state.teamInfo} 
          userStory={state.userStory} 
          elevatorPitch={state.elevatorPitch} 
          aiData={state.aiData} 
        />
      )}
    </div>
  );
}

function LanguageSelection({ onSelect }: { onSelect: (lang: Language) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-12"
      >
        <h1 className="text-7xl md:text-9xl font-serif font-black tracking-tighter text-[#141414] leading-none mb-4">
          ZERO TO GLOBAL
        </h1>
        <p className="text-xl md:text-2xl font-medium text-[#5A5A40] uppercase tracking-[0.2em]">
          Executive Innovation Challenge
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {[
          { id: 'en', label: 'English', sub: 'Global Standard' },
          { id: 'zh', label: '繁體中文', sub: '傳統中文' },
          { id: 'ja', label: '日本語', sub: '日本市場' }
        ].map((lang) => (
          <button
            key={lang.id}
            onClick={() => onSelect(lang.id as Language)}
            className="group relative bg-white border border-[#141414]/10 p-10 rounded-3xl hover:border-[#5A5A40] transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-[#5A5A40] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            <span className="block text-3xl font-bold mb-2">{lang.label}</span>
            <span className="block text-sm text-[#141414]/40 uppercase tracking-widest font-bold">{lang.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TeamSetup({ t, onSubmit }: { t: any, onSubmit: (info: TeamInfo) => void }) {
  const [formData, setFormData] = useState<TeamInfo>({
    teamNumber: '',
    country: 'Japan',
    prefecture: '',
    city: '',
    town: ''
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-12 text-center">
        <h2 className="text-4xl font-serif font-bold mb-4">{t.teamSetup}</h2>
        <div className="h-1 w-20 bg-[#5A5A40] mx-auto" />
      </div>

      <div className="bg-white p-10 rounded-[2rem] shadow-xl border border-[#141414]/5 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">{t.teamNumber}</label>
            <input 
              type="text" 
              value={formData.teamNumber}
              onChange={e => setFormData({ ...formData, teamNumber: e.target.value })}
              className="w-full bg-[#F5F5F0] border-none rounded-xl p-4 focus:ring-2 focus:ring-[#5A5A40] transition-all"
              placeholder="e.g. 01"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">{t.country}</label>
            <input 
              type="text" 
              value={formData.country}
              onChange={e => setFormData({ ...formData, country: e.target.value })}
              className="w-full bg-[#F5F5F0] border-none rounded-xl p-4 focus:ring-2 focus:ring-[#5A5A40] transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">{t.prefecture}</label>
            <input 
              type="text" 
              value={formData.prefecture}
              onChange={e => setFormData({ ...formData, prefecture: e.target.value })}
              className="w-full bg-[#F5F5F0] border-none rounded-xl p-4 focus:ring-2 focus:ring-[#5A5A40] transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">{t.city}</label>
            <input 
              type="text" 
              value={formData.city}
              onChange={e => setFormData({ ...formData, city: e.target.value })}
              className="w-full bg-[#F5F5F0] border-none rounded-xl p-4 focus:ring-2 focus:ring-[#5A5A40] transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">{t.town}</label>
            <input 
              type="text" 
              value={formData.town}
              onChange={e => setFormData({ ...formData, town: e.target.value })}
              className="w-full bg-[#F5F5F0] border-none rounded-xl p-4 focus:ring-2 focus:ring-[#5A5A40] transition-all"
            />
          </div>
        </div>

        <button
          onClick={() => onSubmit(formData)}
          disabled={!formData.teamNumber || !formData.city}
          className="w-full bg-[#141414] text-white py-5 rounded-2xl font-bold uppercase tracking-[0.2em] hover:bg-[#5A5A40] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
        >
          {t.next} <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function Step1({ t, onSubmit }: { t: any, onSubmit: (story: UserStory) => void }) {
  const [story, setStory] = useState<UserStory>({
    targetUser: '',
    coreProblem: '',
    solutionSummary: '',
    desiredOutcome: ''
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-12">
        <span className="text-xs font-bold text-[#5A5A40] uppercase tracking-[0.3em] mb-2 block">Step 01</span>
        <h2 className="text-5xl font-serif font-bold">{t.userStory}</h2>
      </div>

      <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-[#141414]/5">
        <div className="mb-10 p-8 bg-[#F5F5F0] rounded-2xl border-l-4 border-[#5A5A40]">
          <p className="text-lg font-serif italic text-[#141414]/60">
            "As a <span className="text-[#5A5A40] font-bold">{story.targetUser || '...'}</span>, 
            I want to <span className="text-[#5A5A40] font-bold">{story.coreProblem || '...'}</span>, 
            so that I can achieve <span className="text-[#5A5A40] font-bold">{story.desiredOutcome || '...'}</span>."
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">{t.targetUser}</label>
            <input 
              type="text" 
              value={story.targetUser}
              onChange={e => setStory({ ...story, targetUser: e.target.value })}
              className="w-full bg-[#F5F5F0] border-none rounded-xl p-4 focus:ring-2 focus:ring-[#5A5A40] transition-all"
              placeholder="e.g. Busy urban professionals"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">{t.coreProblem}</label>
            <input 
              type="text" 
              value={story.coreProblem}
              onChange={e => setStory({ ...story, coreProblem: e.target.value })}
              className="w-full bg-[#F5F5F0] border-none rounded-xl p-4 focus:ring-2 focus:ring-[#5A5A40] transition-all"
              placeholder="e.g. Find healthy meals quickly"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">{t.solutionSummary}</label>
            <textarea 
              value={story.solutionSummary}
              onChange={e => setStory({ ...story, solutionSummary: e.target.value })}
              className="w-full bg-[#F5F5F0] border-none rounded-xl p-4 focus:ring-2 focus:ring-[#5A5A40] transition-all h-32"
              placeholder="Describe your solution..."
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">{t.desiredOutcome}</label>
            <input 
              type="text" 
              value={story.desiredOutcome}
              onChange={e => setStory({ ...story, desiredOutcome: e.target.value })}
              className="w-full bg-[#F5F5F0] border-none rounded-xl p-4 focus:ring-2 focus:ring-[#5A5A40] transition-all"
              placeholder="e.g. Better work-life balance and health"
            />
          </div>
        </div>

        <button
          onClick={() => onSubmit(story)}
          disabled={!story.targetUser || !story.coreProblem || !story.solutionSummary || !story.desiredOutcome}
          className="mt-10 w-full bg-[#141414] text-white py-5 rounded-2xl font-bold uppercase tracking-[0.2em] hover:bg-[#5A5A40] disabled:opacity-30 transition-all flex items-center justify-center gap-3"
        >
          {t.next} <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function Step2({ t, onSubmit }: { t: any, onSubmit: (pitch: ElevatorPitch) => void }) {
  const [pitch, setPitch] = useState<ElevatorPitch>({
    targetSegment: '',
    context: '',
    productDescription: '',
    coreValueProp: '',
    differentiation: '',
    competitiveAdvantage: '',
    pitchText: ''
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-12">
        <span className="text-xs font-bold text-[#5A5A40] uppercase tracking-[0.3em] mb-2 block">Step 02</span>
        <h2 className="text-5xl font-serif font-bold">{t.elevatorPitch}</h2>
      </div>

      <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-[#141414]/5 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">{t.targetSegment}</label>
            <input 
              type="text" 
              value={pitch.targetSegment}
              onChange={e => setPitch({ ...pitch, targetSegment: e.target.value })}
              className="w-full bg-[#F5F5F0] border-none rounded-xl p-4 focus:ring-2 focus:ring-[#5A5A40] transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">{t.context}</label>
            <input 
              type="text" 
              value={pitch.context}
              onChange={e => setPitch({ ...pitch, context: e.target.value })}
              className="w-full bg-[#F5F5F0] border-none rounded-xl p-4 focus:ring-2 focus:ring-[#5A5A40] transition-all"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">{t.productDescription}</label>
            <textarea 
              value={pitch.productDescription}
              onChange={e => setPitch({ ...pitch, productDescription: e.target.value })}
              className="w-full bg-[#F5F5F0] border-none rounded-xl p-4 focus:ring-2 focus:ring-[#5A5A40] transition-all h-24"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">{t.coreValueProp}</label>
            <input 
              type="text" 
              value={pitch.coreValueProp}
              onChange={e => setPitch({ ...pitch, coreValueProp: e.target.value })}
              className="w-full bg-[#F5F5F0] border-none rounded-xl p-4 focus:ring-2 focus:ring-[#5A5A40] transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">{t.differentiation}</label>
            <input 
              type="text" 
              value={pitch.differentiation}
              onChange={e => setPitch({ ...pitch, differentiation: e.target.value })}
              className="w-full bg-[#F5F5F0] border-none rounded-xl p-4 focus:ring-2 focus:ring-[#5A5A40] transition-all"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">{t.competitiveAdvantage}</label>
            <input 
              type="text" 
              value={pitch.competitiveAdvantage}
              onChange={e => setPitch({ ...pitch, competitiveAdvantage: e.target.value })}
              className="w-full bg-[#F5F5F0] border-none rounded-xl p-4 focus:ring-2 focus:ring-[#5A5A40] transition-all"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Full Pitch (150-250 words)</label>
            <textarea 
              value={pitch.pitchText}
              onChange={e => setPitch({ ...pitch, pitchText: e.target.value })}
              className="w-full bg-[#F5F5F0] border-none rounded-xl p-4 focus:ring-2 focus:ring-[#5A5A40] transition-all h-48"
              placeholder="Write your elevator pitch here..."
            />
            <div className="text-right text-xs font-bold text-[#141414]/30">
              {pitch.pitchText.split(/\s+/).filter(Boolean).length} words
            </div>
          </div>
        </div>

        <button
          onClick={() => onSubmit(pitch)}
          disabled={!pitch.pitchText}
          className="w-full bg-[#141414] text-white py-5 rounded-2xl font-bold uppercase tracking-[0.2em] hover:bg-[#5A5A40] disabled:opacity-30 transition-all flex items-center justify-center gap-3"
        >
          {t.submit} <Rocket className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function Dashboard({ state, t, setState }: { state: AppState, t: any, setState: any }) {
  const [activeTab, setActiveTab] = useState('bmc');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const updateAIData = (path: string, value: any) => {
    setState((prev: AppState) => {
      const newData = { ...prev.aiData };
      const keys = path.split('.');
      let current: any = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return { ...prev, aiData: newData };
    });
  };

  if (state.isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Loader2 className="w-20 h-20 text-[#5A5A40] animate-spin mb-8" />
        <h2 className="text-4xl font-serif font-bold mb-4">{t.generating}</h2>
        <p className="text-[#141414]/40 uppercase tracking-widest font-bold">Analyzing market data & financial projections</p>
      </div>
    );
  }

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      await generateStructuredPDF(state);
    } catch (error) {
      console.error('Report generation failed:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleRefine = async () => {
    setState((prev: AppState) => ({ ...prev, isGenerating: true }));
    try {
      const data = await generateBusinessModel(
        state.language,
        state.teamInfo!,
        state.userStory!,
        state.elevatorPitch!,
        state.aiData
      );
      setState((prev: AppState) => ({ ...prev, aiData: data, isGenerating: false }));
    } catch (error) {
      console.error('Refinement failed:', error);
      setState((prev: AppState) => ({ ...prev, isGenerating: false }));
    }
  };

  const ai = state.aiData;

  return (
    <div className="space-y-12">
      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[#141414]/10">
        <div>
          <h2 className="text-4xl font-serif font-bold mb-2">Innovation Dashboard</h2>
          <p className="text-[#141414]/40 uppercase tracking-widest text-[10px] font-bold">
            Project: {state.elevatorPitch?.context} | Team {state.teamInfo?.teamNumber}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleRefine}
            disabled={state.isGenerating}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-[#141414]/10 rounded-full hover:bg-[#F5F5F0] transition-colors text-xs font-bold uppercase tracking-widest"
          >
            <Zap className="w-4 h-4" />
            Refine with AI
          </button>
          <button
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
            className="flex items-center gap-2 px-8 py-3 bg-[#141414] text-white rounded-full hover:bg-[#141414]/90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 text-xs font-bold uppercase tracking-widest"
          >
            {isGeneratingReport ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            {t.generateReport}
          </button>
        </div>
      </div>

      {/* Gamification Layer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <ScoreCard icon={<ShieldCheck className="w-5 h-5" />} label={t.scores.sustainability} score={ai.scores?.sustainability || 0} color="bg-emerald-500" />
        <ScoreCard icon={<AlertTriangle className="w-5 h-5" />} label={t.scores.risk} score={ai.scores?.risk || 0} color="bg-amber-500" />
        <ScoreCard icon={<Globe className="w-5 h-5" />} label={t.scores.scalability} score={ai.scores?.scalability || 0} color="bg-blue-500" />
        <ScoreCard icon={<Zap className="w-5 h-5" />} label={t.scores.aiFeedback} score={ai.scores?.aiFeedback || 0} color="bg-violet-500" />
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar Navigation */}
        <aside className="lg:w-64 flex-shrink-0">
          <nav className="space-y-2 sticky top-24">
            <NavItem icon={<FileText />} label={t.bmc} active={activeTab === 'bmc'} onClick={() => setActiveTab('bmc')} />
            <NavItem icon={<Zap />} label={t.valueLogic} active={activeTab === 'value'} onClick={() => setActiveTab('value')} />
            <NavItem icon={<TrendingUp />} label={t.ltv} active={activeTab === 'ltv'} onClick={() => setActiveTab('ltv')} />
            <NavItem icon={<Users />} label={t.coca} active={activeTab === 'coca'} onClick={() => setActiveTab('coca')} />
            <NavItem icon={<BarChart3 />} label={t.financials} active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} />
            <NavItem icon={<Rocket />} label={t.investorReady} active={activeTab === 'investor'} onClick={() => setActiveTab('investor')} />
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-[#141414]/5 p-12 min-h-[600px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'bmc' && <BMCView bmc={ai.bmc} t={t} onUpdate={(f, v) => updateAIData(`bmc.${f}`, v)} />}
                {activeTab === 'value' && <ValueLogicView logic={ai.valueLogic} t={t} onUpdate={(f, v) => updateAIData(`valueLogic.${f}`, v)} />}
                {activeTab === 'ltv' && <LTVView ltv={ai.financials?.ltv} t={t} onUpdate={(f, v) => updateAIData(`financials.ltv.${f}`, v)} />}
                {activeTab === 'coca' && <COCAView coca={ai.financials?.coca} ratio={ai.financials?.ratio} t={t} onUpdate={(f, v) => updateAIData(`financials.${f}`, v)} />}
                {activeTab === 'finance' && <FinancialsView projections={ai.financials?.projections} t={t} onUpdate={(f, v) => updateAIData(`financials.${f}`, v)} />}
                {activeTab === 'investor' && <InvestorView output={ai.investorOutput} t={t} onUpdate={(f, v) => updateAIData(`investorOutput.${f}`, v)} />}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-12 flex justify-center">
            <button
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
              className="group relative bg-[#141414] text-white px-12 py-6 rounded-2xl font-bold uppercase tracking-[0.2em] hover:bg-[#5A5A40] transition-all flex items-center gap-4 overflow-hidden shadow-2xl"
            >
              {isGeneratingReport ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <FileText className="w-6 h-6" />
                  {t.report}
                  <Download className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ icon, label, score, color }: { icon: any, label: string, score: number, color: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-lg border border-[#141414]/5">
      <div className="flex items-center gap-3 mb-4 text-[#141414]/40">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-4xl font-serif font-bold">{score}</span>
        <div className="w-24 h-2 bg-[#F5F5F0] rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            className={cn("h-full", color)}
          />
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group",
        active 
          ? "bg-[#141414] text-white shadow-xl translate-x-2" 
          : "text-[#141414]/60 hover:bg-white hover:text-[#141414] hover:shadow-md"
      )}
    >
      <span className={cn("transition-transform duration-300", active ? "scale-110" : "group-hover:scale-110")}>
        {icon}
      </span>
      <span className="text-sm font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

function BMCView({ bmc, t, onUpdate }: { bmc: any, t: any, onUpdate: (field: string, val: string) => void }) {
  if (!bmc) return null;
  return (
    <div className="space-y-8">
      <h3 className="text-3xl font-serif font-bold border-b border-[#141414]/10 pb-4">{t.bmc}</h3>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <BMCBlock title="Key Partners" content={bmc.keyPartners} onUpdate={(val) => onUpdate('keyPartners', val)} className="md:row-span-2" />
        <BMCBlock title="Key Activities" content={bmc.keyActivities} onUpdate={(val) => onUpdate('keyActivities', val)} />
        <BMCBlock title="Value Propositions" content={bmc.valuePropositions} onUpdate={(val) => onUpdate('valuePropositions', val)} className="md:row-span-2 bg-[#F5F5F0]" />
        <BMCBlock title="Customer Relationships" content={bmc.customerRelationships} onUpdate={(val) => onUpdate('customerRelationships', val)} />
        <BMCBlock title="Customer Segments" content={bmc.customerSegments} onUpdate={(val) => onUpdate('customerSegments', val)} className="md:row-span-2" />
        <BMCBlock title="Key Resources" content={bmc.keyResources} onUpdate={(val) => onUpdate('keyResources', val)} />
        <BMCBlock title="Channels" content={bmc.channels} onUpdate={(val) => onUpdate('channels', val)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BMCBlock title="Cost Structure" content={bmc.costStructure} onUpdate={(val) => onUpdate('costStructure', val)} />
        <BMCBlock title="Revenue Streams" content={bmc.revenueStreams} onUpdate={(val) => onUpdate('revenueStreams', val)} />
      </div>
    </div>
  );
}

function BMCBlock({ title, content, onUpdate, className }: { title: string, content: string, onUpdate: (val: string) => void, className?: string }) {
  return (
    <div className={cn("p-6 border border-[#141414]/10 rounded-2xl group relative", className)}>
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-3">{title}</h4>
      <textarea
        value={content}
        onChange={(e) => onUpdate(e.target.value)}
        className="w-full bg-transparent text-sm leading-relaxed resize-none focus:ring-0 border-none p-0 h-32"
      />
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Zap className="w-3 h-3 text-[#5A5A40]" />
      </div>
    </div>
  );
}

function ValueLogicView({ logic, t, onUpdate }: { logic: any, t: any, onUpdate: (field: string, val: string) => void }) {
  if (!logic) return null;
  return (
    <div className="space-y-12">
      <h3 className="text-3xl font-serif font-bold border-b border-[#141414]/10 pb-4">{t.valueLogic}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <ValueCard title="Creates Value" content={logic.creates} onUpdate={(val) => onUpdate('creates', val)} icon={<Zap className="w-8 h-8" />} />
        <ValueCard title="Delivers Value" content={logic.delivers} onUpdate={(val) => onUpdate('delivers', val)} icon={<Globe className="w-8 h-8" />} />
        <ValueCard title="Captures Value" content={logic.captures} onUpdate={(val) => onUpdate('captures', val)} icon={<BarChart3 className="w-8 h-8" />} />
      </div>
    </div>
  );
}

function ValueCard({ title, content, onUpdate, icon }: { title: string, content: string, onUpdate: (val: string) => void, icon: any }) {
  return (
    <div className="p-8 bg-[#F5F5F0] rounded-[2rem] border border-[#141414]/5 group relative">
      <div className="text-[#5A5A40] mb-6">{icon}</div>
      <h4 className="text-xl font-serif font-bold mb-4">{title}</h4>
      <textarea
        value={content}
        onChange={(e) => onUpdate(e.target.value)}
        className="w-full bg-transparent text-sm text-[#141414]/70 leading-relaxed resize-none border-none focus:ring-0 p-0 h-40"
      />
    </div>
  );
}

function LTVView({ ltv, t, onUpdate }: { ltv: any, t: any, onUpdate: (field: string, val: any) => void }) {
  if (!ltv) return null;
  return (
    <div className="space-y-12">
      <h3 className="text-3xl font-serif font-bold border-b border-[#141414]/10 pb-4">{t.ltv}</h3>
      <div className="bg-[#141414] text-white p-12 rounded-[2.5rem] shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div>
            <span className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">ARPU</span>
            <input 
              type="number" 
              value={ltv.arpu} 
              onChange={(e) => onUpdate('arpu', Number(e.target.value))}
              className="bg-transparent text-4xl font-serif font-bold text-center border-none focus:ring-0 w-full"
            />
          </div>
          <div>
            <span className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Gross Margin</span>
            <input 
              type="number" 
              step="0.01"
              value={ltv.margin} 
              onChange={(e) => onUpdate('margin', Number(e.target.value))}
              className="bg-transparent text-4xl font-serif font-bold text-center border-none focus:ring-0 w-full"
            />
          </div>
          <div>
            <span className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Lifetime (Months)</span>
            <input 
              type="number" 
              value={ltv.lifetime} 
              onChange={(e) => onUpdate('lifetime', Number(e.target.value))}
              className="bg-transparent text-4xl font-serif font-bold text-center border-none focus:ring-0 w-full"
            />
          </div>
        </div>
        <div className="mt-12 pt-12 border-t border-white/10 text-center">
          <span className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Total LTV</span>
          <span className="text-7xl font-serif font-bold text-[#D4AF37]">${(ltv.arpu * ltv.margin * ltv.lifetime).toFixed(2)}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 bg-[#F5F5F0] rounded-2xl">
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#141414]/40 mb-4">Explanation</h4>
          <textarea
            value={ltv.explanation}
            onChange={(e) => onUpdate('explanation', e.target.value)}
            className="w-full bg-transparent text-sm leading-relaxed resize-none border-none focus:ring-0 p-0 h-32"
          />
        </div>
        <div className="p-8 bg-[#F5F5F0] rounded-2xl">
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#141414]/40 mb-4">Calculation Breakdown</h4>
          <textarea
            value={ltv.breakdown}
            onChange={(e) => onUpdate('breakdown', e.target.value)}
            className="w-full bg-transparent text-sm font-mono leading-relaxed resize-none border-none focus:ring-0 p-0 h-32"
          />
        </div>
      </div>
    </div>
  );
}

function COCAView({ coca, ratio, t, onUpdate }: { coca: any, ratio: any, t: any, onUpdate: (field: string, val: any) => void }) {
  if (!coca) return null;
  return (
    <div className="space-y-12">
      <h3 className="text-3xl font-serif font-bold border-b border-[#141414]/10 pb-4">{t.coca}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="p-8 bg-white border border-[#141414]/10 rounded-2xl">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#141414]/40 mb-4">Estimated COCA</h4>
            <div className="flex items-center gap-2">
              <span className="text-5xl font-serif font-bold">$</span>
              <input 
                type="number" 
                value={coca.estimatedCost} 
                onChange={(e) => onUpdate('coca.estimatedCost', Number(e.target.value))}
                className="bg-transparent text-5xl font-serif font-bold border-none focus:ring-0 w-full"
              />
            </div>
          </div>
          <div className="p-8 bg-[#F5F5F0] rounded-2xl">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#141414]/40 mb-4">Assumptions</h4>
            <textarea
              value={coca.assumptions}
              onChange={(e) => onUpdate('coca.assumptions', e.target.value)}
              className="w-full bg-transparent text-sm leading-relaxed resize-none border-none focus:ring-0 p-0 h-32"
            />
          </div>
        </div>
        <div className={cn(
          "p-12 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-6",
          ratio.classification === 'Healthy' ? "bg-emerald-50 text-emerald-900 border border-emerald-200" :
          ratio.classification === 'Moderate' ? "bg-amber-50 text-amber-900 border border-amber-200" :
          "bg-rose-50 text-rose-900 border border-rose-200"
        )}>
          <span className="text-xs font-bold uppercase tracking-widest opacity-60">LTV / COCA Ratio</span>
          <span className="text-8xl font-serif font-bold">{ratio.value.toFixed(2)}</span>
          <div className="px-6 py-2 rounded-full bg-white/50 font-bold uppercase tracking-widest text-sm">
            {ratio.classification}
          </div>
          <textarea
            value={ratio.interpretation}
            onChange={(e) => onUpdate('ratio.interpretation', e.target.value)}
            className="w-full bg-transparent text-sm font-medium max-w-xs text-center resize-none border-none focus:ring-0 p-0 h-20"
          />
        </div>
      </div>
    </div>
  );
}

function FinancialsView({ projections, t, onUpdate }: { projections: any, t: any, onUpdate: (field: string, val: any) => void }) {
  if (!projections) return null;
  return (
    <div className="space-y-12">
      <h3 className="text-3xl font-serif font-bold border-b border-[#141414]/10 pb-4">{t.financials}</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#141414]/10">
              <th className="py-4 text-xs font-bold uppercase tracking-widest text-[#141414]/40">Year</th>
              <th className="py-4 text-xs font-bold uppercase tracking-widest text-[#141414]/40">Revenue</th>
              <th className="py-4 text-xs font-bold uppercase tracking-widest text-[#141414]/40">Cost</th>
              <th className="py-4 text-xs font-bold uppercase tracking-widest text-[#141414]/40">Profit</th>
            </tr>
          </thead>
          <tbody>
            {projections.fiveYearCashFlow.map((row: any, idx: number) => (
              <tr key={row.year} className="border-b border-[#141414]/5 hover:bg-[#F5F5F0]/50 transition-colors">
                <td className="py-4 font-bold">{row.year}</td>
                <td className="py-4">
                  <input 
                    type="number" 
                    value={row.revenue} 
                    onChange={(e) => {
                      const newFlow = [...projections.fiveYearCashFlow];
                      newFlow[idx].revenue = Number(e.target.value);
                      newFlow[idx].profit = newFlow[idx].revenue - newFlow[idx].cost;
                      onUpdate('projections.fiveYearCashFlow', newFlow);
                    }}
                    className="bg-transparent border-none focus:ring-0 w-32"
                  />
                </td>
                <td className="py-4">
                  <input 
                    type="number" 
                    value={row.cost} 
                    onChange={(e) => {
                      const newFlow = [...projections.fiveYearCashFlow];
                      newFlow[idx].cost = Number(e.target.value);
                      newFlow[idx].profit = newFlow[idx].revenue - newFlow[idx].cost;
                      onUpdate('projections.fiveYearCashFlow', newFlow);
                    }}
                    className="bg-transparent border-none focus:ring-0 w-32"
                  />
                </td>
                <td className={cn("py-4 font-bold", row.profit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                  ${row.profit.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FinStat label="Payback Period" value={projections.paybackPeriod} onUpdate={(val) => onUpdate('projections.paybackPeriod', val)} unit="Months" />
        <FinStat label="ROI" value={projections.roi} onUpdate={(val) => onUpdate('projections.roi', val)} unit="%" />
        <FinStat label="NPV" value={projections.npv} onUpdate={(val) => onUpdate('projections.npv', val)} unit="$" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <RiskItem title="Market Uncertainty" content={projections.risks.uncertainty} onUpdate={(val) => onUpdate('projections.risks.uncertainty', val)} />
        <RiskItem title="Regulatory Risk" content={projections.risks.regulatory} onUpdate={(val) => onUpdate('projections.risks.regulatory', val)} />
        <RiskItem title="Competitive Pressure" content={projections.risks.competitive} onUpdate={(val) => onUpdate('projections.risks.competitive', val)} />
        <RiskItem title="Cost Sensitivity" content={projections.risks.sensitivity} onUpdate={(val) => onUpdate('projections.risks.sensitivity', val)} />
      </div>
    </div>
  );
}

function FinStat({ label, value, onUpdate, unit }: { label: string, value: any, onUpdate: (val: any) => void, unit: string }) {
  return (
    <div className="p-8 bg-white border border-[#141414]/10 rounded-2xl text-center">
      <span className="block text-xs font-bold uppercase tracking-widest text-[#141414]/40 mb-2">{label}</span>
      <div className="flex items-center justify-center gap-1">
        {unit === '$' && <span className="text-2xl font-serif font-bold">$</span>}
        <input 
          type="number" 
          value={value} 
          onChange={(e) => onUpdate(Number(e.target.value))}
          className="bg-transparent text-2xl font-serif font-bold text-center border-none focus:ring-0 w-24"
        />
        {unit !== '$' && <span className="text-2xl font-serif font-bold">{unit}</span>}
      </div>
    </div>
  );
}

function RiskItem({ title, content, onUpdate }: { title: string, content: string, onUpdate: (val: string) => void }) {
  return (
    <div className="p-6 border border-[#141414]/10 rounded-2xl">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <h4 className="text-xs font-bold uppercase tracking-widest">{title}</h4>
      </div>
      <textarea
        value={content}
        onChange={(e) => onUpdate(e.target.value)}
        className="w-full bg-transparent text-sm leading-relaxed text-[#141414]/70 resize-none border-none focus:ring-0 p-0 h-20"
      />
    </div>
  );
}

function InvestorView({ output, t, onUpdate }: { output: any, t: any, onUpdate: (field: string, val: any) => void }) {
  if (!output) return null;
  return (
    <div className="space-y-12">
      <h3 className="text-3xl font-serif font-bold border-b border-[#141414]/10 pb-4">{t.investorReady}</h3>
      
      <div className="p-10 bg-[#5A5A40] text-white rounded-[2rem] shadow-xl">
        <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-6">Investor Elevator Pitch</h4>
        <textarea
          value={output.pitch}
          onChange={(e) => onUpdate('pitch', e.target.value)}
          className="w-full bg-transparent text-2xl font-serif italic leading-relaxed resize-none border-none focus:ring-0 p-0 h-32"
        />
      </div>

      <div className="space-y-8">
        <h4 className="text-xl font-serif font-bold">Executive Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <SummarySection title="Problem" content={output.executiveSummary.problem} onUpdate={(val) => onUpdate('executiveSummary.problem', val)} />
          <SummarySection title="Solution" content={output.executiveSummary.solution} onUpdate={(val) => onUpdate('executiveSummary.solution', val)} />
          <SummarySection title="Market" content={output.executiveSummary.market} onUpdate={(val) => onUpdate('executiveSummary.market', val)} />
          <SummarySection title="Business Model" content={output.executiveSummary.businessModel} onUpdate={(val) => onUpdate('executiveSummary.businessModel', val)} />
          <SummarySection title="Financial Viability" content={output.executiveSummary.financialViability} onUpdate={(val) => onUpdate('executiveSummary.financialViability', val)} />
          <SummarySection title="Competitive Advantage" content={output.executiveSummary.competitiveAdvantage} onUpdate={(val) => onUpdate('executiveSummary.competitiveAdvantage', val)} />
          <SummarySection title="Impact" content={output.executiveSummary.impact} onUpdate={(val) => onUpdate('executiveSummary.impact', val)} className="md:col-span-2" />
        </div>
      </div>
    </div>
  );
}

function SummarySection({ title, content, onUpdate, className }: { title: string, content: string, onUpdate: (val: string) => void, className?: string }) {
  return (
    <div className={cn("p-8 bg-[#F5F5F0] rounded-2xl", className)}>
      <h5 className="text-xs font-bold uppercase tracking-widest text-[#141414]/40 mb-4">{title}</h5>
      <textarea
        value={content}
        onChange={(e) => onUpdate(e.target.value)}
        className="w-full bg-transparent text-sm leading-relaxed resize-none border-none focus:ring-0 p-0 h-32"
      />
    </div>
  );
}
