'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, deleteDoc } from 'firebase/firestore';
import { Header } from '@/components/cma/Header';
import { Footer } from '@/components/cma/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Loader2, MoreVertical, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { firestore, user, isUserLoading } = useFirebase();
  const [mapToDelete, setMapToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const mindmapsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, `users/${user.uid}/mindmaps`));
  }, [firestore, user?.uid]);

  const { data: mindmaps, isLoading: isLoadingMindmaps } = useCollection(mindmapsQuery);

  const isLoading = isUserLoading || isLoadingMindmaps;

  const handleDelete = async () => {
    if (!mapToDelete || !firestore || !user?.uid) return;
    
    setIsDeleting(true);
    try {
      const docRef = doc(firestore, `users/${user.uid}/mindmaps`, mapToDelete);
      await deleteDoc(docRef);
      toast({
        title: "Mind Map Deleted",
        description: "Your mind map has been successfully removed.",
      });
      setMapToDelete(null);
    } catch (error: any) {
      console.error("Error deleting mind map:", error);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: error.message || "Could not delete the mind map.",
      });
    } finally {
      setIsDeleting(false);
    }
  };


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 container py-24">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-headline">My Mind Maps</h1>
          <Button asChild>
            <Link href="/workspace">
              <PlusCircle className="mr-2 h-5 w-5" /> New Mind Map
            </Link>
          </Button>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-accent" />
          </div>
        )}

        {!isLoading && mindmaps && mindmaps.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mindmaps.map(map => (
              <Card key={map.id} className="glass-panel hover:border-accent transition-colors duration-300 flex flex-col">
                <CardHeader className="flex-row items-start justify-between">
                  <div>
                    <CardTitle className="font-headline text-2xl">
                      <Link href={`/workspace?mapId=${map.id}`} className="hover:underline">
                        {map.title}
                      </Link>
                    </CardTitle>
                    <CardDescription>
                      {map.createdAt ? format(new Date(map.createdAt), "PPP") : 'No date'}
                    </CardDescription>
                  </div>
                  <AlertDialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <AlertDialogTrigger asChild>
                           <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setMapToDelete(map.id); }}>
                              <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                              <span className="text-destructive">Delete</span>
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your mind map.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setMapToDelete(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                               {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                               Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardHeader>
                <CardContent className="flex-1">
                  <Link href={`/workspace?mapId=${map.id}`} className="block h-full">
                    <p className="text-sm text-muted-foreground">
                        {map.nodeCount || 0} nodes
                    </p>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && (!mindmaps || mindmaps.length === 0) && (
          <div className="text-center py-16">
            <div className="glass-panel max-w-lg mx-auto p-8">
              <h2 className="text-2xl font-headline mb-2">No Mind Maps Yet</h2>
              <p className="text-muted-foreground mb-6">
                Click the button to generate your first AI-powered mind map.
              </p>
              <Button asChild>
                <Link href="/workspace">
                  <PlusCircle className="mr-2 h-5 w-5" /> Create New Mind Map
                </Link>
              </Button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
