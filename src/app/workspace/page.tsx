"use client";

import { useState, useCallback, useEffect, Suspense, useMemo } from "react";
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
import { Header } from "@/components/cma/Header";
import { generateMindMapFromInput } from "@/ai/flows/generate-mind-map-from-input";
import {
  summarizeSelectedNode,
  SummarizeSelectedNodeOutput,
} from "@/ai/flows/summarize-selected-node";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Zap, MessageSquare } from "lucide-react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { convertMapToCsv } from "@/ai/flows/convert-map-to-csv";
import * as pdfjsLib from "pdfjs-dist";
import { useFirebase, useMemoFirebase, useDoc, useNotes } from "@/firebase";
import { doc } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import * as d3 from "d3-hierarchy";
import { ChatModal } from "@/components/cma/ChatModal"; // CORRECT: ChatModal imported
import { Button } from "@/components/ui/button";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;
}

// ... (buildHierarchy and processAndSetMindMapData functions remain the same)
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
// ... (downloadFile and filter functions remain the same)

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

  // --- CHATBOT STATE (Reinstated) ---
  const [mindMapSourceContent, setMindMapSourceContent] = useState<string>("");
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  // ----------------------------------

  // 💡 PRESENTATION MODE STATE
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [currentPresentationIndex, setCurrentPresentationIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false); // State synced from SummaryPanel (TTS hook)

  const docRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !mapId) return null;
    return doc(firestore, `users/${user.uid}/mindmaps`, mapId);
  }, [firestore, user?.uid, mapId]);

  const { data: fetchedMapData, isLoading: isLoadingMap } = useDoc(docRef);
  const { data: notes } = useNotes(user?.uid, mindMapData?.mapId);

  // 💡 DERIVED STATE: ORDERED NODES for Presentation
  const orderedNodes = useMemo(() => {
    if (!mindMapData?.root) return [];

    // Use D3 to create a hierarchy and get all nodes in depth-first order
    const hierarchy = d3.hierarchy(mindMapData.root, (d) => d.children || []);
    return hierarchy.descendants().map((d) => d.data as HierarchicalMapNode);
  }, [mindMapData]);

  // 🔥 FIX: Context Loading and Fallback Logic for Legacy Maps
  useEffect(() => {
    if (fetchedMapData) {
      try {
        let loadedSourceContent: string = "";

        // 1. Attempt to load the new sourcePayload field
        if (
          fetchedMapData.sourcePayload &&
          typeof fetchedMapData.sourcePayload === "string"
        ) {
          loadedSourceContent = fetchedMapData.sourcePayload;
        } else if (fetchedMapData.mapData) {
          // 2. FALLBACK FOR LEGACY MAPS (Fix for "Context is missing" error)
          try {
            const nodes = JSON.parse(fetchedMapData.mapData);
            if (Array.isArray(nodes) && nodes.length > 0) {
              const nodeLabels = nodes.map((n: any) => n.label).join("; ");
              const title = fetchedMapData.title || "Mind Map Content";

              // Construct minimal fallback context
              loadedSourceContent = `Mind Map Title: ${title}. Core Concepts/Nodes: ${nodeLabels}. (NOTE: Original source document unavailable. Contextual chat will use the map's nodes/labels as a minimal source.)`;

              // Only show toast if chat is enabled via fallback
              if (loadedSourceContent.length > 0) {
                toast({
                  title: "Contextual Chat Enabled",
                  description:
                    "Using map nodes/labels as a minimal RAG context for this older map.",
                  variant: "default",
                });
              }
            }
          } catch (e) {
            console.error("Error parsing mapData for fallback context:", e);
          }
        }

        // Set state with the loaded content
        setMindMapSourceContent(loadedSourceContent);

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
        // CORRECT: Ensure sourcePayload is SAVED
        sourcePayload: mindMapSourceContent,
      };
      delete (mapToSave as any).root;
      delete (mapToSave as any).nodes;

      const docRef = doc(
        firestore,
        `users/${user.uid}/mindmaps`,
        mapToSave.mapId
      );
      await setDocumentNonBlocking(docRef, mapToSave, { merge: true });

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

  const generateSummary = useCallback(
    // 💡 FIX 1: Added mindMapTitle as an explicit required argument
    async (
      node: HierarchicalMapNode,
      mindMapTitle: string,
      detailLevel: "detailed" | "simplest"
    ) => {
      if (!node) return;
      setIsLoadingSummary(true);
      try {
        const result = await summarizeSelectedNode({
          nodeId: node.id,
          label: node.label,
          mindmapTitle: mindMapTitle, // 💡 FIX 2: Passed the new required field
          detailLevel: detailLevel,
        });
        setSummary(result);
        return result;
      } catch (error) {
        console.error("Failed to generate summary:", error);
        toast({
          variant: "destructive",
          title: "Summary Failed",
          description: "Could not generate the summary for the selected node.",
        });
        setSummary(null);
      } finally {
        setIsLoadingSummary(false);
      }
    },
    // toast is in dependencies for toast, other state setters are stable
    [toast]
  );

  const handleNodeSelect = useCallback(
    async (node: HierarchicalMapNode | null) => {
      // 💡 LOGIC: Manual selection should exit Presentation Mode
      if (isPresentationMode) {
        setTimeout(() => setIsPresentationMode(false), 50);
      }

      setSelectedNode(node);
      setSummary(null);

      // 💡 FIX 3: Get mindMapData title and check if it exists
      const mapTitle = mindMapData?.title;

      if (node?.id && node.label && mapTitle) {
        // 💡 FIX 4: Pass the mind map title to generateSummary
        await generateSummary(node, mapTitle, "detailed");
      } else if (node) {
        // Log error if node is selected but context is missing
        console.error(
          "Cannot generate summary: MindMapData or title is missing."
        );
        toast({
          variant: "destructive",
          title: "Summary Blocked",
          description:
            "Mind map title is missing. Cannot generate contextual summary.",
        });
      }
    },
    // 💡 FIX 5: Added mindMapData (for title) and toast to dependencies
    [generateSummary, isPresentationMode, mindMapData, toast]
  );

  // -----------------------------------------------------------
  // 💡 PRESENTATION MODE HANDLERS AND EFFECTS (Unchanged)
  // -----------------------------------------------------------

  const handleStopPresentation = useCallback(() => {
    setIsPresentationMode(false);
    setCurrentPresentationIndex(0);
    setSelectedNode(null);
    toast({
      title: "Presentation Ended",
      description: "You have reviewed all nodes in the mind map.",
    });
  }, [toast]);

  const handleTogglePresentation = useCallback(() => {
    if (isPresentationMode) {
      handleStopPresentation();
    } else {
      if (orderedNodes.length > 0) {
        setCurrentPresentationIndex(0);
        setIsPresentationMode(true);
      } else {
        toast({
          variant: "destructive",
          title: "Start Failed",
          description: "No mind map loaded to present.",
        });
      }
    }
  }, [isPresentationMode, orderedNodes.length, handleStopPresentation, toast]);

  const goToNextNode = useCallback(() => {
    if (currentPresentationIndex < orderedNodes.length - 1) {
      setCurrentPresentationIndex((prev) => prev + 1);
    } else {
      handleStopPresentation();
    }
  }, [currentPresentationIndex, orderedNodes.length, handleStopPresentation]);

  const goToPreviousNode = useCallback(() => {
    if (currentPresentationIndex > 0) {
      setCurrentPresentationIndex((prev) => prev - 1);
    }
  }, [currentPresentationIndex]);

  // 💡 EFFECT 1: Handles sequential selection and summary fetching for the presentation
  useEffect(() => {
    if (!isPresentationMode || orderedNodes.length === 0) {
      return;
    }

    const nodeToPresent = orderedNodes[currentPresentationIndex];
    const mapTitle = mindMapData?.title; // 💡 FIX: Get map title for context

    // 💡 FIX: Check that the map title exists before calling generateSummary
    if (nodeToPresent && nodeToPresent.id !== selectedNode?.id && mapTitle) {
      setSelectedNode(nodeToPresent);
      setSummary(null);
      generateSummary(nodeToPresent, mapTitle, "detailed"); // 💡 FIX: Pass mapTitle
    }
  }, [
    isPresentationMode,
    currentPresentationIndex,
    orderedNodes,
    generateSummary,
    selectedNode,
    mindMapData?.title, // 💡 FIX: Added mapTitle as dependency
  ]);

  // 💡 EFFECT 2: Auto-Advance Logic (Watches TTS state)
  useEffect(() => {
    // Only run if we are in presentation mode and the narration just stopped
    if (isPresentationMode && !isSpeaking && !isLoadingSummary) {
      // Ensure the summary that finished speaking belongs to the current selected node
      const isCurrentNodeSummaryLoaded =
        !!summary &&
        orderedNodes[currentPresentationIndex]?.id === selectedNode?.id;

      if (isCurrentNodeSummaryLoaded) {
        const timer = setTimeout(() => {
          goToNextNode();
        }, 2000); // Wait 2 seconds (the tutorial pause)

        return () => clearTimeout(timer);
      }
    }
  }, [
    isPresentationMode,
    isSpeaking,
    isLoadingSummary,
    summary,
    currentPresentationIndex,
    orderedNodes,
    goToNextNode,
    selectedNode,
  ]);

  // -----------------------------------------------------------
  // 💡 END PRESENTATION MODE HANDLERS AND EFFECTS
  // -----------------------------------------------------------

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

    if (isPresentationMode) handleStopPresentation();

    // --- CAPTURE SOURCE CONTENT ---
    setMindMapSourceContent(payload);
    // ----------------------------

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

    if (isPresentationMode) handleStopPresentation();

    setIsUploading(true);
    setSelectedNode(null);
    setMindMapData(null);
    setSummary(null);

    try {
      const fileBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: fileBuffer,
        cMapUrl: "/cmaps/",
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

      // --- CAPTURE SOURCE CONTENT ---
      setMindMapSourceContent(textContent);
      // ----------------------------

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
      if (isPresentationMode) {
        handleStopPresentation();
      }

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
    if (isPresentationMode) handleStopPresentation();

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
          // 💡 NEW PROPS PASSED TO INPUT PANEL
          isPresentationMode={isPresentationMode}
          onTogglePresentation={handleTogglePresentation}
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
          // 💡 NEW PROPS PASSED TO SUMMARY PANEL
          isPresentationMode={isPresentationMode}
          goToNext={goToNextNode}
          goToPrevious={goToPreviousNode}
          currentPresentationIndex={currentPresentationIndex}
          totalNodes={orderedNodes.length}
          setIsSpeaking={setIsSpeaking} // Callback to update the parent's TTS state
        />
      </div>

      {/* --- FLOATING CHAT BUTTON (Opens Modal) --- */}
      {mindMapData && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setIsChatModalOpen(true)}
            className="rounded-full h-14 w-14 shadow-xl flex items-center justify-center transition-transform hover:scale-105"
            variant="default"
            size="icon"
            title="Open Contextual Chat"
            disabled={!mindMapSourceContent} // Disables if context fallback failed
          >
            <MessageSquare className="h-6 w-6 text-white" />
          </Button>
        </div>
      )}

      {/* --- CONTEXTUAL CHAT MODAL (Rendered Here) --- */}
      <ChatModal
        isOpen={isChatModalOpen}
        setIsOpen={setIsChatModalOpen}
        mindMapContext={mindMapSourceContent}
        mindMapTitle={mindMapData?.title || "Untitled Map"}
      />
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
