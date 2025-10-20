"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type {
  HierarchicalMapNode,
  GenerateMindMapOutput,
  MindMapData,
  Note,
} from "@/lib/types";
import { InputPanel } from "@/components/cma/InputPanel";
import { SummaryPanel } from "@/components/cma/SummaryPanel";
import { MindMap } from "@/components/cma/MindMap";
import { AIPersona } from "@/components/cma/AIPersona";
import { Header } from "@/components/cma/Header";
import { generateMindMapFromInput } from "@/ai/flows/generate-mind-map-from-input";
import {
  summarizeSelectedNode,
  SummarizeSelectedNodeOutput,
} from "@/ai/flows/summarize-selected-node";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Zap } from "lucide-react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { convertMapToCsv } from "@/ai/flows/convert-map-to-csv";
import * as pdfjsLib from "pdfjs-dist";
import { useFirebase, useMemoFirebase, useDoc, useNotes } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;
}

const buildHierarchy = (
  nodes: GenerateMindMapOutput["nodes"]
): HierarchicalMapNode | null => {
  if (!nodes || nodes.length === 0) return null;

  const nodeMap = new Map<string, HierarchicalMapNode>();
  let rootNode: HierarchicalMapNode | null = null;

  nodes.forEach((node) => {
    if (node.id && node.label) {
      const newNode: HierarchicalMapNode = { ...node, children: [] };
      nodeMap.set(node.id, newNode);
      if (!node.parentId) rootNode = newNode;
    }
  });

  if (!rootNode && nodes.length > 0) {
    const potentialRoots = nodes.filter(
      (n) => !n.parentId || !nodeMap.has(n.parentId!)
    );
    if (potentialRoots.length > 0)
      rootNode = nodeMap.get(potentialRoots[0].id)!;
  }
  if (!rootNode && nodes.length > 0) rootNode = nodeMap.get(nodes[0].id)!;

  nodes.forEach((node) => {
    if (node.id && node.label && node.parentId && nodeMap.has(node.parentId)) {
      const parent = nodeMap.get(node.parentId);
      const child = nodeMap.get(node.id);
      if (parent && child && parent.id !== child.id) {
        parent.children = parent.children || [];
        parent.children.push(child);
      }
    }
  });

  return rootNode;
};

const processAndSetMindMapData = (
  result: GenerateMindMapOutput | null
): MindMapData | null => {
  if (result && result.nodes) {
    const rootNode = buildHierarchy(result.nodes);
    if (rootNode) return { ...result, root: rootNode };
    else throw new Error("Could not build hierarchy from AI response.");
  } else {
    throw new Error("Invalid data structure returned from AI.");
  }
};

const downloadFile = (dataUrl: string, fileName: string) => {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(dataUrl);
};

const filter = (node: HTMLElement) => {
  if (
    node.tagName === "LINK" &&
    node.hasAttribute("href") &&
    node.getAttribute("href")?.includes("fonts.googleapis.com")
  ) {
    return false;
  }
  return true;
};

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mapId = searchParams.get("mapId");
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const [mindMapData, setMindMapData] = useState<MindMapData | null>(null);
  const [selectedNode, setSelectedNode] = useState<HierarchicalMapNode | null>(
    null
  );
  const [summary, setSummary] = useState<SummarizeSelectedNodeOutput | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const docRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !mapId) return null;
    return doc(firestore, `users/${user.uid}/mindmaps`, mapId);
  }, [firestore, user?.uid, mapId]);

  const { data: fetchedMapData, isLoading: isLoadingMap } = useDoc(docRef);
  const { data: notes } = useNotes(user?.uid, mindMapData?.mapId);

  useEffect(() => {
    if (fetchedMapData) {
      try {
        const parsedMapData = {
          ...fetchedMapData,
          nodes: JSON.parse(fetchedMapData.mapData),
        };
        const processedData = processAndSetMindMapData(
          parsedMapData as GenerateMindMapOutput
        );
        setMindMapData(processedData);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error Loading Map",
          description: "Could not parse the mind map data.",
        });
      }
    }
  }, [fetchedMapData, toast]);

  const handleSave = async (mapDataToSave: MindMapData) => {
    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to save a mind map.",
      });
      return false;
    }

    setIsSaving(true);
    try {
      const mapToSave = {
        ...mapDataToSave,
        userId: user.uid,
        mapData: JSON.stringify(mapDataToSave.nodes),
        nodeCount: mapDataToSave.nodes.length,
        isSaved: true,
      };
      delete (mapToSave as any).root;
      delete (mapToSave as any).nodes;

      const docRef = doc(
        firestore,
        `users/${user.uid}/mindmaps`,
        mapToSave.mapId
      );
      setDocumentNonBlocking(docRef, mapToSave, { merge: true });

      setMindMapData((prev) => (prev ? { ...prev, isSaved: true } : null));
      return true;
    } catch (error: any) {
      console.error("Failed to save mind map:", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description:
          error.message || "An unexpected error occurred while saving.",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleMindMapData = async (data: GenerateMindMapOutput | null) => {
    try {
      const processedData = processAndSetMindMapData(data);
      if (processedData) {
        setMindMapData(processedData);
        const saved = await handleSave(processedData);
        if (saved) {
          router.push(`/workspace?mapId=${processedData.mapId}`);
        }
      }
    } catch (e: any) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: e.message || "Could not process the mind map data.",
      });
      setMindMapData(null);
    }
  };

  const handleNodeSelect = useCallback(
    async (node: HierarchicalMapNode | null) => {
      setSelectedNode(node);
      setSummary(null);

      if (node?.id && node.label) {
        setIsLoadingSummary(true);
        try {
          const result = await summarizeSelectedNode({
            nodeId: node.id,
            label: node.label,
            detailLevel: "detailed",
          });
          setSummary(result);
        } catch (error) {
          console.error("Failed to generate summary:", error);
          toast({
            variant: "destructive",
            title: "Summary Failed",
            description:
              "Could not generate the summary for the selected node.",
          });
          setSummary(null);
        } finally {
          setIsLoadingSummary(false);
        }
      }
    },
    [toast]
  );

  const handleGenerate = async (payload: string) => {
    if (!payload.trim()) {
      toast({
        variant: "destructive",
        title: "Input is empty",
        description: "Please provide some text to generate a mind map.",
      });
      return;
    }
    if (!user) {
      toast({
        variant: "destructive",
        title: "Not Logged In",
        description: "You must be logged in to generate a mind map.",
      });
      return;
    }

    setIsGenerating(true);
    setSelectedNode(null);
    setMindMapData(null);
    setSummary(null);

    try {
      const result = await generateMindMapFromInput({
        inputType: "text",
        payload: payload,
        options: { detailLevel: "detailed" },
      });
      await handleMindMapData(result);
    } catch (error) {
      console.error("Failed to generate mind map:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Could not generate the mind map. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePdfUpload = async (formData: FormData) => {
    const file = formData.get("file") as File;
    if (!file) return;

    if (!user) {
      toast({
        variant: "destructive",
        title: "Not Logged In",
        description: "You must be logged in to generate a mind map.",
      });
      return;
    }

    setIsUploading(true);
    setSelectedNode(null);
    setMindMapData(null);
    setSummary(null);

    try {
      const fileBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: fileBuffer,
        cMapUrl: "/static/cmaps/",
        cMapPacked: true,
      });
      const pdf = await loadingTask.promise;

      let textContent = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const text = await page.getTextContent();
        textContent += text.items
          .map((item) => ("str" in item ? item.str : ""))
          .join("\n");
      }

      if (!textContent) throw new Error("Could not extract text from PDF.");

      const result = await generateMindMapFromInput({
        inputType: "file",
        payload: textContent,
        options: { detailLevel: "detailed" },
      });
      await handleMindMapData(result);
    } catch (error: any) {
      console.error("Failed to generate mind map from PDF:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description:
          error.message || "Could not generate mind map from the PDF.",
      });
      handleMindMapData(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleExport = async (format: "json" | "png" | "pdf" | "csv") => {
    if (!mindMapData) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "There is no mind map to export.",
      });
      return;
    }
    const title = mindMapData.title.replace(/ /g, "_") || "mind-map";

    try {
      switch (format) {
        case "json":
          const jsonString = JSON.stringify(mindMapData, null, 2);
          const blob = new Blob([jsonString], { type: "application/json" });
          downloadFile(URL.createObjectURL(blob), `${title}.json`);
          break;
        case "png":
          const mindmapContent = document.getElementById("mindmap-content");
          if (!mindmapContent) throw new Error("Mind map element not found.");
          const dataUrl = await toPng(mindmapContent, {
            cacheBust: true,
            filter,
            style: { transform: "scale(1)", left: "0", top: "0" },
          });
          downloadFile(dataUrl, `${title}.png`);
          break;
        case "pdf":
          const pdfContent = document.getElementById("mindmap-content");
          if (!pdfContent) throw new Error("Mind map element not found.");
          const pdfDataUrl = await toPng(pdfContent, {
            cacheBust: true,
            pixelRatio: 2,
            filter,
            style: { transform: "scale(1)", left: "0", top: "0" },
          });
          const { width, height } = pdfContent.getBoundingClientRect();
          const pdf = new jsPDF({
            orientation: width > height ? "landscape" : "portrait",
            unit: "px",
            format: [width, height],
          });
          pdf.addImage(
            pdfDataUrl,
            "PNG",
            0,
            0,
            pdf.internal.pageSize.getWidth(),
            pdf.internal.pageSize.getHeight()
          );
          pdf.save(`${title}.pdf`);
          break;
        case "csv":
          const { csv } = await convertMapToCsv(mindMapData);
          const blobCsv = new Blob([csv], { type: "text/csv;charset=utf-8;" });
          downloadFile(URL.createObjectURL(blobCsv), `${title}.csv`);
          break;
      }
      toast({
        title: "Export Successful",
        description: `Your mind map has been downloaded as a ${format.toUpperCase()} file.`,
      });
    } catch (error: any) {
      console.error(`Failed to export mind map as ${format}:`, error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description:
          error.message ||
          `Could not export the mind map as ${format.toUpperCase()}.`,
      });
    }
  };

  const handleManualSave = async () => {
    if (!mindMapData) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "There is no mind map to save.",
      });
      return;
    }
    const success = await handleSave(mindMapData);
    if (success) {
      toast({
        title: "Mind Map Saved!",
        description: "Your mind map has been successfully saved.",
      });
    }
  };

  const isLoading = isGenerating || isUploading || isLoadingMap;
  const noteForSelectedNode = notes?.find((n) => n.nodeId === selectedNode?.id);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <Header />
      <div className="pt-16 h-screen w-screen flex p-4 gap-4">
        <InputPanel
          onGenerate={handleGenerate}
          onPdfUpload={handlePdfUpload}
          onExport={handleExport}
          onSave={handleManualSave}
          isGenerating={isGenerating}
          isUploading={isUploading}
          isSaving={isSaving}
          mindMapData={mindMapData}
        />
        <div className="flex-1 h-full rounded-2xl border border-border bg-card/20 relative overflow-hidden shadow-2xl shadow-black/20">
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
              <Loader2 className="h-12 w-12 animate-spin text-accent" />
              <p className="mt-4 text-lg font-medium text-foreground">
                {isUploading
                  ? "Analyzing PDF..."
                  : isGenerating
                  ? "Generating mind map..."
                  : "Loading mind map..."}
              </p>
              <p className="text-muted-foreground">This may take a moment.</p>
            </div>
          )}
          {mindMapData ? (
            <MindMap
              data={mindMapData}
              onNodeSelect={handleNodeSelect}
              selectedNodeId={selectedNode?.id}
            />
          ) : (
            !isLoading && (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
                <Zap className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h2 className="text-2xl font-headline text-foreground/90">
                  Mind Map Workspace
                </h2>
                <p className="text-muted-foreground max-w-md mt-2">
                  Start by generating a new mind map from text or a PDF, or open
                  an existing one from your dashboard.
                </p>
              </div>
            )
          )}
        </div>
        <SummaryPanel
          node={selectedNode}
          onNodeSelect={handleNodeSelect}
          summary={summary}
          isLoadingSummary={isLoadingSummary}
          note={noteForSelectedNode}
          mindMapData={mindMapData}
        />
      </div>
      <AIPersona />
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkspaceContent />
    </Suspense>
  );
}
