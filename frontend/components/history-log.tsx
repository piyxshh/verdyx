"use client";

import React from "react";
import { PredictionResult } from "@/lib/types";
import { History, RotateCcw, Trash2, ArrowRight } from "lucide-react";

interface HistoryLogProps {
  history: PredictionResult[];
  onSelect: (item: PredictionResult) => void;
  onClear: () => void;
}

export function HistoryLog({ history, onSelect, onClear }: HistoryLogProps) {
  if (!history || history.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c1220]/70 p-5 shadow-xl backdrop-blur-xl space-y-4">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <History className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Scenario Evaluation History</h3>
            <p className="text-[11px] text-slate-400">Saved locally in browser localStorage (Zero Cloud Dependency)</p>
          </div>
        </div>

        <button
          onClick={onClear}
          className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[11px] text-slate-400 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300 transition-all"
        >
          <Trash2 className="h-3 w-3" />
          Clear Log
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {history.slice(0, 6).map((item) => {
          const prob = Math.round((item.distress_probability ?? 0) * 100);
          const isHigh = prob >= 60;
          const isMed = prob >= 30 && prob < 60;

          const badgeColor = isHigh
            ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
            : isMed
            ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";

          return (
            <div
              key={item.prediction_id}
              className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.01] p-3 transition-all hover:border-white/20 hover:bg-white/[0.03]"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${badgeColor}`}>
                    {item.risk_tier ?? "Evaluated"}
                  </span>
                  <span className="font-mono text-xs font-bold text-white">
                    {prob}% Distress
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })} • ID: {item.prediction_id.slice(-6)}
                </div>
              </div>

              <button
                onClick={() => onSelect(item)}
                className="flex items-center gap-1 rounded-lg bg-blue-500/10 px-2.5 py-1.5 text-xs font-medium text-blue-300 hover:bg-blue-500/20 hover:text-white transition-all"
                title="Restore scenario in form"
              >
                <span>Load</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
