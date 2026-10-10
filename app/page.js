'use client';

import { useState, useEffect } from 'react';
import { useAnonToken } from '@/lib/useAnonToken';

const EMOJIS = ['😂', '❤️', '🔥', '👎'];

export default function Home() {
  const token = useAnonToken();
  const [photos, setPhotos] = useState([]);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});

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
    if (!file || !token || uploading) return;

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
          uploader_token: token,
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
    if (!token) return;
    try {
      const res = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo_id: photoId,
          emoji,
          reactor_token: token,
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
    if (!token) return;

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
          author_token: token,
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
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '30px' }}>
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="file"
            accept="image/*"
            required
            onChange={(e) => setFile(e.target.files[0])}
          />
          <input
            type="text"
            placeholder="Descripción (opcional)..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <button type="submit" disabled={uploading}>
            {uploading ? 'Subiendo...' : 'Publicar Foto'}
          </button>
        </form>
      </header>

      <main style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {photos.map((photo) => {
          const currentComment = commentInputs[photo.id] || {};
          return (
            <article
              key={photo.id}
              style={{
                border: '1px solid #ccc',
                borderRadius: '8px',
                padding: '15px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <img
                src={photo.url}
                alt={photo.caption || 'Foto'}
                style={{ width: '100%', maxHeight: '500px', objectFit: 'contain' }}
              />
              {photo.caption && <p>{photo.caption}</p>}

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {EMOJIS.map((emoji) => {
                  const count = photo.reactions?.[emoji] || 0;
                  return (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(photo.id, emoji)}
                      style={{ padding: '5px 10px' }}
                    >
                      {emoji} {count > 0 && count}
                    </button>
                  );
                })}
              </div>

              <section style={{ borderTop: '1px solid #eee', paddingTop: '10px' }}>
                <h4>Comentarios</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '10px 0' }}>
                  {photo.comments?.length === 0 && <p style={{ fontSize: '13px' }}>Sin comentarios.</p>}
                  {photo.comments?.map((c) => (
                    <div key={c.id} style={{ fontSize: '14px' }}>
                      <strong>{c.author_name}: </strong>
                      <span>{c.body}</span>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={(e) => handleCommentSubmit(e, photo.id)}
                  style={{ display: 'flex', gap: '8px' }}
                >
                  <input
                    type="text"
                    placeholder="Tu nombre (opcional)"
                    value={currentComment.author_name || ''}
                    onChange={(e) => handleCommentChange(photo.id, 'author_name', e.target.value)}
                    style={{ width: '150px' }}
                  />
                  <input
                    type="text"
                    placeholder="Escribe un comentario..."
                    required
                    value={currentComment.body || ''}
                    onChange={(e) => handleCommentChange(photo.id, 'body', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="submit">Enviar</button>
                </form>
              </section>
            </article>
          );
        })}
      </main>
    </div>
  );
}
