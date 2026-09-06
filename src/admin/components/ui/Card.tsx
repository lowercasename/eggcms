// src/admin/components/ui/Card.tsx
import { forwardRef, type HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Rows inside are separated by a hairline. */
  divided?: boolean
  /** Border weight: panels use 1px strong, cards that are picked use 1.5px. */
  weight?: 'panel' | 'card'
}

/** A white panel with a 1px strong border and 12px corners. */
const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { children, className = '', divided, weight = 'panel', ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={[
        'bg-panel rounded-panel overflow-hidden',
        weight === 'panel' ? 'border border-line-strong' : 'border-[1.5px] border-line-strong',
        divided ? 'divide-y divide-line-hair' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
})

export default Card
