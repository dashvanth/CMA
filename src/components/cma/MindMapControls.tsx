"use client";

import {
  Download,
  Save,
  FileJson,
  FileImage,
  Sheet,
  FileText,
  Loader2,
  Presentation,
  StopCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MindMapData } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MindMapControlsProps {
  onExport: (format: "json" | "png" | "pdf" | "csv") => void;
  onSave: () => void;
  isSaving: boolean;
  mindMapData: MindMapData | null;
  isLoading: boolean;

  // --- New Props for Presentation Mode ---
  isPresentationMode: boolean;
  onTogglePresentation: () => void;
}

export function MindMapControls({
  onExport,
  onSave,
  isSaving,
  mindMapData,
  isLoading,
  isPresentationMode,
  onTogglePresentation,
}: MindMapControlsProps) {
  const isMindMapPresent = !!mindMapData && !isLoading;
  const isAnyActionPending = isLoading || isSaving;

  return (
    <div className="p-4 border-t border-border">
      <div className="flex gap-2 mb-2">
        {/* PRESENTATION BUTTON */}
        <Button
          variant={isPresentationMode ? "destructive" : "secondary"}
          className={cn(
            "w-full",
            isPresentationMode && "bg-destructive hover:bg-destructive/90"
          )}
          onClick={onTogglePresentation}
          disabled={isAnyActionPending || !isMindMapPresent}
        >
          {isPresentationMode ? (
            <StopCircle className="mr-2 h-4 w-4" />
          ) : (
            <Presentation className="mr-2 h-4 w-4" />
          )}
          {isPresentationMode ? "Exit Presentation" : "Present Mode"}
        </Button>

        {/* SAVE BUTTON */}
        <Button
          variant="secondary"
          className="w-full"
          onClick={onSave}
          disabled={
            !isMindMapPresent || isSaving || isLoading || isPresentationMode
          }
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isSaving ? "Saving..." : mindMapData?.isSaved ? "Saved" : "Save"}
        </Button>
      </div>

      {/* EXPORT DROPDOWN */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full"
            disabled={
              !isMindMapPresent || isAnyActionPending || isPresentationMode
            }
          >
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuItem onSelect={() => onExport("png")}>
            <FileImage className="mr-2 h-4 w-4" />
            <span>PNG</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onExport("pdf")}>
            <FileText className="mr-2 h-4 w-4" />
            <span>PDF</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => onExport("json")}>
            <FileJson className="mr-2 h-4 w-4" />
            <span>JSON</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onExport("csv")}>
            <Sheet className="mr-2 h-4 w-4" />
            <span>CSV</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
