"use client";

import React, { useState, useEffect } from "react";
import { SlidersHorizontal } from "lucide-react";
import { CompanyFeatures } from "@/lib/types";

interface WhatIfSandboxProps {
  currentFeatures: CompanyFeatures;
  baseProbability: number;
}

export function WhatIfSandbox({ currentFeatures, baseProbability }: WhatIfSandboxProps) {
  const [borrowingDep, setBorrowingDep] = useState(currentFeatures["Borrowing dependency"] ?? 0.37);
  const [debtRatio, setDebtRatio] = useState(currentFeatures["Debt ratio %"] ?? 0.11);
  const [roa, setRoa] = useState(currentFeatures["Net Income to Total Assets"] ?? 0.80);

  // Re-sync levers whenever a new scenario result loads (preset, history load,
  // or fresh prediction) so deltas are computed against the right baseline.
  useEffect(() => {
    setBorrowingDep(currentFeatures["Borrowing dependency"] ?? 0.37);
    setDebtRatio(currentFeatures["Debt ratio %"] ?? 0.11);
    setRoa(currentFeatures["Net Income to Total Assets"] ?? 0.80);
  }, [currentFeatures]);

  // Compute live sensitivity delta
  const depDelta = (borrowingDep - (currentFeatures["Borrowing dependency"] ?? 0.37)) * 0.45;
  const debtDelta = (debtRatio - (currentFeatures["Debt ratio %"] ?? 0.11)) * 0.35;
  const roaDelta = ((currentFeatures["Net Income to Total Assets"] ?? 0.80) - roa) * 0.30;

  const simulatedProb = Math.max(
    0.04,
    Math.min(0.96, baseProbability + depDelta + debtDelta + roaDelta)
  );

  const deltaPct = Math.round((simulatedProb - baseProbability) * 100);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c1220]/80 p-5 shadow-xl backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">What-If Sensitivity Sandbox</h3>
            <p className="text-[11px] text-slate-400">Tweak high-impact levers to test scenario resilience</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Simulated Distress:</span>
          <span className="font-mono text-sm font-bold text-cyan-400">
            {Math.round(simulatedProb * 100)}%
          </span>
          {deltaPct !== 0 && (
            <span
              className={`font-mono text-xs font-bold ${
                deltaPct > 0 ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              ({deltaPct > 0 ? `+${deltaPct}` : deltaPct}%)
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Lever 1: Borrowing Dependency */}
        <div className="space-y-1.5 rounded-xl border border-white/[0.04] bg-white/[0.01] p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300">Borrowing Dep</span>
            <span className="font-mono text-cyan-300 font-bold">{(borrowingDep * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min={0.0}
            max={1.0}
            step={0.01}
            value={borrowingDep}
            onChange={(e) => setBorrowingDep(parseFloat(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-cyan-400"
          />
        </div>

        {/* Lever 2: Debt Ratio */}
        <div className="space-y-1.5 rounded-xl border border-white/[0.04] bg-white/[0.01] p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300">Debt Ratio %</span>
            <span className="font-mono text-blue-300 font-bold">{(debtRatio * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min={0.0}
            max={1.0}
            step={0.01}
            value={debtRatio}
            onChange={(e) => setDebtRatio(parseFloat(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-blue-400"
          />
        </div>

        {/* Lever 3: ROA */}
        <div className="space-y-1.5 rounded-xl border border-white/[0.04] bg-white/[0.01] p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300">Return on Assets (ROA)</span>
            <span className="font-mono text-purple-300 font-bold">{(roa * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min={0.0}
            max={1.0}
            step={0.01}
            value={roa}
            onChange={(e) => setRoa(parseFloat(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-purple-400"
          />
        </div>
      </div>
    </div>
  );
}
