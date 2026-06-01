// Updated by GitHub contribution automation.
/**
 * Performance Optimization Guide
 * Targets: < 1s initial load, < 80ms graph render, < 100ms search
 */

// ============ OPTIMIZATION CHECKLIST ============

export const PERFORMANCE_OPTIMIZATIONS = {
  "Frontend Bundle": [
    "✅ Use dynamic imports for heavy components (D3, Charts)",
    "✅ Tree-shake unused code in production build",
    "✅ Compress images with next/image component",
    "✅ Code split: Separate route chunks",
    "✅ Remove unused CSS with Tailwind purge",
  ],
  "React Optimizations": [
    "✅ Memoize expensive components (MemoizedSearchArea)",
    "✅ Use useMemo for graph calculations",
    "✅ Lazy load off-screen components",
    "✅ Batch state updates where possible",
  ],
  "Network": [
    "✅ API response caching with SWR/TanStack Query",
    "✅ Pagination for large lists (limit 50 memories)",
    "✅ Compress API responses (gzip)",
    "✅ Use fetch batching (query multiple endpoints)",
    "✅ Set reasonable timeouts (30s default)",
  ],
  "Graph Rendering": [
    "✅ Limit initial nodes to 100 max",
    "✅ Use WebGL for large graphs (Option: Three.js)",
    "✅ Debounce zoom/pan events",
    "✅ Only update visible nodes during drag",
  ],
  "Backend": [
    "✅ Index queries (Memory.user_id, Relationship.user_id)",
    "✅ Limit relationship queries (LIMIT 100)",
    "✅ Use database connection pooling",
    "✅ Cache search results in memory",
  ],
  "Deployment": [
    "✅ Enable gzip compression on Vercel",
    "✅ Set long cache headers for static assets",
    "✅ Use CDN for assets (Vercel built-in)",
    "✅ Monitor with Vercel Analytics",
  ],
};

// ============ QUICK PERFORMANCE WINS ============

/**
 * Optimize image loading
 */
export const optimizeImages = {
  setup: `
    // In Next.js layout
    import Image from 'next/image';
    
    // Use for graph node avatars, thumbnails
    <Image
      src="/memory-icon.png"
      width={32}
      height={32}
      alt="Memory"
      priority={false}
    />
  `,
  benefits: "Automatic lazy loading, format optimization, responsive sizing",
};

/**
 * Memoize expensive calculations
 */
export const memoizeCalculations = {
  setup: `
    import { useMemo } from 'react';
    
    const filteredGraph = useMemo(() => {
      return {
        nodes: graph.nodes.filter(n => n.group === selectedType),
        links: graph.links.filter(l => l.source === selectedNode),
      };
    }, [graph, selectedType, selectedNode]);
  `,
  benefits: "Prevents unnecessary recalculations, smoother interactions",
};

/**
 * Lazy load D3 graph
 */
export const lazyLoadD3 = {
  setup: `
    const GraphComponent = dynamic(() => import('./Graph'), {
      loading: () => <div>Loading graph...</div>,
      ssr: false,
    });
  `,
  benefits: "D3 (180kb) only loaded when graph tab is clicked",
};

/**
 * Batch API requests
 */
export const batchRequests = {
  setup: `
    // Instead of 3 separate requests
    const [memories, graph, insights] = await Promise.all([
      fetch('/api/memories', { headers }),
      fetch('/api/graph', { headers }),
      fetch('/api/insights', { headers }),
    ]);
  `,
  benefits: "Parallel requests, faster combined load",
};

/**
 * Compress responses
 */
export const compressResponses = {
  setup: `
    # In Render/Railway backend
    pip install whitenoise
    
    from whitenoise import WhiteNoise
    app.middleware('http')(WhiteNoise(app))
  `,
  benefits: "Gzip compression, ~70% size reduction",
};

// ============ MONITORING ============

/**
 * Performance metrics to track
 */
export const performanceMetrics = {
  "First Contentful Paint (FCP)": {
    target: "< 1.5s",
    tool: "Vercel Analytics",
  },
  "Largest Contentful Paint (LCP)": {
    target: "< 2.5s",
    tool: "Vercel Analytics / Google PageSpeed",
  },
  "Graph Render Time": {
    target: "< 500ms",
    tool: "performance.mark/measure in code",
  },
  "Search Query Time": {
    target: "< 100ms",
    tool: "Backend logs",
  },
  "API Response Time": {
    target: "< 200ms (p95)",
    tool: "Render/Railway metrics",
  },
};

/**
 * Add performance monitoring to React
 */
export const addPerformanceMonitoring = `
  // In page.tsx
  useEffect(() => {
    const perfData = performance.getEntriesByType('navigation')[0];
    if (perfData) {
      console.log('Performance Metrics:');
      console.log('DNS:', perfData.domainLookupEnd - perfData.domainLookupStart);
      console.log('TCP:', perfData.connectEnd - perfData.connectStart);
      console.log('TTFB:', perfData.responseStart - perfData.requestStart);
      console.log('DL:', perfData.responseEnd - perfData.responseStart);
    }
  }, []);
`;

// ============ QUICK WINS FOR JUDGES ============

export const quickWinsForDemo = [
  "Pre-load demo data so click 'Demo Mode' is instant",
  "Use web workers for graph calculations (non-blocking)",
  "Compress all images in /public folder",
  "Enable minification in next.config.js",
  "Use production build for demo (not dev)",
];

// ============ BENCHMARK TARGETS ============

export const benchmarkTargets = {
  "Landing Page": "< 1s load",
  "Demo Mode": "< 500ms show graph",
  "Search Query": "< 80ms response",
  "Graph Interaction": "60fps smooth",
  "Mobile": "< 3s on 4G",
};
