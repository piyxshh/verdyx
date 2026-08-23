"use client";

import React, { useState } from "react";
import { FORM_FIELDS, DEMO_PRESETS } from "@/lib/constants";
import { CompanyFeatures } from "@/lib/types";
import { Play, RotateCcw } from "lucide-react";

interface ScenarioFormProps {
  initialFeatures: CompanyFeatures;
  isLoading: boolean;
  onSubmit: (features: CompanyFeatures) => void;
}

export function ScenarioForm({ initialFeatures, isLoading, onSubmit }: ScenarioFormProps) {
  const [features, setFeatures] = useState<CompanyFeatures>(initialFeatures);
  const [activePreset, setActivePreset] = useState<string | null>("high-risk");

  const handleFieldChange = (key: keyof CompanyFeatures, value: number) => {
    setFeatures((prev) => ({ ...prev, [key]: value }));
    setActivePreset(null);
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

  const solvencyFields = Object.entries(FORM_FIELDS).filter(([_, c]) => c.category === "solvency");
  const operationsFields = Object.entries(FORM_FIELDS).filter(([_, c]) => c.category === "operations");

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Presets — minimal pills */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium text-slate-600">Try a preset</p>
          <button
            type="button"
            onClick={resetToMedians}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {DEMO_PRESETS.map((preset) => {
            const isSelected = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={`rounded-xl border px-3.5 py-3 text-left transition ${
                  isSelected
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{preset.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      isSelected
                        ? "bg-white/15 text-white"
                        : preset.risk_tier === "High Risk"
                        ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                        : preset.risk_tier === "Medium Risk"
                        ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                        : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    }`}
                  >
                    {preset.risk_tier}
                  </span>
                </div>
                <p className={`mt-1 text-xs leading-5 ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                  {preset.tagline}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inputs — two clean cards */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Debt & Safety</h3>
              <p className="text-xs text-slate-500">How much debt does the company carry? · 6 inputs</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">6</span>
          </div>
          <div className="space-y-4">
            {solvencyFields.map(([key, config]) => {
              const val = (features[key] as number) ?? config.default_median;
              const isHealthy = config.healthy_direction === "lower" ? val <= config.default_median : val >= config.default_median;
              return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-medium text-slate-700">{config.label}</label>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${isHealthy ? "bg-emerald-500" : "bg-red-400"}`} title={isHealthy ? "Healthy range" : "Risky range"} />
                    <input
                      type="number"
                      min={config.min}
                      max={config.max}
                      step={config.step}
                      value={Number.isFinite(features[key] as number) ? features[key] : config.default_median}
                      onChange={(e) => handleFieldChange(key, parseFloat(e.target.value) || 0)}
                      className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right text-xs font-medium text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
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
                  className="h-1.5 w-full accent-slate-900"
                />
                <p className="text-xs leading-4 text-slate-500">{config.description}</p>
              </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Profits & Performance</h3>
              <p className="text-xs text-slate-500">Is the company making enough money? · 4 inputs</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">4</span>
          </div>
          <div className="space-y-4">
            {operationsFields.map(([key, config]) => {
              const val = (features[key] as number) ?? config.default_median;
              const isHealthy = config.healthy_direction === "lower" ? val <= config.default_median : val >= config.default_median;
              return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-medium text-slate-700">{config.label}</label>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${isHealthy ? "bg-emerald-500" : "bg-red-400"}`} title={isHealthy ? "Healthy range" : "Risky range"} />
                    <input
                      type="number"
                      min={config.min}
                      max={config.max}
                      step={config.step}
                      value={Number.isFinite(features[key] as number) ? features[key] : config.default_median}
                      onChange={(e) => handleFieldChange(key, parseFloat(e.target.value) || 0)}
                      className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right text-xs font-medium text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
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
                  className="h-1.5 w-full accent-slate-900"
                />
                <p className="text-xs leading-4 text-slate-500">{config.description}</p>
              </div>
              );
            })}
          </div>
          <p className="mt-5 rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-600 ring-1 ring-slate-200">
            <span className="font-semibold text-slate-900">10 inputs.</span> Each slider directly changes the AI prediction — what you see is what drives the result.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              AI is analyzing…
            </>
          ) : (
            <>
              <Play className="h-4 w-4" /> Analyze this company
            </>
          )}
        </button>
      </div>
    </form>
  );
}
