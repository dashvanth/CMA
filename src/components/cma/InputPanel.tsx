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
  Sparkles, // FIX: Imported Sparkles
  Mic,
  File as FileIcon,
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
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useState, useRef } from "react"; // FIX: Imported useState and useRef
import { useToast } from "@/hooks/use-toast";
import { Separator } from "../ui/separator";

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
    <div className="w-96 shrink-0 h-full flex flex-col gap-4">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Generate New Map</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4">
          <div className="flex-1">
            <Label htmlFor="text-input" className="mb-2 block">
              Enter Text or Upload PDF
            </Label>
            <Textarea
              id="text-input"
              placeholder="Paste text here to generate a mind map..."
              value={textInput}
              onChange={handleTextareaChange}
              rows={8}
              disabled={isAnyActionPending || isPresentationMode}
            />
            <Button
              className="w-full mt-2"
              onClick={handleGenerateClick}
              disabled={
                !textInput.trim() || isAnyActionPending || isPresentationMode
              }
            >
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {isGenerating ? "Generating..." : "Generate from Text"}
            </Button>
          </div>
          <Separator />
          {/* PDF UPLOAD SECTION */}
          <div className="space-y-2">
            <Label htmlFor="pdf-file" className="mb-2 block">
              Upload PDF File
            </Label>
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
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnyActionPending || isPresentationMode}
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileIcon className="mr-2 h-4 w-4" />
              )}
              {isUploading ? "Uploading..." : "Upload PDF"}
            </Button>
          </div>

          <div className="flex gap-2 mt-auto">
            {/* Keeping the Mic button as a placeholder for future voice command features */}
            <Button variant="outline" className="flex-1" disabled={isLoading}>
              <Mic className="mr-2 h-4 w-4" /> Use Voice
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* MindMapControls logic is inlined here */}
      {isMindMapPresent && (
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2 mb-2">
              {/* PRESENTATION BUTTON */}
              <Button
                variant={isPresentationMode ? "destructive" : "secondary"}
                className={cn(
                  "w-full",
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
                {isPresentationMode ? "Exit Presentation" : "Present Mode"}
              </Button>

              {/* SAVE BUTTON */}
              <Button
                variant="secondary"
                className="w-full"
                onClick={onSave}
                disabled={!isMindMapPresent || isSaving || isAnyActionPending}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isSaving
                  ? "Saving..."
                  : mindMapData?.isSaved
                  ? "Saved"
                  : "Save"}
              </Button>
            </div>

            {/* EXPORT DROPDOWN */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full"
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
