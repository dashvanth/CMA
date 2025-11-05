"use client";

import type { MindMapData, MapNode, HierarchicalMapNode } from "@/lib/types";
import { cn } from "@/lib/utils";
import React, { useMemo, useState, useRef, useEffect } from "react";
import * as d3 from "d3-hierarchy";
import { linkHorizontal } from "d3-shape";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut } from "lucide-react";

const NODE_WIDTH = 176; // 11rem
const NODE_HEIGHT = 112; // 7rem
const HORIZONTAL_SPACING = 90;
const VERTICAL_SPACING = 40;

const NodeComponent = ({
  node,
  onNodeSelect,
  isSelected,
  isDimmed,
}: {
  node: d3.HierarchyPointNode<HierarchicalMapNode>;
  onNodeSelect: (node: HierarchicalMapNode) => void;
  isSelected: boolean;
  isDimmed: boolean;
}) => {
  return (
    <div
      className={cn(
        "absolute group transition-all duration-500 ease-in-out",
        isDimmed && "opacity-50 blur-[2px] scale-95"
      )}
      style={{
        left: `${node.y}px`,
        top: `${node.x}px`,
        transform: `translate(-50%, -50%)`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onNodeSelect(node.data);
      }}
    >
      <div
        className={cn(
          "p-4 w-44 h-28 flex items-center justify-center cursor-pointer border-2 transition-all duration-300 text-center rounded-xl",
          isSelected
            ? "scale-110 border-accent shadow-lg"
            : "bg-card hover:border-accent/70"
        )}
        style={{
          borderColor: isSelected ? "hsl(var(--accent))" : "hsl(var(--border))",
          boxShadow: isSelected ? `0 0 20px -5px hsl(var(--accent))` : "none",
          backgroundColor: isSelected ? "hsl(var(--card))" : undefined,
        }}
      >
        <p className={cn("text-sm font-medium", "text-foreground")}>
          {node.data.label || "[No Label]"}
        </p>
      </div>
    </div>
  );
};

const getPath = linkHorizontal()
  .x((d) => d[1])
  .y((d) => d[0]);

export function MindMap({
  data,
  onNodeSelect,
  selectedNodeId,
}: {
  data: MindMapData;
  onNodeSelect: (node: MapNode | null) => void;
  selectedNodeId?: string;
}) {
  const [zoom, setZoom] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.2));

  const { nodes, links, width, height } = useMemo(() => {
    if (!data || !data.root)
      return { nodes: [], links: [], width: 0, height: 0 };

    const hierarchy = d3.hierarchy(data.root, (d) =>
      d.children && Array.isArray(d.children) ? d.children : []
    );
    const treeLayout = d3
      .tree<HierarchicalMapNode>()
      .nodeSize([
        NODE_HEIGHT + VERTICAL_SPACING,
        NODE_WIDTH + HORIZONTAL_SPACING,
      ]);

    const tree = treeLayout(hierarchy);
    const nodes = tree.descendants();
    const links = tree.links();

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    nodes.forEach((node) => {
      minX = Math.min(minX, node.x - NODE_HEIGHT / 2);
      minY = Math.min(minY, node.y - NODE_WIDTH / 2);
      maxX = Math.max(maxX, node.x + NODE_HEIGHT / 2);
      maxY = Math.max(maxY, node.y + NODE_WIDTH / 2);
    });

    const padding = 50;
    const width = maxY - minY + 2 * padding;
    const height = maxX - minX + 2 * padding;

    // Center the tree
    const offsetX = -minY + padding;
    const offsetY = -minX + padding;

    nodes.forEach((node) => {
      node.x += offsetY;
      node.y += offsetX;
    });

    return { nodes, links, width, height };
  }, [data]);

  const selectedNodeWithFamily = useMemo(() => {
    if (!selectedNodeId) return null;

    const selected = nodes.find((n) => n.data.id === selectedNodeId);
    if (!selected) return null;

    const children = selected.children?.map((c) => c.data.id) || [];
    const parent = selected.parent?.data.id;

    const family = new Set([selectedNodeId, ...children]);
    if (parent) family.add(parent);

    return { selected, family };
  }, [selectedNodeId, nodes]);

  if (!data || !data.root) {
    return null;
  }

  return (
    <div className="w-full h-full relative" onClick={() => onNodeSelect(null)}>
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button size="icon" variant="outline" onClick={handleZoomIn}>
          <ZoomIn />
        </Button>
        <Button size="icon" variant="outline" onClick={handleZoomOut}>
          <ZoomOut />
        </Button>
      </div>

      <div className="w-full h-full overflow-auto" id="mindmap-canvas">
        <div
          ref={contentRef}
          id="mindmap-content"
          className={cn(
            "relative transition-transform duration-300 origin-center",
            !!selectedNodeId && "scale-[0.98]"
          )}
          style={{ width, height, transform: `scale(${zoom})` }}
        >
          <svg
            width={width}
            height={height}
            className="absolute inset-0 overflow-visible"
          >
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeOpacity="0.2"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {links.map((link, i) => {
              const isRelatedToSelected =
                selectedNodeWithFamily?.family.has(link.source.data.id) &&
                selectedNodeWithFamily?.family.has(link.target.data.id);
              const isDimmed = !!selectedNodeId && !isRelatedToSelected;

              return (
                <g
                  key={`link-group-${i}`}
                  className={cn(
                    "transition-all duration-500",
                    isDimmed && "opacity-30"
                  )}
                >
                  <path
                    d={
                      getPath({
                        source: [link.source.x, link.source.y],
                        target: [link.target.x, link.target.y],
                      })!
                    }
                    fill="none"
                    stroke={"hsl(var(--border))"}
                    strokeWidth={1.5}
                  />
                  {isRelatedToSelected && (
                    <path
                      className="synaptic-pulse"
                      d={
                        getPath({
                          source: [link.source.x, link.source.y],
                          target: [link.target.x, link.target.y],
                        })!
                      }
                      fill="none"
                      stroke="hsl(var(--accent))"
                      strokeWidth={2}
                    />
                  )}
                </g>
              );
            })}
          </svg>

          <div className="relative w-full h-full">
            {nodes.map((node, i) => (
              <NodeComponent
                key={`${node.data.id}-${i}`}
                node={node}
                onNodeSelect={
                  onNodeSelect as (node: HierarchicalMapNode) => void
                }
                isSelected={node.data.id === selectedNodeId}
                isDimmed={
                  !!selectedNodeId &&
                  !selectedNodeWithFamily?.family.has(node.data.id)
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
