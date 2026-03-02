import { describe, it, expect } from 'vitest'
import { slugify } from './slugify'

describe('slugify', () => {
  it('lowercases and hyphenates ASCII text', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('collapses multiple spaces/hyphens into one', () => {
    expect(slugify('hello   world')).toBe('hello-world')
    expect(slugify('hello---world')).toBe('hello-world')
  })

  it('strips leading and trailing hyphens', () => {
    expect(slugify('  hello world  ')).toBe('hello-world')
  })

  it('removes non-alphanumeric characters', () => {
    expect(slugify("hello! world's end")).toBe('hello-world-s-end')
  })

  // LOC ALA-LC Russian transliteration
  describe('LOC Russian transliteration', () => {
    it('transliterates basic Cyrillic', () => {
      expect(slugify('Привет мир')).toBe('privet-mir')
    })

    it('transliterates Ю as iu (not yu)', () => {
      expect(slugify('Юлия')).toBe('iuliia')
    })

    it('transliterates Я as ia (not ya)', () => {
      expect(slugify('Яблоко')).toBe('iabloko')
    })

    it('transliterates Ё as e (not yo)', () => {
      expect(slugify('Ёлка')).toBe('elka')
    })

    it('transliterates Й as i (not y/j)', () => {
      expect(slugify('Йогурт')).toBe('iogurt')
    })

    it('transliterates Ц as ts', () => {
      expect(slugify('Цирк')).toBe('tsirk')
    })

    it('transliterates Х as kh', () => {
      expect(slugify('Хлеб')).toBe('khleb')
    })

    it('transliterates Щ as shch', () => {
      expect(slugify('Щука')).toBe('shchuka')
    })

    it('transliterates Ш as sh', () => {
      expect(slugify('Школа')).toBe('shkola')
    })

    it('transliterates Ж as zh', () => {
      expect(slugify('Жизнь')).toBe('zhizn')
    })

    it('transliterates Ч as ch', () => {
      expect(slugify('Чай')).toBe('chai')
    })

    it('transliterates Э as e', () => {
      expect(slugify('Эхо')).toBe('ekho')
    })

    it('omits hard sign (ъ) and soft sign (ь)', () => {
      expect(slugify('объект')).toBe('obekt')
      expect(slugify('Жизнь')).toBe('zhizn')
    })

    it('transliterates Ы as y', () => {
      expect(slugify('Рыба')).toBe('ryba')
    })

    it('handles full phrases', () => {
      expect(slugify('Кабо Рафаэль')).toBe('kabo-rafael')
    })
  })
})