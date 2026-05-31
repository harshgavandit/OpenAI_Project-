/**
 * Landing Page with Instant Demo for Hackathon
 * Key goals: WOW factor, zero friction, instant demo access
 */

"use client";

interface LandingPageProps {
  onDemoClick: () => void;
  onSignupClick: () => void;
}

export default function LandingPage({ onDemoClick, onSignupClick }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fbfcff] to-[#f3f4f6] dark:from-[#1e1f24] dark:to-[#2d2e35]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 backdrop-blur-lg bg-white/80 dark:bg-[#1e1f24]/80 border-b border-[#d7dde8] dark:border-[#3f4148]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="text-2xl">🧠</div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1e1f24] dark:text-white">MemoryGraph</h1>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={onSignupClick}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-[#626b56] hover:bg-[#fbfcff] rounded transition"
            >
              Login
            </button>
            <button
              onClick={onDemoClick}
              className="px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold bg-[#3b82f6] text-white rounded hover:bg-[#2563eb] transition shadow-lg hover:shadow-xl"
            >
              ✨ Try Demo
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-6 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <p className="text-xs sm:text-sm font-semibold text-[#3b82f6]">
              🎯 Top Hackathon Innovation
            </p>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-[#1e1f24] dark:text-white leading-tight">
            Transform Your Scattered Memories into a <span className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">Living Knowledge Map</span>
          </h2>

          <p className="text-lg sm:text-xl text-[#686a71] dark:text-[#b9c3d4] mb-12 max-w-2xl mx-auto">
            Upload PDFs, notes, photos, and conversations. AI extracts relationships. Visualize your memories as an interactive graph. Rediscover connections.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={onDemoClick}
              className="px-8 py-4 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white font-bold text-lg rounded-lg hover:shadow-2xl transition transform hover:scale-105 touch-target"
            >
              🚀 Try Instant Demo (No Signup)
            </button>
            <button
              onClick={onSignupClick}
              className="px-8 py-4 border-2 border-[#d7dde8] dark:border-[#3f4148] text-[#1e1f24] dark:text-white font-bold text-lg rounded-lg hover:bg-[#fbfcff] dark:hover:bg-[#2d2e35] transition touch-target"
            >
              Get Started Free
            </button>
          </div>

          {/* Demo Video Placeholder */}
          <div className="relative max-w-3xl mx-auto mb-20">
            <div className="aspect-video bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] rounded-2xl shadow-2xl flex items-center justify-center overflow-hidden">
              <div className="text-white text-center">
                <div className="text-6xl mb-4">▶️</div>
                <p className="text-xl font-semibold">Watch 60-sec Demo</p>
                <p className="text-sm opacity-80 mt-2">See the power of MemoryGraph in action</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#1e1f24] border-y border-[#d7dde8] dark:border-[#3f4148]">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl sm:text-4xl font-bold text-center mb-16 text-[#1e1f24] dark:text-white">
            Features That Impress Judges
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "📊",
                title: "AI-Powered Extraction",
                description: "Automatically extracts people, places, events from any document"
              },
              {
                icon: "🔗",
                title: "Interactive Graph",
                description: "Visualize relationships between memories in a beautiful D3 network"
              },
              {
                icon: "🔍",
                title: "Smart Search",
                description: "Find memories by person, place, event, or time with semantic search"
              },
              {
                icon: "⏰",
                title: "Time Machine",
                description: "Query your memories by year or age to explore your life timeline"
              },
              {
                icon: "🎯",
                title: "One-Click Demo",
                description: "Instant demo with 45+ pre-loaded memories showing full capabilities"
              },
              {
                icon: "📈",
                title: "Rich Analytics",
                description: "See your memory stats, duplicate detection, and influential connections"
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 bg-[#fbfcff] dark:bg-[#2d2e35] border border-[#d7dde8] dark:border-[#3f4148] rounded-xl hover:shadow-lg transition"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h4 className="text-lg font-bold text-[#1e1f24] dark:text-white mb-2">
                  {feature.title}
                </h4>
                <p className="text-[#686a71] dark:text-[#b9c3d4] text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl sm:text-4xl font-bold text-center mb-16 text-[#1e1f24] dark:text-white">
            Three Amazing Use Cases
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              {
                emoji: "🎓",
                title: "Student's Academic Journey",
                memories: "15 memories • 8 professors • 4 years",
                highlight: "See how Prof. Chen's class led to a hackathon win & internship"
              },
              {
                emoji: "🔬",
                title: "Researcher's Discovery Path",
                memories: "12 memories • 5 collaborators • Breakthrough",
                highlight: "Track how collaboration led to first-author Nature Med paper"
              },
              {
                emoji: "❤️",
                title: "Life Journey Map",
                memories: "18 memories • 7 people • 15 years",
                highlight: "See how meeting Sarah led to love, marriage, and future family"
              }
            ].map((useCase, i) => (
              <div
                key={i}
                className="p-8 bg-gradient-to-br from-[#fbfcff] to-[#f3f4f6] dark:from-[#2d2e35] dark:to-[#1e1f24] border border-[#d7dde8] dark:border-[#3f4148] rounded-2xl hover:shadow-xl transition"
              >
                <div className="text-5xl mb-4">{useCase.emoji}</div>
                <h4 className="text-2xl font-bold text-[#1e1f24] dark:text-white mb-2">
                  {useCase.title}
                </h4>
                <p className="text-[#686a71] dark:text-[#b9c3d4] text-sm mb-4">
                  {useCase.memories}
                </p>
                <p className="text-[#1e1f24] dark:text-white font-medium text-sm">
                  ✨ {useCase.highlight}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Explore Your Memory Graph?
          </h3>
          <p className="text-lg mb-8 opacity-90">
            Click below for an instant interactive demo with 45+ pre-loaded memories showing the full power of MemoryGraph
          </p>
          <button
            onClick={onDemoClick}
            className="px-8 py-4 bg-white text-[#3b82f6] font-bold text-lg rounded-lg hover:shadow-2xl transition transform hover:scale-105 touch-target"
          >
            🚀 See The Magic (No Signup Required)
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-[#d7dde8] dark:border-[#3f4148] bg-[#fbfcff] dark:bg-[#1e1f24]">
        <div className="max-w-6xl mx-auto text-center text-[#686a71] dark:text-[#b9c3d4] text-sm">
          <p>🎯 Built for Hackathons • 🚀 Production-Ready • 💚 Open Source</p>
          <p className="mt-2">Zero-cost deployment. Maximum impact.</p>
        </div>
      </footer>
    </div>
  );
}
