"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import type {
  DartMode,
  FeeMethod,
  LimitExpiry,
  LimitOrderState,
  LimitSide,
  PriorityTier,
  Quote,
  SlippageSettings,
  TitanAppState,
  Token,
} from "./types";
import { DEFAULT_INPUT_TOKEN, DEFAULT_OUTPUT_TOKEN, TOKEN_SOL, TOKEN_USDC, TITAN_TOKENS } from "./tokens";
import { generateTitanQuote } from "./mock-quotes";

export interface TitanContextValue extends TitanAppState {
  setPage: (page: "swap" | "limit" | "learn") => void;
  setMode: (mode: "instant" | "limit" | "dca" | "slice") => void;
  setPrime: (prime: boolean) => void;
  setDart: (dart: DartMode) => void;
  setInputToken: (token: Token) => void;
  setOutputToken: (token: Token) => void;
  setAmount: (amount: string) => void;
  switchTokens: () => void;
  setSettingsOpen: (open: boolean) => void;
  setReviewModalOpen: (open: boolean) => void;
  setChartOpen: (open: boolean) => void;
  setBaseSlippageBps: (bps: number) => void;
  setStableSlippageBps: (bps: number) => void;
  setFeeMethod: (method: FeeMethod) => void;
  setPriorityTier: (tier: PriorityTier) => void;
  refreshQuote: () => void;
  // Wallet state & actions
  walletConnected: boolean;
  walletAddress: string;
  walletName: string;
  walletModalOpen: boolean;
  setWalletModalOpen: (open: boolean) => void;
  connectWallet: (name?: string) => void;
  disconnectWallet: () => void;
  // Limit order actions
  setLimitPair: (pair: string) => void;
  setLimitSide: (side: LimitSide) => void;
  setLimitPrice: (price: string) => void;
  setLimitQuantity: (quantity: string) => void;
  setLimitExpiry: (expiry: LimitExpiry) => void;
}

const TitanContext = createContext<TitanContextValue | null>(null);

const DEFAULT_SLIPPAGE: SlippageSettings = {
  baseBps: 50, // 0.5%
  stableBps: 10, // 0.1%
  feeMethod: "priority",
  priorityTier: "auto",
  customPrioritySol: 0.0001,
  mevProtection: true,
};

export function TitanStateProvider({ children }: { children: React.ReactNode }) {
  const [page, setPage] = useState<"swap" | "limit" | "learn">("swap");
  const [mode, setMode] = useState<"instant" | "limit" | "dca" | "slice">("instant");
  const [prime, setPrime] = useState(true);
  const [dart, setDart] = useState<DartMode>("auto");
  const [inputToken, setInputToken] = useState<Token>(DEFAULT_INPUT_TOKEN);
  const [outputToken, setOutputToken] = useState<Token>(DEFAULT_OUTPUT_TOKEN);
  const [amount, setAmount] = useState<string>("1");
  const [slippageSettings, setSlippageSettings] = useState<SlippageSettings>(DEFAULT_SLIPPAGE);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteTimestamp, setQuoteTimestamp] = useState(Date.now());

  // Wallet connection state
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("So11111111111111111111111111111111111111112");
  const [walletName, setWalletName] = useState("Phantom");
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const connectWallet = useCallback((name = "Phantom") => {
    setWalletName(name);
    setWalletAddress("So11...1112");
    setWalletConnected(true);
    setWalletModalOpen(false);
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletConnected(false);
  }, []);

  // Limit order state
  const [limitPair, setLimitPair] = useState("SOL/USDC");
  const [limitSide, setLimitSide] = useState<LimitSide>("buy");
  const [limitPrice, setLimitPrice] = useState<string>("184.20");
  const [limitQuantity, setLimitQuantity] = useState<string>("1");
  const [limitExpiry, setLimitExpiry] = useState<LimitExpiry>("1d");

  // Determine current active slippage based on token volatility
  const activeSlippageBps = useMemo(() => {
    const isStableOrLst =
      (inputToken.symbol === "USDC" || inputToken.symbol === "USDT") &&
      (outputToken.symbol === "USDC" || outputToken.symbol === "USDT");
    return isStableOrLst ? slippageSettings.stableBps : slippageSettings.baseBps;
  }, [inputToken, outputToken, slippageSettings]);

  // Recalculate quote
  const quote = useMemo(() => {
    return generateTitanQuote(
      inputToken,
      outputToken,
      amount,
      activeSlippageBps,
      dart,
      prime,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputToken, outputToken, amount, activeSlippageBps, dart, prime, quoteTimestamp]);

  const refreshQuote = useCallback(() => {
    setIsLoadingQuote(true);
    setTimeout(() => {
      setQuoteTimestamp(Date.now());
      setIsLoadingQuote(false);
    }, 250);
  }, []);

  const switchTokens = useCallback(() => {
    const prevInput = inputToken;
    const prevOutput = outputToken;
    setInputToken(prevOutput);
    setOutputToken(prevInput);
    if (quote?.outAmount) {
      setAmount(quote.outAmount);
    }
  }, [inputToken, outputToken, quote]);

  // Limit order validation
  const limitOrder: LimitOrderState = useMemo(() => {
    const baseToken = TOKEN_SOL;
    const quoteToken = TOKEN_USDC;
    const marketPrice = baseToken.usdPrice;

    const parsedPrice = parseFloat(limitPrice) || 0;
    const parsedQty = parseFloat(limitQuantity) || 0;
    const notionalUsd = parsedPrice * parsedQty;

    let isValid = true;
    let validationError: string | undefined;

    if (notionalUsd < 10) {
      isValid = false;
      validationError = `Minimum order size is $10.00 notional (current: $${notionalUsd.toFixed(2)})`;
    } else if (limitSide === "buy" && parsedPrice > marketPrice * 1.05) {
      isValid = false;
      validationError = `Limit price is significantly above market ($${marketPrice.toFixed(2)})`;
    } else if (limitSide === "sell" && parsedPrice < marketPrice * 0.95) {
      isValid = false;
      validationError = `Limit price is significantly below market ($${marketPrice.toFixed(2)})`;
    }

    return {
      pair: limitPair,
      baseToken,
      quoteToken,
      side: limitSide,
      limitPrice,
      marketPrice,
      quantity: limitQuantity,
      expiry: limitExpiry,
      notionalUsd,
      isValid,
      validationError,
    };
  }, [limitPair, limitSide, limitPrice, limitQuantity, limitExpiry]);

  const value: TitanContextValue = {
    page,
    mode,
    prime,
    dart,
    inputToken,
    outputToken,
    amount,
    quote,
    isLoadingQuote,
    slippageSettings,
    settingsOpen,
    reviewModalOpen,
    chartOpen,
    limitOrder,
    setPage,
    setMode,
    setPrime,
    setDart,
    setInputToken,
    setOutputToken,
    setAmount,
    switchTokens,
    setSettingsOpen,
    setReviewModalOpen,
    setChartOpen,
    setBaseSlippageBps: (bps) =>
      setSlippageSettings((s) => ({ ...s, baseBps: bps })),
    setStableSlippageBps: (bps) =>
      setSlippageSettings((s) => ({ ...s, stableBps: bps })),
    setFeeMethod: (feeMethod) =>
      setSlippageSettings((s) => ({ ...s, feeMethod })),
    setPriorityTier: (priorityTier) =>
      setSlippageSettings((s) => ({ ...s, priorityTier })),
    refreshQuote,
    walletConnected,
    walletAddress,
    walletName,
    walletModalOpen,
    setWalletModalOpen,
    connectWallet,
    disconnectWallet,
    setLimitPair,
    setLimitSide,
    setLimitPrice,
    setLimitQuantity,
    setLimitExpiry,
  };

  return React.createElement(TitanContext.Provider, { value }, children);
}

export function useTitan() {
  const ctx = useContext(TitanContext);
  if (!ctx) {
    throw new Error("useTitan must be used within a TitanStateProvider");
  }
  return ctx;
}
