'use client';

import { useState, useEffect } from 'react';
import { useAnonToken } from '@/lib/useAnonToken';
import styles from './page.module.css';

const EMOJIS = ['😂', '❤️', '🔥', '👎'];

export default function Home() {
  const token = useAnonToken();
  const [photos, setPhotos] = useState([]);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setSelectedMedia(null);
      }
    }
    if (selectedMedia) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedMedia]);

  async function fetchPhotos() {
    try {
      const res = await fetch('/api/photos');
      if (res.ok) {
        const data = await res.json();
        setPhotos(data);
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchPhotos();
  }, []);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) {
      alert('Por favor selecciona una foto o video primero');
      return;
    }
    if (uploading) return;

    let activeToken = token;
    if (!activeToken && typeof window !== 'undefined') {
      activeToken = localStorage.getItem('anon_token');
      if (!activeToken) {
        activeToken = crypto.randomUUID();
        localStorage.setItem('anon_token', activeToken);
      }
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) throw new Error(uploadData.error);

      const photoRes = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: uploadData.url,
          caption,
          uploader_token: activeToken,
        }),
      });

      if (photoRes.ok) {
        setFile(null);
        setCaption('');
        e.target.reset();
        await fetchPhotos();
      } else {
        const errorData = await photoRes.json().catch(() => ({}));
        alert('Error al guardar foto: ' + (errorData.error || photoRes.statusText));
      }
    } catch (err) {
      alert('Error en la subida: ' + (err.message || 'Error desconocido'));
    } finally {
      setUploading(false);
    }
  }

  async function handleReaction(photoId, emoji) {
    const activeToken = token || localStorage.getItem('anon_token');
    if (!activeToken) return;

    try {
      const res = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo_id: photoId,
          emoji,
          reactor_token: activeToken,
        }),
      });
      if (res.ok) {
        await fetchPhotos();
      }
    } catch (err) {
      console.error(err);
    }
  }

  function handleCommentChange(photoId, field, value) {
    setCommentInputs((prev) => ({
      ...prev,
      [photoId]: {
        ...prev[photoId],
        [field]: value,
      },
    }));
  }

  async function handleCommentSubmit(e, photoId) {
    e.preventDefault();
    const activeToken = token || localStorage.getItem('anon_token');
    if (!activeToken) return;

    const inputData = commentInputs[photoId] || {};
    const body = inputData.body || '';
    const author_name = inputData.author_name || '';

    if (!body.trim()) return;

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo_id: photoId,
          body,
          author_name,
          author_token: activeToken,
        }),
      });

      if (res.ok) {
        setCommentInputs((prev) => ({
          ...prev,
          [photoId]: { author_name: inputData.author_name, body: '' },
        }));
        await fetchPhotos();
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className={styles['app-container']}>
      <header className={styles['app-header']}>
        <div className={styles['title-group']}>
          <h1>
            Muro Anónimo <span className={styles['badge']}>Neon DB</span>
          </h1>
          <p className={styles['subtitle']}>Comparte imágenes, añade reacciones y comenta sin registro.</p>
        </div>
        <div className={styles['stats-counter']}>
          {photos.length} {photos.length === 1 ? 'foto compartida' : 'fotos compartidas'}
        </div>
      </header>

      {/* Formulario de Subida con estilo oscuro */}
      <section className={styles['upload-card']}>
        <h2 className={styles['upload-card-title']}>Publicar foto o video</h2>
        <form onSubmit={handleUpload} className={styles['upload-form']}>
          <div className={styles['file-input-wrapper']}>
            <input
              type="file"
              accept="image/*,video/*"
              required
              onChange={(e) => setFile(e.target.files[0])}
            />
            <span className={styles['file-label-text']}>
              {file ? file.name : 'Haz clic o arrastra una foto o video aquí'}
            </span>
            <span className={styles['file-label-hint']}>Formatos admitidos: JPG, PNG, WEBP, GIF, MP4, WEBM</span>
          </div>

          <input
            type="text"
            className={styles['caption-input']}
            placeholder="Descripción o título (opcional)..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />

          <button type="submit" disabled={uploading} className={styles['submit-btn']}>
            {uploading ? 'Guardando en Neon...' : 'Publicar contenido'}
          </button>
        </form>
      </section>

      {/* Cuadrícula de fotos y videos */}
      <section>
        <h2 className={styles['gallery-section-title']}>Colección</h2>

        {photos.length === 0 ? (
          <div className={styles['empty-state']}>
            <p>No hay fotos o videos todavía en el muro. ¡Sé el primero en compartir uno!</p>
          </div>
        ) : (
          <div className={styles['gallery-grid']}>
            {photos.map((photo) => {
              const currentComment = commentInputs[photo.id] || {};
              const isVideo = photo.url && (photo.url.startsWith('data:video/') || photo.url.match(/\.(mp4|webm|ogg|mov)($|\?)/i));
              return (
                <article key={photo.id} className={styles['photo-card']}>
                  <div
                    className={`${styles['image-wrapper']} ${styles['image-clickable']}`}
                    onClick={() => setSelectedMedia({ url: photo.url, caption: photo.caption, isVideo })}
                    title="Haz clic para ver en pantalla completa"
                  >
                    {isVideo ? (
                      <video
                        src={photo.url}
                        controls
                        playsInline
                        className={styles['photo-img']}
                      />
                    ) : (
                      <img
                        src={photo.url}
                        alt={photo.caption || 'Foto'}
                        className={styles['photo-img']}
                        loading="lazy"
                      />
                    )}
                  </div>

                  <div className={styles['card-body']}>
                    {photo.caption && <p className={styles['photo-caption']}>{photo.caption}</p>}

                    {/* Barra de Reacciones */}
                    <div className={styles['reactions-bar']}>
                      {EMOJIS.map((emoji) => {
                        const count = photo.reactions?.[emoji] || 0;
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleReaction(photo.id, emoji)}
                            className={`${styles['reaction-btn']} ${count > 0 ? styles['has-votes'] : ''}`}
                            title={`Reaccionar con ${emoji}`}
                          >
                            <span>{emoji}</span>
                            {count > 0 && <span className={styles['reaction-count']}>{count}</span>}
                          </button>
                        );
                      })}
                    </div>

                    {/* Comentarios */}
                    <section className={styles['comments-section']}>
                      <h4 className={styles['comments-header']}>
                        Comentarios ({photo.comments?.length || 0})
                      </h4>
                      <div className={styles['comments-list']}>
                        {(!photo.comments || photo.comments.length === 0) && (
                          <p className={styles['no-comments-label']}>Sin comentarios aún.</p>
                        )}
                        {photo.comments?.map((c) => (
                          <div key={c.id} className={styles['comment-bubble']}>
                            <span className={styles['comment-author-name']}>
                              {c.author_name || 'Anónimo'}
                            </span>
                            <span className={styles['comment-text-body']}>{c.body}</span>
                          </div>
                        ))}
                      </div>

                      <form
                        onSubmit={(e) => handleCommentSubmit(e, photo.id)}
                        className={styles['comment-input-form']}
                      >
                        <input
                          type="text"
                          placeholder="Nombre (opc.)"
                          className={styles['author-input']}
                          value={currentComment.author_name || ''}
                          onChange={(e) => handleCommentChange(photo.id, 'author_name', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Comentar..."
                          className={styles['comment-text-input']}
                          required
                          value={currentComment.body || ''}
                          onChange={(e) => handleCommentChange(photo.id, 'body', e.target.value)}
                        />
                        <button type="submit" className={styles['send-comment-btn']}>
                          Enviar
                        </button>
                      </form>
                    </section>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal / Lightbox de imagen o video completo */}
      {selectedMedia && (
        <div
          className={styles['modal-overlay']}
          onClick={() => setSelectedMedia(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={styles['modal-content']}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles['modal-close-btn']}
              onClick={() => setSelectedMedia(null)}
              aria-label="Cerrar vista completa"
              title="Cerrar (Esc)"
            >
              ✕
            </button>
            {selectedMedia.isVideo ? (
              <video
                src={selectedMedia.url}
                controls
                autoPlay
                playsInline
                className={styles['modal-video']}
              />
            ) : (
              <img
                src={selectedMedia.url}
                alt={selectedMedia.caption || 'Vista completa'}
                className={styles['modal-img']}
              />
            )}
            {selectedMedia.caption && (
              <p className={styles['modal-caption']}>{selectedMedia.caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

