'use server';

/**
 * @fileOverview Implements a Genkit flow to execute voice commands for the Cognitive Mindmap Assistant.
 *
 * This flow processes voice transcripts and determines the appropriate action to take,
 * such as explaining a concept or saving notes. It returns the action to be performed
 * and the target node ID, if applicable.
 *
 * - executeVoiceCommand - The main function to execute voice commands.
 * - ExecuteVoiceCommandInput - The input type for the executeVoiceCommand function.
 * - ExecuteVoiceCommandOutput - The return type for the executeVoiceCommand function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExecuteVoiceCommandInputSchema = z.object({
  sessionId: z.string().describe('The session ID of the user.'),
  transcript: z.string().describe('The voice transcript from the user.'),
});
export type ExecuteVoiceCommandInput = z.infer<typeof ExecuteVoiceCommandInputSchema>;

const ExecuteVoiceCommandOutputSchema = z.object({
  action: z.enum(['explain', 'analogy', 'save']).describe('The action to be performed.'),
  targetNodeId: z.string().optional().describe('The target node ID, if applicable.'),
});
export type ExecuteVoiceCommandOutput = z.infer<typeof ExecuteVoiceCommandOutputSchema>;

export async function executeVoiceCommand(input: ExecuteVoiceCommandInput): Promise<ExecuteVoiceCommandOutput> {
  return executeVoiceCommandFlow(input);
}

const executeVoiceCommandPrompt = ai.definePrompt({
  name: 'executeVoiceCommandPrompt',
  input: {schema: ExecuteVoiceCommandInputSchema},
  output: {schema: ExecuteVoiceCommandOutputSchema},
  prompt: `You are CMA (Cognitive Mindmap Assistant), a helpful assistant designed to interpret voice commands within a mind mapping application.

  Based on the user's transcript, determine the appropriate action to take. The possible actions are:
  - explain: The user wants you to explain a concept in more detail.
  - analogy: The user wants you to provide an analogy for a concept.
  - save: The user wants you to save a note associated with a node.

  If the command refers to a specific node, extract the node ID. If the command does not refer to a specific node, the targetNodeId should be omitted.

  Here are some example transcripts and corresponding JSON outputs:

  Transcript: "Explain this concept."
  Output: { "action": "explain" }

  Transcript: "Give me an analogy for this."
  Output: { "action": "analogy" }

  Transcript: "Save this note."
  Output: { "action": "save" }

  Transcript: "Explain node 123."
  Output: { "action": "explain", "targetNodeId": "123" }

  Transcript: "Analogy for node ABC."
  Output: { "action": "analogy", "targetNodeId": "ABC" }

  Transcript: "Save note for node XYZ."
  Output: { "action": "save", "targetNodeId": "XYZ" }

  Now, interpret the following transcript and generate the appropriate JSON output:

  Transcript: {{{transcript}}}
  `, 
});

const executeVoiceCommandFlow = ai.defineFlow(
  {
    name: 'executeVoiceCommandFlow',
    inputSchema: ExecuteVoiceCommandInputSchema,
    outputSchema: ExecuteVoiceCommandOutputSchema,
  },
  async input => {
    const {output} = await executeVoiceCommandPrompt(input);
    return output!;
  }
);
