'use server';
/**
 * @fileOverview Converts a mind map from JSON to CSV format.
 *
 * - convertMapToCsv - A function that handles the mind map conversion process.
 * - ConvertMapToCsvInput - The input type for the convertMapToCsv function.
 * - ConvertMapToCsvOutput - The return type for the convertMapToCsv function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {GenerateMindMapOutput, HierarchicalMapNode} from '@/lib/types';
import papaparse from 'papaparse';

const NodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  parentId: z.string().optional(),
});

const ConvertMapToCsvInputSchema = z.object({
  mapId: z.string().optional(),
  title: z.string().optional(),
  createdAt: z.string().optional(),
  nodes: z.array(NodeSchema),
  exportMeta: z.any().optional(),
});

export type ConvertMapToCsvInput = z.infer<typeof ConvertMapToCsvInputSchema>;

const ConvertMapToCsvOutputSchema = z.object({
  csv: z.string(),
});
export type ConvertMapToCsvOutput = z.infer<typeof ConvertMapToCsvOutputSchema>;

// Helper to build hierarchy
const buildHierarchy = (
  nodes: GenerateMindMapOutput['nodes']
): HierarchicalMapNode | null => {
  if (!nodes || nodes.length === 0) {
    return null;
  }
  const nodeMap = new Map<string, HierarchicalMapNode>();
  let rootNode: HierarchicalMapNode | null = null;
  nodes.forEach(node => {
    if (node.id && node.label) {
      const newNode: HierarchicalMapNode = {...node, children: []};
      nodeMap.set(node.id, newNode);
      if (!node.parentId) {
        rootNode = newNode;
      }
    }
  });
  if (!rootNode && nodes.length > 0) {
    const potentialRoots = nodes.filter(n => !n.parentId || !nodeMap.has(n.parentId!));
    if (potentialRoots.length > 0) {
      rootNode = nodeMap.get(potentialRoots[0].id)!;
    }
  }
  if (!rootNode && nodes.length > 0) {
    rootNode = nodeMap.get(nodes[0].id)!;
  }
  nodes.forEach(node => {
    if (node.id && node.label && node.parentId && nodeMap.has(node.parentId)) {
      const parent = nodeMap.get(node.parentId);
      const child = nodeMap.get(node.id);
      if (parent && child && parent.id !== child.id) {
        parent.children = parent.children || [];
        parent.children.push(child);
      }
    }
  });
  return rootNode;
};

// Helper to flatten hierarchy
const flattenHierarchy = (root: HierarchicalMapNode) => {
  const flat: {level: number; id: string; label: string; parentId?: string}[] =
    [];
  function traverse(node: HierarchicalMapNode, level: number) {
    flat.push({
      level,
      id: node.id,
      label: node.label,
      parentId: node.parentId,
    });
    if (node.children) {
      node.children.forEach(child => traverse(child, level + 1));
    }
  }
  traverse(root, 0);
  return flat;
};

export async function convertMapToCsv(
  input: ConvertMapToCsvInput
): Promise<ConvertMapToCsvOutput> {
  return convertMapToCsvFlow(input);
}

const convertMapToCsvFlow = ai.defineFlow(
  {
    name: 'convertMapToCsvFlow',
    inputSchema: ConvertMapToCsvInputSchema,
    outputSchema: ConvertMapToCsvOutputSchema,
  },
  async mindMapData => {
    const root = buildHierarchy(mindMapData.nodes);
    if (!root) {
      throw new Error('Could not build hierarchy from mind map data.');
    }

    const flattenedData = flattenHierarchy(root);

    const csv = papaparse.unparse(flattenedData, {
      columns: ['level', 'id', 'label', 'parentId'],
    });

    return {csv};
  }
);
