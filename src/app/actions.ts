"use server";

import { generateMindMapFromInput } from "@/ai/flows/generate-mind-map-from-input";
import {
  executeVoiceCommand,
  ExecuteVoiceCommandOutput,
} from "@/ai/flows/execute-voice-commands";
import { GenerateMindMapOutput } from "@/lib/types";

// Expose the voice command flow as a server action
export async function executeVoiceCommandAction(
  transcript: string
): Promise<ExecuteVoiceCommandOutput> {
  if (!transcript) {
    throw new Error("Transcript cannot be empty.");
  }

  // Use a placeholder Session ID as the flow expects one
  const sessionId = "cma-session-id";

  return executeVoiceCommand({ sessionId, transcript });
}
