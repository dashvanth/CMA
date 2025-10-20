'use server';

/**
 * @fileOverview Summarizes a selected node, providing TL;DR, detailed, and analogy summaries.
 *
 * - summarizeSelectedNode - A function that handles the summarization process.
 * - SummarizeSelectedNodeInput - The input type for the summarizeSelectedNode function.
 * - SummarizeSelectedNodeOutput - The return type for the summarizeSelectedNode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeSelectedNodeInputSchema = z.object({
  nodeId: z.string().describe('The ID of the node to summarize.'),
  label: z.string().describe('The label of the node.'),
  detailLevel: z.enum(['detailed', 'simplest']).default('detailed').describe('The level of detail for the summaries.'),
});

export type SummarizeSelectedNodeInput = z.infer<typeof SummarizeSelectedNodeInputSchema>;

const SummarizeSelectedNodeOutputSchema = z.object({
  tl_dr: z.string().describe('A short, ≤ 2 sentences, max 28 words summary.'),
  detailed: z.string().describe('1–3 concise paragraphs summary, may include bullet points.'),
  analogy: z.string().describe('1–2 short analogies using everyday examples.'),
});

export type SummarizeSelectedNodeOutput = z.infer<typeof SummarizeSelectedNodeOutputSchema>;

export async function summarizeSelectedNode(input: SummarizeSelectedNodeInput): Promise<SummarizeSelectedNodeOutput> {
  return summarizeSelectedNodeFlow(input);
}

const summarizeSelectedNodePrompt = ai.definePrompt({
  name: 'summarizeSelectedNodePrompt',
  input: {schema: SummarizeSelectedNodeInputSchema},
  output: {schema: SummarizeSelectedNodeOutputSchema},
  prompt: `You are CMA (Cognitive Mindmap Assistant) Backend Assistant. You are an expert at summarizing complex topics.

You will be provided with a node label from a mindmap, and you will generate a TL;DR, a detailed summary, and an analogy for the concept. The detailLevel is {{{detailLevel}}}.

Node Label: {{{label}}}

Output a JSON object with the following keys:
- tl_dr: A short, ≤ 2 sentences, max 28 words summary.
- detailed: 1–3 concise paragraphs summary, may include bullet points.
- analogy: 1–2 short analogies using everyday examples.

Ensure that the summaries are context-aware and relevant to the node label provided.
`,config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
  },
});

const summarizeSelectedNodeFlow = ai.defineFlow(
  {
    name: 'summarizeSelectedNodeFlow',
    inputSchema: SummarizeSelectedNodeInputSchema,
    outputSchema: SummarizeSelectedNodeOutputSchema,
  },
  async input => {
    const {output} = await summarizeSelectedNodePrompt(input);
    return output!;
  }
);
