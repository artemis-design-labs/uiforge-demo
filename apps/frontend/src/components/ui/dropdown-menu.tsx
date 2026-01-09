"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DropdownMenuProps {
  children: React.ReactNode
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode
  className?: string
}

interface DropdownMenuContentProps {
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  className?: string
}

interface DropdownMenuItemProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

interface DropdownMenuLabelProps {
  children: React.ReactNode
  className?: string
}

interface DropdownMenuSeparatorProps {
  className?: string
}

const DropdownMenu = ({ children }: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === DropdownMenuTrigger) {
          return React.cloneElement(child as React.ReactElement<any>, {
            onClick: () => setIsOpen(!isOpen)
          })
        }
        if (React.isValidElement(child) && child.type === DropdownMenuContent) {
          return isOpen ? React.cloneElement(child as React.ReactElement<any>, {
            onClose: () => setIsOpen(false)
          }) : null
        }
        return child
      })}
    </div>
  )
}

const DropdownMenuTrigger = ({ children, className, onClick, ...props }: DropdownMenuTriggerProps & { onClick?: () => void }) => (
  <button
    className={cn("focus:outline-none", className)}
    onClick={onClick}
    {...props}
  >
    {children}
  </button>
)

const DropdownMenuContent = ({ children, align = 'end', className, onClose, ...props }: DropdownMenuContentProps & { onClose?: () => void }) => (
  <div
    className={cn(
      "absolute top-full mt-2 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
      align === 'end' && 'right-0',
      align === 'start' && 'left-0',
      align === 'center' && 'left-1/2 -translate-x-1/2',
      className
    )}
    {...props}
  >
    {React.Children.map(children, (child) => {
      if (React.isValidElement(child) && child.type === DropdownMenuItem) {
        return React.cloneElement(child as React.ReactElement<any>, {
          onClose
        })
      }
      return child
    })}
  </div>
)

const DropdownMenuItem = ({ children, onClick, className, onClose, ...props }: DropdownMenuItemProps & { onClose?: () => void }) => (
  <button
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
      className
    )}
    onClick={() => {
      onClick?.()
      onClose?.()
    }}
    {...props}
  >
    {children}
  </button>
)

const DropdownMenuLabel = ({ children, className, ...props }: DropdownMenuLabelProps) => (
  <div
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  >
    {children}
  </div>
)

const DropdownMenuSeparator = ({ className, ...props }: DropdownMenuSeparatorProps) => (
  <div
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
)

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
}