"use client";

import React, { useState } from "react";
import { DollarSign, TrendingUp, AlertOctagon, Scale, Copy, Check } from "lucide-react";
import { AgentReports, FinalVerdict } from "@/lib/types";

interface AgentReportDeckProps {
  reports: AgentReports;
  verdict: FinalVerdict;
}

export function AgentReportDeck({ reports, verdict }: AgentReportDeckProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const agents = [
    {
      id: "finance",
      title: "Finance Agent",
      role: "Solvency & Gearing Specialist",
      icon: DollarSign,
      color: "blue",
      borderColor: "border-blue-500/20",
      accentBg: "bg-blue-500/10 text-blue-400",
      reportText: reports.finance,
      keyInputs: "Borrowing dependency, Debt ratio %, Debt/Net worth",
    },
    {
      id: "market",
      title: "Market Agent",
      role: "Operations & Profitability Specialist",
      icon: TrendingUp,
      color: "purple",
      borderColor: "border-purple-500/20",
      accentBg: "bg-purple-500/10 text-purple-400",
      reportText: reports.market,
      keyInputs: "Persistent EPS, Return on Assets (ROA), Profit margins",
    },
    {
      id: "risk",
      title: "Risk Agent",
      role: "Compound Failure Mode Detector",
      icon: AlertOctagon,
      color: "amber",
      borderColor: "border-amber-500/20",
      accentBg: "bg-amber-500/10 text-amber-400",
      reportText: reports.risk,
      keyInputs: "Synthesizes Finance + Market reports for compounding shocks",
    },
    {
      id: "decision",
      title: "Decision Agent",
      role: "Executive Verdict Synthesizer",
      icon: Scale,
      color: "rose",
      borderColor: "border-rose-500/20",
      accentBg: "bg-rose-500/10 text-rose-400",
      reportText: verdict.reasoning,
      keyInputs: `Synthesized Risk Tier: ${verdict.tier} (Confidence: ${(verdict.confidence * 100).toFixed(0)}%)`,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Multi-Agent Domain Interpretations
          </h3>
          <p className="text-xs text-slate-400">
            Agents contextualize the prediction — they never generate the probability
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium text-slate-300">
          LangGraph Orchestration
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {agents.map((agent, index) => {
          const Icon = agent.icon;
          const isCopied = copiedIndex === index;

          return (
            <div
              key={agent.id}
              className={`flex flex-col justify-between rounded-2xl border ${agent.borderColor} bg-[#0c1220]/80 p-5 shadow-lg backdrop-blur-xl transition-all hover:border-white/20`}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${agent.accentBg}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{agent.title}</h4>
                      <p className="text-[11px] font-medium text-slate-400">{agent.role}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => copyText(agent.reportText, index)}
                    title="Copy report"
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition-colors hover:border-white/20 hover:text-white"
                  >
                    {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {/* Report Content */}
                <div className="mt-3.5 text-xs leading-relaxed text-slate-300">
                  <p className="whitespace-pre-line">{agent.reportText}</p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-4 border-t border-white/[0.06] pt-2.5">
                <span className="text-[10px] font-medium text-slate-400">
                  <span className="font-semibold text-slate-300">Focus: </span>
                  {agent.keyInputs}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
