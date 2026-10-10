import React from 'react';
import type { Foto } from '../../types';
import './FotoCard.css';

interface FotoCardProps {
  foto: Foto;
  imageUrl: string;
  onClick: () => void;
}

export const FotoCard: React.FC<FotoCardProps> = ({ foto, imageUrl, onClick }) => {
  // Conteo total de reacciones
  const totalReacciones = Object.values(foto.reacciones).reduce((acc, c) => acc + c, 0);

  return (
    <div className="foto-card" onClick={onClick} role="button" tabIndex={0}>
      <div className="foto-card-media">
        {imageUrl ? (
          <img src={imageUrl} alt={foto.titulo} className="foto-card-img" loading="lazy" />
        ) : (
          <div style={{ height: 200, background: '#121316' }} />
        )}
        <div className="foto-card-overlay">
          <span className="view-badge">Abrir</span>
        </div>
      </div>

      <div className="foto-card-body">
        <h3 className="foto-card-title" title={foto.titulo}>
          {foto.titulo}
        </h3>

        {foto.descripcion && <p className="foto-card-desc">{foto.descripcion}</p>}

        {foto.etiquetas.length > 0 && (
          <div className="foto-card-tags">
            {foto.etiquetas.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="tag-badge">
                #{tag}
              </span>
            ))}
            {foto.etiquetas.length > 3 && (
              <span className="tag-badge">+{foto.etiquetas.length - 3}</span>
            )}
          </div>
        )}

        <div className="foto-card-footer">
          <div className="reaction-summary">
            <span>❤️</span>
            <span>{totalReacciones}</span>
          </div>

          <div className="comment-summary">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            <span>{foto.comentarios.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
