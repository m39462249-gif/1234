import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { Foto, EmojiReaction, Comentario } from '../types';
import { EMOJI_LIST } from '../types';
import { getAllFotosDB, addFotosDB, updateFotoDB, deleteFotoDB } from '../db';

const PAGE_SIZE = 12;

export function useFotos() {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  // Map para gestionar URLs en memoria asociadas a cada id de foto
  const urlsRef = useRef<Map<string, string>>(new Map());
  const [urlsVersion, setUrlsVersion] = useState<number>(0);

  // Carga inicial desde IndexedDB
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const stored = await getAllFotosDB();
        if (isMounted) {
          // Generar URLs para cada foto
          stored.forEach((foto) => {
            if (!urlsRef.current.has(foto.id)) {
              urlsRef.current.set(foto.id, URL.createObjectURL(foto.blob));
            }
          });
          setFotos(stored);
          setUrlsVersion((v) => v + 1);
        }
      } catch (err) {
        console.error('Error cargando fotos de IndexedDB:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
      // Revocar todas las URLs al desmontar
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      urlsRef.current.clear();
    };
  }, []);

  // Obtener URL de una foto específica
  const getFotoUrl = useCallback(
    (id: string): string => {
      // Usamos urlsVersion en dependencias indirectas si se requiere refresco
      return urlsRef.current.get(id) || '';
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [urlsVersion]
  );

  // Subir fotos nuevas a partir de una lista de Files
  const subirFotos = useCallback(
    async (
      archivos: File[],
      metadatosComunes?: { titulo?: string; descripcion?: string; etiquetas?: string[] }
    ) => {
      const defaultReacciones: Record<EmojiReaction, number> = {
        '❤️': 0,
        '😂': 0,
        '🔥': 0,
        '😍': 0,
        '👏': 0,
      };

      const nuevasFotos: Foto[] = archivos.map((archivo, index) => {
        const id = `${Date.now()}-${index}-${Math.random().toString(36).substring(2, 8)}`;
        const cleanName = archivo.name.replace(/\.[^/.]+$/, '');
        return {
          id,
          blob: archivo,
          titulo: metadatosComunes?.titulo || cleanName,
          descripcion: metadatosComunes?.descripcion || '',
          etiquetas: metadatosComunes?.etiquetas || [],
          reacciones: { ...defaultReacciones },
          comentarios: [],
          createdAt: Date.now() + index,
        };
      });

      // Crear sus URLs
      nuevasFotos.forEach((f) => {
        urlsRef.current.set(f.id, URL.createObjectURL(f.blob));
      });

      await addFotosDB(nuevasFotos);

      setFotos((prev) => [...nuevasFotos, ...prev]);
      setUrlsVersion((v) => v + 1);
    },
    []
  );

  // Actualizar metadatos (título, descripción, etiquetas)
  const actualizarMetadatos = useCallback(
    async (id: string, updates: { titulo: string; descripcion: string; etiquetas: string[] }) => {
      setFotos((prev) => {
        const updated = prev.map((f) => {
          if (f.id === id) {
            const nextFoto: Foto = {
              ...f,
              titulo: updates.titulo.trim() || f.titulo,
              descripcion: updates.descripcion.trim(),
              etiquetas: updates.etiquetas,
            };
            updateFotoDB(nextFoto).catch((e) => console.error('Error guardando metadatos:', e));
            return nextFoto;
          }
          return f;
        });
        return updated;
      });
    },
    []
  );

  // Alternar/incrementar reacción emoji
  const reaccionar = useCallback(async (id: string, emoji: EmojiReaction) => {
    if (!EMOJI_LIST.includes(emoji)) return;

    setFotos((prev) => {
      const updated = prev.map((f) => {
        if (f.id === id) {
          const count = f.reacciones[emoji] || 0;
          const nextFoto: Foto = {
            ...f,
            reacciones: {
              ...f.reacciones,
              [emoji]: count + 1,
            },
          };
          updateFotoDB(nextFoto).catch((e) => console.error('Error guardando reacción:', e));
          return nextFoto;
        }
        return f;
      });
      return updated;
    });
  }, []);

  // Agregar un comentario
  const agregarComentario = useCallback(async (id: string, texto: string) => {
    const textoLimpio = texto.trim();
    if (!textoLimpio) return;

    const nuevoComentario: Comentario = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      texto: textoLimpio,
      fecha: new Date().toISOString(),
    };

    setFotos((prev) => {
      const updated = prev.map((f) => {
        if (f.id === id) {
          const nextFoto: Foto = {
            ...f,
            comentarios: [nuevoComentario, ...f.comentarios],
          };
          updateFotoDB(nextFoto).catch((e) => console.error('Error guardando comentario:', e));
          return nextFoto;
        }
        return f;
      });
      return updated;
    });
  }, []);

  // Eliminar foto
  const eliminarFoto = useCallback(async (id: string) => {
    // Revocar ObjectURL
    const existingUrl = urlsRef.current.get(id);
    if (existingUrl) {
      URL.revokeObjectURL(existingUrl);
      urlsRef.current.delete(id);
      setUrlsVersion((v) => v + 1);
    }

    await deleteFotoDB(id);
    setFotos((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // Filtro por búsqueda (título, descripción, etiquetas)
  const fotosFiltradas = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return fotos;

    return fotos.filter((f) => {
      const matchTitulo = f.titulo.toLowerCase().includes(query);
      const matchDesc = f.descripcion.toLowerCase().includes(query);
      const matchTags = f.etiquetas.some((tag) => tag.toLowerCase().includes(query));
      return matchTitulo || matchDesc || matchTags;
    });
  }, [fotos, searchQuery]);

  // Fotos visibles para el scroll infinito
  const fotosVisibles = useMemo(() => {
    return fotosFiltradas.slice(0, visibleCount);
  }, [fotosFiltradas, visibleCount]);

  const tieneMasFotos = visibleCount < fotosFiltradas.length;

  const cargarMas = useCallback(() => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  }, []);

  // Reset de visibleCount si cambia la búsqueda
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery]);

  return {
    fotos: fotosVisibles,
    todasLasFotos: fotosFiltradas,
    totalFotos: fotosFiltradas.length,
    loading,
    searchQuery,
    setSearchQuery,
    tieneMasFotos,
    cargarMas,
    getFotoUrl,
    subirFotos,
    actualizarMetadatos,
    reaccionar,
    agregarComentario,
    eliminarFoto,
  };
}
