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

const HISTORY_STORAGE_KEY = "verdyx_prediction_history";

export default function DashboardPage() {
  const initialFeatures = DEMO_PRESETS[0].features;
  const [currentFeatures, setCurrentFeatures] = useState<CompanyFeatures>(initialFeatures);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [showDocsModal, setShowDocsModal] = useState<boolean>(false);
  const [history, setHistory] = useState<PredictionResult[]>([]);
  const [formKey, setFormKey] = useState<number>(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) setHistory(JSON.parse(saved));
    } catch (e) {
      console.warn("Failed to load history:", e);
    }
    handleRunAnalysis(initialFeatures);
  }, []);

  const handleRunAnalysis = async (features: CompanyFeatures) => {
    setIsLoading(true);
    setCurrentFeatures(features);
    setLoadingStep("Checking company numbers…");
    setTimeout(() => setLoadingStep("AI agents are reading the data…"), 800);
    setTimeout(() => setLoadingStep("Preparing final verdict…"), 1600);
    try {
      const data = await runPrediction(features);
      setResult(data);
      setHistory((prev) => {
        const updated = [data, ...prev.filter((p) => p.prediction_id !== data.prediction_id)].slice(0, 12);
        try {
          localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.warn("Failed to save history:", e);
        }
        return updated;
      });
    } catch (error) {
      console.error("Prediction failed:", error);
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handleLoadFromHistory = (item: PredictionResult) => {
    if (item.company_features) {
      setCurrentFeatures(item.company_features);
      setFormKey((k) => k + 1);
    }
    setResult(item);
    window.scrollTo({ top: 380, behavior: "smooth" });
  };

  const handleClearHistory = () => {
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {}
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col">
      <Navbar onOpenDocs={() => setShowDocsModal(true)} />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Intro — minimal */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Company Health Analyzer
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Enter a company’s financial numbers below. Our AI model predicts the risk first, then 4 specialist agents explain <em>why</em> — in plain English.
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
              Trained on 6,819 real companies
            </span>
          </p>
        </div>

        {/* Section 1: Input */}
        <section className="mb-10">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-slate-900">
              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                1
              </span>
              Enter company data
            </h2>
            {isLoading && (
              <span className="text-xs font-medium text-slate-500 animate-pulse">{loadingStep}</span>
            )}
          </div>
          <ScenarioForm key={formKey} initialFeatures={currentFeatures} isLoading={isLoading} onSubmit={handleRunAnalysis} />
        </section>

        {/* Section 2: Results */}
        {result && result.status === "completed" && result.distress_probability !== null && (
          <section className="mb-10">
            <h2 className="mb-4 text-sm font-semibold tracking-wide text-slate-900">
              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                2
              </span>
              AI Analysis Results
            </h2>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <RiskGauge
                  probability={result.distress_probability}
                  riskTier={result.risk_tier ?? "Unknown"}
                  confidence={result.final_verdict?.confidence ?? 0.0}
                />
              </div>
              <div className="lg:col-span-8 flex flex-col gap-6">
                <FeatureImportanceChart factors={result.top_factors} />
                <WhatIfSandbox currentFeatures={currentFeatures} baseProbability={result.distress_probability} />
              </div>
            </div>

            {result.agent_reports && result.final_verdict && (
              <div className="mt-6">
                <AgentReportDeck reports={result.agent_reports} verdict={result.final_verdict} />
              </div>
            )}
          </section>
        )}

        {/* Section 3: History */}
        <section>
          <h2 className="mb-4 text-sm font-semibold tracking-wide text-slate-900">
            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-700 ring-1 ring-slate-200">
              3
            </span>
            Past Analyses
            <span className="ml-2 text-xs font-normal text-slate-500">— saved in your browser</span>
          </h2>
          <HistoryLog history={history} onSelect={handleLoadFromHistory} onClear={handleClearHistory} />
        </section>
      </main>

      <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        Verdyx — AI-Powered Company Health Analyzer
      </footer>

      {/* Guide modal — light */}
      {showDocsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-semibold text-slate-900">How Verdyx works</h3>
              <button onClick={() => setShowDocsModal(false)} className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900 ring-1 ring-emerald-200">
                <strong>Key idea:</strong> The AI model calculates the risk score first using data from 6,819 real companies. The agents only explain the result — they never guess the number.
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li><strong>You enter 10 numbers</strong> → describing the company’s debt, savings, and profits.</li>
                <li><strong>AI Model runs</strong> → calculates the exact risk percentage.</li>
                <li><strong>Finance + Market agents</strong> → explain the debt situation and profit health.</li>
                <li><strong>Risk agent</strong> → identifies what could go wrong.</li>
                <li><strong>Decision agent</strong> → gives the final verdict: Low, Medium, or High Risk.</li>
              </ol>
            </div>
            <div className="mt-5 flex justify-end">
              <button onClick={() => setShowDocsModal(false)} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
