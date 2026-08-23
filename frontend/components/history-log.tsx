"use client";

import React from "react";
import { PredictionResult } from "@/lib/types";
import { History, Trash2 } from "lucide-react";

export function HistoryLog({ history, onSelect, onClear }: { history: PredictionResult[]; onSelect: (item: PredictionResult) => void; onClear: () => void }) {
  if (!history.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        No evaluations yet. Run a scenario above to see history here.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white">
            <History className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Recent evaluations</h3>
            <p className="text-xs text-slate-500">{history.length} saved locally</p>
          </div>
        </div>
        <button onClick={onClear} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
          <Trash2 className="h-3.5 w-3.5" /> Clear
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {history.slice(0, 6).map((item) => {
          const pct = Math.round((item.distress_probability ?? 0) * 100);
          const badge =
            pct >= 60
              ? "bg-red-50 text-red-700 ring-red-200"
              : pct >= 30
              ? "bg-amber-50 text-amber-700 ring-amber-200"
              : "bg-emerald-50 text-emerald-700 ring-emerald-200";
          return (
            <div key={item.prediction_id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${badge}`}>{item.risk_tier}</span>
                  <span className="text-xs font-semibold text-slate-900">{pct}%</span>
                </div>
                <div className="text-xs text-slate-500">{new Date(item.created_at).toLocaleTimeString()} · {item.prediction_id.slice(-6)}</div>
              </div>
              <button onClick={() => onSelect(item)} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-900 hover:text-white">
                Load
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
