"use client";

import React from "react";
import { Cpu, BookOpen } from "lucide-react";

export function Navbar({ onOpenDocs }: { onOpenDocs?: () => void }) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
            V
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900">VERDYX</span>
              <span className="hidden sm:inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-slate-600 ring-1 ring-slate-200">
                ENTERPRISE AI
              </span>
            </div>
            <p className="hidden text-xs text-slate-500 sm:block">AI-Powered Company Health Check</p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 sm:flex">
            RF 10-Feat · AI Model Active
          </div>
          <div className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 lg:flex">
            <Cpu className="h-3.5 w-3.5 text-slate-500" />
            4 AI Agents
          </div>
          {onOpenDocs && (
            <button
              onClick={onOpenDocs}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">How it works</span>
              <span className="sm:hidden">Guide</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
