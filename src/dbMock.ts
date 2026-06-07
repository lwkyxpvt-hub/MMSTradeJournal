/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { type Trade, type DayOfWeek, type WeeklyStats } from "./types";

const INITIAL_TRADES: Trade[] = [
  {
    id: "trade-1",
    status: "CLOSED",
    pair: "BTC/USDT",
    direction: "LONG",
    dayOfWeek: "Monday",
    date: "2026-06-01",
    entryModel: "MMS Buy Model",
    confluence: {
      crh: false,
      crl: true,
      pdra: true,
      ash: false,
      asl: true
    },
    timeframesUsed: "4H / 1H / 15m",
    entry: 68200,
    stopLoss: 67200,
    takeProfit: 70700,
    riskPercentage: 1.0,
    resultPercentage: 3.66,
    outcome: "TP",
    rMultiple: 2.5,
    preTradePsychology: {
      emotionalTags: ["Calm", "Patient", "Focused"],
      confidenceLevel: 4,
      focusLevel: 5,
      followedPlan: true,
      notes: "Retested the 4H demand zone on Monday morning. High liquidity sweep observed below 68k. Waiting for confirmation close on 15m. Perfect textbook entry.",
    },
    postTradeReflection: {
      emotionalTags: ["Calm", "Disciplined", "Confident"],
      lessonsLearned: "Waiting for the liquidity sweep saved me from premature entry. Continuing to prioritize patient 4-hour setups.",
      wouldTakeAgain: true,
    },
    charts: {
      htfSeed: 121,
      entrySeed: 122,
      exitSeed: 123,
    },
    aiReview: {
      status: "success",
      rating: "Pristine Execution",
      comparisonWithPlan: "You strictly adhered to the entry trigger blueprint and kept patience at the forefront.",
      feedback: "Your discipline on this Monday trade set an exemplary tone for the week. Recognizing the sweep of 68k demonstrates structural maturity. The alignment of focus (5/5) and calmness directly translated into a clean 2.5R capture.",
      coachingAdvice: [
        "Document this specific sweep behavior in your playbook.",
        "Ensure future Long entries have the same 15m confirmation cushion.",
        "Refrain from scaling-in once the 4H order block is activated."
      ],
      timestamp: "2026-06-01T14:30:00Z",
    },
  },
  {
    id: "trade-2",
    status: "CLOSED",
    pair: "EUR/USD",
    direction: "LONG",
    dayOfWeek: "Tuesday",
    date: "2026-06-02",
    entryModel: "MMS Sell Model",
    confluence: {
      crh: false,
      crl: false,
      pdra: true,
      ash: false,
      asl: false
    },
    timeframesUsed: "1H / 15m",
    entry: 1.0850,
    stopLoss: 1.0820,
    takeProfit: 1.0920,
    riskPercentage: 1.2,
    resultPercentage: -1.2,
    outcome: "SL",
    rMultiple: -1.0,
    preTradePsychology: {
      emotionalTags: ["FOMO", "Impulsive", "Hesitant"],
      confidenceLevel: 2,
      focusLevel: 2,
      followedPlan: false,
      notes: "I missed the initial London break. Felt behind so I forced an aggressive limit entry on a lower-low pullback hoping for a reversal without formal setup.",
    },
    postTradeReflection: {
      emotionalTags: ["Frustrated", "Revenge Trading"],
      lessonsLearned: "Chasing a missed breakout on EURUSD is negative EV. If a move is missed, it's missed—move on. Emotional greed triggers unnecessary losses.",
      wouldTakeAgain: false,
    },
    charts: {
      htfSeed: 241,
      entrySeed: 242,
      exitSeed: 243,
    },
    aiReview: {
      status: "success",
      rating: "Psychology Alert",
      comparisonWithPlan: "Complete deviation from plan. Entrance was prompted by fear of missing out rather than strategy criteria.",
      feedback: "This Tuesday trade represents a classic emotional trade cycle. Missing an early setup caused cognitive tension, driving you to force a secondary entrance. Focus was low (2/5) and anxiety high.",
      coachingAdvice: [
        "Close your terminal for 30 minutes if you miss the main London/NY bell breakout.",
        "Set an alarm for structural level triggers instead of watching price tick-by-tick.",
        "Write 'I will not chase' on your desk sticky note."
      ],
      timestamp: "2026-06-02T10:15:00Z",
    },
  },
  {
    id: "trade-3",
    status: "CLOSED",
    pair: "TSLA",
    direction: "LONG",
    dayOfWeek: "Wednesday",
    date: "2026-06-03",
    entryModel: "MMS Buy Model",
    confluence: {
      crh: false,
      crl: true,
      pdra: true,
      ash: false,
      asl: false
    },
    timeframesUsed: "Daily / 1H / 5m",
    entry: 175.0,
    stopLoss: 172.0,
    takeProfit: 182.0,
    riskPercentage: 1.5,
    resultPercentage: 3.5,
    outcome: "TP",
    rMultiple: 2.33,
    preTradePsychology: {
      emotionalTags: ["Focused", "Confident", "Calm"],
      confidenceLevel: 5,
      focusLevel: 5,
      followedPlan: true,
      notes: "TSLA is displaying massive relative strength. Retesting daily support on high relative volume. Pre-market plan mapped this out perfectly. Entered on the micro-level consolidation break.",
    },
    postTradeReflection: {
      emotionalTags: ["Calm", "Disciplined", "Patient"],
      lessonsLearned: "Aligning stock picks with relative market strength creates quick momentum moves. Spreads and liquidity were solid.",
      wouldTakeAgain: true,
    },
    charts: {
      htfSeed: 301,
      entrySeed: 302,
      exitSeed: 303,
    },
    aiReview: {
      status: "success",
      rating: "A",
      comparisonWithPlan: "Excellent execution. Retest and macro-concurrence criteria met completely.",
      feedback: "A brilliant breakout execution utilizing market beta and relative strength. Stacking variables (volume, sector interest, key daily retests) gives high conviction setups.",
      coachingAdvice: [
        "Continue tracking relative stock strength on TSLA/NVDA daily benchmarks.",
        "Ensure R-multiple risk ratios stay consistently above 2.0R like this one."
      ],
      timestamp: "2026-06-03T16:05:00Z",
    },
  },
  {
    id: "trade-4",
    status: "CLOSED",
    pair: "ETH/USDT",
    direction: "SHORT",
    dayOfWeek: "Thursday",
    date: "2026-06-04",
    entryModel: "MMS Sell Model",
    confluence: {
      crh: true,
      crl: false,
      pdra: false,
      ash: true,
      asl: false
    },
    timeframesUsed: "1H / 15m / 5m",
    entry: 3450,
    stopLoss: 3520,
    takeProfit: 3310,
    riskPercentage: 1.0,
    resultPercentage: 0.15,
    outcome: "BREAKEVEN",
    rMultiple: 0.1,
    preTradePsychology: {
      emotionalTags: ["Hesitant", "Patient"],
      confidenceLevel: 3,
      focusLevel: 3,
      followedPlan: false,
      notes: "Nothing was fitting my core strategy in NY afternoon. Decided to scalp ETH out of boredom. Low energy level.",
    },
    postTradeReflection: {
      emotionalTags: ["Calm", "Focused"],
      lessonsLearned: "Trading to cure boredom is an expensive habit. Although I managed to exit flat after a breakdown failed to resolve, it could have easily hit SL.",
      wouldTakeAgain: false,
    },
    charts: {
      htfSeed: 411,
      entrySeed: 412,
      exitSeed: 413,
    },
    aiReview: {
      status: "success",
      rating: "C",
      comparisonWithPlan: "Plan deviation. Boredom trades represent a disciplinary leak that erodes compounding.",
      feedback: "Trading when energy is low out of pure 'boredom' is a dangerous habit. You salvaged this into a flat/breakeven state by managing the exit efficiently, but the catalyst for the trade was weak.",
      coachingAdvice: [
        "Replace terminal watching during low-volume hours with physical exercise or chart research.",
        "Strictly limit NY Session Scalps to standard setups only."
      ],
      timestamp: "2026-06-04T19:40:00Z",
    },
  },
  {
    id: "trade-5",
    status: "OPEN",
    pair: "SOL/USDT",
    direction: "LONG",
    dayOfWeek: "Friday",
    date: "2026-06-05",
    entryModel: "MMS Buy Model",
    confluence: {
      crh: false,
      crl: true,
      pdra: true,
      ash: false,
      asl: true
    },
    timeframesUsed: "4H / 15m",
    entry: 132.0,
    stopLoss: 129.0,
    takeProfit: 139.0,
    riskPercentage: 1.0,
    resultPercentage: 0.0,
    outcome: "MANUAL_CLOSE",
    rMultiple: 0.0,
    preTradePsychology: {
      emotionalTags: ["Calm", "Patient", "Focused"],
      confidenceLevel: 4,
      focusLevel: 4,
      followedPlan: true,
      notes: "Retesting Wednesday support line. Friday low-volume drift swept morning liquidity. Perfect structure for a weekend position base.",
    },
    charts: {
      htfSeed: 551,
      entrySeed: 552,
      exitSeed: 553,
    },
  }
];

export function getStoredTrades(): Trade[] {
  if (typeof window === "undefined") return INITIAL_TRADES;
  const stored = localStorage.getItem("trademind_trades");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Error reading trades from localstorage", e);
    }
  }
  // If not in localStorage, seed it
  localStorage.setItem("trademind_trades", JSON.stringify(INITIAL_TRADES));
  return INITIAL_TRADES;
}

export function saveTrades(trades: Trade[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("trademind_trades", JSON.stringify(trades));
  }
}

export function calculateWeeklyStats(trades: Trade[]): WeeklyStats {
  // Only completed/closed trades count toward finalized journal statistics
  const closedTrades = trades.filter((t) => t.status === "CLOSED");
  const totalTrades = closedTrades.length;

  if (totalTrades === 0) {
    return {
      weeklyPnl: 0,
      winRate: 0,
      totalTrades: 0,
      avgRMultiple: 0,
      streakType: "neutral",
      streakCount: 0,
    };
  }

  // PnL Sum
  const weeklyPnl = closedTrades.reduce((sum, t) => sum + t.resultPercentage, 0);

  // Win Rate (TP counts as win, SL as loss, others like BREAKEVEN or MANUAL_CLOSE don't count as win)
  const wins = closedTrades.filter((t) => t.outcome === "TP").length;
  // Express win rate as percentage of closed positions
  const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;

  // Average R Multiple
  const totalR = closedTrades.reduce((sum, t) => sum + t.rMultiple, 0);
  const avgRMultiple = parseFloat((totalR / totalTrades).toFixed(2));

  // Streak (Looking backwards chronologically by date/time or list index)
  const sorted = [...closedTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  let currentStreakCount = 0;
  let currentStreakType: "winning" | "losing" | "neutral" = "neutral";

  if (sorted.length > 0) {
    const lastTrade = sorted[sorted.length - 1];
    if (lastTrade.outcome === "TP" || lastTrade.resultPercentage > 0) {
      currentStreakType = "winning";
    } else if (lastTrade.outcome === "SL" || lastTrade.resultPercentage < 0) {
      currentStreakType = "losing";
    } else {
      currentStreakType = "neutral";
    }

    if (currentStreakType !== "neutral") {
      // Iterate backwards
      for (let i = sorted.length - 1; i >= 0; i--) {
        const t = sorted[i];
        if (currentStreakType === "winning") {
          if (t.resultPercentage >= 0) {
            currentStreakCount++;
          } else {
            break;
          }
        } else if (currentStreakType === "losing") {
          if (t.resultPercentage < 0) {
            currentStreakCount++;
          } else {
            break;
          }
        }
      }
    } else {
      currentStreakCount = 1;
    }
  }

  return {
    weeklyPnl: parseFloat(weeklyPnl.toFixed(2)),
    winRate,
    totalTrades,
    avgRMultiple,
    streakType: currentStreakType,
    streakCount: currentStreakCount,
  };
}
