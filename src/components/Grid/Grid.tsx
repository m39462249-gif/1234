import React, { useEffect, useRef } from 'react';
import type { Foto } from '../../types';
import { FotoCard } from '../FotoCard/FotoCard';
import './Grid.css';

interface GridProps {
  fotos: Foto[];
  totalFotos: number;
  loading: boolean;
  searchQuery: string;
  tieneMasFotos: boolean;
  onCargarMas: () => void;
  getFotoUrl: (id: string) => string;
  onSelectFoto: (foto: Foto) => void;
  onOpenUpload: () => void;
}

export const Grid: React.FC<GridProps> = ({
  fotos,
  totalFotos,
  loading,
  searchQuery,
  tieneMasFotos,
  onCargarMas,
  getFotoUrl,
  onSelectFoto,
  onOpenUpload,
}) => {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // IntersectionObserver para el scroll infinito
  useEffect(() => {
    if (!tieneMasFotos) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onCargarMas();
        }
      },
      {
        root: null,
        rootMargin: '300px',
        threshold: 0.1,
      }
    );

    const target = sentinelRef.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [tieneMasFotos, onCargarMas]);

  if (loading) {
    return (
      <div className="grid-container">
        <div className="infinite-scroll-sentinel">
          <div className="loading-dots">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    );
  }

  if (totalFotos === 0) {
    return (
      <div className="grid-container">
        <div className="empty-muro">
          <svg
            className="empty-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
          </svg>
          <h2 className="empty-title">
            {searchQuery ? 'Sin resultados para la búsqueda' : 'Tu muro está vacío'}
          </h2>
          <p className="empty-desc">
            {searchQuery
              ? `No se encontraron fotos que coincidan con "${searchQuery}". Prueba con otras palabras o etiquetas.`
              : 'Sube tus fotos favoritas para comenzar a coleccionar imágenes, agregar etiquetas, recibir reacciones y comentarios.'}
          </p>
          {!searchQuery && (
            <button type="button" className="empty-action-btn" onClick={onOpenUpload}>
              Subir tu primera foto
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid-container">
      <div className="masonry-columns">
        {fotos.map((foto) => (
          <FotoCard
            key={foto.id}
            foto={foto}
            imageUrl={getFotoUrl(foto.id)}
            onClick={() => onSelectFoto(foto)}
          />
        ))}
      </div>

      {tieneMasFotos && (
        <div ref={sentinelRef} className="infinite-scroll-sentinel">
          <div className="loading-dots">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}
    </div>
  );
};
