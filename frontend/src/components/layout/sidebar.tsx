"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Settings,
  Play,
  History,
  FileText,
  Activity,
  Users,
  Database,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: string;
  count?: number;
}

function NavItem({ icon, label, href, badge, count }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
        "hover:bg-accent hover:text-accent-foreground",
        isActive && "bg-accent text-accent-foreground border-l-2 border-primary"
      )}
    >
      <div className="flex-shrink-0">{icon}</div>
      <span className="flex-1 text-sm font-medium">{label}</span>
      {badge && (
        <Badge variant="secondary" className="text-xs">
          {badge}
        </Badge>
      )}
      {count !== undefined && (
        <span className="text-xs text-muted-foreground">{count}</span>
      )}
    </Link>
  );
}

interface NavSectionProps {
  label: string;
  children: React.ReactNode;
}

function NavSection({ label, children }: NavSectionProps) {
  return (
    <div className="space-y-1">
      <h4 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        {label}
      </h4>
      {children}
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-border bg-card h-[calc(100vh-4rem)] fixed left-0 top-16 overflow-y-auto">
      <nav className="p-4 space-y-6">
        {/* Dashboard */}
        <NavItem
          icon={<LayoutDashboard className="h-5 w-5" />}
          label="Dashboard"
          href="/"
        />

        {/* Quick Actions */}
        <NavSection label="Quick Actions">
          <NavItem
            icon={<Settings className="h-5 w-5" />}
            label="Configure"
            href="/configure"
            badge="Azure"
          />
          <NavItem
            icon={<Play className="h-5 w-5" />}
            label="Execute"
            href="/execute"
          />
        </NavSection>

        {/* Management */}
        <NavSection label="Management">
          <NavItem
            icon={<History className="h-5 w-5" />}
            label="Session History"
            href="/history"
          />
          <NavItem
            icon={<FileText className="h-5 w-5" />}
            label="Artifacts"
            href="/artifacts"
          />
          <NavItem
            icon={<Activity className="h-5 w-5" />}
            label="Monitoring"
            href="/monitoring"
          />
        </NavSection>

        {/* Settings */}
        <NavSection label="Settings">
          <NavItem
            icon={<Users className="h-5 w-5" />}
            label="Team"
            href="/team"
          />
          <NavItem
            icon={<Database className="h-5 w-5" />}
            label="Templates"
            href="/templates"
          />
        </NavSection>

        {/* Help */}
        <div className="mt-auto pt-4 border-t space-y-1">
          <NavItem
            icon={<HelpCircle className="h-5 w-5" />}
            label="Documentation"
            href="/docs"
          />
          <NavItem
            icon={<MessageSquare className="h-5 w-5" />}
            label="Support"
            href="/support"
          />
        </div>
      </nav>
    </aside>
  );
}
