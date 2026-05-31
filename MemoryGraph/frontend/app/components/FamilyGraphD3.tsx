'use client';

import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';
import type { MemoryProofItem } from '@/app/components/MemoryProofCard';
import { MemoryProofCard } from '@/app/components/MemoryProofCard';

export interface GraphNode {
  id: string;
  group: string;
  label: string;
}

export interface GraphLink {
  source: string;
  target: string;
  label: string;
}

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  group: string;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  label: string;
}

export function FamilyGraphD3({
  nodes,
  links,
  proofs,
  selectedId,
  onSelect,
  onAskAbout,
}: {
  nodes: GraphNode[];
  links: GraphLink[];
  proofs: MemoryProofItem[];
  selectedId: string | null;
  onSelect: (nodeId: string) => void;
  onAskAbout?: (name: string) => void;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [size, setSize] = useState({ width: 960, height: 560 });
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  });

  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setSize({ width: el.clientWidth, height: Math.max(560, el.clientHeight) });
    });
    observer.observe(el);
    setSize({ width: el.clientWidth, height: Math.max(560, el.clientHeight) });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || nodes.length === 0) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const simNodes: SimNode[] = nodes.map((node) => ({ ...node }));
    const nodeById = new Map(simNodes.map((node) => [node.id, node]));
    const simLinks: SimLink[] = links
      .map((link) => ({
        source: nodeById.get(link.source) || link.source,
        target: nodeById.get(link.target) || link.target,
        label: link.label,
      }))
      .filter((link) => link.source && link.target) as SimLink[];

    const simulation = d3
      .forceSimulation(simNodes)
      .force('link', d3.forceLink(simLinks).id((d) => (d as SimNode).id).distance(110))
      .force('charge', d3.forceManyBody().strength(-420))
      .force('center', d3.forceCenter(size.width / 2, size.height / 2))
      .force('collision', d3.forceCollide(36));

    const link = svg
      .append('g')
      .attr('stroke', '#94a3b8')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(simLinks)
      .join('line')
      .attr('stroke-width', 1.5);

    const label = svg
      .append('g')
      .selectAll('text')
      .data(simLinks)
      .join('text')
      .attr('font-size', 9)
      .attr('fill', '#64748b')
      .text((d) => (d as SimLink).label.replaceAll('_', ' '));

    const node = svg
      .append('g')
      .selectAll('circle')
      .data(simNodes)
      .join('circle')
      .attr('r', (d) => (d.id === selectedId ? 14 : 10))
      .attr('fill', (d) => (d.id === selectedId ? '#0891b2' : '#0f172a'))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (_, d) => onSelectRef.current(d.id));

    const text = svg
      .append('g')
      .selectAll('text')
      .data(simNodes)
      .join('text')
      .text((d) => d.label)
      .attr('font-size', 11)
      .attr('font-weight', 700)
      .attr('fill', '#f8fafc')
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .style('pointer-events', 'none');

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as SimNode).x ?? 0)
        .attr('y1', (d) => (d.source as SimNode).y ?? 0)
        .attr('x2', (d) => (d.target as SimNode).x ?? 0)
        .attr('y2', (d) => (d.target as SimNode).y ?? 0);
      label
        .attr('x', (d) => (((d.source as SimNode).x ?? 0) + ((d.target as SimNode).x ?? 0)) / 2)
        .attr('y', (d) => (((d.source as SimNode).y ?? 0) + ((d.target as SimNode).y ?? 0)) / 2);
      node.attr('cx', (d) => d.x ?? 0).attr('cy', (d) => d.y ?? 0);
      text.attr('x', (d) => d.x ?? 0).attr('y', (d) => d.y ?? 0);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, links, selectedId, size.width, size.height]);

  const selectedProof = proofs.find((proof) =>
    selectedId ? proof.title.toLowerCase().includes(selectedId.toLowerCase()) || proof.memory_id === selectedId : false,
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="min-h-[560px] overflow-hidden rounded-lg border border-white/10 bg-slate-900">
        <svg ref={svgRef} width="100%" height={size.height} viewBox={`0 0 ${size.width} ${size.height}`} className="w-full" />
      </div>
      <div>
        {selectedId ? (
          selectedProof ? (
            <MemoryProofCard proof={selectedProof} compact />
          ) : (
            <div className="rounded-xl border border-amber-200 bg-white p-5 text-sm text-slate-600">
              <p className="font-bold text-slate-950">{selectedId}</p>
              <p className="mt-2">Ask about this person to see which memories mention them.</p>
              {onAskAbout && (
                <button
                  type="button"
                  onClick={() => onAskAbout(selectedId)}
                  className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  Ask about {selectedId}
                </button>
              )}
            </div>
          )
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
            Tap a person or place to explore their connections.
          </div>
        )}
      </div>
    </div>
  );
}
