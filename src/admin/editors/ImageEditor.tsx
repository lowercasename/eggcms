// src/admin/editors/ImageEditor.tsx
import { Image as ImageIcon } from 'lucide-react'
import MediaField from '../components/media/MediaField'
import type { EditorProps } from './types'

export default function ImageEditor({ value, onChange }: EditorProps) {
  return (
    <MediaField
      value={(value as string) || null}
      onChange={onChange}
      kinds={['image']}
      noun="image"
      filenameTestId="image-filename"
      preview={(path) => <img src={path} alt="" className="w-24 h-24 rounded-control border-[1.5px] border-line-strong object-cover bg-panel" />}
      placeholder={
        <div className="w-24 h-24 rounded-control border-[1.5px] border-dashed border-line-input bg-panel flex items-center justify-center">
          <ImageIcon className="w-7 h-7 text-ink-2" aria-hidden />
        </div>
      }
    />
  )
}
