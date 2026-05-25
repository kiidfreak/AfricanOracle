'use client';

import React, { useState, useEffect } from 'react';
import { Search, Play, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface MarketQuestion {
  question: string;
  category: string;
  drivers: string[];
  horizon: string;
  current_crowd_prob: number | null;
  source_ids: string[];
  data_coverage: number;
  ready: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  macro:       'text-blue-400 bg-blue-500/10 border-blue-500/20',
  equity:      'text-amber-400 bg-amber-500/10 border-amber-500/20',
  equities:    'text-amber-400 bg-amber-500/10 border-amber-500/20',
  agriculture: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  fx:          'text-purple-400 bg-purple-500/10 border-purple-500/20',
  energy:      'text-orange-400 bg-orange-500/10 border-orange-500/20',
};

function CoverageBar({ coverage, ready }: { coverage: number; ready: boolean }) {
  const pct = Math.round(coverage * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            ready ? 'bg-emerald-500' : coverage > 0.4 ? 'bg-amber-500' : 'bg-slate-600'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-[9px] font-mono shrink-0 ${
        ready ? 'text-emerald-400' : 'text-slate-600'
      }`}>
        {pct}%
      </span>
    </div>
  );
}

export const PredictForm = ({
  onPredict,
  disabled,
}: {
  onPredict: (q: string) => void;
  disabled?: boolean;
}) => {
  const [question, setQuestion] = useState('');
  const [questions, setQuestions] = useState<MarketQuestion[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Pull-to-refresh states
  const [startY, setStartY] = useState(0);
  const [pullOffset, setPullOffset] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchQuestions = (targetPage: number, replace: boolean = false) => {
    setIsLoading(true);
    return fetch(`/api/questions?page=${targetPage}&limit=5`)
      .then((r) => r.json())
      .then((data) => {
        const list: MarketQuestion[] = data.questions ?? data ?? [];
        if (list.length === 0) {
          setHasMore(false);
        } else {
          if (replace) {
            setHasMore(true);
          }
          setQuestions((prev) => {
            if (replace) return list;
            const existing = new Set(prev.map(q => q.question));
            const uniqueNew = list.filter(q => !existing.has(q.question));
            if (uniqueNew.length === 0) {
              setHasMore(false);
            }
            return [...prev, ...uniqueNew];
          });
          setPage(targetPage + 1);
        }
      })
      .catch(() => {
        if (replace) {
          setQuestions([
            { question: 'Will CBK cut rates at the next MPC meeting (June 2026)?', category: 'macro', drivers: ['CBK CPI', 'T-Bills'], horizon: '28d', current_crowd_prob: 0.44, source_ids: ['cbk-inflation', 'cbk-tbills'], data_coverage: 0.9, ready: true },
            { question: 'Will KNBS May Inflation news report a drop to 5.0% YoY?', category: 'macro', drivers: ['KNBS / Business Daily report', 'Food price index trend'], horizon: '15d', current_crowd_prob: 0.52, source_ids: ['cbk-inflation'], data_coverage: 0.92, ready: true },
            { question: 'Will NCBA Group approve KSh 3.00 final dividend for FY25 at the AGM?', category: 'equities', drivers: ['NSE NCBA corporate filing'], horizon: '45d', current_crowd_prob: 0.65, source_ids: ['nse-equity'], data_coverage: 0.95, ready: true },
            { question: 'Will Safaricom (SCOM) close above KES 20 before end of Q3?', category: 'equity', drivers: ['NSE SCOM close'], horizon: '90d', current_crowd_prob: 0.38, source_ids: ['nse-equity'], data_coverage: 0.75, ready: true },
          ]);
          setHasMore(false);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const loadMoreQuestions = () => {
    if (isLoading || !hasMore || isRefreshing) return;
    fetchQuestions(page);
  };

  const startPull = (clientKeyY: number, scrollTop: number) => {
    if (scrollTop === 0 && !isRefreshing && !isLoading) {
      setStartY(clientKeyY);
      setIsPulling(true);
    }
  };

  const movePull = (clientKeyY: number) => {
    if (!isPulling) return;
    const diff = clientKeyY - startY;
    if (diff > 0) {
      const damped = Math.min(80, diff * 0.45);
      setPullOffset(damped);
    }
  };

  const endPull = () => {
    if (!isPulling) return;
    setIsPulling(false);
    if (pullOffset > 50) {
      triggerRefresh();
    } else {
      setPullOffset(0);
    }
  };

  const triggerRefresh = () => {
    setIsRefreshing(true);
    setPullOffset(50);
    fetchQuestions(1, true).finally(() => {
      setIsRefreshing(false);
      setPullOffset(0);
    });
  };

  useEffect(() => {
    loadMoreQuestions();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || disabled) return;
    onPredict(question);
  };

  const handleSelect = (q: string) => {
    if (disabled) return;
    setQuestion(q);
    onPredict(q);
    setExpanded(null);
  };

  return (
    <div className="bg-[#0c1120] border border-slate-800/60 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Search size={14} className="text-indigo-400" />
        <span className="text-xs font-bold text-slate-300">Ask a market question</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type or pick a question below…"
          disabled={!!disabled}
          className="w-full bg-[#080c16] border border-slate-800/60 rounded-lg py-3 px-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50"
        />

        <button
          type="submit"
          suppressHydrationWarning
          disabled={!question || !!disabled}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
        >
          <Play size={14} fill="currentColor" />
          Run Intelligence Cycle
        </button>
      </form>

      {questions.length > 0 && (
        <div className="space-y-1.5 flex flex-col relative overflow-hidden">
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 block mb-1">
            Question Library · {questions.filter((q) => q.ready).length} live
          </span>

          {/* Pull to refresh indicator */}
          {pullOffset > 0 && (
            <div
              className="absolute top-6 left-0 right-0 flex items-center justify-center text-[10px] text-indigo-400 font-bold transition-all pointer-events-none z-20"
              style={{
                height: `${pullOffset}px`,
                opacity: Math.min(1, pullOffset / 50)
              }}
            >
              <div className="flex items-center gap-1.5 bg-[#080c16]/90 border border-slate-800/80 px-3 py-1 rounded-full shadow-lg">
                <div className={`w-2.5 h-2.5 border-2 border-indigo-400 border-t-transparent rounded-full ${
                  isRefreshing ? 'animate-spin' : pullOffset > 50 ? 'rotate-180' : ''
                } transition-transform`} />
                <span>
                  {isRefreshing
                    ? 'Refreshing...'
                    : pullOffset > 50
                    ? 'Release to refresh'
                    : 'Pull to refresh'}
                </span>
              </div>
            </div>
          )}

          <div
            onScroll={(e) => {
              const target = e.currentTarget;
              if (target.scrollHeight - target.scrollTop <= target.clientHeight + 40) {
                loadMoreQuestions();
              }
            }}
            onTouchStart={(e) => {
              startPull(e.touches[0].clientY, e.currentTarget.scrollTop);
            }}
            onTouchMove={(e) => {
              movePull(e.touches[0].clientY);
            }}
            onTouchEnd={() => {
              endPull();
            }}
            onMouseDown={(e) => {
              startPull(e.clientY, e.currentTarget.scrollTop);
            }}
            onMouseMove={(e) => {
              movePull(e.clientY);
            }}
            onMouseUp={() => {
              endPull();
            }}
            onMouseLeave={() => {
              endPull();
            }}
            className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800/80 scrollbar-track-transparent relative transition-all"
            style={{
              transform: pullOffset > 0 ? `translateY(${pullOffset}px)` : 'none',
              transition: isPulling ? 'none' : 'transform 0.2s ease-out'
            }}
          >
            {questions.map((q) => {
              const catColor = CATEGORY_COLORS[q.category] ?? 'text-slate-400 bg-slate-800/40 border-slate-700/30';
              const isExpanded = expanded === q.question;
              return (
                <div
                  key={q.question}
                  className={`rounded-lg border transition-all ${
                    q.ready
                      ? 'border-slate-800/50 hover:border-indigo-500/20 hover:bg-slate-800/10'
                      : 'border-slate-800/30 opacity-60'
                  } cursor-pointer`}
                  onClick={() => setExpanded(isExpanded ? null : q.question)}
                >
                  {/* Row */}
                  <div className="flex items-start gap-2 p-2.5">
                    {/* Ready indicator */}
                    <div className="shrink-0 mt-0.5">
                      {q.ready ? (
                        <CheckCircle2 size={12} className="text-emerald-500" />
                      ) : q.data_coverage > 0.3 ? (
                        <AlertCircle size={12} className="text-amber-500" />
                      ) : (
                        <Clock size={12} className="text-slate-600" />
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-slate-200 leading-snug">{q.question}</div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${catColor}`}>
                          {q.category}
                        </span>
                        <span className="text-[9px] text-slate-600 font-mono">{q.horizon}</span>
                        {q.current_crowd_prob !== null && (
                          <span className="text-[9px] text-slate-600">
                            crowd: {((q.current_crowd_prob ?? 0) * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Run button (only for ready questions) */}
                    {q.ready && (
                      <button
                        type="button"
                        disabled={!!disabled}
                        onClick={(e) => { e.stopPropagation(); handleSelect(q.question); }}
                        className="shrink-0 px-2 py-1 text-[9px] font-bold text-indigo-400 hover:text-white hover:bg-indigo-600 border border-indigo-500/20 hover:border-indigo-500 rounded transition-all disabled:opacity-40"
                      >
                        Run
                      </button>
                    )}
                  </div>

                  {/* Expanded drivers + coverage */}
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-2 border-t border-slate-800/40 mt-0 pt-2">
                      <CoverageBar coverage={q.data_coverage} ready={q.ready} />
                      <div className="flex flex-wrap gap-1">
                        {q.drivers.map((d) => (
                          <span key={d} className="text-[9px] text-slate-500 bg-slate-800/60 px-1.5 py-0.5 rounded">
                            {d}
                          </span>
                        ))}
                      </div>
                      {q.source_ids.length > 0 && (
                        <div className="text-[9px] text-slate-700 font-mono">
                          sources: {q.source_ids.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="text-[9px] text-center text-slate-600 py-1.5 animate-pulse">
                Loading more questions...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
