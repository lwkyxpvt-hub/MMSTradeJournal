/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, FormEvent } from "react";
import { type Trade, type DayOfWeek, type TradeDirection, type EntryModel, type StrategyConfluence } from "../types";
import { X, Save, Sparkles, BrainCircuit, Calendar, Compass, Layers, CheckSquare, Camera, Image as ImageIcon } from "lucide-react";

interface CreateTradeModalProps {
  onClose: () => void;
  onSave: (trade: Trade) => void;
}

const POSITIVE_EMOTIONS = ["Calm", "Patient", "Focused", "Disciplined", "Confident"];
const NEGATIVE_EMOTIONS = ["FOMO", "Revenge Trading", "Frustrated", "Hesitant", "Overconfident", "Impulsive"];

export default function CreateTradeModal({ onClose, onSave }: CreateTradeModalProps) {
  // Trade info
  const [pair, setPair] = useState("BTC/USDT");
  const [direction, setDirection] = useState<TradeDirection>("LONG");
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>("Monday");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [entry, setEntry] = useState(65000);
  const [stopLoss, setStopLoss] = useState(64000);
  const [takeProfit, setTakeProfit] = useState(67500);
  const [riskPercentage, setRiskPercentage] = useState(1.0);
  
  // Setup fields
  const [entryModel, setEntryModel] = useState<EntryModel>("MMS Buy Model");
  const [confluence, setConfluence] = useState<StrategyConfluence>({
    crh: false,
    crl: false,
    pdra: false,
    ash: false,
    asl: false
  });
  const [timeframesUsed, setTimeframesUsed] = useState("4H / 15m");

  // Pre-psychology
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>(["Calm"]);
  const [confidenceLevel, setConfidenceLevel] = useState(4);
  const [focusLevel, setFocusLevel] = useState(4);
  const [followedPlan, setFollowedPlan] = useState(true);
  const [notes, setNotes] = useState("");

  // Screenshots state
  const [screenshotHtf, setScreenshotHtf] = useState("");
  const [screenshotEntry, setScreenshotEntry] = useState("");
  const [screenshotExit, setScreenshotExit] = useState("");
  const [screenshotCover, setScreenshotCover] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image must be smaller than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          if (type === "htf") setScreenshotHtf(reader.result);
          if (type === "entry") setScreenshotEntry(reader.result);
          if (type === "exit") setScreenshotExit(reader.result);
          if (type === "cover") setScreenshotCover(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Auto-set the Day of the Week off the specified Date
  useEffect(() => {
    if (date) {
      const daysList: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      const d = new Date(date);
      const dayIndex = d.getDay(); // 0 is Sunday, 1 is Monday... 6 is Saturday
      let mappedDay: DayOfWeek = "Monday";
      if (dayIndex >= 1 && dayIndex <= 5) {
        mappedDay = daysList[dayIndex - 1];
      } else if (dayIndex === 0 || dayIndex === 6) {
        mappedDay = "Friday"; // Map weekend logging to Friday
      }
      setDayOfWeek(mappedDay);
    }
  }, [date]);

  const toggleEmotion = (emotion: string) => {
    if (selectedEmotions.includes(emotion)) {
      setSelectedEmotions(selectedEmotions.filter((e) => e !== emotion));
    } else {
      setSelectedEmotions([...selectedEmotions, emotion]);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const newTrade: Trade = {
      id: `trade-${Date.now()}`,
      status: "OPEN", // New trade is created as OPEN initially
      pair: pair.trim().toUpperCase() || "BTC/USDT",
      direction,
      dayOfWeek,
      date,
      entryModel,
      confluence,
      timeframesUsed: timeframesUsed.trim() || "Multi",
      entry: Number(entry),
      stopLoss: Number(stopLoss),
      takeProfit: Number(takeProfit),
      riskPercentage: Number(riskPercentage),
      resultPercentage: 0.0, // Open trade has 0.0 PnL initially
      outcome: "MANUAL_CLOSE", // Default placeholder
      rMultiple: 0.0, // Open trade has 0.0 R initially
      preTradePsychology: {
        emotionalTags: selectedEmotions.length > 0 ? selectedEmotions : ["Neutral"],
        confidenceLevel: Number(confidenceLevel),
        focusLevel: Number(focusLevel),
        followedPlan,
        notes: notes.trim(),
      },
      charts: {
        htfSeed: Math.floor(Math.random() * 1000) + 1,
        entrySeed: Math.floor(Math.random() * 1000) + 2,
        exitSeed: Math.floor(Math.random() * 1000) + 3,
        screenshotHtf,
        screenshotEntry,
        screenshotExit,
        screenshotCover
      },
    };
    onSave(newTrade);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div 
        id="create-trade-modal-pane"
        className="w-full max-w-2xl rounded-xl border border-[#2A2E39] bg-[#171B26] text-white shadow-2xl my-8 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2A2E39] bg-[#131722] px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-400">STAGE 1</span>
            <h2 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
              <BrainCircuit className="h-4 w-4 text-indigo-400 animate-pulse" />
              <span>Initialize Pre-Trade Journal</span>
            </h2>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="rounded-lg p-1.5 text-gray-400 hover:bg-[#2A2E39] hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sub-header instruction */}
        <div className="bg-[#1C2030] px-6 py-2.5 text-xs text-slate-300 border-b border-[#2A2E39]/50 flex items-center gap-2">
          <Compass className="h-4 w-4 text-indigo-400" />
          <span>Setup trade criteria before execution to prevent cognitive plan deviation.</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto style-scrollbar">
          
          {/* Section 1: Core Trade Logistics */}
          <div className="space-y-4">
            <h3 className="text-[11px] uppercase font-black tracking-widest text-[#868F9F] flex items-center gap-2">
              <span className="text-indigo-400">01 /</span> Core Setup Logistics
            </h3>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Pair */}
              <div>
                <label className="block text-[9px] uppercase font-extrabold text-gray-400 mb-1">Trading Pair / Ticker</label>
                <input
                  type="text"
                  required
                  value={pair}
                  onChange={(e) => setPair(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2E39] bg-[#131722] px-3.5 py-2 text-sm font-mono text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="BTC/USDT, AAPL, EUR/USD..."
                />
              </div>

              {/* Direction selector */}
              <div>
                <label className="block text-[9px] uppercase font-extrabold text-gray-400 mb-1">Position Direction</label>
                <div className="grid grid-cols-2 gap-1 bg-[#131722] p-1 rounded-lg border border-[#2A2E39]">
                  <button
                    type="button"
                    onClick={() => setDirection("LONG")}
                    className={`rounded py-1 text-xs font-black transition-all ${
                      direction === "LONG" 
                        ? "bg-emerald-500 text-white shadow" 
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    LONG
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection("SHORT")}
                    className={`rounded py-1 text-xs font-black transition-all ${
                      direction === "SHORT" 
                        ? "bg-rose-500 text-white shadow" 
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    SHORT
                  </button>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-[9px] uppercase font-extrabold text-gray-400 mb-1">Specific Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2E39] bg-[#131722] px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Entry Model Selection */}
              <div>
                <label className="block text-[9px] uppercase font-extrabold text-[#868F9F] mb-1">MMS Model Type</label>
                <div className="grid grid-cols-2 gap-1.5 bg-[#131722] p-1 rounded-lg border border-[#2A2E39]">
                  {(["MMS Buy Model", "MMS Sell Model"] as EntryModel[]).map((mode) => (
                    <button
                      type="button"
                      key={mode}
                      onClick={() => setEntryModel(mode)}
                      className={`rounded py-1.5 text-xs font-bold font-mono transition-all ${
                        entryModel === mode 
                          ? "bg-indigo-600 text-white shadow" 
                          : "text-gray-400 hover:text-white hover:bg-[#1C2030]"
                      }`}
                    >
                      {mode === "MMS Buy Model" ? "MMS Buy" : "MMS Sell"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeframes Used */}
              <div>
                <label className="block text-[9px] uppercase font-extrabold text-gray-400 mb-1">Timeframes Engaged</label>
                <input
                  type="text"
                  required
                  value={timeframesUsed}
                  onChange={(e) => setTimeframesUsed(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2E39] bg-[#131722] px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g., 4H / 1Hour / 15m"
                />
              </div>

              {/* Risk % */}
              <div>
                <label className="block text-[9px] uppercase font-extrabold text-gray-400 mb-1">Risk Budget (%)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={riskPercentage}
                  onChange={(e) => setRiskPercentage(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#2A2E39] bg-[#131722] px-3.5 py-2 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Strategy Confluence Matrix */}
            <div className="bg-[#131722] rounded-xl border border-[#2A2E39] p-4.5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-[#2A2E39]/40 pb-2">
                <div>
                  <span className="block text-[10px] uppercase font-black text-indigo-400">Strategy Confluence Checklist</span>
                  <p className="text-[10px] text-gray-400">Select structural cues present before initiating this trigger</p>
                </div>
                <span className="rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] px-2.5 py-0.5 font-black font-mono">
                  {Object.values(confluence).filter(Boolean).length} / 5 confluences
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* HTF Candle Range */}
                <div className="space-y-2.5 md:border-r md:border-[#2A2E39]/40 md:pr-3">
                  <span className="block text-[9px] font-black uppercase text-slate-300 tracking-wider">
                    HTF Candle Range
                  </span>
                  <div className="space-y-2">
                    <label className="flex items-start gap-2.5 cursor-pointer group text-xs">
                      <input
                        type="checkbox"
                        checked={confluence.crh}
                        onChange={(e) => setConfluence(prev => ({ ...prev, crh: e.target.checked }))}
                        className="rounded border-[#292D3D] bg-[#171B26] text-indigo-600 focus:ring-0 focus:ring-offset-0 h-4 w-4 mt-0.5 cursor-pointer accent-indigo-600"
                      />
                      <div className="select-none">
                        <span className="block font-black text-slate-100 group-hover:text-indigo-400 transition-colors">CRH</span>
                        <span className="block text-[8px] text-[#868F9F]">Candle Range High swept</span>
                      </div>
                    </label>
                    <label className="flex items-start gap-2.5 cursor-pointer group text-xs">
                      <input
                        type="checkbox"
                        checked={confluence.crl}
                        onChange={(e) => setConfluence(prev => ({ ...prev, crl: e.target.checked }))}
                        className="rounded border-[#292D3D] bg-[#171B26] text-indigo-600 focus:ring-0 focus:ring-offset-0 h-4 w-4 mt-0.5 cursor-pointer accent-indigo-600"
                      />
                      <div className="select-none">
                        <span className="block font-black text-slate-100 group-hover:text-indigo-400 transition-colors">CRL</span>
                        <span className="block text-[8px] text-[#868F9F]">Candle Range Low swept</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* HTF PDA */}
                <div className="space-y-2.5 md:border-r md:border-[#2A2E39]/40 md:pr-3">
                  <span className="block text-[9px] font-black uppercase text-slate-300 tracking-wider">
                    HTF PDA
                  </span>
                  <div className="space-y-2">
                    <label className="flex items-start gap-2.5 cursor-pointer group text-xs">
                      <input
                        type="checkbox"
                        checked={confluence.pdra}
                        onChange={(e) => setConfluence(prev => ({ ...prev, pdra: e.target.checked }))}
                        className="rounded border-[#292D3D] bg-[#171B26] text-indigo-600 focus:ring-0 focus:ring-offset-0 h-4 w-4 mt-0.5 cursor-pointer accent-indigo-600"
                      />
                      <div className="select-none">
                        <span className="block font-black text-slate-100 group-hover:text-indigo-400 transition-colors">PDRA Reached</span>
                        <span className="block text-[8px] text-[#868F9F]">Premium/Discount matrix metric attained</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Asia Session Liquidity */}
                <div className="space-y-2.5">
                  <span className="block text-[9px] font-black uppercase text-slate-300 tracking-wider">
                    Asia Session Liquidity
                  </span>
                  <div className="space-y-2">
                    <label className="flex items-start gap-2.5 cursor-pointer group text-xs">
                      <input
                        type="checkbox"
                        checked={confluence.ash}
                        onChange={(e) => setConfluence(prev => ({ ...prev, ash: e.target.checked }))}
                        className="rounded border-[#292D3D] bg-[#171B26] text-indigo-600 focus:ring-0 focus:ring-offset-0 h-4 w-4 mt-0.5 cursor-pointer accent-indigo-600"
                      />
                      <div className="select-none">
                        <span className="block font-black text-slate-100 group-hover:text-indigo-400 transition-colors">ASH</span>
                        <span className="block text-[8px] text-[#868F9F]">Asia Session High swept</span>
                      </div>
                    </label>
                    <label className="flex items-start gap-2.5 cursor-pointer group text-xs">
                      <input
                        type="checkbox"
                        checked={confluence.asl}
                        onChange={(e) => setConfluence(prev => ({ ...prev, asl: e.target.checked }))}
                        className="rounded border-[#292D3D] bg-[#171B26] text-indigo-600 focus:ring-0 focus:ring-offset-0 h-4 w-4 mt-0.5 cursor-pointer accent-indigo-600"
                      />
                      <div className="select-none">
                        <span className="block font-black text-slate-100 group-hover:text-indigo-400 transition-colors">ASL</span>
                        <span className="block text-[8px] text-[#868F9F]">Asia Session Low swept</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Numerical Entry Plan Bounds */}
            <div className="bg-[#131722] rounded-xl border border-[#2A2E39] p-4 mt-2">
              <span className="block text-[9px] uppercase font-bold text-indigo-400 mb-3">Planned Numerical Blueprint</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Entry Quote</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={entry}
                    onChange={(e) => setEntry(Number(e.target.value))}
                    className="w-full rounded border border-[#2A2E39] bg-[#171B26] px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Stop Loss Bound</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={stopLoss}
                    onChange={(e) => setStopLoss(Number(e.target.value))}
                    className="w-full rounded border border-[#2A2E39] bg-[#171B26] px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 text-rose-300"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Take Profit Target</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(Number(e.target.value))}
                    className="w-full rounded border border-[#2A2E39] bg-[#171B26] px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 text-emerald-300"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-[#2A2E39]" />

          {/* Section 2: Cognitive Metrics and Emotional State Picker */}
          <div className="space-y-4">
            <h3 className="text-[11px] uppercase font-black tracking-widest text-[#868F9F] flex items-center gap-2">
              <span className="text-emerald-400">02 /</span> Pre-Trade Mindstate Profiling
            </h3>

            {/* Slider metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="flex justify-between text-[9px] uppercase font-bold text-slate-400 mb-1">
                  <span>Confidence Level</span>
                  <span className="text-indigo-400 font-bold font-mono">{confidenceLevel}/5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={confidenceLevel}
                  onChange={(e) => setConfidenceLevel(Number(e.target.value))}
                  className="w-full accent-indigo-500 bg-[#131722] h-2 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-[9px] uppercase font-bold text-slate-400 mb-1">
                  <span>Focus Score</span>
                  <span className="text-indigo-400 font-bold font-mono">{focusLevel}/5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={focusLevel}
                  onChange={(e) => setFocusLevel(Number(e.target.value))}
                  className="w-full accent-indigo-500 bg-[#131722] h-2 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Selectable Emotional State Tags (Multiple Selections) */}
            <div className="space-y-2">
              <label className="block text-[9px] uppercase font-black text-gray-400">
                Emotional State Indicators (Select All That Apply)
              </label>
              
              <div className="space-y-3">
                {/* Positive Row */}
                <div>
                  <span className="block text-[8px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Positive States</span>
                  <div className="flex flex-wrap gap-2">
                    {POSITIVE_EMOTIONS.map((tag) => {
                      const isSelected = selectedEmotions.includes(tag);
                      return (
                        <button
                          type="button"
                          key={tag}
                          onClick={() => toggleEmotion(tag)}
                          className={`rounded px-2.5 py-1 text-xs font-semibold border transition ${
                            isSelected 
                              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold shadow-sm" 
                              : "bg-[#131722] border-[#2A2E39] text-gray-400 hover:text-white"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Negative Row */}
                <div>
                  <span className="block text-[8px] font-bold text-rose-400 uppercase tracking-widest mb-1">Negative States / Red Flags</span>
                  <div className="flex flex-wrap gap-2">
                    {NEGATIVE_EMOTIONS.map((tag) => {
                      const isSelected = selectedEmotions.includes(tag);
                      return (
                        <button
                          type="button"
                          key={tag}
                          onClick={() => toggleEmotion(tag)}
                          className={`rounded px-2.5 py-1 text-xs font-semibold border transition ${
                            isSelected 
                              ? "bg-rose-500/20 border-rose-500/50 text-rose-300 font-bold shadow-sm" 
                              : "bg-[#131722] border-[#2A2E39] text-gray-400 hover:text-white"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Plan Compliance */}
            <div className="bg-[#131722] border border-[#2A2E39] p-3 rounded-xl flex items-center justify-between">
              <div>
                <span className="block text-xs font-semibold text-slate-200">Adhering to Your Rulebook Plan?</span>
                <span className="block text-[9px] text-[#868F9F]">Strict compliance is essential for psychological trading logs</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFollowedPlan(true)}
                  className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                    followedPlan 
                      ? "bg-emerald-500 text-white shadow-md font-black" 
                      : "bg-[#171B26] border border-[#2A2E39] text-[#868F9F] hover:text-white"
                  }`}
                >
                  YES
                </button>
                <button
                  type="button"
                  onClick={() => setFollowedPlan(false)}
                  className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                    !followedPlan 
                      ? "bg-rose-500 text-white shadow-md font-black" 
                      : "bg-[#171B26] border border-[#2A2E39] text-[#868F9F] hover:text-white"
                  }`}
                >
                  NO
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Pre-Trade Contextual Commentary</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[#2A2E39] bg-[#131722] p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                placeholder="Detail key structural triggers, upcoming news, or personal psychological context..."
              />
            </div>

            {/* Screenshots / Chart Upload Grid */}
            <div className="space-y-3">
              <h3 className="text-[11px] uppercase font-black tracking-widest text-[#868F9F] flex items-center gap-2">
                <span className="text-indigo-400">03 /</span> Screenshot Portfolio Assets
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                {/* HTF Image */}
                <div className="bg-[#131722] border border-[#2A2E39] p-3.5 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="block text-[9px] uppercase font-bold text-indigo-400">HTF Screenshot</span>
                    {screenshotHtf && (
                      <button 
                        type="button" 
                        onClick={() => setScreenshotHtf("")} 
                        className="text-[9px] font-black text-rose-400 hover:underline uppercase"
                      >
                        remove
                      </button>
                    )}
                  </div>
                  {screenshotHtf ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-[#2A2035] bg-black">
                      <img src={screenshotHtf} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed border-[#2A2E39] hover:border-indigo-500 bg-[#0B0B10]/50 hover:bg-[#12121A] transition cursor-pointer text-center p-2">
                      <Camera className="h-5 w-5 text-gray-500 mb-1" />
                      <span className="block text-[10px] font-extrabold text-white">Higher Timeframe</span>
                      <span className="block text-[8px] text-gray-500 uppercase">Max size 2MB</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleFileChange(e, "htf")} 
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>

                {/* Entry Image */}
                <div className="bg-[#131722] border border-[#2A2E39] p-3.5 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="block text-[9px] uppercase font-bold text-indigo-400">Entry Execution</span>
                    {screenshotEntry && (
                      <button 
                        type="button" 
                        onClick={() => setScreenshotEntry("")} 
                        className="text-[9px] font-black text-rose-400 hover:underline uppercase"
                      >
                        remove
                      </button>
                    )}
                  </div>
                  {screenshotEntry ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-[#2A2035] bg-black">
                      <img src={screenshotEntry} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed border-[#2A2E39] hover:border-indigo-500 bg-[#0B0B10]/50 hover:bg-[#12121A] transition cursor-pointer text-center p-2">
                      <ImageIcon className="h-5 w-5 text-gray-500 mb-1" />
                      <span className="block text-[10px] font-extrabold text-white">Entry execution</span>
                      <span className="block text-[8px] text-gray-500 uppercase">Max size 2MB</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleFileChange(e, "entry")} 
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>

                {/* Exit Image */}
                <div className="bg-[#131722] border border-[#2A2E39] p-3.5 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="block text-[9px] uppercase font-bold text-indigo-400">Exit Execution</span>
                    {screenshotExit && (
                      <button 
                        type="button" 
                        onClick={() => setScreenshotExit("")} 
                        className="text-[9px] font-black text-rose-400 hover:underline uppercase"
                      >
                        remove
                      </button>
                    )}
                  </div>
                  {screenshotExit ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-[#2A2035] bg-black">
                      <img src={screenshotExit} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed border-[#2A2E39] hover:border-indigo-500 bg-[#0B0B10]/50 hover:bg-[#12121A] transition cursor-pointer text-center p-2">
                      <Camera className="h-5 w-5 text-gray-500 mb-1" />
                      <span className="block text-[10px] font-extrabold text-white">Exit execution</span>
                      <span className="block text-[8px] text-gray-500 uppercase">Max size 2MB</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleFileChange(e, "exit")} 
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>

                {/* Cover Image */}
                <div className="bg-[#131722] border border-[#2A2E39] p-3.5 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="block text-[9px] uppercase font-bold text-indigo-400">Main Cover</span>
                    {screenshotCover && (
                      <button 
                        type="button" 
                        onClick={() => setScreenshotCover("")} 
                        className="text-[9px] font-black text-rose-400 hover:underline uppercase"
                      >
                        remove
                      </button>
                    )}
                  </div>
                  {screenshotCover ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-[#2A2035] bg-black">
                      <img src={screenshotCover} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed border-[#2A2E39] hover:border-indigo-500 bg-[#0B0B10]/50 hover:bg-[#12121A] transition cursor-pointer text-center p-2">
                      <ImageIcon className="h-5 w-5 text-gray-500 mb-1" />
                      <span className="block text-[10px] font-extrabold text-white">Cover thumbnail</span>
                      <span className="block text-[8px] text-gray-500 uppercase">Max size 2MB</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleFileChange(e, "cover")} 
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2A2E39]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#2A2E39] px-4 py-2 text-sm font-semibold hover:bg-[#131722] text-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-bold text-white hover:bg-indigo-500 active:scale-95 transition shadow-lg shadow-indigo-950/20"
            >
              <Save className="h-4 w-4" />
              <span>Initialize Open Position</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
