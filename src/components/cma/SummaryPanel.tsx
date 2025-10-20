"use client";

import type { HierarchicalMapNode, Note, MindMapData } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Volume2,
  MessageSquareQuote,
  Bookmark,
  ThumbsUp,
  HelpCircle,
  Flame,
  X,
  Loader2,
  Pencil,
  VolumeX, // Imported VolumeX for the stop state
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SummarizeSelectedNodeOutput } from "@/ai/flows/summarize-selected-node";
import { SaveNoteDialog } from "./SaveNoteDialog";
import { useTTS } from "@/hooks/use-tts";

interface SummaryPanelProps {
  node: HierarchicalMapNode | null;
  summary: SummarizeSelectedNodeOutput | null;
  isLoadingSummary: boolean;
  onNodeSelect: (node: HierarchicalMapNode | null) => void;
  note?: Note;
  mindMapData: MindMapData | null;
}

export function SummaryPanel({
  node,
  summary,
  isLoadingSummary,
  onNodeSelect,
  note,
  mindMapData,
}: SummaryPanelProps) {
  const glassEffect = "bg-card/60 backdrop-blur-xl border-border";
  // TTS Hook Initialization
  const { isTTSAvailable, isSpeaking, speak, stop } = useTTS();

  const handleNarrate = () => {
    if (!summary) return;

    if (isSpeaking) {
      stop();
      return;
    }

    // Concatenate the summaries for a full narration
    const fullText = `Node: ${node?.label}. TL;DR: ${summary.tl_dr}. Detailed summary: ${summary.detailed}. Analogy: ${summary.analogy}.`;
    speak(fullText);
  };

  // Determine if narration should be disabled (no summary OR TTS not available)
  const isNarrationDisabled = !summary || !isTTSAvailable;

  return (
    <div
      className={cn(
        `w-96 shrink-0 h-full transition-transform duration-500 ease-in-out`,
        // Use translate-x-full for cleaner hiding, assuming the parent container allows it.
        !node ? "translate-x-full" : "translate-x-0"
      )}
    >
      <Card
        className={`w-full h-full flex flex-col ${glassEffect} shadow-2xl shadow-black/20`}
      >
        {node && (
          <>
            <CardHeader className="pb-4 relative">
              <button
                className="absolute top-4 right-4 h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted"
                onClick={() => onNodeSelect(null)}
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2 mb-2 pt-4">
                <Badge variant="outline" className="capitalize border-border">
                  Concept
                </Badge>
              </div>
              <CardTitle className="text-2xl font-headline pr-8">
                {node.label}
              </CardTitle>
              <CardDescription className="font-code text-xs pt-1">
                ID: {node.id}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 overflow-y-auto pt-4">
              {isLoadingSummary ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                  <p className="mt-4 text-muted-foreground">
                    Generating summary...
                  </p>
                </div>
              ) : summary ? (
                <>
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                      TL;DR
                    </h3>
                    <p className="text-foreground/90">{summary.tl_dr}</p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                      Detailed Summary
                    </h3>
                    <p className="text-foreground/90 whitespace-pre-wrap text-sm leading-relaxed">
                      {summary.detailed}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                      <MessageSquareQuote className="h-4 w-4" />
                      Analogy
                    </h3>
                    <blockquote className="text-foreground/90 italic border-l-2 border-accent pl-4">
                      {summary.analogy}
                    </blockquote>
                  </div>

                  {note && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                          <Pencil className="h-4 w-4" /> My Note
                        </h3>
                        <p className="text-foreground/90 whitespace-pre-wrap text-sm leading-relaxed">
                          {note.content}
                        </p>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <p className="text-muted-foreground">No summary available.</p>
                </div>
              )}

              <div className="mt-auto pt-4 space-y-2">
                <Separator />
                <div className="flex gap-2">
                  <button
                    // FIX: Moved onClick and disabled attributes inside the tag
                    onClick={handleNarrate}
                    disabled={isNarrationDisabled}
                    className={cn(
                      "flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 w-full",
                      isSpeaking
                        ? "bg-accent text-accent-foreground hover:bg-accent/90" // Accent color when speaking
                        : "border border-input bg-background hover:bg-accent hover:text-accent-foreground" // Default style
                    )}
                  >
                    {isSpeaking ? (
                      // Show the stop icon when speaking
                      <VolumeX className="mr-2 h-4 w-4" />
                    ) : (
                      // Show the volume icon otherwise
                      <Volume2 className="mr-2 h-4 w-4" />
                    )}
                    {isSpeaking ? "Stop Narrating" : "Narrate Summary"}
                  </button>

                  <SaveNoteDialog
                    node={node}
                    existingNote={note}
                    mindMapData={mindMapData}
                  >
                    <button className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full">
                      <Bookmark className="mr-2 h-4 w-4" />{" "}
                      {note ? "Edit Note" : "Save Note"}
                    </button>
                  </SaveNoteDialog>
                </div>
                <div className="text-center text-xs text-muted-foreground pt-2">
                  Feedback
                </div>
                <div className="flex gap-2">
                  <button className="w-full h-12 flex-col gap-1 items-center justify-center inline-flex hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium">
                    <ThumbsUp className="h-5 w-5 text-green-400" />
                    <span className="text-xs">Got it</span>
                  </button>
                  <button className="w-full h-12 flex-col gap-1 items-center justify-center inline-flex hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium">
                    <HelpCircle className="h-5 w-5 text-yellow-400" />
                    <span className="text-xs">Confused</span>
                  </button>
                  <button className="w-full h-12 flex-col gap-1 items-center justify-center inline-flex hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium">
                    <Flame className="h-5 w-5 text-orange-400" />
                    <span className="text-xs">Insightful</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
