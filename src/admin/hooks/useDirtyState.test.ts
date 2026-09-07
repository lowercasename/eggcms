import { describe, it, expect } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useDirtyState } from './useDirtyState'

describe('useDirtyState', () => {
  it('is not dirty after initial load', async () => {
    const { result } = renderHook(() =>
      useDirtyState({ title: 'Hello' }, false)
    )
    await waitFor(() => {
      expect(result.current.isDirty).toBe(false)
    })
  })

  it('is not dirty while loading', () => {
    const { result } = renderHook(() =>
      useDirtyState({ title: 'Hello' }, true)
    )
    expect(result.current.isDirty).toBe(false)
  })

  it('is dirty when data changes after load', async () => {
    const { result, rerender } = renderHook(
      ({ data, loading }) => useDirtyState(data, loading),
      { initialProps: { data: { title: 'Hello' } as Record<string, unknown>, loading: true } }
    )

    // Simulate loading complete
    rerender({ data: { title: 'Hello' }, loading: false })
    await waitFor(() => {
      expect(result.current.isDirty).toBe(false)
    })

    // Simulate user edit
    rerender({ data: { title: 'Modified' }, loading: false })
    await waitFor(() => {
      expect(result.current.isDirty).toBe(true)
    })
  })

  it('markClean clears dirty state', async () => {
    const { result, rerender } = renderHook(
      ({ data, loading }) => useDirtyState(data, loading),
      { initialProps: { data: { title: 'Hello' } as Record<string, unknown>, loading: true } }
    )

    rerender({ data: { title: 'Hello' }, loading: false })
    await waitFor(() => {
      expect(result.current.isDirty).toBe(false)
    })

    rerender({ data: { title: 'Modified' }, loading: false })
    await waitFor(() => {
      expect(result.current.isDirty).toBe(true)
    })

    act(() => { result.current.markClean() })
    await waitFor(() => {
      expect(result.current.isDirty).toBe(false)
    })
  })

  it('stays clean after save when _meta is excluded from tracked data', async () => {
    // The caller should strip server metadata before passing to this hook.
    // After save, the editable fields haven't changed, so isDirty stays false.
    const { result, rerender } = renderHook(
      ({ data, loading }) => useDirtyState(data, loading),
      { initialProps: { data: { title: 'Hello' } as Record<string, unknown>, loading: true } }
    )

    rerender({ data: { title: 'Hello' }, loading: false })
    await waitFor(() => {
      expect(result.current.isDirty).toBe(false)
    })

    // User edits title
    rerender({ data: { title: 'Modified' }, loading: false })
    await waitFor(() => {
      expect(result.current.isDirty).toBe(true)
    })

    // Save: markClean captures { title: 'Modified' }, then API returns same editable fields
    act(() => { result.current.markClean() })
    rerender({ data: { title: 'Modified' }, loading: false })

    await waitFor(() => {
      expect(result.current.isDirty).toBe(false)
    })
  })

  it('resets dirty state when resetKey changes', async () => {
    const { result, rerender } = renderHook(
      ({ data, loading, resetKey }) => useDirtyState(data, loading, resetKey),
      { initialProps: { data: { title: 'Hello' } as Record<string, unknown>, loading: true, resetKey: 'item-1' } }
    )

    rerender({ data: { title: 'Hello' }, loading: false, resetKey: 'item-1' })
    await waitFor(() => {
      expect(result.current.isDirty).toBe(false)
    })

    rerender({ data: { title: 'Modified' }, loading: false, resetKey: 'item-1' })
    await waitFor(() => {
      expect(result.current.isDirty).toBe(true)
    })

    // Changing resetKey should reset dirty tracking
    rerender({ data: { title: 'New item' }, loading: false, resetKey: 'item-2' })
    await waitFor(() => {
      expect(result.current.isDirty).toBe(false)
    })
  })
})

describe('useDirtyState change counting', () => {
  it('agrees with itself: dirty exactly when at least one field changed', async () => {
    const { result, rerender } = renderHook(
      ({ data, loading }) => useDirtyState(data, loading),
      { initialProps: { data: { title: 'A' } as Record<string, unknown>, loading: false } }
    )
    await waitFor(() => expect(result.current.savedData).not.toBeNull())

    // A field that was absent and is now an empty string is not a change.
    rerender({ data: { title: 'A', subtitle: '' }, loading: false })
    expect(result.current.isDirty).toBe(false)
    expect(result.current.changedCount).toBe(0)

    rerender({ data: { title: 'B', subtitle: '' }, loading: false })
    expect(result.current.isDirty).toBe(true)
    expect(result.current.changedCount).toBe(1)
  })

  it('markClean(next) makes the given data the new baseline', async () => {
    const { result, rerender } = renderHook(
      ({ data, loading }) => useDirtyState(data, loading),
      { initialProps: { data: { title: 'A' } as Record<string, unknown>, loading: false } }
    )
    await waitFor(() => expect(result.current.savedData).not.toBeNull())
    rerender({ data: { title: 'B' }, loading: false })
    act(() => result.current.markClean({ title: 'B', extra: 'from server' }))
    await waitFor(() => expect(result.current.savedData).toEqual({ title: 'B', extra: 'from server' }))
    rerender({ data: { title: 'B', extra: 'from server' }, loading: false })
    expect(result.current.isDirty).toBe(false)
  })
})
