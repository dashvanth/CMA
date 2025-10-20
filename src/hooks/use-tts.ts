"use client";

import { useState, useCallback, useEffect } from "react";

/**
 * Hook to manage Text-to-Speech (TTS) functionality.
 * Uses the browser's native SpeechSynthesis API.
 */
export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  const utteranceRef = useCallback((node: SpeechSynthesisUtterance) => {
    if (node) {
      node.onend = () => setIsSpeaking(false);
      node.onstart = () => setIsSpeaking(true);
    }
  }, []);

  // Cleanup effect on unmount
  useEffect(() => {
    return () => {
      if (synth && synth.speaking) {
        synth.cancel();
      }
    };
  }, [synth]);

  const speak = useCallback(
    (text: string) => {
      if (!synth || !text) return;

      if (synth.speaking) {
        synth.cancel(); // Stop current speech if any
      }

      const utterance = new SpeechSynthesisUtterance(text);
      // You can customize properties here (e.g., rate, pitch, voice)
      // utterance.rate = 1.1;

      // Set up listeners via the ref logic
      utteranceRef(utterance);

      synth.speak(utterance);
    },
    [synth, utteranceRef]
  );

  const stop = useCallback(() => {
    if (synth && synth.speaking) {
      synth.cancel();
    }
    setIsSpeaking(false);
  }, [synth]);

  return {
    isTTSAvailable: !!synth,
    isSpeaking,
    speak,
    stop,
  };
}
