// Updated by GitHub contribution automation.
/**
 * API utilities for new post-hackathon features:
 * - Sharing (public/private links)
 * - Export (JSON, CSV, PDF)
 * - Usage tracking & limits
 */

import { API_URL as API_BASE } from "@/app/lib/api";

// ==================== SHARING ====================

export async function createShare(
  memoryId: string,
  token: string,
  isPublic: boolean = false,
  allowDownload: boolean = false,
  expiresAt?: string
) {
  const response = await fetch(`${API_BASE}/shares/create`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      memory_id: memoryId,
      is_public: isPublic,
      allow_download: allowDownload,
      expires_at: expiresAt,
    }),
  });
  if (!response.ok) throw new Error("Failed to create share");
  return response.json();
}

export async function listShares(token: string) {
  const response = await fetch(`${API_BASE}/shares/list`, {
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to list shares");
  return response.json();
}

export async function deleteShare(shareId: string, token: string) {
  const response = await fetch(`${API_BASE}/shares/${shareId}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to delete share");
  return response.json();
}

export async function accessSharedMemory(shareToken: string) {
  const response = await fetch(`${API_BASE}/share/${shareToken}`);
  if (!response.ok) throw new Error("Failed to access shared memory");
  return response.json();
}

// ==================== EXPORTS ====================

export async function exportMemoriesAsJSON(token: string) {
  const response = await fetch(`${API_BASE}/exports/archive.json`, {
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to export JSON");
  const blob = await response.blob();
  downloadBlob(blob, "memories_export.json");
}

export async function exportMemoriesAsCSV(token: string) {
  const response = await fetch(`${API_BASE}/exports/relationships.csv`, {
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to export CSV");
  const blob = await response.blob();
  downloadBlob(blob, "memorygraph_relationships.csv");
}

export async function exportFamilyReport(token: string) {
  const response = await fetch(`${API_BASE}/exports/family-report.html`, {
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to export family report");
  const blob = await response.blob();
  downloadBlob(blob, "memorygraph_family_report.html");
}

export async function createFamilyInvite(token: string, payload: { recipient_name?: string; recipient_email?: string; relationship?: string }) {
  const response = await fetch(`${API_BASE}/invites`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to create invite");
  return response.json();
}

export async function getWeeklyReport(token: string) {
  const response = await fetch(`${API_BASE}/reports/weekly`, {
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to generate weekly report");
  return response.json();
}

export async function archiveMemory(memoryId: string, token: string) {
  const response = await fetch(`${API_BASE}/memories/${memoryId}/archive`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to archive memory");
  return response.json();
}

export async function deleteMemory(memoryId: string, token: string) {
  const response = await fetch(`${API_BASE}/memories/${memoryId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason: "Deleted by user" }),
  });
  if (!response.ok) throw new Error("Failed to delete memory");
  return response.json();
}

export async function exportMemoriesAsPDF(token: string) {
  const response = await fetch(`${API_BASE}/export/pdf`, {
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to export PDF");
  const blob = await response.blob();
  downloadBlob(blob, "memories_export.pdf");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ==================== USAGE & LIMITS ====================

export async function getUsageStats(token: string) {
  const response = await fetch(`${API_BASE}/usage/stats`, {
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to get usage stats");
  return response.json();
}

export async function checkUsageLimit(action: string, token: string) {
  const response = await fetch(`${API_BASE}/usage/check-limit?action=${action}`, {
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to check usage limit");
  return response.json();
}

// ==================== UI HELPERS ====================

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

export function getShareLink(shareToken: string): string {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://memorygraph.io";
  return `${baseUrl}/share/${shareToken}`;
}
