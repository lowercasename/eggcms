// src/admin/editors/FileEditor.tsx
import MediaField, { KindTile } from '../components/media/MediaField'
import type { MediaKind } from '../lib/media'
import type { EditorProps } from './types'

/** Kinds this field will accept. Defaults to documents (PDFs and the like). */
function acceptedKinds(field: EditorProps['field']): MediaKind[] {
  return field.kinds && field.kinds.length > 0 ? field.kinds : ['document']
}

export default function FileEditor({ field, value, onChange }: EditorProps) {
  const kinds = acceptedKinds(field)
  return (
    <MediaField
      value={(value as string) || null}
      onChange={onChange}
      kinds={kinds}
      noun="file"
      filenameTestId="file-filename"
      preview={(_path, entry) => <KindTile kind={entry?.kind ?? kinds[0]} />}
      placeholder={<KindTile kind={kinds[0]} dashed />}
    />
  )
}
