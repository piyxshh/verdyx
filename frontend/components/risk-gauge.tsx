"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, ShieldAlert, Zap } from "lucide-react";

interface RiskGaugeProps {
  probability: number; // 0.0 to 1.0
  riskTier: string;
  confidence: number;
}

export function RiskGauge({ probability, riskTier, confidence }: RiskGaugeProps) {
  const percentage = Math.round(probability * 100);
  
  // Theme styling based on risk score
  const isHighRisk = probability >= 0.60;
  const isMediumRisk = probability >= 0.30 && probability < 0.60;

  const colorConfig = isHighRisk
    ? {
        stroke: "#f43f5e",
        text: "text-rose-400",
        bgBadge: "bg-rose-500/10 border-rose-500/30 text-rose-400",
        label: "Acute Distress Risk",
        glow: "shadow-rose-500/20",
        icon: ShieldAlert,
      }
    : isMediumRisk
    ? {
        stroke: "#f59e0b",
        text: "text-amber-400",
        bgBadge: "bg-amber-500/10 border-amber-500/30 text-amber-400",
        label: "Moderate Operational Risk",
        glow: "shadow-amber-500/20",
        icon: AlertTriangle,
      }
    : {
        stroke: "#10b981",
        text: "text-emerald-400",
        bgBadge: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
        label: "Low Distress Risk (Solvent)",
        glow: "shadow-emerald-500/20",
        icon: CheckCircle2,
      };

  const IconComponent = colorConfig.icon;

  // Arc calculation for SVG
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * (circumference * 0.75); // 270-degree arc

  return (
    <div className="relative flex flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-[#0c1220]/70 p-6 backdrop-blur-xl shadow-xl">
      
      {/* Risk Tier Badge */}
      <div className="mb-2 flex items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${colorConfig.bgBadge}`}>
          <IconComponent className="h-3.5 w-3.5" />
          {riskTier}
        </span>
      </div>

      {/* SVG Radial Meter */}
      <div className="relative flex h-52 w-52 items-center justify-center">
        <svg className="h-full w-full -rotate-135 transform" viewBox="0 0 200 200">
          {/* Background Track Arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="transparent"
            stroke="#1a2438"
            strokeWidth="14"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            strokeLinecap="round"
          />

          {/* Active Colored Arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="transparent"
            stroke={colorConfig.stroke}
            strokeWidth="14"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 8px ${colorConfig.stroke}66)`,
            }}
          />
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Distress Probability
          </span>
          <div className="flex items-baseline">
            <span className={`font-mono text-4xl font-black tracking-tight ${colorConfig.text}`}>
              {percentage}
            </span>
            <span className={`font-mono text-xl font-bold ${colorConfig.text}`}>%</span>
          </div>
          <span className="mt-1 text-[11px] text-slate-400">
            P(Insolvency | X)
          </span>
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="mt-2 grid w-full grid-cols-2 gap-2 border-t border-white/[0.06] pt-3 text-center">
        <div className="rounded-lg bg-white/[0.02] p-2">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Model Confidence</div>
          <div className="font-mono text-sm font-semibold text-slate-200">{(confidence * 100).toFixed(0)}%</div>
        </div>
        <div className="rounded-lg bg-white/[0.02] p-2">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Decision Engine</div>
          <div className="text-xs font-semibold text-blue-400 flex items-center justify-center gap-1">
            <Zap className="h-3 w-3" /> ML Prior
          </div>
        </div>
      </div>

    </div>
  );
}
