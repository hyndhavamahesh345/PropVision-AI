'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';
import {
  Building2,
  Bell,
  Menu,
  X,
  Plus,
  BarChart3,
  Home,
  FileText,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/properties', label: 'Properties', icon: Building2 },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/comparison', label: 'Compare', icon: FileText },
];

export function Navbar() {
  const pathname = usePathname();
  const { user } = useUser();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifCount] = useState(3);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-[#030712]/90 backdrop-blur-xl border-b border-white/8 shadow-2xl shadow-black/40'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg glow-indigo">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="font-heading font-bold text-lg gradient-text">
                  PropInspect
                </span>
                <span className="text-gray-400 text-sm ml-1">AI</span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      active
                        ? 'text-indigo-300 bg-indigo-500/10'
                        : 'text-gray-400 hover:text-gray-100 hover:bg-white/5'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                    {active && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-indigo-400 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <button
                className="relative p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-white/5 transition-all duration-200"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {notifCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {notifCount}
                  </span>
                )}
              </button>

              {/* New Inspection CTA */}
              <Link
                href="/upload"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-cyan-500 text-white transition-all duration-300 shadow-lg shadow-indigo-500/25"
              >
                <Plus className="w-4 h-4" />
                New Inspection
              </Link>

              {/* User Button from Clerk */}
              <div className="flex items-center">
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8",
                      userButtonPopoverCard: "bg-gray-900 border border-white/10",
                      userButtonPopoverActionButton: "hover:bg-white/5",
                    },
                  }}
                />
              </div>

              {/* Mobile Hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-white/5 transition-all"
              >
                {mobileOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden glass-dark border-t border-white/8 animate-slide-up">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                      active
                        ? 'text-indigo-300 bg-indigo-500/10'
                        : 'text-gray-400 hover:text-gray-100 hover:bg-white/5'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </Link>
                );
              })}
              <Link
                href="/upload"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 w-full px-4 py-3 rounded-lg text-sm font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 text-white mt-2"
              >
                <Plus className="w-4 h-4" />
                New Inspection
              </Link>
            </div>
          </div>
        )}
      </nav>

    </>
  );
}
