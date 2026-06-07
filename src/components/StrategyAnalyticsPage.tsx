/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { type Trade, type StrategyConfluence } from "../types";
import { Sparkles, Layers, Percent, TrendingUp, BarChart3, ChevronRight, HelpCircle } from "lucide-react";

interface StrategyAnalyticsPageProps {
  trades: Trade[];
}

export default function StrategyAnalyticsPage({ trades }: StrategyAnalyticsPageProps) {
  // Only closed trades count for statistical accuracy analysis
  const closedTrades = trades.filter((t) => t.status === "CLOSED");

  // Helper to compute stats for a subset of trades
  const calculateSubsetStats = (subset: Trade[]) => {
    const sampleSize = subset.length;
    if (sampleSize === 0) {
      return { winRate: 0, avgR: 0, sampleSize: 0, wins: 0 };
    }
    const wins = subset.filter((t) => t.outcome === "TP" || t.resultPercentage > 0).length;
    const winRate = Math.round((wins / sampleSize) * 100);
    const totalR = subset.reduce((sum, t) => sum + t.rMultiple, 0);
    const avgR = parseFloat((totalR / sampleSize).toFixed(2));
    return { winRate, avgR, sampleSize, wins };
  };

  // Specific Single Confluent Metrics
  const crhStats = calculateSubsetStats(closedTrades.filter((t) => !!t.confluence?.crh));
  const crlStats = calculateSubsetStats(closedTrades.filter((t) => !!t.confluence?.crl));
  const pdraStats = calculateSubsetStats(closedTrades.filter((t) => !!t.confluence?.pdra));
  const ashStats = calculateSubsetStats(closedTrades.filter((t) => !!t.confluence?.ash));
  const aslStats = calculateSubsetStats(closedTrades.filter((t) => !!t.confluence?.asl));

  // Entry Model Metrics
  const mmsBuyStats = calculateSubsetStats(closedTrades.filter((t) => t.entryModel === "MMS Buy Model"));
  const mmsSellStats = calculateSubsetStats(closedTrades.filter((t) => t.entryModel === "MMS Sell Model"));

  // Combination Confluences Analysis
  // Formulate unique recorded combinations of active variables
  const getCombinationAnalytics = () => {
    const combos: Record<string, Trade[]> = {};
    
    // Explicit combinations we want to ensure we analyze even if count is 0
    const combosToEnsure = [
      "CRL + PDRA + ASL",
      "CRH + PDRA + ASH",
      "CRL + PDRA",
      "CRH only"
    ];

    closedTrades.forEach((t) => {
      const keys: string[] = [];
      if (t.confluence?.crh) keys.push("CRH");
      if (t.confluence?.crl) keys.push("CRL");
      if (t.confluence?.pdra) keys.push("PDRA");
      if (t.confluence?.ash) keys.push("ASH");
      if (t.confluence?.asl) keys.push("ASL");

      let comboName = "None";
      if (keys.length === 1) {
        comboName = `${keys[0]} only`;
      } else if (keys.length > 1) {
        comboName = keys.join(" + ");
      }

      if (!combos[comboName]) {
        combos[comboName] = [];
      }
      combos[comboName].push(t);
    });

    // Make sure we include standard combos if they aren't generated yet (to display zeroes)
    combosToEnsure.forEach((k) => {
      if (!combos[k]) {
        // Find if any trades match this scenario specifically
        const matches = closedTrades.filter((t) => {
          const isCrh = !!t.confluence?.crh;
          const isCrl = !!t.confluence?.crl;
          const isPdra = !!t.confluence?.pdra;
          const isAsh = !!t.confluence?.ash;
          const isAsl = !!t.confluence?.asl;

          if (k === "CRL + PDRA + ASL") return isCrl && isPdra && isAsl && !isCrh && !isAsh;
          if (k === "CRH + PDRA + ASH") return isCrh && isPdra && isAsh && !isCrl && !isAsl;
          if (k === "CRL + PDRA") return isCrl && isPdra && !isCrh && !isAsh && !isAsl;
          if (k === "CRH only") return isCrh && !isCrl && !isPdra && !isAsh && !isAsl;
          return false;
        });
        combos[k] = matches;
      }
    });

    return Object.entries(combos).map(([name, list]) => {
      const stats = calculateSubsetStats(list);
      // Expected expectancy metric (WinRate as decimal * AvgR)
      const expectancy = parseFloat(((stats.winRate / 100) * stats.avgR).toFixed(2));
      return {
        name,
        ...stats,
        expectancy
      };
    }).sort((a, b) => b.sampleSize - a.sampleSize);
  };

  const comboAnalysisList = getCombinationAnalytics();

  // Helper rendering wrapper for progress tint
  const getWinRateColor = (wr: number, sampleSize: number) => {
    if (sampleSize === 0) return "text-gray-500";
    if (wr >= 60) return "text-emerald-400";
    if (wr >= 45) return "text-indigo-400";
    return "text-rose-400";
  };

  const getWinRateBg = (wr: number, sampleSize: number) => {
    if (sampleSize === 0) return "bg-[#2A2E39]";
    if (wr >= 60) return "bg-emerald-500";
    if (wr >= 45) return "bg-indigo-500";
    return "bg-rose-500";
  };

  return (
    <div id="analytics-research-pane" className="space-y-6">
      
      {/* Page Hero Header */}
      <div className="bg-[#131722] rounded-xl border border-[#2A2E39] p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-indigo-500/10 text-indigo-400 text-[10px] px-2.5 py-0.5 uppercase tracking-wider font-extrabold font-mono border border-indigo-500/20">
              Strategy Research Desk
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1.5 flex items-center gap-1.5">
            <Layers className="h-5 w-5 text-indigo-400" />
            <span>Confluence Matrices & Entry Model Research</span>
          </h2>
          <p className="text-xs text-[#868F9F] mt-0.5 max-w-2xl">
            This module decomposes historical trading execution to identify positive expectancy cues. Review single confluence performance, trigger mechanisms and composite confluence groupings.
          </p>
        </div>
        <div className="bg-[#171B26] px-4 py-3 rounded-lg border border-[#2A2E39] text-center shrink-0 min-w-[150px]">
          <span className="block text-[8px] uppercase font-bold text-[#868F9F]">Analytics Sample Base</span>
          <span className="text-2xl font-black text-white font-mono">{closedTrades.length}</span>
          <span className="block text-[9px] text-[#A3A6AF] mt-0.5">archived positions</span>
        </div>
      </div>

      {/* Grid: 5 Confluences Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
          <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider font-mono">
            Confluence Criteria Win Rates
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* CRH swept card */}
          <div className="bg-[#131722] rounded-xl border border-[#2A2E39]/80 p-4 space-y-3">
            <div>
              <span className="text-[10px] font-black font-mono text-indigo-400">CRH Present</span>
              <p className="text-[8px] text-gray-500 uppercase font-bold">Candle Range High Swept</p>
            </div>
            
            <div className="space-y-1">
              <span className={`text-2xl font-black font-mono block ${getWinRateColor(crhStats.winRate, crhStats.sampleSize)}`}>
                {crhStats.sampleSize > 0 ? `${crhStats.winRate}%` : "0.0%"}
              </span>
              <div className="h-1 bg-[#1A1F2C] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${getWinRateBg(crhStats.winRate, crhStats.sampleSize)}`} 
                  style={{ width: `${crhStats.sampleSize > 0 ? crhStats.winRate : 0}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between text-[10px] text-gray-400 font-mono pt-1.5 border-t border-[#2A2E39]/45">
              <div>
                <span className="block text-[8px] text-slate-500 font-bold uppercase">Avg R Payoff</span>
                <strong className="text-[#D1D4DC]">{crhStats.sampleSize > 0 ? `${crhStats.avgR > 0 ? "+" : ""}${crhStats.avgR}R` : "0.00R"}</strong>
              </div>
              <div className="text-right">
                <span className="block text-[8px] text-slate-500 font-bold uppercase">Sample Size</span>
                <strong className="text-white">{crhStats.sampleSize} positions</strong>
              </div>
            </div>
          </div>

          {/* CRL swept card */}
          <div className="bg-[#131722] rounded-xl border border-[#2A2E39]/80 p-4 space-y-3">
            <div>
              <span className="text-[10px] font-black font-mono text-indigo-400">CRL Present</span>
              <p className="text-[8px] text-gray-500 uppercase font-bold">Candle Range Low Swept</p>
            </div>
            
            <div className="space-y-1">
              <span className={`text-2xl font-black font-mono block ${getWinRateColor(crlStats.winRate, crlStats.sampleSize)}`}>
                {crlStats.sampleSize > 0 ? `${crlStats.winRate}%` : "0.0%"}
              </span>
              <div className="h-1 bg-[#1A1F2C] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${getWinRateBg(crlStats.winRate, crlStats.sampleSize)}`} 
                  style={{ width: `${crlStats.sampleSize > 0 ? crlStats.winRate : 0}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between text-[10px] text-gray-400 font-mono pt-1.5 border-t border-[#2A2E39]/45">
              <div>
                <span className="block text-[8px] text-slate-500 font-bold uppercase">Avg R Payoff</span>
                <strong className="text-[#D1D4DC]">{crlStats.sampleSize > 0 ? `${crlStats.avgR > 0 ? "+" : ""}${crlStats.avgR}R` : "0.00R"}</strong>
              </div>
              <div className="text-right">
                <span className="block text-[8px] text-slate-500 font-bold uppercase">Sample Size</span>
                <strong className="text-white">{crlStats.sampleSize} positions</strong>
              </div>
            </div>
          </div>

          {/* PDRA present card */}
          <div className="bg-[#131722] rounded-xl border border-[#2A2E39]/80 p-4 space-y-3">
            <div>
              <span className="text-[10px] font-black font-mono text-indigo-400">PDRA Present</span>
              <p className="text-[8px] text-gray-500 uppercase font-bold">HTF PDA Metric Attained</p>
            </div>
            
            <div className="space-y-1">
              <span className={`text-2xl font-black font-mono block ${getWinRateColor(pdraStats.winRate, pdraStats.sampleSize)}`}>
                {pdraStats.sampleSize > 0 ? `${pdraStats.winRate}%` : "0.0%"}
              </span>
              <div className="h-1 bg-[#1A1F2C] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${getWinRateBg(pdraStats.winRate, pdraStats.sampleSize)}`} 
                  style={{ width: `${pdraStats.sampleSize > 0 ? pdraStats.winRate : 0}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between text-[10px] text-gray-400 font-mono pt-1.5 border-t border-[#2A2E39]/45">
              <div>
                <span className="block text-[8px] text-slate-500 font-bold uppercase">Avg R Payoff</span>
                <strong className="text-[#D1D4DC]">{pdraStats.sampleSize > 0 ? `${pdraStats.avgR > 0 ? "+" : ""}${pdraStats.avgR}R` : "0.00R"}</strong>
              </div>
              <div className="text-right">
                <span className="block text-[8px] text-slate-500 font-bold uppercase">Sample Size</span>
                <strong className="text-white">{pdraStats.sampleSize} positions</strong>
              </div>
            </div>
          </div>

          {/* ASH swept card */}
          <div className="bg-[#131722] rounded-xl border border-[#2A2E39]/80 p-4 space-y-3">
            <div>
              <span className="text-[10px] font-black font-mono text-indigo-400">ASH Present</span>
              <p className="text-[8px] text-gray-500 uppercase font-bold">Asia Session High Swept</p>
            </div>
            
            <div className="space-y-1">
              <span className={`text-2xl font-black font-mono block ${getWinRateColor(ashStats.winRate, ashStats.sampleSize)}`}>
                {ashStats.sampleSize > 0 ? `${ashStats.winRate}%` : "0.0%"}
              </span>
              <div className="h-1 bg-[#1A1F2C] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${getWinRateBg(ashStats.winRate, ashStats.sampleSize)}`} 
                  style={{ width: `${ashStats.sampleSize > 0 ? ashStats.winRate : 0}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between text-[10px] text-gray-400 font-mono pt-1.5 border-t border-[#2A2E39]/45">
              <div>
                <span className="block text-[8px] text-slate-500 font-bold uppercase">Avg R Payoff</span>
                <strong className="text-[#D1D4DC]">{ashStats.sampleSize > 0 ? `${ashStats.avgR > 0 ? "+" : ""}${ashStats.avgR}R` : "0.00R"}</strong>
              </div>
              <div className="text-right">
                <span className="block text-[8px] text-slate-500 font-bold uppercase">Sample Size</span>
                <strong className="text-white">{ashStats.sampleSize} positions</strong>
              </div>
            </div>
          </div>

          {/* ASL swept card */}
          <div className="bg-[#131722] rounded-xl border border-[#2A2E39]/80 p-4 space-y-3">
            <div>
              <span className="text-[10px] font-black font-mono text-indigo-400">ASL Present</span>
              <p className="text-[8px] text-gray-500 uppercase font-bold">Asia Session Low Swept</p>
            </div>
            
            <div className="space-y-1">
              <span className={`text-2xl font-black font-mono block ${getWinRateColor(aslStats.winRate, aslStats.sampleSize)}`}>
                {aslStats.sampleSize > 0 ? `${aslStats.winRate}%` : "0.0%"}
              </span>
              <div className="h-1 bg-[#1A1F2C] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${getWinRateBg(aslStats.winRate, aslStats.sampleSize)}`} 
                  style={{ width: `${aslStats.sampleSize > 0 ? aslStats.winRate : 0}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between text-[10px] text-gray-400 font-mono pt-1.5 border-t border-[#2A2E39]/45">
              <div>
                <span className="block text-[8px] text-slate-500 font-bold uppercase">Avg R Payoff</span>
                <strong className="text-[#D1D4DC]">{aslStats.sampleSize > 0 ? `${aslStats.avgR > 0 ? "+" : ""}${aslStats.avgR}R` : "0.00R"}</strong>
              </div>
              <div className="text-right">
                <span className="block text-[8px] text-slate-500 font-bold uppercase">Sample Size</span>
                <strong className="text-white">{aslStats.sampleSize} positions</strong>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Comparative Section: Entry Models */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* MMS Buy Model details card */}
        <div className="bg-[#131722] rounded-xl border border-[#2A2E39] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#2A2E39]/50 pb-3">
            <div className="space-y-0.5">
              <span className="rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] px-2 py-0.5 uppercase tracking-wide font-black font-mono">
                MMS Phase A
              </span>
              <h4 className="text-sm font-bold text-white uppercase">MMS Buy Model (MMBM)</h4>
            </div>
            <span className="text-xs text-[#868F9F] font-mono">
              Sample size: <strong>{mmsBuyStats.sampleSize}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-[#171B26] rounded-lg p-3.5 border border-[#2A2E39]/70">
              <span className="block text-[9px] text-[#868F9F] font-bold uppercase mb-1">Buy Model Win Rate</span>
              <span className={`text-xl font-mono font-black ${getWinRateColor(mmsBuyStats.winRate, mmsBuyStats.sampleSize)}`}>
                {mmsBuyStats.sampleSize > 0 ? `${mmsBuyStats.winRate}%` : "0%"}
              </span>
            </div>
            <div className="bg-[#171B26] rounded-lg p-3.5 border border-[#2A2E39]/70">
              <span className="block text-[9px] text-[#868F9F] font-bold uppercase mb-1">Buy Model Average R</span>
              <span className="text-xl font-mono font-black text-[#D1D4DC]">
                {mmsBuyStats.sampleSize > 0 ? `${mmsBuyStats.avgR > 0 ? "+" : ""}${mmsBuyStats.avgR}R` : "0.00R"}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-[#A3A6AF] bg-[#171B26]/40 p-2.5 rounded border border-[#2A2E39]/40 leading-relaxed font-sans">
            <strong>Execution Bias Note:</strong> The Market Maker Buy Model profiles consolidation, original high-timeframe sweeps, and the smart money reversal curve phase.
          </div>
        </div>

        {/* MMS Sell Model details card */}
        <div className="bg-[#131722] rounded-xl border border-[#2A2E39] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#2A2E39]/50 pb-3">
            <div className="space-y-0.5">
              <span className="rounded bg-[#2A2E39] text-[#A3A6AF] border border-[#2A2E39]/50 text-[9px] px-2 py-0.5 uppercase tracking-wide font-black font-mono">
                MMS Phase B
              </span>
              <h4 className="text-sm font-bold text-white uppercase">MMS Sell Model (MMSM)</h4>
            </div>
            <span className="text-xs text-[#868F9F] font-mono">
              Sample size: <strong>{mmsSellStats.sampleSize}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-[#171B26] rounded-lg p-3.5 border border-[#2A2E39]/70">
              <span className="block text-[9px] text-[#868F9F] font-bold uppercase mb-1">Sell Model Win Rate</span>
              <span className={`text-xl font-mono font-black ${getWinRateColor(mmsSellStats.winRate, mmsSellStats.sampleSize)}`}>
                {mmsSellStats.sampleSize > 0 ? `${mmsSellStats.winRate}%` : "0%"}
              </span>
            </div>
            <div className="bg-[#171B26] rounded-lg p-3.5 border border-[#2A2E39]/70">
              <span className="block text-[9px] text-[#868F9F] font-bold uppercase mb-1">Sell Model Average R</span>
              <span className="text-xl font-mono font-black text-[#D1D4DC]">
                {mmsSellStats.sampleSize > 0 ? `${mmsSellStats.avgR > 0 ? "+" : ""}${mmsSellStats.avgR}R` : "0.00R"}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-[#A3A6AF] bg-[#171B26]/40 p-2.5 rounded border border-[#2A2E39]/40 leading-relaxed font-sans">
            <strong>Execution Bias Note:</strong> The Market Maker Sell Model captures premium-level distribution, stop raids, and the high-timeframe curve reversal phase.
          </div>
        </div>

      </div>

      {/* Advanced Combination Matrix Analysis */}
      <div className="bg-[#131722] rounded-xl border border-[#2A2E39] p-5 space-y-4">
        <div>
          <h4 className="text-sm font-bold text-white uppercase flex items-center gap-1.5">
            <HelpCircle className="h-4 w-4 text-indigo-400" />
            <span>Composite Strategy Confluence Matrix (Expectancy Benchmarks)</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            This module combines individual structural variables into complex setups to calculate comparative edge potency.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#2A2E39]/60">
          <table className="w-full text-xs font-mono select-none text-left border-collapse">
            <thead>
              <tr className="bg-[#171B26] text-gray-400 uppercase text-[9px] border-b border-[#2A2E39]">
                <th className="py-3 px-4 font-black">Confluence Cluster Pattern</th>
                <th className="py-3 px-4 font-black text-center">Sample size</th>
                <th className="py-3 px-4 font-black text-center">Wins / Losses</th>
                <th className="py-3 px-4 font-black text-center">Win rate</th>
                <th className="py-3 px-4 font-black text-center">Avg R captured</th>
                <th className="py-3 px-4 font-black text-right">Cluster Expectancy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2E39]/45">
              {comboAnalysisList.map((row) => {
                const hasExpectancy = row.expectancy > 0;
                const isHighlyValuable = row.winRate >= 50 && row.sampleSize > 0;
                
                return (
                  <tr 
                    key={row.name} 
                    className={`hover:bg-[#1E2235]/35 transition-colors ${
                      isHighlyValuable ? "bg-[#10B981]/5" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 font-black text-white">
                      <div className="flex items-center gap-2">
                        {isHighlyValuable && (
                          <span className="rounded bg-emerald-500/15 text-emerald-400 text-[8px] px-1.5 py-0.2 uppercase border border-emerald-500/20 font-sans">
                            High Edge
                          </span>
                        )}
                        <span>{row.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-300">
                      {row.sampleSize} positions
                    </td>
                    <td className="py-3.5 px-4 text-center text-[#868F9F]">
                      <span className="text-emerald-400 font-bold">{row.wins}</span>
                      <span className="mx-1">/</span>
                      <span className="text-rose-400 font-bold">{row.sampleSize - row.wins}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`font-black ${getWinRateColor(row.winRate, row.sampleSize)}`}>
                        {row.sampleSize > 0 ? `${row.winRate}%` : "0.0%"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-black text-[#D1D4DC]">
                      {row.sampleSize > 0 ? `${row.avgR > 0 ? "+" : ""}${row.avgR}R` : "0.00R"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className={`font-black rounded px-2 py-0.5 text-[10px] ${
                        row.sampleSize === 0
                          ? "bg-stone-500/10 text-stone-500 border border-stone-500/20"
                          : hasExpectancy 
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/35"
                            : "bg-danger-500/10 text-rose-400 border border-rose-500/25"
                      }`}>
                        {row.sampleSize > 0 ? `${hasExpectancy ? "+" : ""}${row.expectancy} expectancy` : "0.00 expectation"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
