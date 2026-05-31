/**
 * Sharing modal component for the frontend
 * Allows users to create and manage shareable links
 */

"use client";

import { useState } from "react";
import { createShare, getShareLink } from "./api-utils";

interface ShareModalProps {
  memoryId: string;
  memoryTitle: string;
  token: string;
  onClose: () => void;
}

export default function ShareModal({
  memoryId,
  memoryTitle,
  token,
  onClose,
}: ShareModalProps) {
  const [isPublic, setIsPublic] = useState(false);
  const [allowDownload, setAllowDownload] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateShare = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await createShare(memoryId, token, isPublic, allowDownload);
      const link = getShareLink(result.share_token);
      setShareLink(link);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create share");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Share &quot;{memoryTitle}&quot;</h3>

        {shareLink ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 p-4 rounded">
              <p className="text-sm font-medium text-green-800 mb-2">✓ Share link created!</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Make this memory publicly shareable</span>
              </label>
              <p className="text-xs text-gray-600 ml-6">
                {isPublic
                  ? "Anyone with the link can view this memory"
                  : "Only people you share the link with can access it"}
              </p>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allowDownload}
                  onChange={(e) => setAllowDownload(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Allow recipients to download raw content</span>
              </label>
              <p className="text-xs text-gray-600 ml-6">
                {allowDownload
                  ? "Recipients can see the full memory text"
                  : "Recipients can only see summary and structured data"}
              </p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={handleCreateShare}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isLoading ? "Creating..." : "Create Share Link"}
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
