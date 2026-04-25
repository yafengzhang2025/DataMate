"use client";

import {
  Workflow,
  Database,
  Settings,
  Bell,
  Zap,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type PageView = "workflows" | "operators" | "datasets" | "knowledge";

const navItems: { label: string; icon: React.ElementType; page: PageView }[] = [
  { label: "工作流", icon: Workflow, page: "workflows" },
  { label: "算子市场", icon: Zap, page: "operators" },
  { label: "数据集", icon: Database, page: "datasets" },
  { label: "知识库", icon: BookOpen, page: "knowledge" },
];

interface TopNavProps {
  activePage: PageView;
  onPageChange: (page: PageView) => void;
}

export function TopNav({ activePage, onPageChange }: TopNavProps) {
  return (
    <header className="h-12 flex-shrink-0 border-b border-border bg-card backdrop-blur-md flex items-center px-4 gap-6">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mr-4">
        <div className="relative flex items-center justify-center w-8 h-8">
          {/* Gradient background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-cyber-purple/20 to-cyber-neon/15 rounded-lg blur-sm" />
          {/* Logo container */}
          <div className="relative w-full h-full rounded-lg bg-gradient-to-br from-primary/10 to-cyber-purple/10 border border-primary/25 flex items-center justify-center overflow-hidden">
            {/* Abstract data flow lines */}
            <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none">
              {/* Central node */}
              <circle cx="16" cy="16" r="3" className="fill-primary" />
              {/* Data flow paths */}
              <path d="M8 8 L13 13" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M24 8 L19 13" className="stroke-cyber-purple" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M8 24 L13 19" className="stroke-cyber-neon" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M24 24 L19 19" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" />
              {/* Outer nodes */}
              <circle cx="6" cy="6" r="2" className="fill-primary/60" />
              <circle cx="26" cy="6" r="2" className="fill-cyber-purple/60" />
              <circle cx="6" cy="26" r="2" className="fill-cyber-neon/60" />
              <circle cx="26" cy="26" r="2" className="fill-primary/60" />
            </svg>
          </div>
        </div>
        <span className="text-sm font-bold tracking-tight text-foreground">
          DataMate
        </span>
      </div>

      {/* Nav Items */}
      <nav className="flex items-center gap-1" role="navigation" aria-label="主导航">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => onPageChange(item.page)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              activePage === item.page
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        <button className="relative p-2 text-muted-foreground hover:text-foreground rounded-md transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
          <span className="sr-only">通知</span>
        </button>
        <button className="p-2 text-muted-foreground hover:text-foreground rounded-md transition-colors">
          <Settings className="h-4 w-4" />
          <span className="sr-only">设置</span>
        </button>
        <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center">
          <span className="text-[10px] font-bold text-primary">DM</span>
        </div>
      </div>
    </header>
  );
}
