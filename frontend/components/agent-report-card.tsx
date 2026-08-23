"use client";

import React, { useState } from "react";
import { DollarSign, TrendingUp, AlertOctagon, Scale, Copy, Check } from "lucide-react";
import { AgentReports, FinalVerdict } from "@/lib/types";

export function AgentReportDeck({ reports, verdict }: { reports: AgentReports; verdict: FinalVerdict }) {
  const [copied, setCopied] = useState<number | null>(null);
  const copy = (t: string, i: number) => {
    navigator.clipboard.writeText(t);
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  };

  const agents = [
    { id: "finance", title: "Finance Agent", role: "Debt & loan safety", Icon: DollarSign, text: reports.finance },
    { id: "market", title: "Market Agent", role: "Profits & business health", Icon: TrendingUp, text: reports.market },
    { id: "risk", title: "Risk Agent", role: "What could go wrong", Icon: AlertOctagon, text: reports.risk },
    { id: "decision", title: "Decision", role: `${verdict.tier} · ${Math.round(verdict.confidence * 100)}% confidence`, Icon: Scale, text: verdict.reasoning },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">What our AI agents found</h3>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">4 specialist AI agents</span>
      </div>
      <p className="text-xs text-slate-500">Each agent reads the prediction and explains a different angle. They never make up the numbers.</p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {agents.map((a, i) => {
          const Icon = a.Icon;
          return (
            <div key={a.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{a.title}</div>
                    <div className="text-xs text-slate-500">{a.role}</div>
                  </div>
                </div>
                <button
                  onClick={() => copy(a.text, i)}
                  className="rounded-full border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  title="Copy"
                >
                  {copied === i ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p className="whitespace-pre-line text-sm leading-6 text-slate-700">{a.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
