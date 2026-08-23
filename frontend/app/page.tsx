"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { RiskGauge } from "@/components/risk-gauge";
import { FeatureImportanceChart } from "@/components/feature-importance-chart";
import { AgentReportDeck } from "@/components/agent-report-card";
import { ScenarioForm } from "@/components/scenario-form";
import { WhatIfSandbox } from "@/components/what-if-sandbox";
import { HistoryLog } from "@/components/history-log";
import { DEMO_PRESETS } from "@/lib/constants";
import { CompanyFeatures, PredictionResult } from "@/lib/types";
import { runPrediction } from "@/lib/api";
import { ShieldCheck, Database, Layers, Sparkles } from "lucide-react";

const HISTORY_STORAGE_KEY = "verdyx_prediction_history";

export default function DashboardPage() {
  // Default to High Risk preset on initial load to demonstrate contrast immediately
  const initialFeatures = DEMO_PRESETS[0].features;
  const [currentFeatures, setCurrentFeatures] = useState<CompanyFeatures>(initialFeatures);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [showDocsModal, setShowDocsModal] = useState<boolean>(false);
  const [history, setHistory] = useState<PredictionResult[]>([]);
  // Remounts the form when a scenario is loaded from history so its internal
  // slider state re-initializes from the restored features.
  const [formKey, setFormKey] = useState<number>(0);

  // Load history & initial prediction on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Failed to load history from localStorage:", e);
    }
    handleRunAnalysis(initialFeatures);
  }, []);

  const handleRunAnalysis = async (features: CompanyFeatures) => {
    setIsLoading(true);
    setCurrentFeatures(features);

    // Simulated progress steps for visual feedback
    setLoadingStep("1/3 Running RandomForestClassifier.predict_proba()...");
    setTimeout(() => {
      setLoadingStep("2/3 Invoking Finance & Market Agents in parallel (Groq 120B)...");
    }, 300);
    setTimeout(() => {
      setLoadingStep("3/3 Synthesizing Risk & Decision verdicts in LangGraph...");
    }, 600);

    try {
      const data = await runPrediction(features);
      setResult(data);

      // Save to localStorage history
      setHistory((prev) => {
        const updated = [data, ...prev.filter((p) => p.prediction_id !== data.prediction_id)].slice(0, 12);
        try {
          localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.warn("Failed to save history to localStorage:", e);
        }
        return updated;
      });
    } catch (error) {
      console.error("Failed to run prediction:", error);
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handleLoadFromHistory = (item: PredictionResult) => {
    if (item.company_features) {
      setCurrentFeatures(item.company_features);
      setFormKey((k) => k + 1); // force ScenarioForm remount with restored values
    }
    setResult(item);
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  const handleClearHistory = () => {
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (e) {
      console.warn("Failed to clear localStorage:", e);
    }
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar onOpenDocs={() => setShowDocsModal(true)} />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        
        {/* Hero Title & Context Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-slate-950 via-[#0c1322] to-slate-950 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300">
                <Sparkles className="h-3.5 w-3.5" />
                Empirical ML • Multi-Agent Synthesis
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Enterprise Strategic Distress & Solvency Intelligence
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed">
                Quantitative ML prediction is architecturally prior to qualitative LLM interpretation. The Random Forest generates the distress probability first — 4 specialized agents explain why.
              </p>
            </div>

            {/* Architecture Metrics Pills */}
            <div className="flex flex-wrap gap-2 sm:gap-3 lg:flex-col lg:items-end">
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2 text-xs">
                <Database className="h-4 w-4 text-emerald-400" />
                <span className="text-slate-400">Dataset:</span>
                <span className="font-semibold text-white">UCI Taiwanese (6,819 Firms)</span>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2 text-xs">
                <ShieldCheck className="h-4 w-4 text-blue-400" />
                <span className="text-slate-400">Model AUC:</span>
                <span className="font-mono font-bold text-cyan-300">0.9253 (10-Feature RF, 200 Trees)</span>
              </div>
            </div>

          </div>
        </div>

        {/* SECTION 1: SCENARIO INPUT FORM */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-white tracking-tight">
                1. Financial Health Input Form
              </h2>
              <p className="text-xs text-slate-400">
                Enter corporate balance sheet ratios or pick a pre-configured scenario
              </p>
            </div>
            {isLoading && (
              <span className="font-mono text-xs text-cyan-400 animate-pulse">
                {loadingStep}
              </span>
            )}
          </div>

          <ScenarioForm
            key={formKey}
            initialFeatures={currentFeatures}
            isLoading={isLoading}
            onSubmit={handleRunAnalysis}
          />
        </section>

        {/* SECTION 2: RESULTS & DECISION DASHBOARD */}
        {result && result.status === "completed" && result.distress_probability !== null && (
          <section className="space-y-6 pt-4 border-t border-white/[0.08]">
            <div>
              <h2 className="text-lg font-extrabold text-white tracking-tight">
                2. Decision Intelligence & Multi-Agent Verdict
              </h2>
              <p className="text-xs text-slate-400">
                Audited prediction output, Gini feature attribution, and specialist agent reports
              </p>
            </div>

            {/* Top Grid: Gauge + Feature Importance + What-If */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              
              {/* Radial Risk Gauge (4 cols) */}
              <div className="lg:col-span-4">
                <RiskGauge
                  probability={result.distress_probability}
                  riskTier={result.risk_tier ?? "Unknown"}
                  confidence={result.final_verdict?.confidence ?? 0.0}
                />
              </div>

              {/* Feature Importance Attribution (8 cols) */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                <FeatureImportanceChart factors={result.top_factors} />
                <WhatIfSandbox
                  currentFeatures={currentFeatures}
                  baseProbability={result.distress_probability}
                />
              </div>

            </div>

            {/* Bottom Grid: 4-Agent Domain Deck */}
            {result.agent_reports && result.final_verdict && (
              <div className="pt-2">
                <AgentReportDeck
                  reports={result.agent_reports}
                  verdict={result.final_verdict}
                />
              </div>
            )}

          </section>
        )}

        {/* SECTION 3: SCENARIO EVALUATION HISTORY (LOCALSTORAGE) */}
        <section className="pt-4 border-t border-white/[0.08]">
          <HistoryLog
            history={history}
            onSelect={handleLoadFromHistory}
            onClear={handleClearHistory}
          />
        </section>

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/[0.08] bg-[#070a12] py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Verdyx — ML-Powered Multi-Agent Decision Intelligence</span>
          <span>Jadavpur University Academic Project</span>
        </div>
      </footer>

      {/* Architecture Modal */}
      {showDocsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-2xl w-full rounded-2xl border border-white/10 bg-[#0c1220] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-cyan-400" />
                <h3 className="font-bold text-white">System Architecture & Core Invariant</h3>
              </div>
              <button
                onClick={() => setShowDocsModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] p-3">
                <strong className="text-emerald-300">The Verdyx Invariant:</strong>
                <p className="mt-1 text-slate-300">
                  The ML model computes distress probability <em>first</em> from 6,819 verified historical company samples. The LLM agents only interpret that prediction — they never generate or alter the number.
                </p>
              </div>

              <div>
                <strong className="text-white">Pipeline Execution Order:</strong>
                <ol className="list-decimal list-inside mt-1 space-y-1 text-slate-400">
                  <li><strong>Form Submission:</strong> 10 key ratios submitted directly to the 10-feature RandomForest (no imputation).</li>
                  <li><strong>RandomForest:</strong> In-memory inference outputs probability score & top features (AUC 0.9253).</li>
                  <li><strong>Finance & Market Agents:</strong> Concurrently analyze solvency and profitability.</li>
                  <li><strong>Risk Agent:</strong> Synthesizes cross-domain failure modes.</li>
                  <li><strong>Decision Agent:</strong> Produces final executive verdict.</li>
                </ol>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowDocsModal(false)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
