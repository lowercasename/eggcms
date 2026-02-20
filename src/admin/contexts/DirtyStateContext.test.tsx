import { describe, it, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { DirtyStateProvider, useDirtyStateContext, useDirtyItems } from './DirtyStateContext'

// Test helper component to expose context values
function DirtyItemsConsumer() {
  const { dirtyItems } = useDirtyItems()
  return (
    <div data-testid="dirty-items">{JSON.stringify([...dirtyItems])}</div>
  )
}

function SetItemDirtyButton({ itemId, dirty }: { itemId: string; dirty: boolean }) {
  const { setItemDirty } = useDirtyStateContext()
  return (
    <button onClick={() => setItemDirty(itemId, dirty)}>
      {dirty ? `Mark ${itemId} dirty` : `Mark ${itemId} clean`}
    </button>
  )
}

describe('DirtyStateContext - item-level tracking', () => {
  it('starts with empty dirtyItems set', () => {
    render(
      <DirtyStateProvider>
        <DirtyItemsConsumer />
      </DirtyStateProvider>
    )

    expect(screen.getByTestId('dirty-items').textContent).toBe('[]')
  })

  it('adds item to dirtyItems when setItemDirty(id, true) is called', () => {
    render(
      <DirtyStateProvider>
        <SetItemDirtyButton itemId="item-1" dirty={true} />
        <DirtyItemsConsumer />
      </DirtyStateProvider>
    )

    act(() => {
      screen.getByText('Mark item-1 dirty').click()
    })

    expect(screen.getByTestId('dirty-items').textContent).toBe('["item-1"]')
  })

  it('removes item from dirtyItems when setItemDirty(id, false) is called', () => {
    render(
      <DirtyStateProvider>
        <SetItemDirtyButton itemId="item-1" dirty={true} />
        <SetItemDirtyButton itemId="item-1" dirty={false} />
        <DirtyItemsConsumer />
      </DirtyStateProvider>
    )

    // First mark dirty
    act(() => {
      screen.getByText('Mark item-1 dirty').click()
    })

    expect(screen.getByTestId('dirty-items').textContent).toBe('["item-1"]')

    // Then mark clean
    act(() => {
      screen.getByText('Mark item-1 clean').click()
    })

    expect(screen.getByTestId('dirty-items').textContent).toBe('[]')
  })

  it('tracks multiple dirty items', () => {
    render(
      <DirtyStateProvider>
        <SetItemDirtyButton itemId="item-1" dirty={true} />
        <SetItemDirtyButton itemId="item-2" dirty={true} />
        <DirtyItemsConsumer />
      </DirtyStateProvider>
    )

    act(() => {
      screen.getByText('Mark item-1 dirty').click()
      screen.getByText('Mark item-2 dirty').click()
    })

    const items = JSON.parse(screen.getByTestId('dirty-items').textContent!)
    expect(items).toContain('item-1')
    expect(items).toContain('item-2')
  })
})

describe('useDirtyItems - without provider', () => {
  it('returns empty set when used outside DirtyStateProvider', () => {
    render(<DirtyItemsConsumer />)

    expect(screen.getByTestId('dirty-items').textContent).toBe('[]')
  })
})
