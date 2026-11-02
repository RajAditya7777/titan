"use client";

import { useState } from "react";
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Coins,
  ShieldAlert,
} from "lucide-react";
import { useTitan } from "@/lib/products/titan/state";
import { formatUsd, formatTokenAmount } from "@/lib/products/titan/tokens";
import type { LimitExpiry, LimitSide } from "@/lib/products/titan/types";

export function LimitOrderCard() {
  const {
    limitOrder,
    setLimitPair,
    setLimitSide,
    setLimitPrice,
    setLimitQuantity,
    setLimitExpiry,
    walletConnected,
    setWalletModalOpen,
  } = useTitan();

  const [orderPlaced, setOrderPlaced] = useState(false);

  const marketPrice = limitOrder.marketPrice;
  const currentLimitPriceNum = parseFloat(limitOrder.limitPrice) || 0;
  const priceDiffPct = marketPrice > 0
    ? (((currentLimitPriceNum - marketPrice) / marketPrice) * 100).toFixed(2)
    : "0.00";

  const expiries: { key: LimitExpiry; label: string }[] = [
    { key: "1h", label: "1 Hour" },
    { key: "1d", label: "1 Day" },
    { key: "7d", label: "7 Days" },
    { key: "never", label: "Never" },
  ];

  return (
    <div className="w-full max-w-[520px] mx-auto rounded-3xl border border-white/[0.08] bg-[#151513] p-4 sm:p-5 shadow-2xl relative text-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#262113] text-[#f2d363] border border-[#f2d363]/30">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm">Titan Limit Order</h3>
            <span className="text-[10px] text-[#a8a69f] font-mono">
              On-Chain Orderbook • Filled by Market Makers
            </span>
          </div>
        </div>

        {/* Pair Selector */}
        <select
          data-companion="titan-limit-pair"
          value={limitOrder.pair}
          onChange={(e) => setLimitPair(e.target.value)}
          className="rounded-lg border border-white/[0.08] bg-[#20201d] px-2.5 py-1 text-xs font-mono font-medium text-white focus:border-[#f2d363] focus:outline-none cursor-pointer"
        >
          <option value="SOL/USDC">SOL / USDC</option>
          <option value="SOL/USDT">SOL / USDT</option>
          <option value="JUP/USDC">JUP / USDC</option>
          <option value="BONK/USDC">BONK / USDC</option>
          <option value="cbBTC/USDC">cbBTC / USDC</option>
        </select>
      </div>

      {orderPlaced ? (
        <div className="py-8 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#00d692]/15 text-[#00d692] border border-[#00d692]/30">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h4 className="text-base font-semibold text-white">Limit Order Placed!</h4>
          <p className="text-xs text-[#a8a69f] max-w-sm mx-auto">
            Order submitted to Titan on-chain orderbook. When market price reaches ${limitOrder.limitPrice}, market makers will execute your trade.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setOrderPlaced(false)}
              className="rounded-xl bg-[#20201d] px-5 py-2 text-xs font-semibold text-white hover:bg-[#2b2927] border border-white/10"
            >
              Place Another Order
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Buy / Sell Side Selector */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl border border-white/[0.06] bg-[#20201d]">
            <button
              type="button"
              data-companion="titan-limit-side-buy"
              onClick={() => setLimitSide("buy")}
              className={`rounded-xl py-2 text-center text-xs font-semibold transition-all ${
                limitOrder.side === "buy"
                  ? "bg-[#00d692] text-[#100e0a] shadow-sm"
                  : "text-[#a8a69f] hover:text-white"
              }`}
            >
              Buy {limitOrder.baseToken.symbol}
            </button>
            <button
              type="button"
              data-companion="titan-limit-side-sell"
              onClick={() => setLimitSide("sell")}
              className={`rounded-xl py-2 text-center text-xs font-semibold transition-all ${
                limitOrder.side === "sell"
                  ? "bg-[#f34f6a] text-white shadow-sm"
                  : "text-[#a8a69f] hover:text-white"
              }`}
            >
              Sell {limitOrder.baseToken.symbol}
            </button>
          </div>

          {/* Limit Price Input & Market Reference */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#20201d] p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#a8a69f]">
              <label>Limit Price</label>
              {/* Market Reference Button */}
              <button
                type="button"
                data-companion="titan-limit-market-ref"
                onClick={() => setLimitPrice(marketPrice.toFixed(2))}
                className="flex items-center gap-1 font-mono text-[11px] text-[#f2d363] hover:underline"
              >
                <span>Market: ${marketPrice.toFixed(2)}</span>
                <span className="rounded bg-[#f2d363]/15 px-1 py-0.2 text-[9px]">Use</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                data-companion="titan-limit-price-input"
                value={limitOrder.limitPrice}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, "");
                  setLimitPrice(val);
                }}
                placeholder="0.00"
                className="w-full bg-transparent font-mono text-2xl font-semibold text-white focus:outline-none"
              />
              <span className="font-mono text-xs text-[#a8a69f]">
                {limitOrder.quoteToken.symbol}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-[#78766d] pt-1 border-t border-white/[0.04]">
              <span>Comparison to market:</span>
              <span
                className={
                  parseFloat(priceDiffPct) > 0
                    ? "text-[#00d692]"
                    : parseFloat(priceDiffPct) < 0
                    ? "text-amber-400"
                    : "text-white"
                }
              >
                {parseFloat(priceDiffPct) > 0 ? `+${priceDiffPct}%` : `${priceDiffPct}%`} vs Market
              </span>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#20201d] p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#a8a69f]">
              <label>Quantity</label>
              <div className="flex items-center gap-1 font-mono text-[11px]">
                <span>Bal: {formatTokenAmount(limitOrder.baseToken.balance)}</span>
                <button
                  type="button"
                  onClick={() => setLimitQuantity((limitOrder.baseToken.balance * 0.25).toFixed(2))}
                  className="rounded bg-[#2b2927] px-1 py-0.2 text-[9px] text-[#f2d363]"
                >
                  25%
                </button>
                <button
                  type="button"
                  onClick={() => setLimitQuantity((limitOrder.baseToken.balance * 0.5).toFixed(2))}
                  className="rounded bg-[#2b2927] px-1 py-0.2 text-[9px] text-[#f2d363]"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => setLimitQuantity(limitOrder.baseToken.balance.toString())}
                  className="rounded bg-[#2b2927] px-1 py-0.2 text-[9px] text-[#f2d363]"
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                data-companion="titan-limit-quantity-input"
                value={limitOrder.quantity}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, "");
                  setLimitQuantity(val);
                }}
                placeholder="0.00"
                className="w-full bg-transparent font-mono text-2xl font-semibold text-white focus:outline-none"
              />
              <span className="font-mono text-xs text-[#a8a69f]">
                {limitOrder.baseToken.symbol}
              </span>
            </div>

            <div className="text-[11px] font-mono text-[#78766d]">
              Order Notional: {formatUsd(limitOrder.notionalUsd)}
            </div>
          </div>

          {/* Expiry Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[#a8a69f]">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> Order Expiry
              </span>
              <span className="text-[10px] font-mono text-[#78766d]">Auto-cancels if unfilled</span>
            </div>
            <div
              data-companion="titan-limit-expiry-select"
              className="grid grid-cols-4 gap-2"
            >
              {expiries.map((exp) => (
                <button
                  key={exp.key}
                  type="button"
                  onClick={() => setLimitExpiry(exp.key)}
                  className={`rounded-xl py-2 text-center text-xs font-mono transition-all border ${
                    limitOrder.expiry === exp.key
                      ? "border-[#f2d363] bg-[#262113] text-[#f2d363] font-semibold"
                      : "border-white/[0.06] bg-[#20201d] text-[#a8a69f] hover:text-white"
                  }`}
                >
                  {exp.label}
                </button>
              ))}
            </div>
          </div>

          {/* $10 Minimum Validation Badge */}
          <div
            data-companion="titan-limit-min-validation"
            className={`rounded-xl border p-3 text-xs transition-all flex items-start gap-2.5 ${
              limitOrder.isValid
                ? "border-[#00d692]/30 bg-[#00d692]/10 text-[#00d692]"
                : "border-amber-500/30 bg-amber-500/10 text-amber-400"
            }`}
          >
            {limitOrder.isValid ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-[#00d692]" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
            )}
            <div className="space-y-0.5">
              <div className="font-semibold text-[11px]">
                {limitOrder.isValid
                  ? `Order Size Valid: ${formatUsd(limitOrder.notionalUsd)}`
                  : limitOrder.validationError}
              </div>
              <div className="text-[10px] opacity-80">
                Titan requires minimum $10 notional order value to prevent state-bloat on Solana.
              </div>
            </div>
          </div>

          {/* Fee & Refundable Rent Notice */}
          <div className="rounded-xl border border-white/[0.05] bg-[#1a1917] p-2.5 text-[11px] font-mono text-[#78766d] flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Coins className="h-3 w-3 text-[#f2d363]" /> Limit Fee: 10 bps (0.10%)
            </span>
            <span className="text-[#a8a69f]">Rent: ~0.002 SOL (Refundable)</span>
          </div>

          {/* Place Limit Order Button */}
          <button
            type="button"
            data-companion="titan-limit-submit"
            onClick={() => {
              if (!walletConnected) {
                setWalletModalOpen(true);
              } else {
                setOrderPlaced(true);
              }
            }}
            disabled={walletConnected && !limitOrder.isValid}
            className="w-full rounded-2xl bg-[#fed766] hover:bg-[#ffe082] py-3.5 text-center text-sm font-extrabold text-black transition-all shadow-[0_0_20px_rgba(254,215,102,0.25)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {walletConnected ? `Place Limit Order (${limitOrder.side.toUpperCase()})` : "Connect Wallet"}
          </button>
        </div>
      )}
    </div>
  );
}
