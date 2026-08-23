"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

interface RiskGaugeProps {
  probability: number;
  riskTier: string;
  confidence: number;
}

export function RiskGauge({ probability, riskTier, confidence }: RiskGaugeProps) {
  const percentage = Math.round(probability * 100);
  const isHigh = probability >= 0.6;
  const isMed = probability >= 0.3 && probability < 0.6;

  const cfg = isHigh
    ? { stroke: "#e11d48", label: "High risk", Icon: ShieldAlert, badge: "bg-red-50 text-red-700 ring-red-200" }
    : isMed
    ? { stroke: "#d97706", label: "Medium risk", Icon: AlertTriangle, badge: "bg-amber-50 text-amber-700 ring-amber-200" }
    : { stroke: "#059669", label: "Low risk", Icon: CheckCircle2, badge: "bg-emerald-50 text-emerald-700 ring-emerald-200" };

  const Icon = cfg.Icon;
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * (circumference * 0.75);

  return (
    <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${cfg.badge}`}>
        <Icon className="h-3.5 w-3.5" /> {riskTier}
      </span>
      <p className="mt-1 text-xs text-slate-500">{cfg.label}</p>

      <div className="relative mt-3 flex h-48 w-48 items-center justify-center">
        <svg className="h-full w-full -rotate-135" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r={radius} fill="transparent" stroke="#e2e8f0" strokeWidth="12" strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`} strokeLinecap="round" />
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="transparent"
            stroke={cfg.stroke}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-medium tracking-wide text-slate-500">Risk Level</span>
          <span className="flex items-baseline gap-0.5">
            <span className="text-4xl font-bold tracking-tight text-slate-900">{percentage}</span>
            <span className="text-lg font-semibold text-slate-700">%</span>
          </span>
          <span className="text-xs text-slate-500">chance of financial trouble</span>
        </div>
      </div>

      <div className="mt-4 grid w-full grid-cols-2 gap-2 border-t border-slate-200 pt-4 text-center">
        <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
          <div className="text-xs text-slate-500">Confidence</div>
          <div className="text-sm font-semibold text-slate-900">{Math.round(confidence * 100)}%</div>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
          <div className="text-xs text-slate-500">AI Model</div>
          <div className="text-xs font-semibold text-slate-900">Trained on 6,819 firms</div>
        </div>
      </div>
    </div>
  );
}
