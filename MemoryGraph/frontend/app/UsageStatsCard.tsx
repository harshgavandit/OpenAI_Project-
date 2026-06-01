// Updated by GitHub contribution automation.
/**
 * Usage stats component
 * Shows user's current usage vs. plan limits
 */

"use client";

import { useEffect, useState } from "react";
import { getUsageStats } from "./api-utils";

interface UsageStats {
  plan: string;
  current_storage_bytes: number;
  storage_limit_mb: number;
  memories_count: number;
  daily_uploads: number;
  daily_upload_limit: number;
  daily_queries: number;
  daily_query_limit: number;
}

interface UsageStatsCardProps {
  token: string;
}

export default function UsageStatsCard({ token }: UsageStatsCardProps) {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getUsageStats(token);
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch usage stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  if (loading) return <div className="p-4 bg-gray-100 rounded">Loading usage stats...</div>;
  if (!stats) return null;

  const storagePercent = Math.round(
    (stats.current_storage_bytes / (stats.storage_limit_mb * 1024 * 1024)) * 100
  );
  const uploadPercent = Math.round((stats.daily_uploads / stats.daily_upload_limit) * 100);
  const queryPercent = Math.round((stats.daily_queries / stats.daily_query_limit) * 100);

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "pro":
        return "bg-blue-100 text-blue-800";
      case "team":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="border border-[#d7dde8] bg-white p-4 rounded shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Usage & Plan</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPlanBadgeColor(stats.plan)}`}>
          {stats.plan.charAt(0).toUpperCase() + stats.plan.slice(1)} Plan
        </span>
      </div>

      <div className="space-y-4">
        {/* Storage */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">Storage</span>
            <span className="text-xs text-gray-600">
              {Math.round(stats.current_storage_bytes / 1024 / 1024)}MB / {stats.storage_limit_mb}MB
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${storagePercent > 90 ? "bg-red-500" : "bg-green-500"}`}
              style={{ width: `${Math.min(storagePercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Daily Uploads */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">Daily Uploads</span>
            <span className="text-xs text-gray-600">
              {stats.daily_uploads} / {stats.daily_upload_limit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${uploadPercent > 90 ? "bg-orange-500" : "bg-blue-500"}`}
              style={{ width: `${Math.min(uploadPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Daily Queries */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">Daily Queries</span>
            <span className="text-xs text-gray-600">
              {stats.daily_queries} / {stats.daily_query_limit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${queryPercent > 90 ? "bg-orange-500" : "bg-blue-500"}`}
              style={{ width: `${Math.min(queryPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Memory Count */}
        <div className="pt-2 border-t border-gray-200">
          <p className="text-sm">
            <span className="font-medium">{stats.memories_count}</span> memories collected
          </p>
        </div>
      </div>

      {/* Upgrade hint */}
      {storagePercent > 80 && stats.plan === "free" && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          💡 Running low on storage? <a href="/billing" className="font-medium underline">Upgrade to Pro</a>
        </div>
      )}
    </div>
  );
}
