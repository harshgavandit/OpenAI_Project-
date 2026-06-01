// Updated by GitHub contribution automation.
/**
 * Beautiful Insights Dashboard
 * Shows duplicate detection, influential nodes, memory analytics
 */

"use client";

import { useEffect, useState } from "react";

interface InsightsData {
  count: number;
  summaries: Array<{ memory_id: string; title: string; summary: string }>;
  duplicates: string[][];
  top_people: Array<[string, number]>;
}

interface GraphInsights {
  communities: Array<{ size: number; members: string[] }>;
  influential: Array<{ node: string; degree: number }>;
}

interface InsightsDashboardProps {
  token: string;
  refreshTrigger?: number;
}

import { API_URL } from "@/app/lib/api";

export default function InsightsDashboard({
  token,
  refreshTrigger = 0,
}: InsightsDashboardProps) {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [graphInsights, setGraphInsights] = useState<GraphInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const [insightsRes, graphRes] = await Promise.all([
          fetch(`${API_URL}/memories/insights`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/graph/insights`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (insightsRes.ok) {
          setInsights(await insightsRes.json());
        }
        if (graphRes.ok) {
          setGraphInsights(await graphRes.json());
        }
      } catch (err) {
        console.error("Failed to fetch insights:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [token, refreshTrigger]);

  if (loading) {
    return (
      <div className="p-4 bg-gray-100 dark:bg-[#2d2e35] rounded-lg text-center">
        <p className="text-sm text-gray-600 dark:text-[#b9c3d4]">Loading insights...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Duplicate Detection */}
      {insights && insights.duplicates.length > 0 && (
        <div className="border border-amber-300 dark:border-amber-900 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
          <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-3 flex items-center gap-2">
            <span className="text-lg">🔄</span>
            Potential Duplicates Found
          </h3>
          <div className="space-y-2">
            {insights.duplicates.slice(0, 3).map((group, i) => (
              <div
                key={i}
                className="p-3 bg-white dark:bg-[#1e1f24] border border-amber-200 dark:border-amber-900 rounded text-sm"
              >
                <p className="font-medium text-[#1e1f24] dark:text-white mb-2">
                  {group.length} similar memories detected:
                </p>
                <div className="flex gap-2 flex-wrap">
                  {group.slice(0, 2).map((id) => {
                    const memory = insights.summaries.find((s) => s.memory_id === id);
                    return (
                      <span
                        key={id}
                        className="px-2 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 text-xs rounded"
                      >
                        {memory?.title || id}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Influential Nodes */}
      {graphInsights && graphInsights.influential.length > 0 && (
        <div className="border border-blue-300 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
            <span className="text-lg">⭐</span>
            Most Connected Entities
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {graphInsights.influential.map((item, i) => (
              <div
                key={i}
                className="p-3 bg-white dark:bg-[#1e1f24] border border-blue-200 dark:border-blue-900 rounded text-center hover:shadow-md transition"
              >
                <p className="font-medium text-[#1e1f24] dark:text-white text-sm truncate">
                  {item.node}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  {item.degree} connections
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Memory Communities */}
      {graphInsights && graphInsights.communities.length > 1 && (
        <div className="border border-purple-300 dark:border-purple-900 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
            <span className="text-lg">🏘️</span>
            Memory Communities
          </h3>
          <div className="space-y-2">
            {graphInsights.communities.map((community, i) => (
              <div key={i} className="p-3 bg-white dark:bg-[#1e1f24] border border-purple-200 dark:border-purple-900 rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-[#1e1f24] dark:text-white">
                    Community {i + 1}
                  </span>
                  <span className="text-xs font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-100 px-2 py-1 rounded">
                    {community.size} nodes
                  </span>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {community.members.slice(0, 5).map((member) => (
                    <span
                      key={member}
                      className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-100 text-xs rounded"
                    >
                      {member}
                    </span>
                  ))}
                  {community.members.length > 5 && (
                    <span className="px-2 py-0.5 bg-gray-200 dark:bg-[#3f4148] text-gray-700 dark:text-[#b9c3d4] text-xs rounded">
                      +{community.members.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top People */}
      {insights && insights.top_people.length > 0 && (
        <div className="border border-green-300 dark:border-green-900 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
            <span className="text-lg">👥</span>
            Most Mentioned People
          </h3>
          <div className="flex gap-2 flex-wrap">
            {insights.top_people.map(([person, count], i) => (
              <div key={i} className="relative group">
                <button className="px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-100 text-sm rounded-full font-medium hover:shadow-md transition">
                  {person}{" "}
                  <span className="ml-1 font-bold">×{count}</span>
                </button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-[#1e1f24] text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  Appears in {count} memories
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {insights && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 bg-[#fbfcff] dark:bg-[#2d2e35] border border-[#d7dde8] dark:border-[#3f4148] rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-[#3b82f6]">{insights.count}</p>
            <p className="text-xs text-[#686a71] dark:text-[#b9c3d4]">Total Memories</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#16a34a]">
              {insights.top_people.length}
            </p>
            <p className="text-xs text-[#686a71] dark:text-[#b9c3d4]">Key People</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#ef4444]">
              {insights.duplicates.length}
            </p>
            <p className="text-xs text-[#686a71] dark:text-[#b9c3d4]">Duplicates</p>
          </div>
        </div>
      )}
    </div>
  );
}
