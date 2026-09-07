// src/admin/components/ui/FormField.tsx
import { useId, type ReactNode } from 'react'
import { Layers, AlignLeft, Image, Paperclip, Group, Type } from 'lucide-react'
import type { FieldDefinition } from '../../types'
import { getFieldLabel } from '../../types'
import FieldRow from './FieldRow'
import FieldBlock from './FieldBlock'
import Chip from './Chip'
import { FieldControlProvider } from './FieldContext'

/** Field types that take the full width with the label above. Everything else is a row. */
export const TALL_TYPES = new Set(['richtext', 'text', 'blocks', 'block', 'image', 'file'])

export function isTallField(field: Pick<FieldDefinition, 'type'>): boolean {
  return TALL_TYPES.has(field.type)
}

const typeChips: Record<string, { label: string; Icon: typeof Layers }> = {
  richtext: { label: 'Rich text', Icon: AlignLeft },
  text: { label: 'Text', Icon: Type },
  blocks: { label: 'Blocks', Icon: Layers },
  block: { label: 'Group', Icon: Group },
  image: { label: 'Image', Icon: Image },
  file: { label: 'File', Icon: Paperclip },
}

interface FormFieldProps {
  field: FieldDefinition
  children: ReactNode
  /** Replaces the default type chip on a tall field ("12 blocks"). */
  chip?: ReactNode
  hint?: ReactNode
  labelWidth?: number
  highlight?: boolean
  className?: string
}

/**
 * The one rule that answers "where do I type": a field's layout is chosen by
 * its type and nothing else. Scalars become a FieldRow, tall types a FieldBlock.
 */
export default function FormField({ field, children, chip, hint, labelWidth, highlight, className = '' }: FormFieldProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const label = getFieldLabel(field)
  const labelId = `${id}-label`
  const control = { id, required: !!field.required, hintId, labelId }

  if (!isTallField(field)) {
    return (
      <FieldControlProvider value={control}>
        <div data-field="row" className={className}>
          <FieldRow id={id} label={label} required={field.required} hint={hint} hintId={hintId} labelWidth={labelWidth} highlight={highlight}>
            {children}
          </FieldRow>
        </div>
      </FieldControlProvider>
    )
  }

  const defaultChip = typeChips[field.type]
  const chipNode =
    chip === undefined
      ? defaultChip && (
          <Chip variant="type" icon={<defaultChip.Icon aria-hidden />}>
            {defaultChip.label}
          </Chip>
        )
      : typeof chip === 'string'
        ? (
          <Chip variant="type" icon={defaultChip ? <defaultChip.Icon aria-hidden /> : undefined}>
            {chip}
          </Chip>
        )
        : chip

  return (
    <FieldControlProvider value={control}>
      <div data-field="tall" className={className}>
        <FieldBlock id={id} labelId={labelId} label={label} required={field.required} chip={chipNode} hint={hint} hintId={hintId}>
          {children}
        </FieldBlock>
      </div>
    </FieldControlProvider>
  )
}
