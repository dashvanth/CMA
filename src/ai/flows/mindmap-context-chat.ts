// use server is necessary for Genkit flows that are invoked from the Next.js client
"use server";
/**
 * @fileOverview Answers a user's question based strictly on a provided text context (mind map source).
 *
 * - mindMapContextChat - A server function to invoke the contextual chat flow.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

// --- TYPE DEFINITIONS (Simplified - Removed ChatMessage and chatHistory) ---

// 1. Define Input Schema for the Flow
const MindMapContextChatInputSchema = z.object({
  userQuestion: z
    .string()
    .describe(
      "The specific question asked by the user about the document context."
    ),
  context: z
    .string()
    .describe(
      "The entire text content (e.g., document text or mind map JSON payload) the AI must use as its knowledge source."
    ),
});

export type MindMapContextChatInput = z.infer<
  typeof MindMapContextChatInputSchema
>;

// 2. Define Output Schema for the Flow
const MindMapContextChatOutputSchema = z.object({
  text: z
    .string()
    .describe("The direct, relevant answer derived from the context."),
});

export type MindMapContextChatOutput = z.infer<
  typeof MindMapContextChatOutputSchema
>;

// 3. Define the LLM Prompt Template
const llmPromptTemplate = `System: You are a highly focused Contextual Chatbot Assistant. Your sole purpose is to answer the user's question based **ONLY** on the provided content enclosed in the "Context" section.
Do not use any external or general knowledge. This is a strict constraint.
If the answer cannot be found in the provided "Context", you **MUST** reply with a phrase like: "I cannot find the answer to that question within the context of the current mind map source document."
Provide a concise and direct answer.

Context:
---
{{{context}}}
---

User Question: {{{userQuestion}}}`;

// 4. Define the Prompt and Flow using Genkit
// NOTE: We switch back to definePrompt/defineFlow pattern for maximum stability
const mindMapContextChatPrompt = ai.definePrompt({
  name: "mindMapContextChatPrompt",
  input: { schema: MindMapContextChatInputSchema },
  output: { schema: MindMapContextChatOutputSchema },
  prompt: llmPromptTemplate,
});

const mindMapContextChatFlow = ai.defineFlow(
  {
    name: "mindmap-context-chat", // This is the flow name required by the feature goal
    inputSchema: MindMapContextChatInputSchema,
    outputSchema: MindMapContextChatOutputSchema,
  },
  async (input) => {
    // This executes the prompt with the user's inputs
    const { output } = await mindMapContextChatPrompt(input);
    return output!;
  }
);

// 5. Export the Server Action function for use in the Next.js frontend
export async function mindMapContextChat(
  input: MindMapContextChatInput
): Promise<MindMapContextChatOutput> {
  // Directly call the flow implementation
  return mindMapContextChatFlow(input);
}
