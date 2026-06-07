/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { type TradeOutcome, type TradeDirection } from "../types";

interface TradingChartProps {
  seed: number;
  pair: string;
  type: "htf" | "entry" | "exit" | "thumbnail";
  direction: TradeDirection;
  outcome: TradeOutcome;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
}

// Simple deterministic random generator based on seed
function createRandom(seed: number) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export default function TradingChart({
  seed,
  pair,
  type,
  direction,
  outcome,
  entryPrice,
  stopLossPrice,
  takeProfitPrice,
}: TradingChartProps) {
  const rand = createRandom(seed + (type === "htf" ? 100 : type === "entry" ? 200 : type === "exit" ? 300 : 400));
  const [hoveredCandle, setHoveredCandle] = useState<{ x: number; y: number; open: number; close: number; high: number; low: number; index: number } | null>(null);

  // Layout parameters
  const isThumbnail = type === "thumbnail";
  const numCandles = isThumbnail ? 20 : type === "htf" ? 40 : 25;
  const width = isThumbnail ? 380 : 800;
  const height = isThumbnail ? 160 : 320;
  const paddingX = isThumbnail ? 25 : 60;
  const paddingY = isThumbnail ? 20 : 40;

  // Generate synthetic candles.
  // We want the candles to reflect the trade setup.
  // For LONG trade: overall trend may start low and make a run up if it hits TP, or head down if SL.
  // Let's create a base trajectory.
  const candles: Array<{ open: number; close: number; high: number; low: number; isGreen: boolean }> = [];
  
  // Decide starting price based on entry
  let currentPrice = entryPrice * (0.97 + rand() * 0.04);
  const scale = entryPrice;

  // Determine trajectory offset to reach outcome
  let priceTrend = 0;
  if (direction === "LONG") {
    if (outcome === "TP") priceTrend = 0.0035; // bullish drift
    else if (outcome === "SL") priceTrend = -0.0035; // bearish drift
    else priceTrend = 0.0005; // range
  } else { // SHORT
    if (outcome === "TP") priceTrend = -0.0035; // bearish drift (profit on short)
    else if (outcome === "SL") priceTrend = 0.0035; // bullish drift (loss on short)
    else priceTrend = -0.0005; // range
  }

  // Inject a trigger index for entry, and exit
  const entryIndex = Math.floor(numCandles * 0.25);
  const exitIndex = Math.floor(numCandles * 0.8);

  for (let i = 0; i < numCandles; i++) {
    // Generate organic market fluctuations
    const noise = (rand() - 0.48) * 0.02 * scale;
    let trendMultiplier = 0;
    
    // Guide price behavior to entry, then resolution
    if (i < entryIndex) {
      // consolidate near entry price
      currentPrice = currentPrice * 0.999 + entryPrice * 0.001 + noise * 0.2;
    } else if (i >= entryIndex && i < exitIndex) {
      // start moving towards TP or SL
      currentPrice += priceTrend * scale + noise * 0.8;
    } else {
      // post-exit consolidation or follow-through
      currentPrice += priceTrend * scale * 0.4 + noise * 1.2;
    }

    // Ensure prices never go negative
    if (currentPrice < 0.001) currentPrice = 0.001;

    const open = currentPrice;
    const bodySpread = (rand() * 0.008 + 0.001) * scale;
    const isBullish = rand() > (direction === "LONG" && outcome === "TP" && i > entryIndex ? 0.35 : 0.55);
    const close = isBullish ? open + bodySpread : open - bodySpread;
    
    const wickHighOffset = rand() * 0.005 * scale;
    const wickLowOffset = rand() * 0.005 * scale;
    const high = Math.max(open, close) + wickHighOffset;
    const low = Math.min(open, close) - wickLowOffset;

    candles.push({
      open,
      close,
      high,
      low,
      isGreen: close >= open,
    });
  }

  // Find min and max prices to scale SVG y-axis
  let priceMin = Math.min(...candles.map(c => c.low), stopLossPrice, takeProfitPrice, entryPrice);
  let priceMax = Math.max(...candles.map(c => c.high), stopLossPrice, takeProfitPrice, entryPrice);
  
  // Add some padding to price range
  const pricePadding = (priceMax - priceMin) * 0.15 || 0.05 * entryPrice;
  priceMin -= pricePadding;
  priceMax += pricePadding;

  // Conversions functions
  const getX = (index: number) => paddingX + (index * (width - 2 * paddingX)) / (numCandles - 1);
  const getY = (val: number) => height - paddingY - ((val - priceMin) * (height - 2 * paddingY)) / (priceMax - priceMin);

  // Moving average line points
  const maPeriod = 5;
  const maPoints: string[] = [];
  for (let i = maPeriod; i < numCandles; i++) {
    const slice = candles.slice(i - maPeriod, i);
    const avgClose = slice.reduce((sum, c) => sum + c.close, 0) / maPeriod;
    maPoints.push(`${getX(i)},${getY(avgClose)}`);
  }

  // Format currency/labels nicely
  const formatVal = (v: number) => {
    if (v >= 100000) return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
    if (v >= 1000) return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
    if (v >= 1) return v.toFixed(2);
    return v.toFixed(5);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-[#2A2E39] bg-[#131722] p-1 font-mono text-xs select-none">
      {/* Top Details Panel */}
      <div className="flex items-center justify-between border-b border-[#2A2E39] px-3 py-2 text-[#D1D4DC]">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="text-emerald-400">●</span>
          <span>{pair}</span>
          <span className="text-[10px] rounded bg-[#2A2E39] px-1.5 py-0.5 text-[#868F9F] uppercase font-semibold">
            {type === "htf" ? "Daily (HTF)" : type === "entry" ? "5m Entry" : type === "exit" ? "5m Exit" : "Direct Analysis"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-[#A3A6AF]">
          <span>E: <strong className="text-white">{formatVal(entryPrice)}</strong></span>
          {!isThumbnail && (
            <>
              <span>TP: <strong className="text-emerald-400">{formatVal(takeProfitPrice)}</strong></span>
              <span>SL: <strong className="text-rose-400">{formatVal(stopLossPrice)}</strong></span>
            </>
          )}
        </div>
      </div>

      {tableInteractiveHoverDetails()}

      {/* Main SVG Plot */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height={height}
          className="overflow-visible"
        >
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
            const val = priceMin + p * (priceMax - priceMin);
            const y = getY(val);
            return (
              <g key={idx} opacity="0.05">
                <line x1={0} y1={y} x2={width} y2={y} stroke="#FFFFFF" strokeDasharray="4 4" />
                {!isThumbnail && (
                  <text x={10} y={y - 4} fill="#FFFFFF" fontSize="9" textAnchor="start">
                    {formatVal(val)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Dotted target lines (Take Profit / Stop Loss / Entry) */}
          {!isThumbnail && (
            <>
              {/* Take Profit Zone Fill */}
              {direction === "LONG" ? (
                <rect
                  x={getX(entryIndex)}
                  y={getY(takeProfitPrice)}
                  width={getX(exitIndex) - getX(entryIndex)}
                  height={Math.abs(getY(entryPrice) - getY(takeProfitPrice))}
                  fill="rgba(16, 185, 129, 0.025)"
                />
              ) : (
                <rect
                  x={getX(entryIndex)}
                  y={getY(entryPrice)}
                  width={getX(exitIndex) - getX(entryIndex)}
                  height={Math.abs(getY(takeProfitPrice) - getY(entryPrice))}
                  fill="rgba(16, 185, 129, 0.025)"
                />
              )}

              {/* Stop Loss Zone Fill */}
              {direction === "LONG" ? (
                <rect
                  x={getX(entryIndex)}
                  y={getY(entryPrice)}
                  width={getX(exitIndex) - getX(entryIndex)}
                  height={Math.abs(getY(stopLossPrice) - getY(entryPrice))}
                  fill="rgba(239, 68, 68, 0.025)"
                />
              ) : (
                <rect
                  x={getX(entryIndex)}
                  y={getY(stopLossPrice)}
                  width={getX(exitIndex) - getX(entryIndex)}
                  height={Math.abs(getY(entryPrice) - getY(stopLossPrice))}
                  fill="rgba(239, 68, 68, 0.025)"
                />
              )}

              {/* Take Profit Line */}
              <line
                x1={paddingX}
                y1={getY(takeProfitPrice)}
                x2={width - paddingX}
                y2={getY(takeProfitPrice)}
                stroke="#10B981"
                strokeWidth="1"
                strokeDasharray="5 3"
                opacity="0.5"
              />
              <text x={width - paddingX + 5} y={getY(takeProfitPrice) + 3} fill="#10B981" fontSize="9" fontWeight="bold">
                TP {formatVal(takeProfitPrice)}
              </text>

              {/* Stop Loss Line */}
              <line
                x1={paddingX}
                y1={getY(stopLossPrice)}
                x2={width - paddingX}
                y2={getY(stopLossPrice)}
                stroke="#EF4444"
                strokeWidth="1"
                strokeDasharray="5 3"
                opacity="0.5"
              />
              <text x={width - paddingX + 5} y={getY(stopLossPrice) + 3} fill="#EF4444" fontSize="9" fontWeight="bold">
                SL {formatVal(stopLossPrice)}
              </text>

              {/* Entry Price Line */}
              <line
                x1={paddingX}
                y1={getY(entryPrice)}
                x2={width - paddingX}
                y2={getY(entryPrice)}
                stroke="#8457A8"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                opacity="0.75"
              />
              <text x={paddingX - 5} y={getY(entryPrice) + 3} fill="#C6BBD8" fontSize="9" textAnchor="end" fontWeight="bold">
                ENTRY {formatVal(entryPrice)}
              </text>
            </>
          )}

          {/* Smooth EMA Indicator */}
          {maPoints.length > 1 && (
            <path
              d={`M ${maPoints.join(" L ")}`}
              fill="none"
              stroke="#8B5CFF"
              strokeWidth="1.5"
              opacity="0.4"
            />
          )}

          {/* Candle plot */}
          {candles.map((candle, idx) => {
            const x = getX(idx);
            const highY = getY(candle.high);
            const lowY = getY(candle.low);
            const openY = getY(candle.open);
            const closeY = getY(candle.close);
            
            const candleWidth = isThumbnail ? 6 : 14;
            const openCloseDiff = Math.abs(openY - closeY);
            const startY = Math.min(openY, closeY);

            // Entry Marker (Green/Blue arrow on entry candle)
            const isEntryCandle = idx === entryIndex;
            const isExitCandle = idx === exitIndex;

            return (
              <g
                key={idx}
                onMouseEnter={(e) => {
                  if (isThumbnail) return;
                  setHoveredCandle({
                    x: x,
                    y: startY,
                    open: candle.open,
                    close: candle.close,
                    high: candle.high,
                    low: candle.low,
                    index: idx,
                  });
                }}
                onMouseLeave={() => setHoveredCandle(null)}
                className="cursor-pointer"
              >
                {/* Wick shadow */}
                <line
                  x1={x}
                  y1={highY}
                  x2={x}
                  y2={lowY}
                  stroke={candle.isGreen ? "#26a69a" : "#ef5350"}
                  strokeWidth="1.5"
                />
                
                {/* Real-body bar */}
                <rect
                  x={x - candleWidth / 2}
                  y={startY}
                  width={candleWidth}
                  height={Math.max(openCloseDiff, 1.5)}
                  fill={candle.isGreen ? "#26a69a" : "#ef5350"}
                  stroke={candle.isGreen ? "#26a69a" : "#ef5350"}
                  strokeWidth="0.5"
                  rx="1"
                />

                {/* Draw entry highlight icons */}
                {!isThumbnail && isEntryCandle && (
                  <g>
                    <circle cx={x} cy={getY(entryPrice)} r="6" fill="#8457A8" stroke="#FFFFFF" strokeWidth="1.5" />
                    <line x1={x} y1={getY(entryPrice) + 15} x2={x} y2={getY(entryPrice) + 5} stroke="#8457A8" strokeWidth="2" markerEnd="url(#arrow)" />
                    <text x={x} y={getY(entryPrice) - 10} fill="#C6BBD8" fontSize="8" fontWeight="bold" textAnchor="middle" className="bg-black">
                      BUY IN
                    </text>
                  </g>
                )}

                {/* Draw exit highlight icons */}
                {!isThumbnail && isExitCandle && (
                  <g>
                    <circle
                      cx={x}
                      cy={getY(candles[exitIndex].close)}
                      r="6"
                      fill={outcome === "TP" ? "#10B981" : outcome === "SL" ? "#EF4444" : "#9CA3AF"}
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                    <text
                      x={x}
                      y={getY(candles[exitIndex].close) - 12}
                      fill={outcome === "TP" ? "#34D399" : outcome === "SL" ? "#F87171" : "#D1D5DB"}
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {outcome === "TP" ? "TP HIT 🎉" : outcome === "SL" ? "SL HIT 💥" : "CLOSED"}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover info overlay */}
        {!isThumbnail && hoveredCandle && (
          <div
            className="absolute z-10 pointer-events-none rounded border border-[#2A2E39] bg-[#1C2030] p-2 text-[10px] text-gray-300 shadow-md"
            style={{
              left: `${Math.min(hoveredCandle.x + 15, width - 130)}px`,
              top: `${Math.min(hoveredCandle.y, height - 75)}px`,
            }}
          >
            <div className="font-bold text-white mb-0.5">Candle #{hoveredCandle.index + 1}</div>
            <div>Open: <span className="text-gray-100 font-bold">{formatVal(hoveredCandle.open)}</span></div>
            <div>High: <span className="text-emerald-400 font-bold">{formatVal(hoveredCandle.high)}</span></div>
            <div>Low: <span className="text-rose-400 font-bold">{formatVal(hoveredCandle.low)}</span></div>
            <div>Close: <span className="text-gray-100 font-bold">{formatVal(hoveredCandle.close)}</span></div>
          </div>
        )}
      </div>

      {/* Bottom info banner */}
      <div className="flex items-center justify-between border-t border-[#2A2E39] bg-[#171B26] px-3 py-1.5 text-[10px] text-[#868F9F]">
        <span>UTC Timeframe</span>
        <div className="flex gap-2.5">
          <span>RSI(14): <strong className="text-purple-400">54.21</strong></span>
          <span>MACD: <strong className="text-indigo-400">0.024</strong></span>
        </div>
      </div>
    </div>
  );

  function tableInteractiveHoverDetails() {
    if (isThumbnail) return null;
    return (
      <div className="flex items-center gap-4 bg-[#171B26] px-3 py-1 text-[11px] font-medium text-gray-400 border-b border-[#2A2E39]">
        <div>
          O: <span className="text-emerald-400 font-semibold">{formatVal(candles[candles.length - 1].open)}</span>
        </div>
        <div>
          H: <span className="text-emerald-400 font-semibold">{formatVal(candles[candles.length - 1].high)}</span>
        </div>
        <div>
          L: <span className="text-rose-400 font-semibold">{formatVal(candles[candles.length - 1].low)}</span>
        </div>
        <div>
          C: <span className="text-emerald-400 font-semibold">{formatVal(candles[candles.length - 1].close)}</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-[9px] text-[#868F9F]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
          <span>PSYCHOLOGY SYNC ACTIVE</span>
        </div>
      </div>
    );
  }
}
