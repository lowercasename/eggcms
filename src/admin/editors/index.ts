// src/admin/editors/index.ts
// The one registry of field editors, keyed by field type. Layout is chosen by
// FormField from the type as well, so adding a field type means: write the
// editor, register it here, done.
import type { EditorMap } from './types'
import StringEditor from './StringEditor'
import TextEditor from './TextEditor'
import NumberEditor from './NumberEditor'
import BooleanEditor from './BooleanEditor'
import RichtextEditor from './RichtextEditor'
import DatetimeEditor from './DatetimeEditor'
import SelectEditor from './SelectEditor'
import SlugEditor from './SlugEditor'
import ImageEditor from './ImageEditor'
import BlocksEditor from './BlocksEditor'
import BlockEditor from './BlockEditor'
import LinkFieldEditor from './LinkFieldEditor'
import FileEditor from './FileEditor'

export const editorMap: EditorMap = {
  string: StringEditor,
  text: TextEditor,
  slug: SlugEditor,
  richtext: RichtextEditor,
  number: NumberEditor,
  boolean: BooleanEditor,
  datetime: DatetimeEditor,
  image: ImageEditor,
  select: SelectEditor,
  blocks: BlocksEditor,
  block: BlockEditor,
  link: LinkFieldEditor,
  file: FileEditor,
}

export type { EditorProps, EditorMap } from './types'
