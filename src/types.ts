/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
export type TradeDirection = "LONG" | "SHORT";
export type TradeOutcome = "TP" | "SL" | "BREAKEVEN" | "MANUAL_CLOSE";
export type TradeStatus = "OPEN" | "CLOSED";
export type EntryModel = "MMS Buy Model" | "MMS Sell Model";

export interface StrategyConfluence {
  crh: boolean; // Candle Range High swept (CRH)
  crl: boolean; // Candle Range Low swept (CRL)
  pdra: boolean; // PDRA reached
  ash: boolean; // Asia Session High swept (ASH)
  asl: boolean; // Asia Session Low swept (ASL)
}

export interface PreTradePsychology {
  emotionalTags: string[]; // selected positive/negative tags
  confidenceLevel: number; // 1 to 5
  focusLevel: number;      // 1 to 5
  followedPlan: boolean;
  notes: string;
}

export interface PostTradeReflection {
  emotionalTags: string[]; // selected emotional tags after trade close
  lessonsLearned: string;
  wouldTakeAgain: boolean;
}

export interface TradeCharts {
  htfSeed: number;     // Random/consistent seed to generate higher timeframe chart
  entrySeed: number;   // Seed for entry chart
  exitSeed: number;     // Seed for exit chart
  screenshotHtf?: string;
  screenshotEntry?: string;
  screenshotExit?: string;
  screenshotCover?: string;
}

export interface AIReview {
  status: "idle" | "loading" | "success" | "error";
  feedback?: string;
  rating?: "A" | "B" | "C" | "D" | "F" | "Psychology Alert" | "Pristine Execution";
  comparisonWithPlan?: string;
  coachingAdvice?: string[];
  timestamp?: string;
}

export interface Trade {
  id: string;
  status: TradeStatus;   // "OPEN" or "CLOSED"
  pair: string;          // e.g. "BTC/USD"
  direction: TradeDirection;
  dayOfWeek: DayOfWeek;
  date: string;          // e.g. "2026-06-01"
  entryModel: EntryModel;
  confluence: StrategyConfluence;
  timeframesUsed: string; // newly required timeframes descriptor
  entry: number;
  stopLoss: number;
  takeProfit: number;
  riskPercentage: number;
  resultPercentage: number; // default 0.0 when OPEN
  outcome: TradeOutcome;     // default "MANUAL_CLOSE" when OPEN
  rMultiple: number;         // default 0.0 when OPEN
  preTradePsychology: PreTradePsychology;
  postTradeReflection?: PostTradeReflection; // present only when CLOSED
  charts: TradeCharts;
  aiReview?: AIReview;
}

export interface WeeklyStats {
  weeklyPnl: number;       // total profit/loss percentage
  winRate: number;         // percentage (0-100)
  totalTrades: number;
  avgRMultiple: number;
  streakType: "winning" | "losing" | "neutral";
  streakCount: number;
}
