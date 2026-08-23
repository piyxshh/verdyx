"use client";

import React, { useState } from "react";
import { FORM_FIELDS, DEMO_PRESETS } from "@/lib/constants";
import { CompanyFeatures } from "@/lib/types";
import { Sparkles, Play, RotateCcw } from "lucide-react";

interface ScenarioFormProps {
  initialFeatures: CompanyFeatures;
  isLoading: boolean;
  onSubmit: (features: CompanyFeatures) => void;
}

export function ScenarioForm({ initialFeatures, isLoading, onSubmit }: ScenarioFormProps) {
  const [features, setFeatures] = useState<CompanyFeatures>(initialFeatures);
  const [activePreset, setActivePreset] = useState<string | null>("high-risk");

  const handleFieldChange = (key: keyof CompanyFeatures, value: number) => {
    setFeatures((prev) => ({
      ...prev,
      [key]: value,
    }));
    setActivePreset(null); // Custom tweaking
  };

  const applyPreset = (presetId: string) => {
    const preset = DEMO_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setFeatures(preset.features);
      setActivePreset(preset.id);
    }
  };

  const resetToMedians = () => {
    const medians: Partial<CompanyFeatures> = {};
    Object.entries(FORM_FIELDS).forEach(([key, config]) => {
      medians[key as keyof CompanyFeatures] = config.default_median;
    });
    setFeatures(medians as CompanyFeatures);
    setActivePreset(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(features);
  };

  // Group features into two clean columns: Solvency vs Operations
  const solvencyFields = Object.entries(FORM_FIELDS).filter(([_, config]) => config.category === "solvency");
  const operationsFields = Object.entries(FORM_FIELDS).filter(([_, config]) => config.category === "operations");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* 1-Click Preset Selector Bar */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0c1220]/90 p-4 shadow-xl backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Instant Demonstration Presets
            </span>
          </div>
          <button
            type="button"
            onClick={resetToMedians}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-200"
          >
            <RotateCcw className="h-3 w-3" />
            Reset to Dataset Medians
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {DEMO_PRESETS.map((preset) => {
            const isSelected = activePreset === preset.id;
            const borderGlow =
              preset.risk_tier === "High Risk"
                ? "border-rose-500/40 bg-rose-500/[0.08] text-rose-300"
                : preset.risk_tier === "Medium Risk"
                ? "border-amber-500/40 bg-amber-500/[0.08] text-amber-300"
                : "border-emerald-500/40 bg-emerald-500/[0.08] text-emerald-300";

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? borderGlow
                    : "border-white/[0.06] bg-white/[0.02] text-slate-300 hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-xs font-bold text-white">{preset.name}</span>
                  <span className="text-[10px] font-semibold uppercase">{preset.risk_tier}</span>
                </div>
                <p className="mt-1 text-[11px] leading-tight text-slate-400">
                  {preset.tagline}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2-Column Ratio Inputs: Solvency vs Operations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* Card 1: Solvency & Capital Structure */}
        <div className="rounded-2xl border border-blue-500/20 bg-[#0c1220]/70 p-5 shadow-xl backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div>
              <h3 className="text-sm font-bold text-blue-300">Solvency & Capital Structure</h3>
              <p className="text-[11px] text-slate-400">Evaluated by Finance & Risk Agents</p>
            </div>
            <span className="rounded bg-blue-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-blue-400">
              6 Ratios
            </span>
          </div>

          <div className="space-y-4">
            {solvencyFields.map(([key, config]) => (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">{config.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Median: {config.default_median}</span>
                    <input
                      type="number"
                      min={config.min}
                      max={config.max}
                      step={config.step}
                      value={features[key] ?? config.default_median}
                      onChange={(e) => handleFieldChange(key, parseFloat(e.target.value) || 0)}
                      className="w-16 rounded border border-white/10 bg-[#070b14] px-1.5 py-0.5 text-right font-mono text-xs font-semibold text-cyan-300 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <input
                  type="range"
                  min={config.min}
                  max={config.max}
                  step={config.step}
                  value={features[key] ?? config.default_median}
                  onChange={(e) => handleFieldChange(key, parseFloat(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-blue-500"
                />

                <p className="text-[10px] text-slate-400 leading-tight">
                  {config.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Operations & Profitability */}
        <div className="rounded-2xl border border-purple-500/20 bg-[#0c1220]/70 p-5 shadow-xl backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div>
              <h3 className="text-sm font-bold text-purple-300">Operations & Profitability</h3>
              <p className="text-[11px] text-slate-400">Evaluated by Market & Risk Agents</p>
            </div>
            <span className="rounded bg-purple-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-purple-400">
              4 Ratios
            </span>
          </div>

          <div className="space-y-4">
            {operationsFields.map(([key, config]) => (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">{config.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Median: {config.default_median}</span>
                    <input
                      type="number"
                      min={config.min}
                      max={config.max}
                      step={config.step}
                      value={features[key] ?? config.default_median}
                      onChange={(e) => handleFieldChange(key, parseFloat(e.target.value) || 0)}
                      className="w-16 rounded border border-white/10 bg-[#070b14] px-1.5 py-0.5 text-right font-mono text-xs font-semibold text-purple-300 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <input
                  type="range"
                  min={config.min}
                  max={config.max}
                  step={config.step}
                  value={features[key] ?? config.default_median}
                  onChange={(e) => handleFieldChange(key, parseFloat(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-purple-500"
                />

                <p className="text-[10px] text-slate-400 leading-tight">
                  {config.description}
                </p>
              </div>
            ))}
          </div>

          {/* Model Info Badge */}
          <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-300">💡 10-Feature Direct Model: </span>
            All 10 ratios are modeled directly by the RandomForest (AUC 0.9253) — no median imputation. Each slider movement directly shifts the distress probability.
          </div>
        </div>

      </div>

      {/* Primary Submit Action */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] hover:shadow-cyan-500/35 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Running ML & Multi-Agent Inference...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-white" />
              <span>Evaluate Enterprise Scenario</span>
            </>
          )}
        </button>
      </div>

    </form>
  );
}
