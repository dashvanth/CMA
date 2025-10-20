"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  File as FileIcon,
  Mic,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MindMapControls } from "./MindMapControls";
import { MindMapData } from "@/lib/types";

interface InputPanelProps {
  onGenerate: (payload: string) => void;
  onPdfUpload: (formData: FormData) => void;
  onExport: (format: "json" | "png" | "pdf" | "csv") => void;
  onSave: () => void;
  isGenerating: boolean;
  isUploading: boolean;
  isSaving: boolean;
  mindMapData: MindMapData | null;
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
}: InputPanelProps) {
  const [inputText, setInputText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const isLoading = isGenerating || isUploading;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      return;
    }

    if (file.type !== "application/pdf") {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please select a PDF file.",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    onPdfUpload(formData);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const glassEffect = "bg-card/60 backdrop-blur-xl border-border";

  return (
    <Card
      className={`w-96 h-full flex flex-col shrink-0 ${glassEffect} shadow-2xl shadow-black/20`}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Sparkles className="text-accent" />
          <span>Generator</span>
        </CardTitle>
        <CardDescription>
          Create a new mind map from text, PDF, or your voice.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-y-auto">
        <div className="grid w-full gap-1.5 flex-1">
          <Label htmlFor="message">Input</Label>
          <Textarea
            placeholder="Paste your text, notes, or article here..."
            id="message"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="min-h-48 flex-1 bg-input/50 resize-none"
            disabled={isLoading}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onGenerate(inputText)}
            disabled={isLoading || !inputText}
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {isGenerating ? "Generating..." : "Generate from Text"}
          </Button>
        </div>

        <Separator className="my-2" />

        <div className="space-y-2">
            <Label>From File</Label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf"
              disabled={isLoading}
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
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
          <Button variant="outline" className="flex-1" disabled={isLoading}>
            <Mic className="mr-2 h-4 w-4" /> Use Voice
          </Button>
        </div>

      </CardContent>
      <MindMapControls 
        onExport={onExport}
        onSave={onSave}
        isSaving={isSaving}
        mindMapData={mindMapData}
        isLoading={isLoading}
      />
    </Card>
  );
}
