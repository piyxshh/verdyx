"use client";

import React, { useState, useEffect } from "react";
import { SlidersHorizontal } from "lucide-react";
import { CompanyFeatures } from "@/lib/types";

export function WhatIfSandbox({ currentFeatures, baseProbability }: { currentFeatures: CompanyFeatures; baseProbability: number }) {
  const [borrowingDep, setBorrowingDep] = useState(currentFeatures["Borrowing dependency"] ?? 0.37);
  const [debtRatio, setDebtRatio] = useState(currentFeatures["Debt ratio %"] ?? 0.11);
  const [roa, setRoa] = useState(currentFeatures["Net Income to Total Assets"] ?? 0.81);

  useEffect(() => {
    setBorrowingDep(currentFeatures["Borrowing dependency"] ?? 0.37);
    setDebtRatio(currentFeatures["Debt ratio %"] ?? 0.11);
    setRoa(currentFeatures["Net Income to Total Assets"] ?? 0.81);
  }, [currentFeatures]);

  const depDelta = (borrowingDep - (currentFeatures["Borrowing dependency"] ?? 0.37)) * 0.45;
  const debtDelta = (debtRatio - (currentFeatures["Debt ratio %"] ?? 0.11)) * 0.35;
  const roaDelta = ((currentFeatures["Net Income to Total Assets"] ?? 0.81) - roa) * 0.3;
  const simulated = Math.max(0.04, Math.min(0.96, baseProbability + depDelta + debtDelta + roaDelta));
  const delta = Math.round((simulated - baseProbability) * 100);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white">
            <SlidersHorizontal className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">What-if playground</h3>
            <p className="text-xs text-slate-500">Drag the sliders to see how changes affect the risk score</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-slate-900">{Math.round(simulated * 100)}% <span className={`text-xs ${delta > 0 ? "text-red-600" : delta < 0 ? "text-emerald-600" : "text-slate-500"}`}>{delta !== 0 ? `(${delta > 0 ? "+" : ""}${delta}%)` : ""}</span></div>
          <div className="text-xs text-slate-500">estimated risk</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Loan Reliance", value: borrowingDep, set: setBorrowingDep, display: `${Math.round(borrowingDep * 100)}%` },
          { label: "Total Debt", value: debtRatio, set: setDebtRatio, display: `${Math.round(debtRatio * 100)}%` },
          { label: "Asset Productivity", value: roa, set: setRoa, display: `${Math.round(roa * 100)}%` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">{s.label}</span>
              <span className="font-mono font-medium text-slate-900">{s.display}</span>
            </div>
            <input type="range" min={0} max={1} step={0.01} value={s.value} onChange={(e) => s.set(parseFloat(e.target.value))} className="h-1.5 w-full accent-slate-900" />
          </div>
        ))}
      </div>
    </div>
  );
}
