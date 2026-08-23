"use client";

import React from "react";
import { Cpu, BookOpen } from "lucide-react";

export function Navbar({ onOpenDocs }: { onOpenDocs?: () => void }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#070a12]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-lg font-bold text-white shadow-lg shadow-cyan-500/20">
            V
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans text-xl font-extrabold tracking-tight text-white">
                VERDYX
              </span>
              <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-blue-400 uppercase">
                Enterprise AI
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Predictive Decision Intelligence System
            </p>
          </div>
        </div>

        {/* Status Indicators & Navigation */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-1.5 text-xs font-semibold text-emerald-400 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            RandomForest v1.0 • AUC 0.9506
          </div>

          <div className="hidden items-center gap-2 rounded-lg border border-purple-500/20 bg-purple-500/[0.06] px-3 py-1.5 text-xs font-semibold text-purple-300 md:flex">
            <Cpu className="h-3.5 w-3.5 text-purple-400" />
            4 Specialized Agents
          </div>

          {onOpenDocs && (
            <button
              onClick={onOpenDocs}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-white"
            >
              <BookOpen className="h-3.5 w-3.5 text-blue-400" />
              <span>Guide & Architecture</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
