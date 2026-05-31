/**
 * Export menu component
 * Allows users to export their memories in different formats
 */

"use client";

import { useState } from "react";
import { exportMemoriesAsJSON, exportMemoriesAsCSV, exportMemoriesAsPDF } from "./api-utils";

interface ExportMenuProps {
  token: string;
  onClose: () => void;
}

export default function ExportMenu({ token, onClose }: ExportMenuProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (format: "json" | "csv" | "pdf") => {
    setIsExporting(format);
    setError(null);
    try {
      if (format === "json") await exportMemoriesAsJSON(token);
      else if (format === "csv") await exportMemoriesAsCSV(token);
      else if (format === "pdf") await exportMemoriesAsPDF(token);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to export as ${format.toUpperCase()}`);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Export All Memories</h3>

        <div className="space-y-3 mb-4">
          <button
            onClick={() => handleExport("json")}
            disabled={isExporting !== null}
            className="w-full px-4 py-3 text-left border border-gray-300 rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <p className="font-medium text-sm">
              {isExporting === "json" ? "Exporting as JSON..." : "📋 Export as JSON"}
            </p>
            <p className="text-xs text-gray-600">Complete data in JSON format</p>
          </button>

          <button
            onClick={() => handleExport("csv")}
            disabled={isExporting !== null}
            className="w-full px-4 py-3 text-left border border-gray-300 rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <p className="font-medium text-sm">
              {isExporting === "csv" ? "Exporting as CSV..." : "📊 Export as CSV"}
            </p>
            <p className="text-xs text-gray-600">Spreadsheet-friendly format</p>
          </button>

          <button
            onClick={() => handleExport("pdf")}
            disabled={isExporting !== null}
            className="w-full px-4 py-3 text-left border border-gray-300 rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <p className="font-medium text-sm">
              {isExporting === "pdf" ? "Exporting as PDF..." : "📄 Export as PDF"}
            </p>
            <p className="text-xs text-gray-600">Readable document format</p>
          </button>
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <button
          onClick={onClose}
          className="w-full px-4 py-2 border border-gray-300 rounded font-medium hover:bg-gray-50"
        >
          Close
        </button>
      </div>
    </div>
  );
}
