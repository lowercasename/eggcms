// src/admin/lib/words.ts
// Small English helpers for the copy the admin writes about schema labels.

const IRREGULAR: Record<string, string> = { people: 'person', children: 'child', men: 'man', women: 'woman' }

/** "Sections" → "Section", "People" → "Person"; leaves "Address" and multi-word labels alone. */
export function singularize(label: string): string {
  if (label.includes(' ')) return label
  const irregular = IRREGULAR[label.toLowerCase()]
  if (irregular) return label[0] === label[0].toUpperCase() ? irregular[0].toUpperCase() + irregular.slice(1) : irregular
  if (/ss$/i.test(label) || !/s$/i.test(label)) return label
  if (/ies$/i.test(label)) return label.slice(0, -3) + 'y'
  return label.slice(0, -1)
}

/** "article" → "an article", "book" → "a book". */
export function indefinite(noun: string): string {
  return `${/^[aeiou]/i.test(noun) ? 'an' : 'a'} ${noun}`
}

/** "Pages" → "page": what one entry of a collection is called in prose. */
export function entryNoun(schemaLabel: string): string {
  return singularize(schemaLabel).toLowerCase()
}

/** "page", 3 → "pages"; "page", 1 → "page". */
export function plural(noun: string, count: number): string {
  if (count === 1) return noun
  return /s$/i.test(noun) ? noun : `${noun}s`
}
