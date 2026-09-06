// src/admin/components/richtext/ImageInsertModal.tsx
import MediaPickerDialog from '../media/MediaPickerDialog'

interface Props {
  onSelect: (path: string) => void
  onClose: () => void
}

/** "Insert image" in rich text: the media library in pick mode, images only. */
export default function ImageInsertModal({ onSelect, onClose }: Props) {
  return <MediaPickerDialog title="Insert image" kinds={['image']} onSelect={onSelect} onClose={onClose} />
}
