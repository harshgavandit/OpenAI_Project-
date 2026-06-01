// Updated by GitHub contribution automation.
/**
 * AI Extraction Showcase
 * Shows what AI can extract from documents - beautiful sample cards
 */

"use client";

import { useState } from "react";

interface ExtractionSample {
  title: string;
  input: string;
  extracted: {
    people: string[];
    places: string[];
    events: string[];
    dates: string[];
    summary: string;
  };
}

const EXTRACTION_SAMPLES: ExtractionSample[] = [
  {
    title: "Email: Meeting with Sarah",
    input:
      "Had a great coffee meeting with Sarah Chen at Blue Bottle in SF on Jan 15, 2024. We discussed the startup idea for MemoryGraph. She's interested in being an advisor!",
    extracted: {
      people: ["Sarah Chen"],
      places: ["Blue Bottle", "San Francisco"],
      events: ["Coffee meeting", "Startup discussion"],
      dates: ["Jan 15, 2024"],
      summary: "Met with Sarah Chen about MemoryGraph startup opportunity",
    },
  },
  {
    title: "Document: Research Paper Notes",
    input:
      "Reviewed the checkpoint immunotherapy paper by Tasuku Honjo at Tokyo University. This research by James Allison at UCSD inspired our new treatment approach. Meeting scheduled with Dr. Wong at Johns Hopkins on March 20.",
    extracted: {
      people: ["Tasuku Honjo", "James Allison", "Dr. Wong"],
      places: ["Tokyo University", "UCSD", "Johns Hopkins"],
      events: ["Research review", "Treatment planning", "Meeting"],
      dates: ["March 20"],
      summary: "Reviewed checkpoint immunotherapy research and planned treatment strategy",
    },
  },
  {
    title: "Photo Caption: Family Dinner",
    input:
      "Uncle Rajesh, Aunt Priya, and cousin Vikram came over for dinner in Mumbai on July 4th. We cooked biryani and talked about the old house on Marine Drive where grandpa grew up.",
    extracted: {
      people: ["Uncle Rajesh", "Aunt Priya", "Cousin Vikram", "Grandpa"],
      places: ["Mumbai", "Marine Drive"],
      events: ["Family dinner", "Cooking biryani"],
      dates: ["July 4"],
      summary: "Family gathering with relatives discussing childhood memories",
    },
  },
];

interface ExtractionShowcaseProps {
  onClose?: () => void;
}

export default function ExtractionShowcase({ onClose }: ExtractionShowcaseProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className="w-full bg-white dark:bg-[#1e1f24] border border-[#d7dde8] dark:border-[#3f4148] rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-[#1e1f24] dark:text-white flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          AI Extraction Power
        </h3>
        {onClose && (
          <button onClick={onClose} className="text-2xl text-[#9b9b9b] hover:text-[#1e1f24]">
            ✕
          </button>
        )}
      </div>

      {/* Sample Selector */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {EXTRACTION_SAMPLES.map((sample, i) => (
          <button
            key={i}
            onClick={() => setSelectedIndex(i)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              selectedIndex === i
                ? "bg-[#3b82f6] text-white"
                : "bg-[#fbfcff] dark:bg-[#2d2e35] text-[#1e1f24] dark:text-white border border-[#d7dde8] dark:border-[#3f4148] hover:border-[#3b82f6]"
            }`}
          >
            {sample.title}
          </button>
        ))}
      </div>

      {/* Current Sample */}
      <div className="space-y-6">
        {/* Input */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#686a71] dark:text-[#b9c3d4] mb-2">
            Raw Input
          </p>
          <div className="p-4 bg-[#fbfcff] dark:bg-[#2d2e35] border border-[#d7dde8] dark:border-[#3f4148] rounded-lg text-sm text-[#1e1f24] dark:text-white italic">
            &quot;{EXTRACTION_SAMPLES[selectedIndex].input}&quot;
          </div>
        </div>

        {/* Extraction Results */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#686a71] dark:text-[#b9c3d4] mb-3">
            ✨ AI Extracted
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* People */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-lg">
              <p className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                <span>👥</span>
                People
              </p>
              <div className="flex flex-wrap gap-2">
                {EXTRACTION_SAMPLES[selectedIndex].extracted.people.map((person, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 text-xs font-medium rounded-full"
                  >
                    {person}
                  </span>
                ))}
              </div>
            </div>

            {/* Places */}
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg">
              <p className="text-sm font-bold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                <span>📍</span>
                Places
              </p>
              <div className="flex flex-wrap gap-2">
                {EXTRACTION_SAMPLES[selectedIndex].extracted.places.map((place, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-100 text-xs font-medium rounded-full"
                  >
                    {place}
                  </span>
                ))}
              </div>
            </div>

            {/* Events */}
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg">
              <p className="text-sm font-bold text-red-900 dark:text-red-100 mb-3 flex items-center gap-2">
                <span>📅</span>
                Events
              </p>
              <div className="flex flex-wrap gap-2">
                {EXTRACTION_SAMPLES[selectedIndex].extracted.events.map((event, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-red-100 dark:bg-red-900/40 text-red-900 dark:text-red-100 text-xs font-medium rounded-full"
                  >
                    {event}
                  </span>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900 rounded-lg">
              <p className="text-sm font-bold text-amber-900 dark:text-amber-100 mb-3 flex items-center gap-2">
                <span>🕐</span>
                Dates
              </p>
              <div className="flex flex-wrap gap-2">
                {EXTRACTION_SAMPLES[selectedIndex].extracted.dates.map((date, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 text-xs font-medium rounded-full"
                  >
                    {date}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-900 rounded-lg">
            <p className="text-sm font-bold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
              <span>📝</span>
              Summary
            </p>
            <p className="text-sm text-purple-900 dark:text-purple-100">
              {EXTRACTION_SAMPLES[selectedIndex].extracted.summary}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-lg">
        <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-100">
          💡 <strong>This is just the beginning!</strong> Upload your own documents, and MemoryGraph will automatically extract relationships,
          create a knowledge graph, and help you explore connections between memories.
        </p>
      </div>
    </div>
  );
}
