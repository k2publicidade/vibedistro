'use client';

import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useDeleteArtist } from '@/lib/hooks/use-artists';
import type { Artist } from '@/lib/types';

interface DeleteArtistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artist: Artist | null;
}

export function DeleteArtistDialog({
  open,
  onOpenChange,
  artist,
}: DeleteArtistDialogProps) {
  const deleteArtist = useDeleteArtist();

  async function handleDelete() {
    if (!artist) return;
    try {
      await deleteArtist.mutateAsync(artist.id);
      toast.success(`"${artist.stageName}" foi removido com sucesso`);
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao excluir artista. Tente novamente.');
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Artista</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir{' '}
            <span className="font-semibold text-foreground">
              {artist?.stageName}
            </span>
            ? Esta acao nao pode ser desfeita. Todos os dados associados a este
            artista serao permanentemente removidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteArtist.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteArtist.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteArtist.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
