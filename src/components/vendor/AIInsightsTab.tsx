'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { ApiSuccess } from '@/types/api';

interface InsightsResponse {
  insights: string;
}

export default function AIInsightsTab({ centerId }: { centerId: string }) {
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, isError, dataUpdatedAt } = useQuery({
    queryKey: ['vendor', 'ai-insights', centerId],
    queryFn:  async () => {
      const { data } = await api.get<ApiSuccess<InsightsResponse>>(`/ai/insights/${centerId}`);
      return data.data;
    },
    staleTime:          10 * 60 * 1000, // matches Redis TTL
    retry:              1,
  });

  function handleRefresh() {
    queryClient.invalidateQueries({ queryKey: ['vendor', 'ai-insights', centerId] });
  }

  const paragraphs = data?.insights
    ? data.insights.split('\n\n').filter(Boolean)
    : [];

  const updatedTime = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="space-y-4">

      {/* Header card */}
      <div className="bg-gradient-to-r from-deepsea-600 to-aqua-600 rounded-xl px-5 py-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-white font-semibold flex items-center gap-2 text-sm">
            <SparkleIcon /> AI Weekly Insights
          </p>
          <p className="text-white/70 text-xs mt-1">
            Powered by GPT-4o-mini · Auto-refreshes every Sunday at 3am
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isFetching}
          className="shrink-0 flex items-center gap-1.5 bg-white/15 hover:bg-white/25 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          <RefreshIcon spinning={isFetching} />
          {isFetching ? 'Generating…' : 'Refresh'}
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 min-h-[180px]">
        {(isLoading || isFetching) && paragraphs.length === 0 ? (
          // Skeleton while generating
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-gray-100 rounded-full w-full" />
            <div className="h-4 bg-gray-100 rounded-full w-5/6" />
            <div className="h-4 bg-gray-100 rounded-full w-full" />
            <div className="h-4 bg-gray-100 rounded-full w-4/5" />
            <div className="h-4 bg-gray-100 rounded-full w-full" />
            <div className="h-4 bg-gray-100 rounded-full w-3/4" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <p className="text-gray-500 text-sm">Could not generate insights right now.</p>
            <button
              onClick={handleRefresh}
              className="text-xs text-aqua-600 underline underline-offset-2 hover:text-aqua-700"
            >
              Try again
            </button>
          </div>
        ) : paragraphs.length > 0 ? (
          <div className="space-y-3">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-sm text-gray-700 leading-relaxed">{p}</p>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">
            No insights yet. Click Refresh to generate your first report.
          </p>
        )}
      </div>

      {/* Footer */}
      {updatedTime && !isLoading && (
        <p className="text-xs text-gray-400 text-right">
          Last fetched at {updatedTime}
        </p>
      )}

    </div>
  );
}

function SparkleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={spinning ? 'animate-spin' : ''}
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}
