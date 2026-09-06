// src/admin/pages/Media.tsx
import MediaBrowser from '../components/media/MediaBrowser'

/** The media library page: the shared browser in manage mode, with its header. */
export default function Media() {
  return <MediaBrowser mode="manage" header className="flex-1 min-w-0 h-screen" />
}
