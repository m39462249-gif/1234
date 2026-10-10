import React, { useState, type FormEvent } from 'react';
import type { Comentario } from '../../types';
import './Comments.css';

interface CommentsProps {
  comentarios: Comentario[];
  onAgregarComentario: (texto: string) => Promise<void>;
}

export const Comments: React.FC<CommentsProps> = ({ comentarios, onAgregarComentario }) => {
  const [texto, setTexto] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!texto.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAgregarComentario(texto);
      setTexto('');
    } catch (err) {
      console.error('Error enviando comentario:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('es-ES', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(d);
    } catch {
      return '';
    }
  };

  return (
    <div className="comments-container">
      <div className="comments-header-title">
        <span>Comentarios</span>
        <span className="comments-count-pill">{comentarios.length}</span>
      </div>

      <div className="comments-list">
        {comentarios.length === 0 ? (
          <p className="no-comments-msg">Aún no hay comentarios. ¡Sé el primero!</p>
        ) : (
          comentarios.map((c) => (
            <div key={c.id} className="comment-item">
              <div className="comment-meta">
                <span className="comment-author">Usuario</span>
                <span>{formatDate(c.fecha)}</span>
              </div>
              <p className="comment-text">{c.texto}</p>
            </div>
          ))
        )}
      </div>

      <form className="comment-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="comment-input"
          placeholder="Escribe un comentario..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <button
          type="submit"
          className="comment-submit-btn"
          disabled={!texto.trim() || isSubmitting}
        >
          Enviar
        </button>
      </form>
    </div>
  );
};
