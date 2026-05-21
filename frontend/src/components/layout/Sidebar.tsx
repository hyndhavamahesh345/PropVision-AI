'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Building2,
  BarChart3,
  FileText,
  GitCompare,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Clock,
  User,
  Zap,
} from 'lucide-react';
import { cn, getStatusColor, getStatusLabel } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/properties', label: 'Properties', icon: Building2 },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/comparison', label: 'Comparison', icon: GitCompare },
  { href: '/upload', label: 'Reports', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const recentInspections = [
  { id: '1', name: 'Sunset Villa', status: 'completed', progress: 100 },
  { id: '2', name: 'Metro Apartment', status: 'running_yolo', progress: 42 },
  { id: '3', name: 'Harbor View', status: 'pending', progress: 0 },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex flex-col h-screen glass-dark border-r border-white/8 transition-all duration-300 ease-in-out relative',
        collapsed ? 'w-[68px]' : 'w-64',
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/8 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg flex-shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-heading font-bold text-sm gradient-text leading-tight">
              PropInspect
            </p>
            <p className="text-xs text-gray-500">AI Platform</p>
          </div>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#0f1629] border border-white/15 flex items-center justify-center text-gray-400 hover:text-white transition-all z-10 shadow-lg"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                active
                  ? 'text-indigo-300 bg-indigo-500/15 shadow-sm'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-white/5'
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-400 rounded-r-full" />
              )}
              <Icon
                className={cn(
                  'w-5 h-5 flex-shrink-0 transition-colors',
                  active
                    ? 'text-indigo-400'
                    : 'text-gray-500 group-hover:text-gray-300'
                )}
              />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}

        {/* Recent Inspections */}
        {!collapsed && (
          <div className="mt-6 pt-4 border-t border-white/8">
            <div className="flex items-center gap-2 px-3 mb-2">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Recent
              </p>
            </div>
            <div className="space-y-1">
              {recentInspections.map((insp) => (
                <Link
                  key={insp.id}
                  href={`/inspections/${insp.id}`}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 transition-all group"
                >
                  <div
                    className={cn(
                      'w-1.5 h-1.5 rounded-full flex-shrink-0',
                      insp.status === 'completed'
                        ? 'bg-emerald-400'
                        : insp.status === 'failed'
                        ? 'bg-red-400'
                        : insp.status === 'pending'
                        ? 'bg-gray-500'
                        : 'bg-amber-400 animate-pulse'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-300 truncate group-hover:text-white transition-colors">
                      {insp.name}
                    </p>
                    <p className={cn('text-[10px]', getStatusColor(insp.status))}>
                      {getStatusLabel(insp.status)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom User Section */}
      <div className="flex-shrink-0 border-t border-white/8 p-3">
        <div
          className={cn(
            'flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer',
            collapsed && 'justify-center'
          )}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">User</p>
              <p className="text-[10px] text-gray-500 truncate">
                user@propinspect.ai
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              className="text-gray-500 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-500/10"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
