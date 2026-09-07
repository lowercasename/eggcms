// src/admin/lib/words.ts
// Small English helpers for the copy the admin writes about schema labels.

const IRREGULAR: Record<string, string> = { people: 'person', children: 'child', men: 'man', women: 'woman', series: 'series', news: 'news' }
const IRREGULAR_PLURAL: Record<string, string> = { person: 'people', child: 'children', man: 'men', woman: 'women', series: 'series', news: 'news' }

/** "Sections" → "Section", "People" → "Person", "Blog Posts" → "Blog Post"; leaves "Address" alone. */
export function singularize(label: string): string {
  const space = label.lastIndexOf(' ')
  if (space !== -1) return label.slice(0, space + 1) + singularize(label.slice(space + 1))
  const irregular = IRREGULAR[label.toLowerCase()]
  if (irregular) return label[0] === label[0].toUpperCase() ? irregular[0].toUpperCase() + irregular.slice(1) : irregular
  if (/ss$/i.test(label) || !/s$/i.test(label)) return label
  if (/ies$/i.test(label)) return label.slice(0, -3) + 'y'
  // Addresses → Address, Boxes → Box, Churches → Church
  if (/(ss|x|ch|sh)es$/i.test(label)) return label.slice(0, -2)
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
  const irregular = IRREGULAR_PLURAL[noun.toLowerCase()]
  if (irregular) return irregular
  if (/(s|x|ch|sh)$/i.test(noun)) return /s$/i.test(noun) && !/ss$/i.test(noun) ? noun : `${noun}es`
  if (/[^aeiou]y$/i.test(noun)) return `${noun.slice(0, -1)}ies`
  return `${noun}s`
}

/** "Article", "Article or Book", "Article, Book or Heading". */
export function joinWords(items: string[], conjunction: 'and' | 'or'): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} ${conjunction} ${items[items.length - 1]}`
}

/** The count the unsaved bar leads with: "1 unsaved change", "3 unsaved changes". */
export function unsavedChanges(count: number): string {
  return `${count} unsaved ${plural('change', count)}`
}
