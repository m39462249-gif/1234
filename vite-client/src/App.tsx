import React, { useState } from 'react';
import type { Foto } from './types';
import { useFotos } from './hooks/useFotos';
import { Header } from './components/Header/Header';
import { Grid } from './components/Grid/Grid';
import { Lightbox } from './components/Lightbox/Lightbox';
import { UploadModal } from './components/UploadModal/UploadModal';
import './App.css';

export const App: React.FC = () => {
  const {
    fotos,
    todasLasFotos,
    totalFotos,
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
  } = useFotos();

  const [selectedFotoId, setSelectedFotoId] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Mantener referencia a la foto activa actualizada
  const selectedFoto = todasLasFotos.find((f) => f.id === selectedFotoId) || null;

  return (
    <div className="app-root">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenUpload={() => setIsUploadOpen(true)}
        totalFotos={totalFotos}
      />

      <main className="main-content">
        <Grid
          fotos={fotos}
          totalFotos={totalFotos}
          loading={loading}
          searchQuery={searchQuery}
          tieneMasFotos={tieneMasFotos}
          onCargarMas={cargarMas}
          getFotoUrl={getFotoUrl}
          onSelectFoto={(foto: Foto) => setSelectedFotoId(foto.id)}
          onOpenUpload={() => setIsUploadOpen(true)}
        />
      </main>

      {/* Visor Modal (Lightbox) */}
      {selectedFoto && (
        <Lightbox
          foto={selectedFoto}
          imageUrl={getFotoUrl(selectedFoto.id)}
          onClose={() => setSelectedFotoId(null)}
          onUpdateMetadata={actualizarMetadatos}
          onReaccionar={reaccionar}
          onAgregarComentario={agregarComentario}
          onEliminar={eliminarFoto}
        />
      )}

      {/* Modal de subida de fotos */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={subirFotos}
      />
    </div>
  );
};

export default App;
