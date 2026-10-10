import React, { useState, useRef, useEffect, type DragEvent, type ChangeEvent } from 'react';
import './UploadModal.css';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (
    files: File[],
    metadata?: { titulo?: string; descripcion?: string; etiquetas?: string[] }
  ) => Promise<void>;
}

interface FilePreview {
  file: File;
  previewUrl: string;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUpload }) => {
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [etiquetasInput, setEtiquetasInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Limpiar previews y campos al cerrar
  useEffect(() => {
    if (!isOpen) {
      previews.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setPreviews([]);
      setTitulo('');
      setDescripcion('');
      setEtiquetasInput('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    const newItems: FilePreview[] = [];
    Array.from(fileList).forEach((file) => {
      if (file.type.startsWith('image/')) {
        newItems.push({
          file,
          previewUrl: URL.createObjectURL(file),
        });
      }
    });

    if (newItems.length > 0) {
      setPreviews((prev) => [...prev, ...newItems]);
      // Si aún no hay título y se sube 1 archivo, prellenar título
      if (!titulo && newItems.length === 1) {
        setTitulo(newItems[0].file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleRemovePreview = (index: number) => {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleAddFiles(e.dataTransfer.files);
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleAddFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (previews.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const tags = etiquetasInput
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter((t) => t.length > 0);

      const files = previews.map((p) => p.file);
      await onUpload(files, {
        titulo: titulo.trim() || undefined,
        descripcion: descripcion.trim(),
        etiquetas: tags,
      });

      onClose();
    } catch (err) {
      console.error('Error al subir fotos:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="upload-modal-overlay" onClick={onClose}>
      <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="upload-modal-header">
          <h2 className="upload-modal-title">Subir fotos al muro</h2>
          <button type="button" className="modal-close-icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="upload-modal-body">
          <div
            className={`drop-area ${isDragging ? 'active' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <svg
              className="drop-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <p className="drop-main-text">Arrastra imágenes aquí o haz clic para buscar</p>
            <p className="drop-sub-text">Formatos admitidos: JPG, PNG, WEBP, GIF (selección múltiple)</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={onFileInputChange}
              multiple
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>

          {previews.length > 0 && (
            <div>
              <p className="form-label" style={{ marginBottom: '0.4rem' }}>
                Imágenes seleccionadas ({previews.length})
              </p>
              <div className="previews-grid">
                {previews.map((item, idx) => (
                  <div key={idx} className="preview-thumb-wrap">
                    <img src={item.previewUrl} alt="Preview" className="preview-thumb-img" />
                    <button
                      type="button"
                      className="remove-thumb-btn"
                      onClick={() => handleRemovePreview(idx)}
                      title="Quitar"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-field">
            <label className="form-label">Título {previews.length > 1 && '(común o dejar vacío)'}</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: Atardecer en la montaña"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Descripción</label>
            <textarea
              className="form-textarea"
              placeholder="Añade detalles sobre la imagen o sesión..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Etiquetas (separadas por comas)</label>
            <input
              type="text"
              className="form-input"
              placeholder="paisaje, naturaleza, verano"
              value={etiquetasInput}
              onChange={(e) => setEtiquetasInput(e.target.value)}
            />
          </div>
        </div>

        <div className="upload-modal-footer">
          <button type="button" className="cancel-modal-btn" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="confirm-upload-btn"
            disabled={previews.length === 0 || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting
              ? 'Guardando...'
              : `Guardar ${previews.length > 0 ? `(${previews.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};
