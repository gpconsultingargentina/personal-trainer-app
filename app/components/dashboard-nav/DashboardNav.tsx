'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/classes', label: 'Clases' },
  { href: '/dashboard/payments', label: 'Pagos' },
  { href: '/dashboard/students', label: 'Alumnos' },
  { href: '/dashboard/reports', label: 'Reportes' },
]

export default function DashboardNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="bg-surface shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Image
                src="/logo.png"
                alt="Otakufiit"
                width={40}
                height={40}
                className="rounded"
              />
            </div>
            {/* Desktop nav */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive(item.href)
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted hover:border-border hover:text-foreground'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            {/* Desktop logout */}
            <form action={logout} className="hidden sm:block">
              <button
                type="submit"
                className="text-muted hover:text-foreground px-3 py-3 rounded text-sm font-medium"
              >
                Cerrar Sesion
              </button>
            </form>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="sm:hidden inline-flex items-center justify-center p-2 rounded text-muted hover:text-foreground hover:bg-surface-alt"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Abrir menu</span>
              {isOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive(item.href)
                    ? 'bg-surface-alt border-primary text-primary'
                    : 'border-transparent text-muted hover:bg-surface-alt hover:border-border hover:text-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <form action={logout} className="border-t border-border pt-2">
              <button
                type="submit"
                className="block w-full text-left pl-3 pr-4 py-3 border-l-4 border-transparent text-base font-medium text-muted hover:bg-surface-alt hover:border-border hover:text-foreground"
              >
                Cerrar Sesion
              </button>
            </form>
          </div>
        </div>
      )}
    </nav>
  )
}
