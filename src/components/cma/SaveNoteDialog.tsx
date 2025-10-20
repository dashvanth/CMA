'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { HierarchicalMapNode, MindMapData, Note } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface SaveNoteDialogProps {
  children: React.ReactNode;
  node: HierarchicalMapNode | null;
  mindMapData: MindMapData | null;
  existingNote?: Note;
}

export function SaveNoteDialog({ children, node, mindMapData, existingNote }: SaveNoteDialogProps) {
  const { firestore, user } = useFirebase();
  const searchParams = useSearchParams();
  const mapIdFromUrl = searchParams.get('mapId');
  const { toast } = useToast();

  const [noteContent, setNoteContent] = useState('');
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const mapId = mindMapData?.mapId || mapIdFromUrl;

  useEffect(() => {
    if (existingNote) {
      setNoteContent(existingNote.content);
    } else {
      setNoteContent('');
    }
  }, [existingNote, open]);

  const handleSave = () => {
    if (!node || !mapId || !user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Cannot save note without a selected node, map, and user.',
      });
      return;
    }
    
    setIsSaving(true);
    
    const noteRef = doc(firestore, `users/${user.uid}/mindmaps/${mapId}/notes`, node.id);
    const noteData = {
      id: node.id,
      nodeId: node.id,
      content: noteContent,
      createdAt: existingNote?.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    setDocumentNonBlocking(noteRef, noteData, { merge: true });
    
    // Optimistic UI update can be handled by the real-time listener
    toast({
        title: 'Note Saved',
        description: 'Your note has been successfully saved.',
    });
    
    setIsSaving(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Note for "{node?.label}"</DialogTitle>
          <DialogDescription>
            Add your thoughts or annotations for this node. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="note-content" className="text-right">
              Note
            </Label>
            <Textarea
              id="note-content"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="col-span-3 min-h-32"
              placeholder="Your notes..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
