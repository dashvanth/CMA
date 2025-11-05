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
  Sparkles,
  Mic,
  Upload,
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
import { Textarea } from "../ui/textarea";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card"; // Kept Card imports for utility, but not used for the fixed bar styling directly

interface InputPanelProps {
  onGenerate: (payload: string) => void;
  onPdfUpload: (formData: FormData) => void;
  onExport: (format: "json" | "png" | "pdf" | "csv") => void;
  onSave: () => void;
  isGenerating: boolean;
  isUploading: boolean;
  isSaving: boolean;
  mindMapData: MindMapData | null;
  // --- PRESENTATION MODE PROPS ---
  isPresentationMode: boolean;
  onTogglePresentation: () => void;
}

export function InputPanel({
  onGenerate,
  onPdfUpload,
  onExport,
  onSave,
  isGenerating,
  isUploading,
  isSaving,
  mindMapData,
  isPresentationMode,
  onTogglePresentation,
}: InputPanelProps) {
  const [textInput, setTextInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isAnyActionPending = isGenerating || isUploading || isSaving;
  const isMindMapPresent = !!mindMapData;
  const isLoading = isGenerating || isUploading;

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
  };

  const handleGenerateClick = () => {
    if (textInput.trim()) {
      onGenerate(textInput);
      setTextInput(""); // Clear input after triggering generation
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please select a PDF file.",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    onPdfUpload(formData);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    // Root div now has the fixed positioning and Glass-Morphism effect
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 
                 w-full max-w-6xl z-40 px-8 py-4 mb-4 
                 rounded-2xl backdrop-blur-xl bg-card/70 
                 shadow-2xl border border-border/50 
                 transition-all duration-300 ease-in-out"
    >
      {/* Input Bar Content */}
      <div className="flex w-full items-end gap-3">
        {/* FILE UPLOAD / MIC BUTTONS (Left Side) */}
        <div className="flex items-center gap-2 mb-1 shrink-0">
          {/* PDF UPLOAD BUTTON */}
          <input
            id="pdf-file"
            type="file"
            name="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf"
            disabled={isAnyActionPending || isPresentationMode}
          />
          <Button
            variant="outline"
            className="h-14 w-14 p-0 shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnyActionPending || isPresentationMode}
            title={isUploading ? "Uploading PDF..." : "Upload PDF"}
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Upload className="h-5 w-5" />
            )}
          </Button>

          {/* VOICE BUTTON (Placeholder for future feature) */}
          <Button
            variant="outline"
            className="h-14 w-14 p-0 shrink-0"
            disabled={isLoading || isPresentationMode}
            title="Use Voice (Future Feature)"
          >
            <Mic className="h-5 w-5" />
          </Button>
        </div>

        {/* TEXT AREA AND GENERATE BUTTON (Center - Flex Grow) */}
        <div className="flex-grow min-w-0 relative">
          <Textarea
            id="text-input"
            placeholder="Paste text or type your concept here to generate a mind map..."
            value={textInput}
            onChange={handleTextareaChange}
            rows={2} // Reduced rows for compact look
            className="min-h-[56px] resize-none pr-16" // Added pr-16 for the spark button
            disabled={isAnyActionPending || isPresentationMode}
            onKeyDown={(e) => {
              // Submit on Enter key press without Shift key
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                textInput.trim() &&
                !isAnyActionPending
              ) {
                e.preventDefault();
                handleGenerateClick();
              }
            }}
          />
          {/* Sparkles button positioned absolutely inside the Textarea */}
          <Button
            className="absolute right-4 bottom-[20px] h-10 w-10 p-0"
            onClick={handleGenerateClick}
            disabled={
              !textInput.trim() || isAnyActionPending || isPresentationMode
            }
            variant="default"
            size="icon"
            title={isGenerating ? "Generating..." : "Generate Mind Map"}
          >
            {isGenerating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* CONTROLS (Right Side - Horizontal Buttons for desktop) */}
        {isMindMapPresent && (
          <div className="flex items-center gap-2 mb-1 shrink-0">
            {/* PRESENTATION BUTTON */}
            <Button
              variant={isPresentationMode ? "destructive" : "secondary"}
              className={cn(
                "h-14 w-32 p-3 text-sm",
                isPresentationMode && "bg-destructive hover:bg-destructive/90"
              )}
              onClick={onTogglePresentation}
              disabled={isAnyActionPending}
            >
              {isPresentationMode ? (
                <StopCircle className="mr-2 h-4 w-4" />
              ) : (
                <Presentation className="mr-2 h-4 w-4" />
              )}
              {isPresentationMode ? "Exit" : "Present"}
            </Button>

            {/* SAVE BUTTON */}
            <Button
              variant="secondary"
              className="h-14 w-28 p-3 text-sm"
              onClick={onSave}
              disabled={!isMindMapPresent || isSaving || isAnyActionPending}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isSaving ? "Saving..." : mindMapData?.isSaved ? "Saved" : "Save"}
            </Button>

            {/* EXPORT DROPDOWN */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-14 w-28 p-3 text-sm"
                  disabled={isAnyActionPending}
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
        )}
      </div>
    </div>
  );
}
