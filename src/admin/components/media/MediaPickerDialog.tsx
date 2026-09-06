// src/admin/components/media/MediaPickerDialog.tsx
import Modal, { ModalFooter } from '../Modal'
import MediaBrowser from './MediaBrowser'
import { Button } from '../ui'
import type { MediaKind } from '../../lib/media'

interface MediaPickerDialogProps {
  title: string
  kinds?: MediaKind[]
  onSelect: (path: string) => void
  onClose: () => void
  /** Show a back button (when opened from another dialog). */
  onBack?: () => void
}

/** "Choose from library": the media browser in a dialog, one click picks a file. */
export default function MediaPickerDialog({ title, kinds, onSelect, onClose, onBack }: MediaPickerDialogProps) {
  return (
    <Modal title={title} onClose={onClose} onBack={onBack} maxWidth="full">
      <MediaBrowser mode="pick" kinds={kinds} onPick={onSelect} className="flex-1 min-h-0" />
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  )
}
