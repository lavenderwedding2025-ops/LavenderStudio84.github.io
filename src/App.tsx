import React, { useState, useEffect } from 'react';
import { Album, AppView, PhotoItem } from './types/album';
import { loadStoredAlbums, saveStoredAlbums } from './utils/defaultData';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ClientGalleryView } from './components/ClientGalleryView';
import { RawFilterModal } from './components/RawFilterModal';
import { CreateAlbumModal } from './components/CreateAlbumModal';
import { EditAlbumModal } from './components/EditAlbumModal';
import { GitHubDeployModal } from './components/GitHubDeployModal';

export default function App() {
  const [albums, setAlbums] = useState<Album[]>(() => loadStoredAlbums());
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [activeAlbumId, setActiveAlbumId] = useState<string>(() => {
    return albums[0]?.id || 'album-huy-tinh';
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRawModalOpen, setIsRawModalOpen] = useState(false);
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);

  const [isClientMode, setIsClientMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('mode') === 'client';
  });

  // Sync albums to localStorage whenever changed
  useEffect(() => {
    saveStoredAlbums(albums);
  }, [albums]);

  // Handle URL query parameter ?album=... & ?mode=client for direct client sharing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const albumParam = params.get('album');
    const modeParam = params.get('mode');

    if (modeParam === 'client') {
      setIsClientMode(true);
      setCurrentView('clientGallery');
    }

    if (albumParam) {
      const found = albums.find(a => a.id === albumParam);
      if (found) {
        setActiveAlbumId(found.id);
        setCurrentView('clientGallery');
      }
    }
  }, [albums]);

  const handleToggleClientMode = (enableClient: boolean) => {
    setIsClientMode(enableClient);
    if (enableClient) {
      setCurrentView('clientGallery');
      const url = new URL(window.location.href);
      url.searchParams.set('mode', 'client');
      if (activeAlbumId) url.searchParams.set('album', activeAlbumId);
      window.history.replaceState({}, '', url.toString());
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete('mode');
      window.history.replaceState({}, '', url.toString());
    }
  };

  const activeAlbum = albums.find(a => a.id === activeAlbumId) || albums[0];

  const handleSelectAlbum = (album: Album) => {
    setActiveAlbumId(album.id);
    setCurrentView('clientGallery');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdatePhoto = (albumId: string, photoId: string, updates: Partial<PhotoItem>) => {
    setAlbums(prev =>
      prev.map(album => {
        if (album.id !== albumId) return album;
        return {
          ...album,
          photos: album.photos.map(photo => {
            if (photo.id !== photoId) return photo;
            return { ...photo, ...updates };
          })
        };
      })
    );
  };

  const handleToggleLockAlbum = (albumId: string) => {
    setAlbums(prev =>
      prev.map(album => {
        if (album.id !== albumId) return album;
        const newStatus = album.status === 'locked' ? 'selecting' : 'locked';
        return { ...album, status: newStatus };
      })
    );
  };

  const handleDeleteAlbum = (albumId: string) => {
    setAlbums(prev => prev.filter(a => a.id !== albumId));
    if (activeAlbumId === albumId) {
      const remaining = albums.filter(a => a.id !== albumId);
      if (remaining.length > 0) {
        setActiveAlbumId(remaining[0].id);
      }
      setCurrentView('dashboard');
    }
  };

  const handleCreateAlbum = (newAlbum: Album) => {
    setAlbums(prev => [newAlbum, ...prev]);
    setActiveAlbumId(newAlbum.id);
    setCurrentView('clientGallery');
  };

  const handleOpenRawModalForAlbum = (album: Album) => {
    setActiveAlbumId(album.id);
    setIsRawModalOpen(true);
  };

  const handleOpenEditModalForAlbum = (album: Album) => {
    setEditingAlbum(album);
  };

  const handleSaveAlbum = (updatedAlbum: Album) => {
    setAlbums(prev =>
      prev.map(a => (a.id === updatedAlbum.id ? updatedAlbum : a))
    );
    if (activeAlbumId === updatedAlbum.id) {
      setActiveAlbumId(updatedAlbum.id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800">
      {/* Top Bar navigation (Chỉ hiển thị cho Studio Admin, ẩn hoàn toàn khi khách mở link) */}
      {!isClientMode && (
        <Navbar
          currentView={currentView}
          onViewChange={(view) => {
            if (view === 'githubGuide') {
              setIsGithubModalOpen(true);
            } else {
              setCurrentView(view);
            }
          }}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onOpenRawModal={() => setIsRawModalOpen(true)}
          activeAlbumTitle={activeAlbum?.title}
        />
      )}

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'dashboard' && !isClientMode && (
          <DashboardView
            albums={albums}
            onSelectAlbum={handleSelectAlbum}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onOpenRawModalForAlbum={handleOpenRawModalForAlbum}
            onOpenEditModalForAlbum={handleOpenEditModalForAlbum}
            onToggleLockAlbum={handleToggleLockAlbum}
            onDeleteAlbum={handleDeleteAlbum}
          />
        )}

        {(currentView === 'clientGallery' || isClientMode) && activeAlbum && (
          <ClientGalleryView
            album={activeAlbum}
            isClientMode={isClientMode}
            onEnterClientMode={() => handleToggleClientMode(true)}
            onExitClientMode={() => handleToggleClientMode(false)}
            onUpdatePhoto={handleUpdatePhoto}
            onToggleLockAlbum={handleToggleLockAlbum}
            onOpenRawModal={handleOpenRawModalForAlbum}
            onOpenEditModal={handleOpenEditModalForAlbum}
            onBackToDashboard={() => {
              setIsClientMode(false);
              setCurrentView('dashboard');
            }}
          />
        )}
      </main>

      {/* Footer (Chỉ hiển thị ở chế độ Studio Admin) */}
      {!isClientMode && (
        <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">Shotpik Studio Selection</span>
              <span>·</span>
              <span>Nền tảng chọn ảnh chuyên nghiệp cho Studio & Khách hàng</span>
            </div>

            <div className="flex items-center gap-4 text-slate-400">
              <span>Hỗ trợ nạp Google Drive & file Sony .ARW, Canon .CR2/.CR3, Nikon .NEF</span>
              <span>·</span>
              <button
                onClick={() => setIsGithubModalOpen(true)}
                className="text-slate-600 hover:text-slate-900 underline cursor-pointer"
              >
                Cấu hình Online GitHub
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* Modals */}
      <CreateAlbumModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateAlbum={handleCreateAlbum}
      />

      {editingAlbum && (
        <EditAlbumModal
          album={editingAlbum}
          isOpen={!!editingAlbum}
          onClose={() => setEditingAlbum(null)}
          onSaveAlbum={handleSaveAlbum}
        />
      )}

      {activeAlbum && (
        <RawFilterModal
          album={activeAlbum}
          isOpen={isRawModalOpen}
          onClose={() => setIsRawModalOpen(false)}
        />
      )}

      <GitHubDeployModal
        albums={albums}
        onImportAlbums={(imported) => setAlbums(imported)}
        isOpen={isGithubModalOpen}
        onClose={() => setIsGithubModalOpen(false)}
      />
    </div>
  );
}
