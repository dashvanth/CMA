"use client";

import {
  Download,
  Save,
  FileJson,
  FileImage,
  Sheet,
  FileText,
  Loader2,
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

interface MindMapControlsProps {
  onExport: (format: "json" | "png" | "pdf" | "csv") => void;
  onSave: () => void;
  isSaving: boolean;
  mindMapData: MindMapData | null;
  isLoading: boolean;
}

export function MindMapControls({ onExport, onSave, isSaving, mindMapData, isLoading }: MindMapControlsProps) {
  const isMindMapPresent = !!mindMapData;

  return (
    <div className="p-4 border-t border-border">
      <div className="flex gap-2">
        <Button 
          variant="secondary" 
          className="w-full" 
          onClick={onSave}
          disabled={!isMindMapPresent || isSaving || isLoading}
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isSaving ? 'Saving...' : mindMapData?.isSaved ? 'Saved' : 'Save'}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              className="w-full"
              disabled={!isMindMapPresent || isLoading}
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
    </div>
  );
}
