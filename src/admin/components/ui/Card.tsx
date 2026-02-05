// src/admin/components/ui/Card.tsx
import { forwardRef, type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hoverable?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { children, className = '', hoverable = false, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={`
        bg-white rounded-xl border border-[#E8E8E3]
        ${hoverable ? 'transition-shadow duration-200 hover:shadow-md' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
})

export default Card
