import { slugify as baseSlugify } from 'transliteration'

// ALA-LC (Library of Congress) Russian romanization, 2012 version
// https://www.loc.gov/catdir/cpso/romanization/russian.pdf
// Diacritics stripped for slug-safe ASCII output.
// Only letters that differ from the transliteration package defaults are listed.
const LOC_RUSSIAN: Record<string, string> = {
  Ё: 'E', ё: 'e',     // default: Yo/yo
  Й: 'I', й: 'i',     // default: J/j
  Х: 'Kh', х: 'kh',   // default: H/h
  Ц: 'Ts', ц: 'ts',   // default: C/c
  Щ: 'Shch', щ: 'shch', // default: Sch/sch
  Ъ: '', ъ: '',        // hard sign — omitted
  Ь: '', ь: '',        // soft sign — omitted
  Э: 'E', э: 'e',      // default: E'/e'
  Ю: 'Iu', ю: 'iu',   // default: Yu/yu
  Я: 'Ia', я: 'ia',   // default: Ya/ya
}

export function slugify(text: string): string {
  return baseSlugify(text, { replace: LOC_RUSSIAN })
}
