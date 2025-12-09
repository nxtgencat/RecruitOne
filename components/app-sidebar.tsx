'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Briefcase, Users, Building2, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AppSidebar() {
    const pathname = usePathname()

    const navItems = [
        { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/companies', icon: Building2, label: 'Companies' },
        { href: '/jobs', icon: Briefcase, label: 'Jobs' },
        { href: '/candidates', icon: Users, label: 'Candidates' },
    ]

    return (
        <aside className="w-64 h-screen sticky top-0 flex flex-col bg-gradient-to-b from-purple-100 via-violet-50 to-cyan-50 border-r border-purple-200">
            {/* Logo Section */}
            <div className="p-6 pb-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-cyan-500 bg-clip-text text-transparent">
                    Recuritone
                </h1>
                <p className="text-xs text-purple-400 mt-1">Recruitment Platform</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1">
                {navItems.map((item) => {
                    const isActive = item.href === '/'
                        ? pathname === '/'
                        : pathname.startsWith(item.href)

                    return (
                        <Link key={item.href} href={item.href}>
                            <div
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                                    isActive
                                        ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-md"
                                        : "text-purple-700 hover:bg-purple-100"
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </div>
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom accent */}
            <div className="p-4">
                <div className="h-1 rounded-full bg-gradient-to-r from-purple-400 to-cyan-400" />
            </div>
        </aside>
    )
}
