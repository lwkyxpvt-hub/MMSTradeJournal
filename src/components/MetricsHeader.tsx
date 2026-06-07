/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { type WeeklyStats } from "../types";
import { TrendingUp, Flame, Percent, Activity, BarChart3, AlertCircle } from "lucide-react";

interface MetricsHeaderProps {
  stats: WeeklyStats;
}

export default function MetricsHeader({ stats }: MetricsHeaderProps) {
  const isProfitable = stats.weeklyPnl >= 0;

  return (
    <div id="metrics-bento-grid" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {/* PnL Card */}
      <div 
        id="metric-card-pnl" 
        className="relative overflow-hidden rounded-xl border border-[#2A2E39] bg-[#171B26] p-4 transition-all duration-300 hover:border-indigo-500/50"
      >
        <div className="flex items-center justify-between text-xs font-semibold text-[#868F9F]">
          <span>WEEKLY PROFIT / LOSS</span>
          <TrendingUp className={`h-4 w-4 ${isProfitable ? "text-emerald-400" : "text-rose-400"}`} />
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className={`text-2xl font-black tracking-tight ${isProfitable ? "text-emerald-400" : "text-rose-400"}`}>
            {isProfitable ? "+" : ""}{stats.weeklyPnl.toFixed(2)}%
          </span>
          <span className="text-[10px] text-gray-400 font-mono">cumulative</span>
        </div>
        <div className="mt-1 text-[10px] text-[#A3A6AF] font-medium">
          Monday to Friday combined capture
        </div>
        <div className="absolute right-0 bottom-0 select-none overflow-hidden pr-2 opacity-5">
          <BarChart3 className="h-16 w-16 text-white" />
        </div>
      </div>

      {/* Win Rate Card */}
      <div 
        id="metric-card-winrate" 
        className="relative overflow-hidden rounded-xl border border-[#2A2E39] bg-[#171B26] p-4 transition-all duration-300 hover:border-indigo-500/50"
      >
        <div className="flex items-center justify-between text-xs font-semibold text-[#868F9F]">
          <span>JOURNAL WIN RATE</span>
          <Percent className="h-4 w-4 text-[#A3A6AF]" />
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-black tracking-tight text-white">
            {stats.winRate}%
          </span>
          <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-0.5">
            ● target met
          </span>
        </div>
        <div className="mt-1 flex gap-2 text-[10px]">
          <div className="text-[#868F9F]">
            Threshold: <strong className="text-gray-300 font-mono">50%+</strong>
          </div>
          <div className="h-4 w-px bg-[#2A2E39]"></div>
          <div className="text-gray-400 font-medium">
            High accuracy bias
          </div>
        </div>
        <div className="absolute right-0 bottom-0 select-none overflow-hidden pr-2 opacity-5">
          <Activity className="h-16 w-16 text-white" />
        </div>
      </div>

      {/* R Multiple Card */}
      <div 
        id="metric-card-rmultiple" 
        className="relative overflow-hidden rounded-xl border border-[#2A2E39] bg-[#171B26] p-4 transition-all duration-300 hover:border-indigo-500/50"
      >
        <div className="flex items-center justify-between text-xs font-semibold text-[#868F9F]">
          <span>AVERAGE R MULTIPLE</span>
          <BarChart3 className="h-4 w-4 text-indigo-400" />
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-black tracking-tight text-white font-mono">
            {stats.avgRMultiple > 0 ? "+" : ""}{stats.avgRMultiple}R
          </span>
          <span className="text-[10px] text-indigo-400 font-mono font-bold">
            payoff factor
          </span>
        </div>
        <div className="mt-1 text-[10px] text-[#A3A6AF] font-medium">
          Captured vs Risked capital efficiency
        </div>
      </div>

      {/* Streak Card */}
      <div 
        id="metric-card-streak" 
        className="relative overflow-hidden rounded-xl border border-[#2A2E39] bg-[#171B26] p-4 transition-all duration-300 hover:border-indigo-500/50"
      >
        <div className="flex items-center justify-between text-xs font-semibold text-[#868F9F]">
          <span>CURRENT STREAK</span>
          <Flame className={`h-4 w-4 ${stats.streakType === "winning" ? "text-amber-500" : stats.streakType === "losing" ? "text-rose-400" : "text-[#A3A6AF]"}`} />
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className={`text-2xl font-black tracking-tight ${stats.streakType === "winning" ? "text-amber-400" : stats.streakType === "losing" ? "text-rose-400" : "text-white"}`}>
            {stats.streakCount} {stats.streakType === "winning" ? "Wins" : stats.streakType === "losing" ? "losses" : "Flat"}
          </span>
        </div>
        <div className="mt-1 text-[10px] text-[#A3A6AF] font-medium flex items-center gap-1">
          {stats.streakType === "winning" && (
            <span className="text-amber-400 font-bold">🔥 Compounding state active</span>
          )}
          {stats.streakType === "losing" && (
            <span className="text-rose-400 font-bold">❄️ Risk reduction required</span>
          )}
          {stats.streakType === "neutral" && (
            <span>No consecutive biases observed</span>
          )}
        </div>
      </div>

      {/* Number of Trades Card */}
      <div 
        id="metric-card-trades" 
        className="relative overflow-hidden rounded-xl border border-[#2A2E39] bg-[#171B26] p-4 transition-all duration-300 hover:border-indigo-500/50"
      >
        <div className="flex items-center justify-between text-xs font-semibold text-[#868F9F]">
          <span>POSITION CALENDAR</span>
          <Activity className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-black tracking-tight text-white font-mono">
            {stats.totalTrades}
          </span>
          <span className="text-[10px] text-[#868F9F]">trades logged</span>
        </div>
        <div className="mt-1 text-[10px] text-[#D1D4DC] font-semibold flex items-center gap-1 bg-[#2A2E39] px-2 py-0.5 rounded w-max">
          <AlertCircle className="h-3 w-3 text-indigo-400" />
          <span>Active Trading Week</span>
        </div>
      </div>
    </div>
  );
}
