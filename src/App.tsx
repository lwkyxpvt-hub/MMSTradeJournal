/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { type Trade, type DayOfWeek, type WeeklyStats } from "./types";
import { getStoredTrades, saveTrades, calculateWeeklyStats } from "./dbMock";
import { auth, isFirebaseConfigured, signOut, onAuthStateChanged, type User } from "./lib/firebase";
import { createCloudTrade, updateCloudTrade, deleteCloudTrade, listenToUserTrades } from "./lib/db";
import AuthModal from "./components/AuthModal";
import MetricsHeader from "./components/MetricsHeader";
import CreateTradeModal from "./components/CreateTradeModal";
import TradeDetailPane from "./components/TradeDetailPane";
import TradingChart from "./components/TradingChart";
import StrategyAnalyticsPage from "./components/StrategyAnalyticsPage";
import { 
  Sparkles, Plus, RefreshCw, Calendar, ArrowUpRight, 
  ArrowDownRight, Check, Compass, Info, BrainCircuit, ChevronRight, 
  Layers, Lock, Unlock, HelpCircle, Flame, Percent, Activity
} from "lucide-react";

export default function App() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | "All">("All");
  const [activeTab, setActiveTab] = useState<"dashboard" | "analytics">("dashboard");
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [activeTradeDetail, setActiveTradeDetail] = useState<Trade | null>(null);
  const [stats, setStats] = useState<WeeklyStats>({
    weeklyPnl: 0,
    winRate: 0,
    totalTrades: 0,
    avgRMultiple: 0,
    streakType: "neutral",
    streakCount: 0,
  });

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Listen to Auth State changes
  useEffect(() => {
    if (!auth) {
      setAuthReady(true);
      const loaded = getStoredTrades();
      setTrades(loaded);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser as User | null);
      setAuthReady(true);
      
      if (!firebaseUser) {
        // Fall back to local storage trades
        const loaded = getStoredTrades();
        setTrades(loaded);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Listen to User Trades from Cloud Firestore
  useEffect(() => {
    if (!user) return;

    const unsubscribeTrades = listenToUserTrades(
      user.uid,
      (cloudTrades) => {
        setTrades(cloudTrades);
      },
      (error) => {
        console.error("Failed to sync cloud trades:", error);
      }
    );

    return () => unsubscribeTrades();
  }, [user]);

  // Sync statistics and localStorage when the trades array updates
  useEffect(() => {
    const updatedStats = calculateWeeklyStats(trades);
    setStats(updatedStats);
    // Only save to localStorage if user is NOT logged in
    if (!user) {
      saveTrades(trades);
    }
  }, [trades, user]);

  const handleCreateTrade = async (newTrade: Trade) => {
    if (user) {
      try {
        await createCloudTrade(newTrade, user.uid);
      } catch (err) {
        alert("Failed to save position to cloud: " + err);
      }
    } else {
      setTrades((prev) => [newTrade, ...prev]);
    }
    setIsLogModalOpen(false);
    // Open the detail drawer instantly so they can view/edit their newly created trade
    setActiveTradeDetail(newTrade);
  };

  const handleUpdateTrade = async (updatedTrade: Trade) => {
    if (user) {
      try {
        await updateCloudTrade(updatedTrade, user.uid);
      } catch (err) {
        alert("Failed to update position on cloud: " + err);
      }
    } else {
      setTrades((prev) => prev.map((t) => (t.id === updatedTrade.id ? updatedTrade : t)));
    }
    if (activeTradeDetail && activeTradeDetail.id === updatedTrade.id) {
      setActiveTradeDetail(updatedTrade);
    }
  };

  const handleDeleteTrade = async (id: string) => {
    if (user) {
      try {
        await deleteCloudTrade(id);
      } catch (err) {
        alert("Failed to delete position from cloud: " + err);
      }
    } else {
      setTrades((prev) => prev.filter((t) => t.id !== id));
    }
    setActiveTradeDetail(null);
  };

  // Re-seed original trades
  const handleResetData = () => {
    if (confirm("Would you like to restore default sample trades? (Includes active OPEN trades to demonstrate the logging system!)")) {
      if (user) {
        alert("Resetting sample data is disabled when signed into a live secure Firebase database. You can manually delete trades or log new ones to fit your personal record!");
        return;
      }
      localStorage.removeItem("trademind_trades");
      const loaded = getStoredTrades();
      setTrades(loaded);
      setSelectedDay("All");
      setActiveTradeDetail(null);
    }
  };

  // Days of the week in standard order
  const days: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  // Filter trades for single day gallery rendering
  const filteredTrades = selectedDay === "All" 
    ? trades 
    : trades.filter((t) => t.dayOfWeek === selectedDay);

  // Compute Confluence Analytics in real-time
  const calculateConfluenceAnalytics = () => {
    const closedTrades = trades.filter((t) => t.status === "CLOSED");
    
    const getStatsForCriteria = (criteriaFn: (t: Trade) => boolean) => {
      const relevant = closedTrades.filter(criteriaFn);
      if (relevant.length === 0) return { total: 0, wins: 0, winRate: 0 };
      const wins = relevant.filter((t) => t.outcome === "TP" || t.resultPercentage > 0).length;
      return {
        total: relevant.length,
        wins,
        winRate: Math.round((wins / relevant.length) * 100),
      };
    };

    return {
      crh: getStatsForCriteria((t) => !!t.confluence?.crh),
      crl: getStatsForCriteria((t) => !!t.confluence?.crl),
      pdra: getStatsForCriteria((t) => !!t.confluence?.pdra),
      ash: getStatsForCriteria((t) => !!t.confluence?.ash),
      asl: getStatsForCriteria((t) => !!t.confluence?.asl),
      mmsBuy: getStatsForCriteria((t) => t.entryModel === "MMS Buy Model"),
      mmsSell: getStatsForCriteria((t) => t.entryModel === "MMS Sell Model"),
    };
  };

  const analytics = calculateConfluenceAnalytics();

  return (
    <div className="min-h-screen bg-[#07070A] text-[#B8B8C8] font-sans antialiased pb-20 selection:bg-indigo-600 selection:text-white">
      
      {/* Top Welcome Banner */}
      {!user ? (
        <div className="bg-[#4D2268]/20 border-b border-[#2A2035] px-6 py-2.5 text-center text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2 text-[#C6BBD8] select-none">
          <Unlock className="h-4 w-4 text-[#8457A8] animate-pulse shrink-0" />
          <span>Demo Sandbox: <button onClick={() => setIsAuthModalOpen(true)} className="text-[#8457A8] hover:underline font-extrabold uppercase ml-0.5 cursor-pointer">Authenticate Profile</button> to enable secure, persistent cloud databases.</span>
        </div>
      ) : (
        <div className="bg-[#10B981]/10 border-b border-[#10B981]/20 px-6 py-2.5 text-center text-[11px] font-semibold tracking-wide flex items-center justify-center gap-2 text-emerald-400 select-none animate-fade-in">
          <Check className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Terminal Linked: Signed in securely as <strong className="font-mono text-white underline">{user.email}</strong>. Live replication active.</span>
        </div>
      )}

      {/* Primary Header */}
      <header className="border-b border-[#24243A] bg-[#141420] py-4 px-6 sticky top-0 z-40 backdrop-blur-md">
        <div className="mx-auto max-w-7xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-600 p-2 shadow-lg shadow-indigo-950/40">
              <Compass className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-black text-white tracking-tight">MMS JOURNAL</h1>
                <span className="rounded bg-[#24243A] px-1.5 py-0.5 text-[8px] font-bold text-gray-400 font-mono tracking-widest uppercase">
                  v2.0 ACTIVE
                </span>
              </div>
              <p className="text-[10px] text-[#7A7A8C] font-semibold uppercase tracking-wider">
                Psychology & Performance Analytics Journal
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-[#0F0F17] p-1 rounded-xl border border-[#24243A] text-xs font-bold font-sans">
            <button
              type="button"
              onClick={() => setActiveTab("dashboard")}
              className={`rounded-lg px-3.5 py-1.5 transition-all text-xs flex items-center gap-1.5 ${
                activeTab === "dashboard"
                  ? "bg-indigo-600 text-white font-extrabold shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Workspace Journal</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("analytics")}
              className={`rounded-lg px-3.5 py-1.5 transition-all text-xs flex items-center gap-1.5 ${
                activeTab === "analytics"
                  ? "bg-indigo-600 text-white font-extrabold shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Research & Analytics</span>
            </button>
          </div>

          {/* Action bars */}
          <div className="flex items-center gap-3">
            {!user ? (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 bg-[#8457A8] hover:bg-[#9367B6] active:scale-95 text-white text-xs font-black rounded-lg px-4 py-2 transition-all shadow-md shadow-[#4D2268]/20"
              >
                <Unlock className="h-4 w-4" />
                <span>CLOUD SYNC</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 border border-[#2A2035] bg-[#0B0B10] rounded-xl px-3 py-1.5 text-xs font-semibold shadow-inner">
                <div className="h-5 w-5 bg-[#8457A8] rounded-full flex items-center justify-center font-black text-white shrink-0 uppercase text-[10px] shadow">
                  {user.email?.slice(0, 1) || "U"}
                </div>
                <span className="text-gray-300 max-w-[110px] truncate text-[10px] font-mono">{user.email}</span>
                <button 
                  onClick={() => signOut(auth)} 
                  className="text-[#8D7FA1] hover:text-rose-400 hover:scale-105 active:scale-95 text-[9px] font-extrabold uppercase tracking-widest cursor-pointer ml-1.5 pl-1.5 border-l border-[#2A2035]"
                  title="Disconnect position synchronization"
                >
                  logout
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleResetData}
              title="Reset sample metrics back to start state"
              className="group flex items-center gap-2 rounded-lg border border-[#2A2E39] bg-[#171B26] px-3.5 py-2 text-xs font-semibold hover:border-indigo-500/50 hover:bg-[#131722] transition active:scale-95 text-gray-300 pointer-events-auto"
            >
              <RefreshCw className="h-3.5 w-3.5 group-hover:rotate-180 transition-transform duration-500 text-gray-400" />
              <span>Reset Sample Data</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLogModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 px-4 py-2 text-xs font-black text-white shadow-lg shadow-indigo-950/20 transition-all font-mono"
            >
              <Plus className="h-4 w-4" />
              <span>LOG REGISTER</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        
        {activeTab === "analytics" ? (
          <StrategyAnalyticsPage trades={trades} />
        ) : (
          <>
            {/* Aggregated Statistical Header */}
            <section id="weekly-overview-stats">
              <MetricsHeader stats={stats} />
            </section>

            {/* Dynamic Open & Recently Closed Positions Grid */}
            <div id="active-and-recent-feed-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Open Positions Panel (Left 5 cols) */}
              <div id="active-open-positions-card" className="lg:col-span-5 bg-[#131722] rounded-xl border border-[#2A2E39] p-4 flex flex-col space-y-3">
                <div className="flex items-center justify-between border-b border-[#2A2E39]/50 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    <h3 className="text-xs font-black uppercase text-slate-200 tracking-wider font-mono">
                      Active Open Positions
                    </h3>
                  </div>
                  <span className="rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 text-[9px] font-black font-mono px-2 py-0.5">
                    {trades.filter((t) => t.status === "OPEN").length} ACTIVE
                  </span>
                </div>

                <div className="flex-1 space-y-3">
                  {trades.filter((t) => t.status === "OPEN").length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center text-gray-500 h-[100px] bg-[#171B26]/30 border border-dashed border-[#2A2E39]/50 rounded-lg">
                      <span className="text-[10px] text-gray-500 font-semibold uppercase">No active open positions logged</span>
                    </div>
                  ) : (
                    trades
                      .filter((t) => t.status === "OPEN")
                      .map((trade) => {
                        const isLong = trade.direction === "LONG";
                        return (
                          <div
                            key={trade.id}
                            id={`active-open-${trade.id}`}
                            onClick={() => setActiveTradeDetail(trade)}
                            className="group cursor-pointer bg-[#171B26] hover:bg-[#1C2030] border border-[#2A2E39] hover:border-indigo-500/55 p-3 rounded-lg flex items-center justify-between transition-all duration-200"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 font-sans">
                                <span className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                                  {trade.pair}
                                </span>
                                <span className={`text-[8px] font-black uppercase px-1 rounded ${
                                  isLong 
                                    ? "bg-[#10B981]/10 text-emerald-400 border border-emerald-500/20" 
                                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                }`}>
                                  {trade.direction}
                                </span>
                              </div>
                              <div className="text-[9px] text-[#868F9F] font-mono">
                                In: <strong className="text-gray-300">{trade.entry}</strong> | model: <span className="text-indigo-300">{trade.entryModel}</span>
                              </div>
                            </div>
                            <div className="text-right space-y-0.5">
                              <span className="block text-[8px] uppercase text-gray-500 font-bold tracking-wide">Allocated risk</span>
                              <span className="block text-[11px] font-black text-amber-300 font-mono">
                                {trade.riskPercentage}% Risk
                              </span>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Recently Terminated Positions Feed (Right 7 cols) */}
              <div id="recently-closed-trades-feed-card" className="lg:col-span-7 bg-[#131722] rounded-xl border border-[#2A2E39] p-4 flex flex-col space-y-3">
                <div className="flex items-center justify-between border-b border-[#2A2E39]/50 pb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-indigo-400" />
                    <h3 className="text-xs font-black uppercase text-slate-200 tracking-wider font-mono">
                      Recently Closed Trades Feed
                    </h3>
                  </div>
                  <span className="text-[10px] text-[#868F9F] font-semibold uppercase font-mono">
                    latest historical actions
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                  {trades.filter((t) => t.status === "CLOSED").length === 0 ? (
                    <div className="col-span-2 flex flex-col items-center justify-center p-6 text-center text-gray-500 h-[100px] bg-[#171B26]/30 border border-dashed border-[#2A2E39]/50 rounded-lg">
                      <span className="text-[10px] text-gray-500 font-semibold uppercase">No closed trades recorded yet</span>
                    </div>
                  ) : (
                    trades
                      .filter((t) => t.status === "CLOSED")
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 4)
                      .map((trade) => {
                        const isWin = trade.outcome === "TP" || trade.resultPercentage > 0;
                        const isLoss = trade.outcome === "SL" || trade.resultPercentage < 0;
                        const isLong = trade.direction === "LONG";
                        return (
                          <div
                            key={trade.id}
                            id={`recent-closed-${trade.id}`}
                            onClick={() => setActiveTradeDetail(trade)}
                            className="group cursor-pointer bg-[#171B26] hover:bg-[#1C2030] border border-[#2A2E39] hover:border-indigo-500/55 p-3 rounded-lg flex flex-col justify-between space-y-2 transition-all duration-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-sans">
                                <span className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                                  {trade.pair}
                                </span>
                                <span className={`text-[8px] font-black uppercase px-1 rounded ${
                                  isLong 
                                    ? "bg-[#10B981]/10 text-emerald-400 border border-emerald-500/20" 
                                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                }`}>
                                  {trade.direction}
                                </span>
                              </div>
                              <span className={`text-[11px] font-black font-mono ${
                                isWin ? "text-[#10B981]" : isLoss ? "text-rose-400" : "text-gray-300"
                              }`}>
                                {trade.resultPercentage >= 0 ? "+" : ""}{trade.resultPercentage}%
                              </span>
                            </div>

                            <div className="flex items-center justify-between border-t border-[#2A2E39]/40 pt-1.5 text-[9px]">
                              <span className="text-gray-400 font-bold">{trade.entryModel}</span>
                              <div className="flex gap-1">
                                {trade.preTradePsychology.emotionalTags?.slice(0, 1).map((tag) => (
                                  <span key={tag} className="rounded bg-indigo-500/10 text-indigo-400 px-1 py-0.1 text-[8px] font-bold font-sans">
                                    {tag}
                                  </span>
                                ))}
                                {trade.postTradeReflection?.emotionalTags?.slice(0, 1).map((tag) => (
                                  <span key={tag} className="rounded bg-[#2A2E39] text-[#A3A6AF] px-1 py-0.1 text-[8px] font-bold font-sans">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>

            {/* Tab Controls and Dynamic Description */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2A2E39]/70 pb-4">
              
              <div className="space-y-1.5 font-sans">
                <span className="block text-[9px] font-black uppercase tracking-widest text-indigo-400">
                  Current Weekly Canvas Layout
                </span>
                <div id="weekly-days-tabs" className="flex flex-wrap items-center gap-1 bg-[#141420] p-1 rounded-xl border border-[#24243A]">
                  <button
                    type="button"
                    onClick={() => setSelectedDay("All")}
                    className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                      selectedDay === "All"
                        ? "bg-indigo-600 text-white font-black shadow-md shadow-[#8457A8]/20"
                        : "text-gray-400 hover:text-white hover:bg-[#0F0F17]"
                    }`}
                  >
                    Weekly Kanban Board
                  </button>
                  
                  <div className="h-4 w-px bg-[#24243A] mx-1"></div>

                  {days.map((day) => {
                    const count = trades.filter((t) => t.dayOfWeek === day).length;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setSelectedDay(day)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
                          selectedDay === day
                            ? "bg-[#24243A] text-white border border-[#8457A8]/50"
                            : "text-gray-400 hover:text-white border border-transparent hover:bg-[#0F0F17]"
                        }`}
                      >
                        <span>{day}</span>
                        {count > 0 && (
                          <span className="rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] px-1.5 font-bold font-mono">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="text-left md:text-right">
                <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">Trading Year 2026</span>
                <span className="text-xs text-[#868F9F] font-semibold block">Active Sync: Mon June 1st - Fri June 5th</span>
              </div>
            </div>

            {/* Dynamic Journal Panel content */}
            <section id="position-gallery-cards">
          
          {selectedDay === "All" ? (
            /* --- KANBAN BOARD SYSTEM (All days tab) --- */
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {days.map((day) => {
                const dayTrades = trades.filter((t) => t.dayOfWeek === day);
                
                return (
                  <div 
                    key={day} 
                    className="flex flex-col bg-[#131722]/60 rounded-xl border border-[#2A2E39]/80 p-3 min-h-[480px] space-y-3"
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-[#2A2E39] px-1">
                      <span className="text-xs font-black uppercase text-slate-200 tracking-wider flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-indigo-500 shadow shadow-indigo-500"></span>
                        {day}
                      </span>
                      <span className="rounded-full bg-[#1C2030] text-[10px] text-[#868F9F] font-extrabold px-2 py-0.5 font-mono border border-[#2A2E39]/50">
                        {dayTrades.length}
                      </span>
                    </div>

                    {/* Column Cards Stack */}
                    <div className="flex-1 space-y-3 overflow-y-auto max-h-[80vh] style-scrollbar pr-0.5">
                      {dayTrades.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-6 text-center text-gray-500 h-[200px] border border-dashed border-[#2A2E39]/60 rounded-lg">
                          <Calendar className="h-6 w-6 text-slate-700 mb-1.5" />
                          <span className="text-[10px] font-semibold text-slate-500">No transactions log</span>
                        </div>
                      ) : (
                        dayTrades.map((trade) => {
                          const isWin = trade.status === "CLOSED" && (trade.outcome === "TP" || trade.resultPercentage > 0);
                          const isLoss = trade.status === "CLOSED" && (trade.outcome === "SL" || trade.resultPercentage < 0);
                          const isLong = trade.direction === "LONG";

                          return (
                            <div
                              key={trade.id}
                              onClick={() => setActiveTradeDetail(trade)}
                              className={`group relative cursor-pointer overflow-hidden rounded-xl border p-2.5 active:scale-[0.98] transition-all duration-300 flex flex-col gap-2 ${
                                trade.status === "OPEN"
                                  ? "border-[#8457A8] bg-[#141420] shadow-[0_0_12px_rgba(132,87,168,0.15)] hover:border-[#A57AC8]"
                                  : isWin
                                    ? "border-[#22C55E]/40 bg-[#141420] shadow-[0_0_12px_rgba(34,197,94,0.05)] hover:border-[#22C55E]"
                                    : isLoss
                                      ? "border-[#EF4444]/40 bg-[#141420] shadow-[0_0_12px_rgba(239,68,68,0.05)] hover:border-[#EF4444]"
                                      : "border-[#2A2035] bg-[#141420] hover:border-[#8457A8]"
                              }`}
                            >
                              {/* miniature chart visual generator */}
                              <div className="relative aspect-[16/7] w-full bg-[#0F0F17] rounded-lg overflow-hidden border border-[#24243A]/50">
                                <div className="absolute inset-0 opacity-80 group-hover:opacity-100 transition duration-300">
                                  <TradingChart
                                    seed={trade.charts.htfSeed}
                                    pair={trade.pair}
                                    type="thumbnail"
                                    direction={trade.direction}
                                    outcome={trade.outcome}
                                    entryPrice={trade.entry}
                                    stopLossPrice={trade.stopLoss}
                                    takeProfitPrice={trade.takeProfit}
                                  />
                                </div>

                                {/* directional sticker flag */}
                                <div className="absolute bottom-1.5 left-1.5 z-10">
                                  <span className={`inline-block text-[8px] font-black uppercase rounded px-1.5 py-0.5 bg-black/80 backdrop-blur border ${
                                    isLong 
                                      ? "text-[#22C55E] border-emerald-500/30" 
                                      : "text-[#EF4444] border-rose-500/30"
                                  }`}>
                                    {trade.direction}
                                  </span>
                                </div>
                              </div>

                              {/* Ticker and Stats row */}
                              <div className="flex items-start justify-between px-0.5">
                                <div>
                                  <h5 className={`text-xs font-black text-white transition-colors duration-200 ${
                                    trade.status === 'OPEN' ? 'group-hover:text-[#8B5CFF]' : isWin ? 'group-hover:text-[#22C55E]' : isLoss ? 'group-hover:text-[#EF4444]' : 'group-hover:text-[#B69CFF]'
                                  }`}>
                                    {trade.pair}
                                  </h5>
                                  <span className="text-[9px] text-[#B8B8C8] font-semibold bg-[#0F0F17] border border-[#24243A] px-1.5 py-0.2 rounded mt-0.5 inline-block">
                                    {trade.entryModel}
                                  </span>
                                </div>

                                {/* Outcome metrics dynamic badge */}
                                <div className="text-right">
                                  {trade.status === "OPEN" ? (
                                    <span className="text-[11px] font-bold text-amber-400 font-mono tracking-tight animate-pulse block">
                                      PENDING
                                    </span>
                                  ) : (
                                    <span className={`text-[11px] font-extrabold font-mono tracking-tight block ${
                                      isWin ? "text-[#22C55E]" : isLoss ? "text-[#EF4444]" : "text-gray-300"
                                    }`}>
                                      {trade.resultPercentage >= 0 ? "+" : ""}{trade.resultPercentage}%
                                    </span>
                                  )}

                                  {/* Small status tracker pill */}
                                  <span className={`rounded px-1 text-[8px] font-bold uppercase ${
                                    trade.status === "OPEN"
                                      ? "bg-amber-400/15 text-amber-400 border border-amber-400/20"
                                      : "bg-slate-400/10 text-slate-400"
                                  }`}>
                                    {trade.status}
                                  </span>
                                </div>
                              </div>

                              {/* Compact Cognitive tags inside Column stack */}
                              <div className="border-t border-[#24243A]/40 pt-1.5 flex flex-wrap gap-1">
                                {trade.preTradePsychology.emotionalTags?.slice(0, 2).map((t) => (
                                  <span key={t} className="rounded bg-indigo-500/10 text-indigo-400 text-[8px] font-bold px-1.5 py-0.2 tracking-normal">
                                    {t}
                                  </span>
                                ))}
                                {trade.preTradePsychology.emotionalTags && trade.preTradePsychology.emotionalTags.length > 2 && (
                                  <span className="text-[7px] text-gray-500 font-bold align-middle mt-0.5">
                                    +{trade.preTradePsychology.emotionalTags.length - 2}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* --- SINGLE DAY CARD GALLERY GRID VIEW (When specific day tab is active) --- */
            <div>
              {filteredTrades.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#2A2E39] bg-[#131722]/60 p-12 text-center max-w-lg mx-auto mt-8">
                  <Calendar className="h-10 w-10 text-gray-500 mb-3 animate-bounce" />
                  <p className="text-sm text-white font-bold mb-1">No Entries Logged for {selectedDay}</p>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6">
                    Maintain emotional and behavioral discipline by setting entry triggers and scoring confidence index on all setups.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsLogModalOpen(true)}
                    className="rounded-lg bg-indigo-600 text-xs font-black text-white hover:bg-indigo-500 px-4 py-2 uppercase tracking-wide transition shadow-lg"
                  >
                    Log {selectedDay} Setup
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredTrades.map((trade) => {
                    const isWin = trade.status === "CLOSED" && (trade.outcome === "TP" || trade.resultPercentage > 0);
                    const isLoss = trade.status === "CLOSED" && (trade.outcome === "SL" || trade.resultPercentage < 0);
                    const followedPlan = trade.preTradePsychology.followedPlan;

                    return (
                      <div
                        key={trade.id}
                        onClick={() => setActiveTradeDetail(trade)}
                        className={`group relative cursor-pointer overflow-hidden rounded-xl border shadow-xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 ${
                          trade.status === "OPEN"
                            ? "border-[#8457A8] bg-[#141420] shadow-[0_0_12px_rgba(132,87,168,0.15)] hover:border-[#A57AC8]"
                            : isWin
                              ? "border-[#22C55E]/40 bg-[#141420] shadow-[0_0_12px_rgba(34,197,94,0.05)] hover:border-[#22C55E]"
                              : isLoss
                                ? "border-[#EF4444]/40 bg-[#141420] shadow-[0_0_12px_rgba(239,68,68,0.05)] hover:border-[#EF4444]"
                                : "border-[#2A2035] bg-[#141420] hover:border-[#8457A8]"
                        }`}
                      >
                        {/* Cover thumbnail candle canvas */}
                        <div className="relative aspect-[16/7] w-full bg-[#0F0F17] border-b border-[#24243A] overflow-hidden">
                          <div className="absolute inset-0 select-none opacity-90 group-hover:opacity-100 transition duration-300">
                            <TradingChart
                              seed={trade.charts.htfSeed}
                              pair={trade.pair}
                              type="thumbnail"
                              direction={trade.direction}
                              outcome={trade.outcome}
                              entryPrice={trade.entry}
                              stopLossPrice={trade.stopLoss}
                              takeProfitPrice={trade.takeProfit}
                            />
                          </div>

                          {/* Top label overlay */}
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                            <span className="rounded bg-black/70 backdrop-blur-md border border-gray-600/20 px-2.5 py-0.5 text-[10px] font-bold text-[#D1D4DC]">
                              {trade.dayOfWeek}
                            </span>
                            
                            <span className={`rounded-md border text-[9px] font-extrabold uppercase px-1.5 py-0.5 tracking-wider backdrop-blur-md ${
                              followedPlan 
                                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" 
                                : "bg-rose-500/10 border-rose-500/40 text-rose-400"
                            }`}>
                              {followedPlan ? "COMPLIANT GUIDE" : "PLAN DEVIATION"}
                            </span>
                          </div>

                          {/* Direction sticker */}
                          <div className="absolute bottom-2.5 left-2.5 z-10">
                            <span className={`inline-flex items-center gap-1 text-[9px] font-black tracking-widest uppercase rounded px-2 py-0.5 bg-black/80 backdrop-blur ${
                              trade.direction === "LONG" ? "text-emerald-400 border border-emerald-500/50" : "text-rose-400 border border-rose-500/50"
                            }`}>
                              {trade.direction}
                            </span>
                          </div>
                        </div>

                        {/* Card metadata footer */}
                        <div className="p-4 flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className={`text-base font-black text-white transition duration-200 ${
                                trade.status === 'OPEN' ? 'group-hover:text-[#8B5CFF]' : isWin ? 'group-hover:text-[#22C55E]' : isLoss ? 'group-hover:text-[#EF4444]' : 'group-hover:text-[#B69CFF]'
                              }`}>
                                {trade.pair}
                              </h4>
                              <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                                Model: <strong className="text-indigo-300">{trade.entryModel}</strong>
                              </p>
                            </div>

                            <div className="text-right">
                              {trade.status === "OPEN" ? (
                                <span className="text-sm font-black text-amber-400 tracking-tight block animate-pulse font-mono">
                                  ACTIVE OPEN
                                </span>
                              ) : (
                                <span className={`text-base font-black font-mono tracking-tight block ${
                                  isWin ? "text-[#22C55E]" : isLoss ? "text-[#EF4444]" : "text-gray-300"
                                }`}>
                                  {trade.resultPercentage >= 0 ? "+" : ""}{trade.resultPercentage}%
                                </span>
                              )}
                              
                              <span className={`rounded px-1.5 py-0.2 text-[8px] font-black uppercase mt-1 inline-block border ${
                                trade.status === "OPEN"
                                  ? "bg-amber-400/10 border-amber-400/35 text-amber-400"
                                  : "bg-slate-400/10 border-slate-400/20 text-slate-400"
                              }`}>
                                {trade.status}
                              </span>
                            </div>
                          </div>

                          {/* Emotion metrics bottom bar */}
                          <div className="mt-3.5 pt-3 border-t border-[#2A2E39] flex items-center justify-between text-[10px] text-[#868F9F]">
                            <div className="flex flex-wrap gap-1.5 truncate max-w-[170px]">
                              {trade.preTradePsychology.emotionalTags?.map((tag) => (
                                <span key={tag} className="rounded bg-indigo-500/10 text-indigo-400 px-2 py-0.2 font-bold font-sans">
                                  {tag}
                                </span>
                              ))}
                            </div>

                            {trade.aiReview ? (
                              <span className="flex items-center gap-1 font-black text-[9px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded shrink-0">
                                <Sparkles className="h-3 w-3 text-amber-300" />
                                <span>COACH AUDITED</span>
                              </span>
                            ) : (
                              <span className="text-right text-gray-500 flex items-center gap-0.5 text-[10px] uppercase font-bold text-[#868F9F]">
                                <span>View Setup</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </section>

          </>
        )}

        {/* Informative Platform Section */}
        <section id="strategy-primer" className="bg-[#131722] rounded-xl border border-[#2A2E39] p-5">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400 shrink-0">
              <Sparkles className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Double-Stage MMS JOURNAL Compliance Framework</h4>
              <p className="text-xs text-gray-400 leading-relaxed mb-2.5">
                Modern psychology holds that professional trading resides in eliminating hindsight bias. MMS JOURNAL logs setups **before** the market executes (Pre-Trade), locking confidence index, and only allows entering results and emotional reflections (Post-Trade) once the trade has completely terminated.
              </p>
              <div className="flex flex-wrap gap-2 text-[10px] text-indigo-300 font-semibold uppercase">
                <span className="rounded bg-indigo-500/10 px-2.5 py-0.5 flex items-center gap-1">
                  <Unlock className="h-3 w-3 text-emerald-400" />
                  Stage 1: Pre-Trade Log (Open)
                </span>
                <span className="rounded bg-indigo-500/10 px-2.5 py-0.5 flex items-center gap-1">
                  <Lock className="h-3 w-3 text-[#EF4444]" />
                  Stage 2: Post-Trade Lock (Closed)
                </span>
                <span className="rounded bg-indigo-500/10 px-2.5 py-0.5 flex items-center gap-1">
                  <BrainCircuit className="h-3 w-3 text-amber-400" />
                  Flash AI coaching validation
                </span>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Log Trade Dialog Modal */}
      {isLogModalOpen && (
        <CreateTradeModal 
          onClose={() => setIsLogModalOpen(false)} 
          onSave={handleCreateTrade}
        />
      )}

      {/* Slide-out detail workspace overlay drawer */}
      {activeTradeDetail && (
        <TradeDetailPane
          trade={activeTradeDetail}
          onClose={() => setActiveTradeDetail(null)}
          onReviewInitiated={handleUpdateTrade}
          onDeleteTrade={handleDeleteTrade}
        />
      )}
      {/* Custom Auth Verification Portal */}
      {isAuthModalOpen && (
        <AuthModal 
          onClose={() => setIsAuthModalOpen(false)} 
          onSuccess={() => setIsAuthModalOpen(false)} 
        />
      )}
    </div>
  );
}
