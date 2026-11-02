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

export interface PlacedOrder {
  id: string;
  pair: string;
  side: "buy" | "sell";
  price: string;
  amount: string;
  time: string;
  type: string;
}

export interface TradeHistoryItem {
  id: string;
  inToken: string;
  outToken: string;
  inAmount: string;
  outAmount: string;
  time: string;
  txHash: string;
}

export interface ToastNotification {
  message: string;
  type: "success" | "info" | "error";
}

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
  // Interactive features
  toast: ToastNotification | null;
  showToast: (message: string, type?: "success" | "info" | "error") => void;
  watchlist: string[];
  toggleWatchlist: (symbol: string) => void;
  isWatchlisted: (symbol: string) => boolean;
  orders: PlacedOrder[];
  addOrder: (order: Omit<PlacedOrder, "id" | "time">) => void;
  cancelOrder: (id: string) => void;
  tradeHistory: TradeHistoryItem[];
  addTradeToHistory: (trade: { inToken: string; outToken: string; inAmount: string; outAmount: string }) => void;
  userBalances: Record<string, number>;
  getUserBalance: (symbol: string) => number;
  selectTokenBySymbol: (symbol: string) => void;
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

  // Toast feedback
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const showToast = useCallback((message: string, type: "success" | "info" | "error" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((cur) => (cur?.message === message ? null : cur));
    }, 3200);
  }, []);

  // Watchlist tokens
  const [watchlist, setWatchlist] = useState<string[]>(["SOL", "HYPE", "PUMP", "cbBTC"]);
  const toggleWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) => {
      const exists = prev.includes(symbol);
      const next = exists ? prev.filter((s) => s !== symbol) : [...prev, symbol];
      showToast(exists ? `Removed ${symbol} from watchlist` : `Added ${symbol} to watchlist`, "info");
      return next;
    });
  }, [showToast]);

  const isWatchlisted = useCallback((symbol: string) => watchlist.includes(symbol), [watchlist]);

  // Orders
  const [orders, setOrders] = useState<PlacedOrder[]>([
    { id: "ord-8831", pair: "SOL/USDC", side: "buy", price: "91.50", amount: "2.5", time: "10 mins ago", type: "LIMIT" },
    { id: "ord-4920", pair: "HYPE/USDC", side: "sell", price: "92.00", amount: "10", time: "42 mins ago", type: "CONDITIONAL" },
  ]);

  const addOrder = useCallback((order: Omit<PlacedOrder, "id" | "time">) => {
    const newOrd: PlacedOrder = {
      ...order,
      id: `ord-${Math.floor(1000 + Math.random() * 9000)}`,
      time: "Just now",
    };
    setOrders((prev) => [newOrd, ...prev]);
    showToast(`Order placed: ${order.side.toUpperCase()} ${order.amount} ${order.pair} at $${order.price}`, "success");
  }, [showToast]);

  const cancelOrder = useCallback((id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    showToast(`Order ${id} cancelled`, "info");
  }, [showToast]);

  // Trade History
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryItem[]>([
    { id: "tx-9941", inToken: "USDC", outToken: "SOL", inAmount: "500.00", outAmount: "5.332", time: "25 mins ago", txHash: "4xZ9...jK7q" },
    { id: "tx-8812", inToken: "SOL", outToken: "USDC", inAmount: "2.00", outAmount: "187.52", time: "2 hrs ago", txHash: "7mK1...p9Lw" },
  ]);

  const addTradeToHistory = useCallback((trade: { inToken: string; outToken: string; inAmount: string; outAmount: string }) => {
    const newItem: TradeHistoryItem = {
      id: `tx-${Math.floor(1000 + Math.random() * 9000)}`,
      ...trade,
      time: "Just now",
      txHash: `${Math.random().toString(36).substring(2, 6)}...${Math.random().toString(36).substring(2, 6)}`,
    };
    setTradeHistory((prev) => [newItem, ...prev]);
    showToast(`Swap complete: ${trade.inAmount} ${trade.inToken} → ${trade.outAmount} ${trade.outToken}`, "success");
  }, [showToast]);

  // User simulated balances
  const [userBalances, setUserBalances] = useState<Record<string, number>>({
    SOL: 12.50,
    USDC: 2500.00,
    HYPE: 45.00,
    PUMP: 100000.00,
    JUP: 350.00,
  });

  const getUserBalance = useCallback((symbol: string) => {
    return userBalances[symbol] ?? 0;
  }, [userBalances]);

  // Select token anywhere
  const selectTokenBySymbol = useCallback((symbol: string) => {
    const found = Object.values(TITAN_TOKENS).find((t) => t.symbol.toUpperCase() === symbol.toUpperCase());
    if (found) {
      setOutputToken(found);
      showToast(`Selected ${found.symbol} (${found.name})`, "info");
    }
  }, [showToast]);

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
    showToast(`Wallet connected via ${name}`, "success");
  }, [showToast]);

  const disconnectWallet = useCallback(() => {
    setWalletConnected(false);
    showToast("Wallet disconnected", "info");
  }, [showToast]);

  // Limit order state
  const [limitPair, setLimitPair] = useState("SOL/USDC");
  const [limitSide, setLimitSide] = useState<LimitSide>("buy");
  const [limitPrice, setLimitPrice] = useState<string>("93.75");
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
    showToast("Fetching freshest Argos & DART route...", "info");
    setTimeout(() => {
      setQuoteTimestamp(Date.now());
      setIsLoadingQuote(false);
      showToast("Quote updated across 14 DEX pools", "success");
    }, 350);
  }, [showToast]);

  const switchTokens = useCallback(() => {
    const prevInput = inputToken;
    const prevOutput = outputToken;
    setInputToken(prevOutput);
    setOutputToken(prevInput);
    if (quote?.outAmount) {
      setAmount(quote.outAmount);
    }
    showToast(`Switched pair: ${prevOutput.symbol} → ${prevInput.symbol}`, "info");
  }, [inputToken, outputToken, quote, showToast]);

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
    toast,
    showToast,
    watchlist,
    toggleWatchlist,
    isWatchlisted,
    orders,
    addOrder,
    cancelOrder,
    tradeHistory,
    addTradeToHistory,
    userBalances,
    getUserBalance,
    selectTokenBySymbol,
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
