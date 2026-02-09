import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SlugEditor from './SlugEditor'

describe('SlugEditor', () => {
  it('generates slug from a single source field', async () => {
    const onChange = vi.fn()
    render(
      <SlugEditor
        field={{ name: 'slug', type: 'slug', from: 'title' }}
        value=""
        onChange={onChange}
        formData={{ title: 'Hello World' }}
      />
    )

    await userEvent.click(screen.getByText('Generate'))
    expect(onChange).toHaveBeenCalledWith('hello-world')
  })

  it('generates slug from multiple source fields', async () => {
    const onChange = vi.fn()
    render(
      <SlugEditor
        field={{ name: 'slug', type: 'slug', from: ['lastName', 'firstName'] }}
        value=""
        onChange={onChange}
        formData={{ lastName: 'Kabo', firstName: 'Raphael' }}
      />
    )

    await userEvent.click(screen.getByText('Generate'))
    expect(onChange).toHaveBeenCalledWith('kabo-raphael')
  })

  it('skips empty fields when generating from multiple sources', async () => {
    const onChange = vi.fn()
    render(
      <SlugEditor
        field={{ name: 'slug', type: 'slug', from: ['lastName', 'firstName'] }}
        value=""
        onChange={onChange}
        formData={{ lastName: 'Kabo', firstName: '' }}
      />
    )

    await userEvent.click(screen.getByText('Generate'))
    expect(onChange).toHaveBeenCalledWith('kabo')
  })

  it('shows generate button when from is an array', () => {
    render(
      <SlugEditor
        field={{ name: 'slug', type: 'slug', from: ['lastName', 'firstName'] }}
        value=""
        onChange={vi.fn()}
        formData={{}}
      />
    )

    expect(screen.getByText('Generate')).toBeTruthy()
  })
})
