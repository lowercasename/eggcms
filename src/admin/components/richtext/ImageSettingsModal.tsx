// src/admin/components/richtext/ImageSettingsModal.tsx
import { useState } from 'react'
import Modal, { ModalBody, ModalFooter } from '../Modal'
import MediaPickerDialog from '../media/MediaPickerDialog'
import { Button, Input, Label, Textarea } from '../ui'

type Size = 'small' | 'medium' | 'large' | 'full'

interface Props {
  src: string
  size: Size
  width: string | null
  alt: string
  caption: string
  onSave: (attrs: { size: Size; width: string | null; alt: string; caption: string }) => void
  onReplace: (newSrc: string) => void
  onClose: () => void
}

const SIZES: Size[] = ['small', 'medium', 'large', 'full']

export default function ImageSettingsModal({
  src,
  size: initialSize,
  width: initialWidth,
  alt: initialAlt,
  caption: initialCaption,
  onSave,
  onReplace,
  onClose,
}: Props) {
  const [size, setSize] = useState<Size>(initialSize)
  const [customWidth, setCustomWidth] = useState(initialWidth || '')
  const [alt, setAlt] = useState(initialAlt)
  const [caption, setCaption] = useState(initialCaption)
  const [showReplace, setShowReplace] = useState(false)

  const handleSave = () => onSave({ size, width: customWidth ? customWidth : null, alt, caption })

  const handleWidthChange = (value: string) => setCustomWidth(value.replace(/[^0-9px]/g, ''))
  const handleWidthBlur = () => {
    if (customWidth && !customWidth.endsWith('px')) setCustomWidth(customWidth + 'px')
  }

  if (showReplace) {
    return (
      <MediaPickerDialog
        title="Replace image"
        kinds={['image']}
        onSelect={(newSrc) => {
          onReplace(newSrc)
          setShowReplace(false)
        }}
        onBack={() => setShowReplace(false)}
        onClose={onClose}
      />
    )
  }

  return (
    <Modal title="Image settings" onClose={onClose} maxWidth="lg">
      <ModalBody className="flex flex-col gap-5">
        <div className="flex justify-center bg-page rounded-control p-4">
          <img src={src} alt={alt} className="max-h-40 max-w-full object-contain rounded-[6px]" />
        </div>

        <div>
          <Label className="mb-2">Size</Label>
          <div className="flex gap-2">
            {SIZES.map((s) => {
              const pressed = size === s && !customWidth
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => {
                    setSize(s)
                    setCustomWidth('')
                  }}
                  className={`flex-1 px-3 py-2.5 text-[15px] font-semibold rounded-control border-[1.5px] transition-colors ${
                    pressed ? 'bg-selected text-white border-selected' : 'bg-panel text-ink-nav border-line-input hover:bg-page'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <Label htmlFor="image-width" className="mb-2">
            Custom width <span className="text-ink-2 font-normal">(optional)</span>
          </Label>
          <Input
            id="image-width"
            mono
            value={customWidth}
            onChange={(e) => handleWidthChange(e.target.value)}
            onBlur={handleWidthBlur}
            placeholder="e.g., 300px"
          />
          <p className="mt-1.5 mb-0 text-[14px] text-ink-2">Overrides the size above when set.</p>
        </div>

        <div>
          <Label htmlFor="image-alt" className="mb-2">
            Alt text
          </Label>
          <Textarea id="image-alt" value={alt} onChange={(e) => setAlt(e.target.value)} rows={2} placeholder="Describe the image for accessibility" className="!min-h-0" />
          <p className="mt-1.5 mb-0 text-[14px] text-ink-2">Read aloud by screen readers and shown if the image fails to load.</p>
        </div>

        <div>
          <Label htmlFor="image-caption" className="mb-2">
            Caption <span className="text-ink-2 font-normal">(optional)</span>
          </Label>
          <Input id="image-caption" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Add a caption below the image" />
        </div>

        <Button variant="secondary" fullWidth onClick={() => setShowReplace(true)}>
          Replace image
        </Button>
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save</Button>
      </ModalFooter>
    </Modal>
  )
}
