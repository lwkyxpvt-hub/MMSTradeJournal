/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from "react";
import { type Trade, type AIReview, type TradeOutcome, type EntryModel, type StrategyConfluence, type TradeStatus } from "../types";
import TradingChart from "./TradingChart";
import { 
  X, Check, AlertTriangle, ArrowUpRight, ArrowDownRight, 
  Activity, Star, Sparkles, Plus, AlertCircle, Sparkle,
  Bookmark, ShieldAlert, AlignLeft, BarChart2, Edit3, Save, CheckSquare
} from "lucide-react";

interface TradeDetailPaneProps {
  trade: Trade;
  onClose: () => void;
  onReviewInitiated: (updatedTrade: Trade) => void;
  onDeleteTrade?: (id: string) => void;
}

const POSITIVE_EMOTIONS = ["Calm", "Patient", "Focused", "Disciplined", "Confident"];
const NEGATIVE_EMOTIONS = ["FOMO", "Revenge Trading", "Frustrated", "Hesitant", "Overconfident", "Impulsive"];

export default function TradeDetailPane({ 
  trade, 
  onClose, 
  onReviewInitiated,
  onDeleteTrade 
}: TradeDetailPaneProps) {
  const [loadingReview, setLoadingReview] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Editable setup fields for active Open Trades
  const [editPair, setEditPair] = useState(trade.pair);
  const [editEntry, setEditEntry] = useState(trade.entry);
  const [editStopLoss, setEditStopLoss] = useState(trade.stopLoss);
  const [editTakeProfit, setEditTakeProfit] = useState(trade.takeProfit);
  const [editRisk, setEditRisk] = useState(trade.riskPercentage);
  const [editEntryModel, setEditEntryModel] = useState<EntryModel>(trade.entryModel || "MMS Buy Model");
  const [editConfluence, setEditConfluence] = useState<StrategyConfluence>(trade.confluence || {
    crh: false,
    crl: false,
    pdra: false,
    ash: false,
    asl: false
  });
  const [editTimeframes, setEditTimeframes] = useState(trade.timeframesUsed || "");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Close trade form states
  const [closeOutcome, setCloseOutcome] = useState<TradeOutcome>("TP");
  const [closePnL, setClosePnL] = useState(0.0);
  const [closeRMultiple, setCloseRMultiple] = useState(0.0);
  const [closeEmotions, setCloseEmotions] = useState<string[]>([]);
  const [closeLessons, setCloseLessons] = useState("");
  const [closeWouldTakeAgain, setCloseWouldTakeAgain] = useState(true);

  // Sync edits when trading focus shifts
  useEffect(() => {
    setEditPair(trade.pair);
    setEditEntry(trade.entry);
    setEditStopLoss(trade.stopLoss);
    setEditTakeProfit(trade.takeProfit);
    setEditRisk(trade.riskPercentage);
    setEditEntryModel(trade.entryModel || "MMS Buy Model");
    setEditConfluence(trade.confluence || {
      crh: false,
      crl: false,
      pdra: false,
      ash: false,
      asl: false
    });
    setEditTimeframes(trade.timeframesUsed || "");
    setSaveMessage(null);
    setErrorMessage(null);

    // Set default close fields based on current state of trade (if already closed)
    if (trade.status === "CLOSED" && trade.postTradeReflection) {
      setCloseOutcome(trade.outcome);
      setClosePnL(trade.resultPercentage);
      setCloseRMultiple(trade.rMultiple);
      setCloseEmotions(trade.postTradeReflection.emotionalTags || []);
      setCloseLessons(trade.postTradeReflection.lessonsLearned);
      setCloseWouldTakeAgain(trade.postTradeReflection.wouldTakeAgain);
    } else {
      // Default guess calculations for easy closing
      setCloseOutcome("TP");
      const riskAmt = Math.abs(trade.entry - trade.stopLoss);
      const rewardAmt = Math.abs(trade.takeProfit - trade.entry);
      const estRatio = riskAmt > 0 ? parseFloat((rewardAmt / riskAmt).toFixed(2)) : 2.0;
      setCloseRMultiple(estRatio);
      setClosePnL(parseFloat((estRatio * trade.riskPercentage).toFixed(2)));
      setCloseEmotions(["Calm"]);
      setCloseLessons("");
      setCloseWouldTakeAgain(true);
    }
  }, [trade]);

  const formatVal = (v: number) => {
    if (v >= 1000) return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
    if (v >= 1) return v.toFixed(2);
    return v.toFixed(5);
  };

  const isLong = trade.direction === "LONG";
  const pnlIsPositive = trade.resultPercentage >= 0;

  // Let the user edit details of an OPEN trade
  const handleSaveOpenChanges = () => {
    const updatedTrade: Trade = {
      ...trade,
      pair: editPair.trim().toUpperCase() || trade.pair,
      entry: Number(editEntry),
      stopLoss: Number(editStopLoss),
      takeProfit: Number(editTakeProfit),
      riskPercentage: Number(editRisk),
      entryModel: editEntryModel,
      confluence: editConfluence,
      timeframesUsed: editTimeframes.trim() || trade.timeframesUsed,
    };
    onReviewInitiated(updatedTrade);
    setSaveMessage("Trade criteria updated successfully.");
    setTimeout(() => setSaveMessage(null), 3000);
  };

  // Switch status from OPEN to CLOSED
  const handleFinalizeCloseTrade = (e: FormEvent) => {
    e.preventDefault();
    const updatedTrade: Trade = {
      ...trade,
      status: "CLOSED",
      outcome: closeOutcome,
      resultPercentage: Number(closePnL),
      rMultiple: Number(closeRMultiple),
      postTradeReflection: {
        emotionalTags: closeEmotions.length > 0 ? closeEmotions : ["Calm"],
        lessonsLearned: closeLessons.trim(),
        wouldTakeAgain: closeWouldTakeAgain,
      },
      // Keep edited values if updated in the panel
      pair: editPair.trim().toUpperCase() || trade.pair,
      entry: Number(editEntry),
      stopLoss: Number(editStopLoss),
      takeProfit: Number(editTakeProfit),
      riskPercentage: Number(editRisk),
      entryModel: editEntryModel,
      confluence: editConfluence,
      timeframesUsed: editTimeframes || trade.timeframesUsed,
    };
    onReviewInitiated(updatedTrade);
  };

  // Auto calculate PnL and R multiple for closure based on selected outcome
  const handleAutoCloseCalculations = () => {
    const riskAmt = Math.abs(editEntry - editStopLoss);
    const rewardAmt = Math.abs(editTakeProfit - editEntry);
    if (riskAmt > 0) {
      const calculatedR = parseFloat((rewardAmt / riskAmt).toFixed(2));
      if (closeOutcome === "TP") {
        setCloseRMultiple(calculatedR);
        setClosePnL(parseFloat((calculatedR * editRisk).toFixed(2)));
      } else if (closeOutcome === "SL") {
        setCloseRMultiple(-1);
        setClosePnL(-editRisk);
      } else if (closeOutcome === "BREAKEVEN") {
        setCloseRMultiple(0);
        setClosePnL(0);
      } else {
        // Manual Close estimatives
        setCloseRMultiple(parseFloat((calculatedR * 0.5).toFixed(2)));
        setClosePnL(parseFloat((calculatedR * 0.5 * editRisk).toFixed(2)));
      }
    }
  };

  const toggleCloseEmotion = (emotion: string) => {
    if (closeEmotions.includes(emotion)) {
      setCloseEmotions(closeEmotions.filter((e) => e !== emotion));
    } else {
      setCloseEmotions([...closeEmotions, emotion]);
    }
  };

  // Gemini AI review hook
  const triggerGeminiReview = async () => {
    setLoadingReview(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/gemini/review-trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trade }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      if (data && data.result) {
        const review: AIReview = {
          status: "success",
          rating: data.result.rating,
          feedback: data.result.feedback,
          comparisonWithPlan: data.result.comparisonWithPlan,
          coachingAdvice: data.result.coachingAdvice || [],
          timestamp: new Date().toISOString(),
        };

        const updatedTrade: Trade = {
          ...trade,
          aiReview: review,
        };

        onReviewInitiated(updatedTrade);
      } else {
        throw new Error("Invalid or empty response format received from Gemini backend.");
      }
    } catch (e: any) {
      console.error("Gemini Review error:", e);
      setErrorMessage(e.message || "Failed to establish coaching channel with Gemini.");
    } finally {
      setLoadingReview(false);
    }
  };

  return (
    <div id="trade-detail-overlay" className="fixed inset-0 z-50 flex items-center justify-end bg-black/75 backdrop-blur-sm transition-all duration-300">
      <div 
        id="trade-detail-sidebar"
        className="h-full w-full max-w-4xl border-l border-[#2A2E39] bg-[#131722] text-white shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#2A2E39] bg-[#171B26] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
              isLong ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
            }`}>
              {isLong ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {trade.direction}
            </span>
            <span className="text-xl font-black text-white tracking-tight">{trade.pair}</span>
            <span className="text-xs text-gray-400 font-mono">({trade.date})</span>

            {/* Status dynamic badge */}
            <span className={`rounded-xl px-2.5 py-0.5 text-[9px] font-black uppercase font-mono border ${
              trade.status === "OPEN" 
                ? "bg-amber-400/10 border-amber-400/40 text-amber-400 animate-pulse" 
                : "bg-slate-400/10 border-slate-400/30 text-slate-400"
            }`}>
              {trade.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onDeleteTrade && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete this ${trade.pair} trade record?`)) {
                    onDeleteTrade(trade.id);
                  }
                }}
                className="mr-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400 hover:bg-red-500/20 active:scale-95 transition"
              >
                Delete Record
              </button>
            )}
            <button 
              type="button"
              onClick={onClose} 
              className="rounded-lg p-2 text-slate-400 hover:bg-[#2A2E39] hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 style-scrollbar">
          
          {/* CLOSED STATE: Financial outcome overview bento */}
          {trade.status === "CLOSED" && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="bg-[#171B26] rounded-xl border border-[#2A2E39] p-4 text-center">
                <span className="block text-[10px] uppercase font-bold text-[#868F9F] mb-1">Result PnL</span>
                <span className={`text-2xl font-black tracking-tight ${pnlIsPositive ? "text-emerald-400" : "text-rose-400"}`}>
                  {pnlIsPositive ? "+" : ""}{trade.resultPercentage}%
                </span>
              </div>

              <div className="bg-[#171B26] rounded-xl border border-[#2A2E39] p-4 text-center">
                <span className="block text-[10px] uppercase font-bold text-[#868F9F] mb-1">R-Multiple Captured</span>
                <span className={`text-2xl font-black font-mono tracking-tight ${trade.rMultiple >= 0 ? "text-indigo-400" : "text-rose-400"}`}>
                  {trade.rMultiple > 0 ? "+" : ""}{trade.rMultiple}R
                </span>
              </div>

              <div className="bg-[#171B26] rounded-xl border border-[#2A2E39] p-4 text-center">
                <span className="block text-[10px] uppercase font-bold text-[#868F9F] mb-1">Risk Capital</span>
                <span className="text-xl font-bold tracking-tight text-white font-mono">
                  {trade.riskPercentage}%
                </span>
              </div>

              <div className="bg-[#171B26] rounded-xl border border-[#2A2E39] p-4 text-center">
                <span className="block text-[10px] uppercase font-bold text-[#868F9F] mb-1">Target Outcome</span>
                <span className={`inline-block text-xs font-black tracking-widest uppercase rounded px-2.5 py-1 mt-1 ${
                  trade.outcome === "TP" 
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50" 
                    : trade.outcome === "SL" 
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/50" 
                    : "bg-gray-400/15 text-gray-400 border border-gray-400/30"
                }`}>
                  {trade.outcome === "TP" ? "🎯 TP HIT" : trade.outcome === "SL" ? "💥 SL HIT" : trade.outcome === "BREAKEVEN" ? "💵 BREAKEVEN" : "🚪 MANUAL CLOSE"}
                </span>
              </div>
            </div>
          )}

          {/* OPEN STATE: Alert Banner highlighting it is active */}
          {trade.status === "OPEN" && (
            <div className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/30 rounded-xl p-4 flex gap-3 items-start">
              <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wide">Pre-Trade Entry Log Active</h4>
                <p className="text-xs text-slate-300">
                  This transaction is in active execution. You can fine-tune the pricing levels below, or satisfy Stage 2 reflection fields below when the play finishes.
                </p>
              </div>
            </div>
          )}

          {/* EDITABLE SECTION: Position Setup and Pricing */}
          <div className="bg-[#171B26] rounded-xl border border-[#2A2E39] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-black tracking-widest text-indigo-400 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span>Stage 1: Core Setup Criteria {trade.status === "OPEN" && " (Editable)"}</span>
              </h3>
              {saveMessage && (
                <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                  {saveMessage}
                </span>
              )}
            </div>

            {trade.status === "OPEN" ? (
              /* Editable layout for OPEN trades */
              <div className="space-y-4">
                <div className="grid grid-col-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[8px] uppercase font-bold text-gray-400 mb-1">Ticker / Pair</label>
                    <input
                      type="text"
                      value={editPair}
                      onChange={(e) => setEditPair(e.target.value)}
                      className="w-full rounded border border-[#2A2E39] bg-[#131722] px-2.5 py-1.5 text-xs text-white uppercase font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] uppercase font-bold text-gray-400 mb-1">MMS Model Type</label>
                    <select
                      value={editEntryModel}
                      onChange={(e) => setEditEntryModel(e.target.value as EntryModel)}
                      className="w-full rounded border border-[#2A2E39] bg-[#131722] px-2.5 py-1.5 text-xs text-white font-semibold focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="MMS Buy Model">MMS Buy Model</option>
                      <option value="MMS Sell Model">MMS Sell Model</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[8px] uppercase font-bold text-gray-400 mb-1">Timeframes Engaged</label>
                    <input
                      type="text"
                      value={editTimeframes}
                      onChange={(e) => setEditTimeframes(e.target.value)}
                      className="w-full rounded border border-[#2A2E39] bg-[#131722] px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                  <div>
                    <label className="block text-[8px] uppercase font-bold text-slate-400 mb-1">Entry Price</label>
                    <input
                      type="number"
                      step="any"
                      value={editEntry}
                      onChange={(e) => setEditEntry(Number(e.target.value))}
                      className="w-full rounded border border-[#2A2E39] bg-[#131722] px-2.5 py-1 text-xs font-mono text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] uppercase font-bold text-slate-400 mb-1">Stop Loss Bound</label>
                    <input
                      type="number"
                      step="any"
                      value={editStopLoss}
                      onChange={(e) => setEditStopLoss(Number(e.target.value))}
                      className="w-full rounded border border-[#2A2E39] bg-[#131722] px-2.5 py-1 text-xs font-mono text-rose-300 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] uppercase font-bold text-slate-400 mb-1">Take Profit Target</label>
                    <input
                      type="number"
                      step="any"
                      value={editTakeProfit}
                      onChange={(e) => setEditTakeProfit(Number(e.target.value))}
                      className="w-full rounded border border-[#2A2E39] bg-[#131722] px-2.5 py-1 text-xs font-mono text-emerald-300 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] uppercase font-bold text-slate-400 mb-1">Risk %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editRisk}
                      onChange={(e) => setEditRisk(Number(e.target.value))}
                      className="w-full rounded border border-[#2A2E39] bg-[#131722] px-2.5 py-1 text-xs font-mono text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Strategy Confluence Checklist inside edit panel */}
                <div className="bg-[#131722] rounded-lg border border-[#2A2E39]/60 p-3.5 mt-2 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#2A2E39]/40 pb-1.5">
                    <span className="block text-[10px] uppercase font-bold text-indigo-400">Strategy Confluence Checklist</span>
                    <span className="rounded bg-indigo-500/10 text-indigo-400 text-[10px] px-2 py-0.5 font-bold font-mono">
                      {Object.values(editConfluence).filter(Boolean).length} / 5 Checked
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <span className="block text-[8px] uppercase font-bold text-[#868F9F]">HTF Candle Range</span>
                      <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
                        <input
                          type="checkbox"
                          checked={editConfluence.crh}
                          onChange={(e) => setEditConfluence(prev => ({ ...prev, crh: e.target.checked }))}
                          className="rounded border-[#2A2E39] bg-[#171B26] text-indigo-600 h-4 w-4 cursor-pointer accent-indigo-600"
                        />
                        <span className={editConfluence.crh ? "text-indigo-400 font-bold" : "text-gray-400"}>CRH swept</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
                        <input
                          type="checkbox"
                          checked={editConfluence.crl}
                          onChange={(e) => setEditConfluence(prev => ({ ...prev, crl: e.target.checked }))}
                          className="rounded border-[#2A2E39] bg-[#171B26] text-indigo-600 h-4 w-4 cursor-pointer accent-indigo-600"
                        />
                        <span className={editConfluence.crl ? "text-indigo-400 font-bold" : "text-gray-400"}>CRL swept</span>
                      </label>
                    </div>

                    <div className="space-y-1.5">
                      <span className="block text-[8px] uppercase font-bold text-[#868F9F]">HTF PDA</span>
                      <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
                        <input
                          type="checkbox"
                          checked={editConfluence.pdra}
                          onChange={(e) => setEditConfluence(prev => ({ ...prev, pdra: e.target.checked }))}
                          className="rounded border-[#2A2E39] bg-[#171B26] text-indigo-600 h-4 w-4 cursor-pointer accent-indigo-600"
                        />
                        <span className={editConfluence.pdra ? "text-indigo-400 font-bold" : "text-gray-400"}>PDRA reached</span>
                      </label>
                    </div>

                    <div className="space-y-1.5">
                      <span className="block text-[8px] uppercase font-bold text-[#868F9F]">Asia Session Liquidity</span>
                      <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
                        <input
                          type="checkbox"
                          checked={editConfluence.ash}
                          onChange={(e) => setEditConfluence(prev => ({ ...prev, ash: e.target.checked }))}
                          className="rounded border-[#2A2E39] bg-[#171B26] text-indigo-600 h-4 w-4 cursor-pointer accent-indigo-600"
                        />
                        <span className={editConfluence.ash ? "text-indigo-400 font-bold" : "text-gray-400"}>ASH swept</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
                        <input
                          type="checkbox"
                          checked={editConfluence.asl}
                          onChange={(e) => setEditConfluence(prev => ({ ...prev, asl: e.target.checked }))}
                          className="rounded border-[#2A2E39] bg-[#171B26] text-indigo-600 h-4 w-4 cursor-pointer accent-indigo-600"
                        />
                        <span className={editConfluence.asl ? "text-indigo-400 font-bold" : "text-gray-400"}>ASL swept</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleSaveOpenChanges}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-1.5 text-xs font-bold text-white transition active:scale-95"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Setup Blueprint</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Read-only layout for CLOSED trades */
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs font-mono">
                  <div className="border-r border-[#2A2E39] pr-3">
                    <span className="block text-[8px] text-[#868F9F] uppercase mb-0.5">Entry Model</span>
                    <span className="text-[#D1D4DC] font-black text-xs block mt-0.5">{trade.entryModel}</span>
                  </div>
                  <div className="border-r border-[#2A2E39] px-3">
                    <span className="block text-[8px] text-[#868F9F] uppercase mb-0.5">Entry Quote</span>
                    <span className="text-white font-bold text-sm block mt-0.5">{formatVal(trade.entry)}</span>
                  </div>
                  <div className="border-r border-[#2A2E39] px-3">
                    <span className="block text-[8px] text-[#868F9F] uppercase mb-0.5">Stop Loss Bound</span>
                    <span className="text-rose-400 font-bold text-sm block mt-0.5">{formatVal(trade.stopLoss)}</span>
                  </div>
                  <div className="pl-3">
                    <span className="block text-[8px] text-[#868F9F] uppercase mb-0.5">Take Profit quote</span>
                    <span className="text-emerald-400 font-bold text-sm block mt-0.5">{formatVal(trade.takeProfit)}</span>
                  </div>
                </div>

                {/* Read-only Strategy Confluences visual array */}
                <div className="bg-[#131722] rounded-lg border border-[#2A2E39]/40 p-3 mt-2 space-y-2">
                  <div className="flex items-center justify-between border-b border-[#2A2E39]/30 pb-1.5">
                    <span className="block text-[9px] uppercase font-black text-indigo-400">Strategy Confluence checklist</span>
                    <span className="rounded bg-indigo-500/10 text-indigo-400 text-[10px] px-2 py-0.5 font-bold font-mono">
                      {Object.values(trade.confluence || {}).filter(Boolean).length} / 5 Present
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {(Object.keys(trade.confluence || {}) as Array<keyof StrategyConfluence>).map((key) => {
                      const present = !!(trade.confluence && trade.confluence[key]);
                      const labels: Record<string, string> = {
                        crh: "CRH swept",
                        crl: "CRL swept",
                        pdra: "PDRA reached",
                        ash: "ASH swept",
                        asl: "ASL swept"
                      };
                      return (
                        <div
                          key={key}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold font-mono border ${
                            present 
                              ? "bg-indigo-500/15 border-indigo-500/45 text-indigo-400" 
                              : "bg-[#171B26] border-[#2A2E39]/60 text-slate-600 line-through"
                          }`}
                        >
                          {present ? <Check className="h-3 w-3 shrink-0" /> : <div className="h-1.5 w-1.5 rounded-full bg-slate-600 shrink-0" />}
                          <span>{labels[key] || key.toUpperCase()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ACTIVE FORM: STAGE 2 CLOSE TRADE COMPLETION PANEL (Only shown when OPEN) */}
          {trade.status === "OPEN" && (
            <div className="border border-indigo-500/30 rounded-xl bg-[#1C2030] p-6 space-y-5">
              <h3 className="text-xs uppercase font-black tracking-widest text-emerald-400 flex items-center gap-1.5 pb-2.5 border-b border-indigo-500/20">
                <CheckSquare className="h-4 w-4" />
                <span>Stage 2: Post-Trade Reflection & Close Position</span>
              </h3>

              <form onSubmit={handleFinalizeCloseTrade} className="space-y-4">
                
                {/* Outcome Button selector */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] uppercase font-bold text-gray-300">Position Outcome</label>
                  <div className="grid grid-cols-4 gap-2 bg-[#131722] p-1 rounded-lg border border-[#2A2E39]">
                    {(["TP", "SL", "BREAKEVEN", "MANUAL_CLOSE"] as TradeOutcome[]).map((oc) => (
                      <button
                        type="button"
                        key={oc}
                        onClick={() => setCloseOutcome(oc)}
                        className={`rounded py-1.5 text-[10px] font-black tracking-wide transition ${
                          closeOutcome === oc 
                            ? oc === "TP" 
                              ? "bg-emerald-500 text-white shadow"
                              : oc === "SL"
                              ? "bg-rose-500 text-white shadow"
                              : oc === "BREAKEVEN"
                              ? "bg-indigo-500 text-white shadow"
                              : "bg-slate-500 text-white shadow"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {oc === "TP" ? "🎯 TP Hit" : oc === "SL" ? "💥 SL Hit" : oc === "BREAKEVEN" ? "💵 BreakEven" : "🚪 Manual Close"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Arithmetic parameters with Auto calculate option */}
                <div className="p-3 bg-[#131722]/80 border border-[#2A2E39] rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] uppercase font-bold text-[#868F9F]">Financial Result Calculations</span>
                    <button
                      type="button"
                      onClick={handleAutoCloseCalculations}
                      className="flex items-center gap-1 text-[8px] bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-wider px-2 py-0.5 rounded transition"
                    >
                      <Sparkle className="h-3.5 w-3.5" />
                      <span>Estimate based on Pricing & SL</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[8px] uppercase font-bold text-slate-400 mb-1">Result PnL %</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={closePnL}
                        onChange={(e) => setClosePnL(Number(e.target.value))}
                        className={`w-full rounded border border-[#2A2E39] bg-[#171B26] px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-indigo-500 ${
                          closePnL >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] uppercase font-bold text-slate-400 mb-1">Final R-Multiple captured</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={closeRMultiple}
                        onChange={(e) => setCloseRMultiple(Number(e.target.value))}
                        className="w-full rounded border border-[#2A2E39] bg-[#171B26] px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Emotional Tags Selector */}
                <div className="space-y-2">
                  <label className="block text-[9px] uppercase font-bold text-gray-300">
                    Post-Trade Emotional Tags (Select All That Apply)
                  </label>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="block text-[7px] uppercase font-bold text-emerald-400 tracking-wider mb-1">Positive Reflections</span>
                      <div className="flex flex-wrap gap-1.5">
                        {POSITIVE_EMOTIONS.map((tag) => (
                          <button
                            type="button"
                            key={tag}
                            onClick={() => toggleCloseEmotion(tag)}
                            className={`rounded px-2.5 py-0.5 text-[10px] font-semibold border transition ${
                              closeEmotions.includes(tag) 
                                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold" 
                                : "bg-[#131722] border-[#2A2E39] text-gray-400 hover:text-white"
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[7px] uppercase font-bold text-rose-400 tracking-wider mb-1">Disciplinary Stresses / Pitfalls</span>
                      <div className="flex flex-wrap gap-1.5">
                        {NEGATIVE_EMOTIONS.map((tag) => (
                          <button
                            type="button"
                            key={tag}
                            onClick={() => toggleCloseEmotion(tag)}
                            className={`rounded px-2.5 py-0.5 text-[10px] font-semibold border transition ${
                              closeEmotions.includes(tag) 
                                ? "bg-rose-500/20 border-rose-500/50 text-rose-300 font-bold" 
                                : "bg-[#131722] border-[#2A2E39] text-gray-400 hover:text-white"
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lessons textarea */}
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-300 mb-1">Key Lessons Extracted</label>
                  <textarea
                    required
                    rows={2.5}
                    value={closeLessons}
                    onChange={(e) => setCloseLessons(e.target.value)}
                    className="w-full rounded-lg border border-[#2A2E39] bg-[#131722] p-3 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                    placeholder="E.g., Took profit early because of consolidation. Next time let the trade touch the target quote and verify plan adherence..."
                  />
                </div>

                {/* Would Take Again YES/NO */}
                <div className="flex items-center justify-between border-t border-indigo-500/10 pt-3">
                  <div>
                    <span className="block text-xs font-bold text-slate-200">Would Take This Trade Setup Again?</span>
                    <span className="block text-[9px] text-[#868F9F]">Based on high probability triggers index</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCloseWouldTakeAgain(true)}
                      className={`rounded px-3 py-1.5 text-xs font-bold transition ${
                        closeWouldTakeAgain 
                          ? "bg-emerald-500 text-white shadow" 
                          : "bg-[#131722] border border-[#2A2E39] text-gray-400"
                      }`}
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() => setCloseWouldTakeAgain(false)}
                      className={`rounded px-3 py-1.5 text-xs font-bold transition ${
                        !closeWouldTakeAgain 
                          ? "bg-rose-500 text-white shadow" 
                          : "bg-[#131722] border border-[#2A2E39] text-gray-400"
                      }`}
                    >
                      NO
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 py-2.5 text-xs font-black text-white tracking-wide transition shadow-lg"
                  >
                    <CheckSquare className="h-4 w-4" />
                    <span>Complete, Archive & Finalize Position</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* COGNITIVE REVIEW: Gemini Intelligent Coaching Hub (Only unlocked when CLOSED) */}
          {trade.status === "CLOSED" && (
            <div className="rounded-xl border border-indigo-500/40 bg-gradient-to-br from-[#1E1B4B]/80 to-[#111827]/90 p-6 shadow-indigo-950/20 shadow-lg">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-4 border-b border-indigo-500/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-indigo-500/20 p-2 text-indigo-400">
                    <Sparkles className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>Gemini AI Cognitive Reflection Coach</span>
                    </h4>
                    <p className="text-[10px] text-indigo-300">Psychology, stress, and behavioral pattern analysis</p>
                  </div>
                </div>

                {!trade.aiReview && (
                  <button
                    type="button"
                    disabled={loadingReview}
                    onClick={triggerGeminiReview}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 px-4 py-2 font-black text-xs text-white uppercase tracking-wider transition-all shadow-md"
                  >
                    {loadingReview ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                        <span>Analyzing Minds...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-amber-300" />
                        <span>Request Coaching Audit</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {errorMessage && (
                <div className="flex gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200 mb-4 items-start">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Coaching Connection Error</p>
                    <p className="text-red-300/80">{errorMessage}</p>
                  </div>
                </div>
              )}

              {loadingReview && (
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="relative flex items-center justify-center h-10 w-10">
                    <div className="absolute animate-ping h-8 w-8 rounded-full bg-indigo-500 opacity-20"></div>
                    <Sparkles className="h-6 w-6 text-indigo-400 animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-white font-black uppercase tracking-widest font-mono">Consulting Executive Playbook...</p>
                    <p className="text-[10px] text-indigo-200">Evaluating mental triggers vs Setup performance patterns</p>
                  </div>
                </div>
              )}

              {!loadingReview && trade.aiReview && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-indigo-500/15 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="block text-[10px] uppercase font-bold text-indigo-300 mb-0.5">Discipline Grade:</span>
                      <span className={`text-lg font-black uppercase px-3 py-1 rounded tracking-wide border ${
                        trade.aiReview.rating?.includes("Pristine") || trade.aiReview.rating === "A"
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : trade.aiReview.rating?.includes("Alert") || trade.aiReview.rating === "F" || trade.aiReview.rating === "D"
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                          : "bg-indigo-500/15 border-indigo-500/30 text-indigo-300"
                      }`}>
                        {trade.aiReview.rating}
                      </span>
                    </div>

                    <span className="text-[10px] text-indigo-300/60 font-mono">
                      Audited: {trade.aiReview.timestamp ? new Date(trade.aiReview.timestamp).toLocaleTimeString() : "Live Session"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <span className="block text-[10px] font-black tracking-widest uppercase text-indigo-300">
                        Discipline & Plan Compliance
                      </span>
                      <p className="text-xs text-gray-200 leading-relaxed bg-black/30 rounded-lg p-3 border border-indigo-500/10">
                        {trade.aiReview.comparisonWithPlan}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <span className="block text-[10px] font-black tracking-widest uppercase text-indigo-300">
                        Psychological Critique
                      </span>
                      <p className="text-xs text-gray-200 leading-relaxed bg-black/30 rounded-lg p-3 border border-indigo-500/10">
                        {trade.aiReview.feedback}
                      </p>
                    </div>
                  </div>

                  {trade.aiReview.coachingAdvice && trade.aiReview.coachingAdvice.length > 0 && (
                    <div className="pt-2">
                      <span className="block text-[10px] font-black tracking-widest uppercase text-amber-300 mb-2">
                        Coaching Action Directives:
                      </span>
                      <ul className="space-y-2 text-xs text-gray-300">
                        {trade.aiReview.coachingAdvice.map((advice, i) => (
                          <li key={i} className="flex gap-2 items-start bg-indigo-950/20 p-2.5 rounded-lg border border-indigo-500/10">
                            <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold text-indigo-300 font-mono shrink-0">
                              #{i + 1}
                            </span>
                            <span>{advice}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={triggerGeminiReview}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold underline"
                    >
                      Re-run Coaching Analysis
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PSYCHOLOGY PROFILES (Shown for closed or showing pre-state for open) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Pre-Trade Mental Profile */}
            <div className="bg-[#171B26] rounded-xl border border-[#2A2E39] p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#10B981] flex items-center justify-between">
                <span>Pre-Trade Mentality</span>
                <span className="rounded bg-emerald-500/15 text-[10px] text-emerald-400 font-bold px-2 py-0.5 uppercase tracking-normal">
                  Sweeps Zone
                </span>
              </h4>

              {/* Slider variables */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#131722] p-3 rounded-lg border border-[#2A2E39]">
                  <span className="block text-[8px] uppercase font-bold text-gray-400">Strict Plan Followed</span>
                  <span className={`text-xs font-black block mt-1 ${trade.preTradePsychology.followedPlan ? 'text-emerald-400': 'text-rose-400'}`}>
                    {trade.preTradePsychology.followedPlan ? "YES — PERFECT" : "NO — DEVIATED"}
                  </span>
                </div>
                <div className="bg-[#131722] p-3 rounded-lg border border-[#2A2E39] font-mono">
                  <span className="block text-[8px] uppercase font-bold text-[#868F9F] mb-1">Risk Budget (R%)</span>
                  <span className="text-white font-extrabold text-xs">{trade.riskPercentage}%</span>
                </div>
              </div>

              {/* Interactive Tag rendering */}
              <div>
                <span className="block text-[8px] uppercase font-bold text-[#868F9F] mb-1.5">Registered Mindstate Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {trade.preTradePsychology.emotionalTags?.map((tag) => {
                    const isPositive = POSITIVE_EMOTIONS.includes(tag);
                    return (
                      <span key={tag} className={`rounded px-2.5 py-0.5 text-[10px] font-bold border ${
                        isPositive 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                          : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                      }`}>
                        {tag}
                      </span>
                    );
                  }) || <span className="text-slate-500 text-xs">No tag registered.</span>}
                </div>
              </div>

              {/* Sliding progress metrics */}
              <div className="space-y-3 pt-1">
                <div>
                  <div className="flex justify-between text-[9px] text-[#A3A6AF] uppercase font-semibold mb-1">
                    <span>Confidence level</span>
                    <span className="text-white font-mono font-bold">{trade.preTradePsychology.confidenceLevel}/5</span>
                  </div>
                  <div className="h-1 text-full bg-[#131722] rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full" 
                      style={{ width: `${trade.preTradePsychology.confidenceLevel * 20}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[9px] text-[#A3A6AF] uppercase font-semibold mb-1">
                    <span>Laser target focus</span>
                    <span className="text-white font-mono font-bold">{trade.preTradePsychology.focusLevel}/5</span>
                  </div>
                  <div className="h-1 text-full bg-[#131722] rounded-full overflow-hidden">
                    <div 
                      className="bg-[#6366F1] h-full rounded-full" 
                      style={{ width: `${trade.preTradePsychology.focusLevel * 20}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[#131722] p-3 rounded-lg border border-[#2A2E39]/80 font-sans">
                <span className="block text-[8px] uppercase font-bold text-[#868F9F] mb-1">Pre-trade Context Narrative</span>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                  {trade.preTradePsychology.notes || "No context noted before trade."}
                </p>
              </div>
            </div>

            {/* Post-Trade Reflection Parameters */}
            <div className="bg-[#171B26] rounded-xl border border-[#2A2E39] p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#EF4444] flex items-center justify-between">
                <span>Post-Trade Reflection</span>
                <span className="rounded bg-rose-500/15 text-[10px] text-rose-400 font-bold px-2 py-0.5 uppercase tracking-normal">
                  Outcome Audit
                </span>
              </h4>

              {trade.status === "CLOSED" && trade.postTradeReflection ? (
                /* Detail views for closed trades */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#131722] p-3 rounded-lg border border-[#2A2E39]">
                      <span className="block text-[8px] uppercase font-bold text-gray-400">Position Retake Bias</span>
                      <span className={`text-[11px] font-black block mt-1 ${trade.postTradeReflection.wouldTakeAgain ? 'text-emerald-400':'text-red-400'}`}>
                        {trade.postTradeReflection.wouldTakeAgain ? "Definite Take Again" : "Avoid In Future"}
                      </span>
                    </div>

                    <div className="bg-[#131722] p-3 rounded-lg border border-[#2A2E39] font-mono">
                      <span className="block text-[8px] uppercase font-bold text-[#868F9F]">Timeframes Used</span>
                      <span className="text-indigo-300 font-black text-xs block mt-1">{trade.timeframesUsed || "N/A"}</span>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[8px] uppercase font-bold text-[#868F9F] mb-1.5">Post-Trade Emotions</span>
                    <div className="flex flex-wrap gap-1.5">
                      {trade.postTradeReflection.emotionalTags?.map((tag) => {
                        const isPositive = POSITIVE_EMOTIONS.includes(tag);
                        return (
                          <span key={tag} className={`rounded px-2.5 py-0.5 text-[10px] font-bold border ${
                            isPositive 
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                          }`}>
                            {tag}
                          </span>
                        );
                      }) || <span className="text-slate-500 text-xs">No tag registered.</span>}
                    </div>
                  </div>

                  <div className="bg-[#131722] p-3 rounded-lg border border-[#2A2E39] font-mono">
                    <span className="block text-[8px] uppercase font-bold text-[#868F9F] mb-1 font-sans">Key Lessons Learned</span>
                    <p className="text-xs text-amber-200/90 leading-relaxed font-mono whitespace-pre-wrap">
                      {trade.postTradeReflection.lessonsLearned || "No critical lessons noted."}
                    </p>
                  </div>
                </div>
              ) : (
                /* Placeholder details when trade is still active */
                <div className="flex flex-col items-center justify-center p-8 text-center text-[#868F9F] space-y-2 bg-[#131722] rounded-xl border border-dashed border-[#2A2E39] min-h-[220px]">
                  <Bookmark className="h-8 w-8 text-slate-600 animate-bounce" />
                  <p className="text-xs text-white font-bold uppercase tracking-wider">Awaiting Outcome</p>
                  <p className="text-[11px] leading-relaxed max-w-[200px]">
                    Once you hit the finalized targets, supply reflection details in the Close forms above.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* SCRIPTED REAL-PRICE SVG VISUAL CHARTS OR SCREENS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-[#D1D4DC]">
                Visual Multi-Timeframe Strategy Analysis
              </h4>
              <span className="text-[10px] text-[#868F9F]">Deterministic SVG Engine & Assets</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <span className="text-[9px] uppercase font-black text-[#868F9F]">1. Higher Timeframe Context (Macro support/demand)</span>
                {trade.charts?.screenshotHtf ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-[#2A2035] bg-black group cursor-pointer">
                    <img src={trade.charts.screenshotHtf} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-[10px] font-bold bg-[#12121A]/85 px-2.5 py-1 rounded border border-[#2A2035]">View Screen</span>
                    </div>
                  </div>
                ) : (
                  <TradingChart
                    seed={trade.charts.htfSeed}
                    pair={trade.pair}
                    type="htf"
                    direction={trade.direction}
                    outcome={trade.outcome}
                    entryPrice={trade.entry}
                    stopLossPrice={trade.stopLoss}
                    takeProfitPrice={trade.takeProfit}
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] uppercase font-black text-[#868F9F]">2. Entry Chart (Buy trigger alignment)</span>
                {trade.charts?.screenshotEntry ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-[#2A2035] bg-black group cursor-pointer">
                    <img src={trade.charts.screenshotEntry} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-[10px] font-bold bg-[#12121A]/85 px-2.5 py-1 rounded border border-[#2A2035]">View Screen</span>
                    </div>
                  </div>
                ) : (
                  <TradingChart
                    seed={trade.charts.entrySeed}
                    pair={trade.pair}
                    type="entry"
                    direction={trade.direction}
                    outcome={trade.outcome}
                    entryPrice={trade.entry}
                    stopLossPrice={trade.stopLoss}
                    takeProfitPrice={trade.takeProfit}
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] uppercase font-black text-[#868F9F]">3. Exit Chart (Position release/hit)</span>
                {trade.charts?.screenshotExit ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-[#2A2035] bg-black group cursor-pointer">
                    <img src={trade.charts.screenshotExit} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-[10px] font-bold bg-[#12121A]/85 px-2.5 py-1 rounded border border-[#2A2035]">View Screen</span>
                    </div>
                  </div>
                ) : (
                  <TradingChart
                    seed={trade.charts.exitSeed}
                    pair={trade.pair}
                    type="exit"
                    direction={trade.direction}
                    outcome={trade.outcome}
                    entryPrice={trade.entry}
                    stopLossPrice={trade.stopLoss}
                    takeProfitPrice={trade.takeProfit}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
