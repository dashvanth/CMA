'use server';
/**
 * @fileOverview Generates a mind map from text, file, or voice input.
 *
 * - generateMindMapFromInput - A function that handles the mind map generation process.
 * - GenerateMindMapInput - The input type for the generateMindMapFromInput function.
 * - GenerateMindMapOutput - The return type for the generateMindMapFromInput function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GenerateMindMapOutput } from '@/lib/types';


const NodeSchema = z.object({
  id: z.string().min(1, { message: 'Node ID cannot be empty.' }),
  label: z.string().min(1, { message: 'Node label cannot be empty.' }),
  parentId: z.string().optional(),
});

const GenerateMindMapOutputSchema = z.object({
  mapId: z.string().optional(),
  title: z.string().optional(),
  createdAt: z.string().optional(),
  nodes: z.array(NodeSchema),
  exportMeta: z.any().optional(),
});

const GenerateMindMapInputSchema = z.object({
  inputType: z.enum(['text', 'file', 'audio']),
  payload: z
    .string()
    .describe(
      'The text, file content, or audio transcription to generate a mind map from.'
    ),
  options: z
    .object({
      detailLevel: z
        .enum(['detailed', 'simplest'])
        .default('detailed')
        .describe('The level of detail to include in the mind map summaries.'),
    })
    .default({}),
});
export type GenerateMindMapInput = z.infer<typeof GenerateMindMapInputSchema>;

export async function generateMindMapFromInput(
  input: GenerateMindMapInput
): Promise<GenerateMindMapOutput> {
  return generateMindMapFromInputFlow(input);
}

const llmPromptTemplate = `System: You are CMA Backend Assistant. You are an expert at creating hierarchical mind maps from text.
Your output MUST be a single JSON object that strictly follows the provided schema. Do not add any extra commentary or text outside of the JSON object.

You will generate a FLAT LIST of nodes. Each node object MUST have:
1. A unique 'id' (e.g., "special-relativity").
2. A non-empty 'label' (e.g., "Special Relativity").
3. An optional 'parentId' which is the 'id' of its parent. The main, top-level node will not have a 'parentId'.

Example of a FLAT LIST structure for a mind map about Relativity:
{
  "nodes": [
    { "id": "theory-of-relativity", "label": "Theory of Relativity" },
    { "id": "special-relativity", "label": "Special Relativity", "parentId": "theory-of-relativity" },
    { "id": "general-relativity", "label": "General Relativity", "parentId": "theory-of-relativity" },
    { "id": "time-dilation", "label": "Time Dilation", "parentId": "special-relativity" },
    { "id": "length-contraction", "label": "Length Contraction", "parentId": "special-relativity" }
  ]
}

Now, generate a complete mind map for the following input as a flat list of nodes. Ensure EVERY node has a unique 'id' and 'label'.

User: {{{payload}}}`;

const generateMindMapPrompt = ai.definePrompt({
  name: 'generateMindMapPrompt',
  input: {schema: GenerateMindMapInputSchema},
  output: {schema: GenerateMindMapOutputSchema},
  prompt: llmPromptTemplate,
});

const generateMindMapFromInputFlow = ai.defineFlow(
  {
    name: 'generateMindMapFromInputFlow',
    inputSchema: GenerateMindMapInputSchema,
    outputSchema: GenerateMindMapOutputSchema,
  },
  async input => {
    const {output} = await generateMindMapPrompt(input);

    if (output) {
      if (!output.mapId) output.mapId = `map-${Date.now()}`;
      if (!output.title)
        output.title =
          output.nodes?.find(n => !n.parentId)?.label || 'Untitled Mind Map';
      if (!output.createdAt) output.createdAt = new Date().toISOString();
      if (!output.exportMeta) {
        output.exportMeta = {
          exportedBy: 'CMA-ai-fallback',
          mode: 'full',
          oneDayModeApplied: false,
        };
      }
    }

    return output!;
  }
);