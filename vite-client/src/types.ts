export type EmojiReaction = '❤️' | '😂' | '🔥' | '😍' | '👏';

export const EMOJI_LIST: EmojiReaction[] = ['❤️', '😂', '🔥', '😍', '👏'];

export interface Comentario {
  id: string;
  texto: string;
  fecha: string; // ISO string
}

export interface Foto {
  id: string;
  blob: Blob;
  titulo: string;
  descripcion: string;
  etiquetas: string[];
  reacciones: Record<EmojiReaction, number>;
  comentarios: Comentario[];
  createdAt: number; // timestamp
}
