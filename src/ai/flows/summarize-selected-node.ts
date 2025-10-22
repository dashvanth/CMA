"use server";

/**
 * @fileOverview Summarizes a selected node, providing TL;DR, detailed, and analogy, with full mindmap context (RAG-enabled).
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

// 💡 UPDATED INPUT SCHEMA: Added fields for comprehensive RAG context
const SummarizeSelectedNodeInputSchema = z.object({
  nodeId: z.string().describe("The ID of the node to summarize."),
  label: z.string().describe("The label of the node to be summarized."),
  mindmapTitle: z
    .string()
    .describe("The main topic/title of the mindmap (e.g., 'Agentic AI')."),
  detailLevel: z
    .enum(["detailed", "simplest"])
    .default("detailed")
    .describe("The level of detail for the summaries."),

  // RAG CONTEXT FIELDS
  ancestorNodes: z
    .string()
    .describe(
      "A comma-separated list of the parent/ancestor nodes' labels, providing the hierarchical context."
    ), // <--- NEW
  siblingNodes: z
    .string()
    .describe(
      "A comma-separated list of the sibling nodes' labels, providing related topics at the same level."
    ), // <--- NEW
  sourceContent: z
    .string()
    .describe(
      "The entire original document or text used to generate the mindmap. This is the RAG source material."
    ), // <--- NEW
});

export type SummarizeSelectedNodeInput = z.infer<
  typeof SummarizeSelectedNodeInputSchema
>;

// OUTPUT SCHEMA remains the same (tl_dr, detailed, analogy)
const SummarizeSelectedNodeOutputSchema = z.object({
  tl_dr: z
    .string()
    .describe("A short, concise, high-level summary (max 28 words)."),
  detailed: z
    .string()
    .describe(
      "1–3 concise paragraphs summarizing the concept in detail, using a professional tone. May include bullet points or numbered lists."
    ),
  analogy: z
    .string()
    .describe(
      "1–2 short, creative analogies using common, everyday examples to explain the concept."
    ),
});

export type SummarizeSelectedNodeOutput = z.infer<
  typeof SummarizeSelectedNodeOutputSchema
>;

export async function summarizeSelectedNode(
  input: SummarizeSelectedNodeInput
): Promise<SummarizeSelectedNodeOutput> {
  return summarizeSelectedNodeFlow(input);
}

// Define the text prompt structure (only for Gemini text model)
const summarizeSelectedNodeTextPrompt = ai.definePrompt({
  name: "summarizeSelectedNodeTextPrompt",
  input: { schema: SummarizeSelectedNodeInputSchema },
  output: {
    schema: z.object({
      tl_dr: z.string(),
      detailed: z.string(),
      analogy: z.string(),
    }),
  },
  // 💡 FIX 2: Updated the prompt to utilize all RAG context fields
  prompt: `You are CMA (Cognitive Mindmap Assistant) Backend Assistant. Your expertise is in generating advanced, highly contextual summaries for mindmap nodes.

Primary Context (Mindmap Topic): **{{{mindmapTitle}}}**
Current Node to Summarize: **{{{label}}}**
Detail Level: {{{detailLevel}}}

Hierarchical Context:
- Ancestors: {{{ancestorNodes}}}
- Siblings (Related Concepts): {{{siblingNodes}}}

RAG Source Content:
---
{{{sourceContent}}}
---

Your task is to generate a comprehensive summary for the 'Current Node to Summarize'. **CRITICALLY, you must use the RAG Source Content and the Hierarchical Context to inform your summary.** Do not give a generic definition. The summary must explain the node in the direct context of the Mindmap Topic.

Output a structured JSON object with the following keys, strictly adhering to the requested style and format:
- tl_dr: A short, concise, high-level summary (max 28 words). Must clearly relate to the 'Primary Context'.
- detailed: 1–3 concise paragraphs summarizing the concept in detail, using a professional tone. It must explain the concept's relationship to the overall mindmap topic and its placement in the map structure.
- analogy: 1–2 short, creative analogies using common, everyday examples to explain the concept to a beginner.

`,
  config: {
    safetySettings: [
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_ONLY_HIGH",
      },
    ],
    // Force structured JSON output
    responseMimeType: "application/json",
  },
});

const summarizeSelectedNodeFlow = ai.defineFlow(
  {
    name: "summarizeSelectedNodeFlow",
    inputSchema: SummarizeSelectedNodeInputSchema,
    outputSchema: SummarizeSelectedNodeOutputSchema,
  },
  async (input) => {
    // 1. Generate Text Summary (Run Text Prompt)
    const { output: summaryData } = await summarizeSelectedNodeTextPrompt(
      input
    );

    // 2. Return the text result directly.
    return summaryData as SummarizeSelectedNodeOutput; // Cast to final type
  }
);
