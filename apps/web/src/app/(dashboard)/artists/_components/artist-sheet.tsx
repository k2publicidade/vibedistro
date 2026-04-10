'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ChevronDown, Loader2 } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/cn';
import { useCreateArtist, useUpdateArtist } from '@/lib/hooks/use-artists';
import type { Artist } from '@/lib/types';

const GENRES = [
  'Pop',
  'Rock',
  'Hip-Hop',
  'R&B',
  'Eletronica',
  'Sertanejo',
  'Funk',
  'MPB',
  'Jazz',
  'Classica',
  'Reggae',
  'Metal',
  'Indie',
  'Outro',
] as const;

const artistSchema = z.object({
  stageName: z.string().min(1, 'Nome artistico e obrigatorio'),
  legalName: z.string().min(1, 'Nome legal e obrigatorio'),
  email: z
    .string()
    .email('E-mail invalido')
    .or(z.literal(''))
    .optional()
    .transform((v) => v || undefined),
  phone: z
    .string()
    .optional()
    .transform((v) => v || undefined),
  country: z
    .string()
    .optional()
    .transform((v) => v || undefined),
  city: z
    .string()
    .optional()
    .transform((v) => v || undefined),
  bio: z
    .string()
    .optional()
    .transform((v) => v || undefined),
  avatarUrl: z
    .string()
    .url('URL invalida')
    .or(z.literal(''))
    .optional()
    .transform((v) => v || undefined),
  genre: z
    .string()
    .optional()
    .transform((v) => v || undefined),
  spotifyId: z
    .string()
    .optional()
    .transform((v) => v || undefined),
  appleMusicId: z
    .string()
    .optional()
    .transform((v) => v || undefined),
  instagramHandle: z
    .string()
    .optional()
    .transform((v) => v || undefined),
  websiteUrl: z
    .string()
    .url('URL invalida')
    .or(z.literal(''))
    .optional()
    .transform((v) => v || undefined),
});

type ArtistFormValues = z.input<typeof artistSchema>;

interface ArtistSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artist?: Artist;
}

export function ArtistSheet({ open, onOpenChange, artist }: ArtistSheetProps) {
  const isEdit = !!artist;
  const [socialOpen, setSocialOpen] = useState(false);

  const createArtist = useCreateArtist();
  const updateArtist = useUpdateArtist();
  const isPending = createArtist.isPending || updateArtist.isPending;

  const form = useForm<ArtistFormValues>({
    resolver: zodResolver(artistSchema),
    defaultValues: {
      stageName: '',
      legalName: '',
      email: '',
      phone: '',
      country: '',
      city: '',
      bio: '',
      avatarUrl: '',
      genre: '',
      spotifyId: '',
      appleMusicId: '',
      instagramHandle: '',
      websiteUrl: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (artist) {
        form.reset({
          stageName: artist.stageName ?? '',
          legalName: artist.legalName ?? '',
          email: artist.email ?? '',
          phone: artist.phone ?? '',
          country: artist.country ?? '',
          city: artist.city ?? '',
          bio: artist.bio ?? '',
          avatarUrl: artist.avatarUrl ?? '',
          genre: artist.bio ? '' : '', // genre not on Artist type directly
          spotifyId: artist.spotifyId ?? '',
          appleMusicId: artist.appleMusicId ?? '',
          instagramHandle: artist.instagramHandle ?? '',
          websiteUrl: artist.websiteUrl ?? '',
        });
        // Open social links section if any value exists
        if (
          artist.spotifyId ||
          artist.appleMusicId ||
          artist.instagramHandle ||
          artist.websiteUrl
        ) {
          setSocialOpen(true);
        }
      } else {
        form.reset({
          stageName: '',
          legalName: '',
          email: '',
          phone: '',
          country: '',
          city: '',
          bio: '',
          avatarUrl: '',
          genre: '',
          spotifyId: '',
          appleMusicId: '',
          instagramHandle: '',
          websiteUrl: '',
        });
        setSocialOpen(false);
      }
    }
  }, [open, artist, form]);

  async function onSubmit(values: ArtistFormValues) {
    try {
      if (isEdit && artist) {
        await updateArtist.mutateAsync({ id: artist.id, ...values });
        toast.success('Artista atualizado com sucesso');
      } else {
        await createArtist.mutateAsync(values);
        toast.success('Artista criado com sucesso');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        isEdit ? 'Erro ao atualizar artista' : 'Erro ao criar artista',
      );
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>
            {isEdit ? 'Editar Artista' : 'Novo Artista'}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Atualize as informacoes do artista.'
              : 'Preencha as informacoes para cadastrar um novo artista.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-6 space-y-5"
          >
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stageName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Artistico *</FormLabel>
                    <FormControl>
                      <Input placeholder="MC Lunar" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="legalName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Legal *</FormLabel>
                    <FormControl>
                      <Input placeholder="Lucas da Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="artista@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="+55 11 99999-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pais</FormLabel>
                    <FormControl>
                      <Input placeholder="Brasil" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Sao Paulo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="genre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Genero Musical</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um genero" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {GENRES.map((genre) => (
                        <SelectItem key={genre} value={genre}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Biografia</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Conte um pouco sobre o artista..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="avatarUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do Avatar</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://exemplo.com/foto.jpg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Social Links (Collapsible) */}
            <Collapsible open={socialOpen} onOpenChange={setSocialOpen}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border border-border/50 bg-secondary/30 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  Links & Redes Sociais
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform duration-200',
                      socialOpen && 'rotate-180',
                    )}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="spotifyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Spotify ID</FormLabel>
                        <FormControl>
                          <Input placeholder="spotify:artist:..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="appleMusicId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apple Music ID</FormLabel>
                        <FormControl>
                          <Input placeholder="ID Apple Music" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="instagramHandle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram</FormLabel>
                        <FormControl>
                          <Input placeholder="@artista" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="websiteUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://artista.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <SheetFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Salvar' : 'Criar Artista'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
