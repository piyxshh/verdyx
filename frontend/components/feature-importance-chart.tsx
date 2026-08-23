"use client";

import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { TopFactor } from "@/lib/types";
import { BarChart3 } from "lucide-react";

interface FeatureImportanceChartProps {
  factors: TopFactor[];
}

export function FeatureImportanceChart({ factors }: FeatureImportanceChartProps) {
  // Format factor data for Recharts
  const chartData = factors.slice(0, 5).map((f) => {
    // Shorten label for clean display
    let shortName = f.feature;
    if (shortName.length > 26) {
      shortName = shortName.slice(0, 24) + "...";
    }
    return {
      name: shortName,
      fullName: f.feature,
      importance: Number((f.importance * 100).toFixed(2)),
    };
  });

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c1220]/70 p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between">
      
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Top Contributing Factors
            </h3>
            <p className="text-[11px] text-slate-400">
              Gini Feature Importance (MDI) attribution
            </p>
          </div>
        </div>
        <span className="rounded bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-300">
          RandomForest (200 Trees)
        </span>
      </div>

      {/* Recharts Bar Chart */}
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <XAxis
              type="number"
              domain={[0, "dataMax + 1"]}
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={{ stroke: "#1e293b" }}
              tickLine={false}
              unit="%"
            />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
              axisLine={{ stroke: "#1e293b" }}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-2.5 text-xs shadow-2xl backdrop-blur-md">
                      <div className="font-semibold text-white">{data.fullName}</div>
                      <div className="mt-1 font-mono text-cyan-400">
                        Relative Weight: {data.importance}%
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="importance" radius={[0, 6, 6, 0]}>
              {chartData.map((_, index) => {
                const colors = ["#38bdf8", "#60a5fa", "#818cf8", "#a78bfa", "#c084fc"];
                return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 text-right">
        <span className="text-[10px] text-slate-400 italic">
          Higher bar = greater influence on model distress prediction
        </span>
      </div>

    </div>
  );
}
