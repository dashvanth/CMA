"use server";

/**
 * @fileOverview Summarizes a selected node, providing TL;DR, detailed, analogy, and a conceptual image.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const SummarizeSelectedNodeInputSchema = z.object({
  nodeId: z.string().describe("The ID of the node to summarize."),
  label: z.string().describe("The label of the node."),
  detailLevel: z
    .enum(["detailed", "simplest"])
    .default("detailed")
    .describe("The level of detail for the summaries."),
});

export type SummarizeSelectedNodeInput = z.infer<
  typeof SummarizeSelectedNodeInputSchema
>;

// 💡 UPDATED OUTPUT SCHEMA TO INCLUDE imageUrl
const SummarizeSelectedNodeOutputSchema = z.object({
  tl_dr: z.string().describe("A short, ≤ 2 sentences, max 28 words summary."),
  detailed: z
    .string()
    .describe("1–3 concise paragraphs summary, may include bullet points."),
  analogy: z.string().describe("1–2 short analogies using everyday examples."),
  imageUrl: z
    .string()
    .nullable()
    .describe(
      "The data URL or public URL of the AI-generated conceptual image."
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
  prompt: `You are CMA (Cognitive Mindmap Assistant) Backend Assistant. You are an expert at summarizing complex topics.

You will be provided with a node label from a mindmap, and you will generate a TL;DR, a detailed summary, and an analogy for the concept. The detailLevel is {{{detailLevel}}}.

Node Label: {{{label}}}

Output a JSON object with the following keys:
- tl_dr: A short, ≤ 2 sentences, max 28 words summary.
- detailed: 1–3 concise paragraphs summary, may include bullet points.
- analogy: 1–2 short analogies using everyday examples.

Ensure that the summaries are context-aware and relevant to the node label provided.
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

// 💡 UPDATED FLOW TO CALL BOTH TEXT AND IMAGE MODELS
const summarizeSelectedNodeFlow = ai.defineFlow(
  {
    name: "summarizeSelectedNodeFlow",
    inputSchema: SummarizeSelectedNodeInputSchema,
    outputSchema: SummarizeSelectedNodeOutputSchema,
  },
  async (input) => {
    const { label } = input;

    // 1. Generate Text Summary (Run Text Prompt)
    const { output: summaryData } = await summarizeSelectedNodeTextPrompt(
      input
    );

    // 2. Generate Image (New Logic)
    let imageUrl: string | null = null;
    const imagePrompt = `A minimalist, abstract, conceptual illustration of the idea: ${label}. Clean white background, simple vector art style, wide aspect ratio.`;

    try {
      // Use ai.generateImages with an image model (Imagen 3.0 is recommended via Google AI)
      const imageResponse = await ai.generateImages({
        model: "imagen-3.0-generate-002",
        prompt: imagePrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: "image/jpeg",
          imageSize: "1024x1024",
        },
      });

      if (
        imageResponse.generatedImages &&
        imageResponse.generatedImages.length > 0
      ) {
        // The result will contain the accessible URL (often a data:image/...)
        imageUrl = imageResponse.generatedImages[0].url || null;
      }
    } catch (e) {
      // If image generation fails (e.g., content violation, API error), proceed without the image
      console.error(`Image generation failed for node "${label}":`, e);
    }

    // 3. Return Combined Result
    return {
      ...summaryData,
      imageUrl,
    } as SummarizeSelectedNodeOutput; // Cast to final type
  }
);
