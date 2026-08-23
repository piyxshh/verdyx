"use client";

import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { TopFactor } from "@/lib/types";

export function FeatureImportanceChart({ factors }: { factors: TopFactor[] }) {
  const chartData = factors.slice(0, 5).map((f) => ({
    name: f.feature.length > 24 ? f.feature.slice(0, 22) + "…" : f.feature,
    fullName: f.feature,
    importance: Number((f.importance * 100).toFixed(2)),
  }));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Why this result?</h3>
          <p className="text-xs text-slate-500">Which inputs mattered most to the AI</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Top 5</span>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <XAxis type="number" domain={[0, "dataMax + 1"]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} unit="%" />
            <YAxis type="category" dataKey="name" width={150} tick={{ fill: "#334155", fontSize: 11, fontWeight: 500 }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload?.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
                      <div className="font-medium text-slate-900">{d.fullName}</div>
                      <div className="font-mono text-slate-600">{d.importance}% influence</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="importance" radius={[0, 8, 8, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={["#0f172a", "#334155", "#475569", "#64748b", "#94a3b8"][i % 5]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-right text-xs text-slate-500">Longer bar = this input had more impact on the AI’s decision</p>
    </div>
  );
}
