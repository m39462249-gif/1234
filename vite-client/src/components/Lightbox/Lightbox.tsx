import React, { useState, useEffect } from 'react';
import type { Foto, EmojiReaction } from '../../types';
import { Reactions } from '../Reactions/Reactions';
import { Comments } from '../Comments/Comments';
import './Lightbox.css';

interface LightboxProps {
  foto: Foto | null;
  imageUrl: string;
  onClose: () => void;
  onUpdateMetadata: (
    id: string,
    updates: { titulo: string; descripcion: string; etiquetas: string[] }
  ) => Promise<void>;
  onReaccionar: (id: string, emoji: EmojiReaction) => Promise<void>;
  onAgregarComentario: (id: string, texto: string) => Promise<void>;
  onEliminar: (id: string) => Promise<void>;
}

export const Lightbox: React.FC<LightboxProps> = ({
  foto,
  imageUrl,
  onClose,
  onUpdateMetadata,
  onReaccionar,
  onAgregarComentario,
  onEliminar,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitulo, setEditTitulo] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editEtiquetas, setEditEtiquetas] = useState('');

  // Sincronizar datos al abrir o cambiar de foto
  useEffect(() => {
    if (foto) {
      setEditTitulo(foto.titulo);
      setEditDesc(foto.descripcion);
      setEditEtiquetas(foto.etiquetas.join(', '));
      setIsEditing(false);
    }
  }, [foto]);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!foto) return null;

  const handleSaveMetadata = async () => {
    const tags = editEtiquetas
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter((t) => t.length > 0);

    await onUpdateMetadata(foto.id, {
      titulo: editTitulo.trim() || foto.titulo,
      descripcion: editDesc.trim(),
      etiquetas: tags,
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    const confirmacion = window.confirm('¿Seguro que deseas eliminar esta foto de tu muro?');
    if (confirmacion) {
      await onEliminar(foto.id);
      onClose();
    }
  };

  const formatDate = (timestamp: number): string => {
    try {
      return new Intl.DateTimeFormat('es-ES', {
        dateStyle: 'medium',
      }).format(new Date(timestamp));
    } catch {
      return '';
    }
  };

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="close-lightbox-btn"
          onClick={onClose}
          title="Cerrar (Esc)"
        >
          ✕
        </button>

        {/* Columna Izquierda: Imagen Completa */}
        <div className="lightbox-media-col">
          <img src={imageUrl} alt={foto.titulo} className="lightbox-img" />
        </div>

        {/* Columna Derecha: Detalles, Edición, Reacciones, Comentarios */}
        <div className="lightbox-details-col">
          <div className="lightbox-top-bar">
            <span className="lightbox-date">Publicada: {formatDate(foto.createdAt)}</span>
            <div className="lightbox-actions-top">
              {!isEditing && (
                <button
                  type="button"
                  className="btn-icon-action"
                  onClick={() => setIsEditing(true)}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  <span>Editar</span>
                </button>
              )}
              <button
                type="button"
                className="btn-icon-action btn-delete"
                onClick={handleDelete}
                title="Eliminar foto"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                <span>Eliminar</span>
              </button>
            </div>
          </div>

          {/* Información o Formulario de Edición */}
          {isEditing ? (
            <div className="edit-form">
              <input
                type="text"
                className="edit-input"
                placeholder="Título"
                value={editTitulo}
                onChange={(e) => setEditTitulo(e.target.value)}
              />
              <textarea
                className="edit-textarea"
                rows={3}
                placeholder="Descripción"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
              />
              <input
                type="text"
                className="edit-input"
                placeholder="Etiquetas (separadas por comas)"
                value={editEtiquetas}
                onChange={(e) => setEditEtiquetas(e.target.value)}
              />
              <div className="edit-actions-row">
                <button
                  type="button"
                  className="btn-icon-action"
                  onClick={() => setIsEditing(false)}
                >
                  Cancelar
                </button>
                <button type="button" className="btn-save" onClick={handleSaveMetadata}>
                  Guardar cambios
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="view-title">{foto.titulo}</h2>
              {foto.descripcion && <p className="view-desc">{foto.descripcion}</p>}
              {foto.etiquetas.length > 0 && (
                <div className="view-tags">
                  {foto.etiquetas.map((t, idx) => (
                    <span key={idx} className="view-tag-chip">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="divider" />

          {/* Reacciones */}
          <div>
            <Reactions
              reacciones={foto.reacciones}
              onReaccionar={(emoji) => onReaccionar(foto.id, emoji)}
            />
          </div>

          <div className="divider" />

          {/* Comentarios */}
          <Comments
            comentarios={foto.comentarios}
            onAgregarComentario={(texto) => onAgregarComentario(foto.id, texto)}
          />
        </div>
      </div>
    </div>
  );
};
