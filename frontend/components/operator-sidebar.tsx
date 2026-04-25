"use client";

import { useState } from "react";
import {
  FileText,
  Image,
  Headphones,
  Video,
  LayoutGrid,
  Download,
  Tags,
  ScanSearch,
  TextSearch,
  ScanEye,
  AudioLines,
  Film,
  Merge,
  ShieldCheck,
  Combine,
  RadioTower,
  WandSparkles,
  Volume2,
  PenTool,
  Lightbulb,
  MessageSquare,
  FileVideo,
  BookOpen,
  Brush,
  ChevronRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  Tag,
  Scan,
  Layers,
  Sparkles,
  Brain,
  ImagePlus,
  Search,
  Upload,
  Puzzle,
  Plus,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { type OperatorCategory } from "@/lib/operators";
import { useOperators } from "@/hooks/use-operators";
import { adaptOperator, adaptCategories } from "@/lib/adapters";

const iconMap: Record<string, React.ElementType> = {
  FileText,
  Image,
  Headphones,
  Video,
  LayoutGrid,
  Download,
  Tags,
  ScanSearch,
  TextSearch,
  ScanEye,
  AudioLines,
  Film,
  Merge,
  ShieldCheck,
  Combine,
  RadioTower,
  WandSparkles,
  Volume2,
  PenTool,
  Lightbulb,
  MessageSquare,
  FileVideo,
  BookOpen,
  Brush,
  ArrowDownToLine,
  ArrowUpFromLine,
  Tag,
  Scan,
  Layers,
  Sparkles,
  Brain,
  ImagePlus,
};

interface OperatorSidebarProps {
  selectedCategory: OperatorCategory | "all";
  onCategoryChange: (category: string | "all") => void;
}

export function OperatorSidebar({
  selectedCategory,
  onCategoryChange,
}: OperatorSidebarProps) {
  const { operators: rawOperators, categories: rawCategories } = useOperators();
  const operators = rawOperators.map(adaptOperator);
  const categories = adaptCategories(rawCategories, operators);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [sidebarSearch, setSidebarSearch] = useState("");

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const filteredCategories = categories.filter((cat) => {
    if (!sidebarSearch) return true;
    const categoryOps = operators.filter((op) => op.category === cat.id);
    return (
      cat.label.includes(sidebarSearch) ||
      categoryOps.some((op) => op.name.includes(sidebarSearch))
    );
  });

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border bg-sidebar flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground tracking-wide mb-3">
          算子库
        </h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="搜索算子..."
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            className="h-8 pl-8 text-xs bg-muted/50 border-border focus-visible:ring-primary/30 placeholder:text-muted-foreground/60"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <nav className="p-2" role="navigation" aria-label="算子分类">
          <button
            onClick={() => onCategoryChange("all")}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-colors mb-1",
              selectedCategory === "all"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>全部算子</span>
            <span className="ml-auto text-[10px] tabular-nums opacity-60">
              {operators.length}
            </span>
          </button>

          {filteredCategories.map((category) => {
            const CategoryIcon = iconMap[category.icon];
            const isExpanded = expandedCategories.has(category.id);
            const categoryOps = operators.filter(
              (op) => op.category === category.id
            );
            const filteredOps = sidebarSearch
              ? categoryOps.filter((op) => op.name.includes(sidebarSearch))
              : categoryOps;

            return (
              <div key={category.id} className="mb-0.5">
                <button
                  onClick={() => {
                    toggleCategory(category.id);
                    onCategoryChange(category.id);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-colors",
                    selectedCategory === category.id
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <ChevronRight
                    className={cn(
                      "h-3 w-3 transition-transform",
                      isExpanded && "rotate-90"
                    )}
                  />
                  {CategoryIcon && <CategoryIcon className="h-3.5 w-3.5" />}
                  <span>{category.label}</span>
                  <span className="ml-auto text-[10px] tabular-nums opacity-60">
                    {category.count}
                  </span>
                </button>
                {isExpanded && (
                  <div className="ml-4 pl-3 border-l border-border">
                    {filteredOps.map((op) => {
                      const OpIcon = iconMap[op.icon];
                      return (
                        <button
                          key={op.id}
                          onClick={() => onCategoryChange(category.id)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-[11px] text-muted-foreground hover:text-foreground rounded transition-colors"
                        >
                          {OpIcon && (
                            <OpIcon className={cn("h-3 w-3", op.iconColor)} />
                          )}
                          <span className="truncate">{op.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          </nav>
      </ScrollArea>
    </aside>
  );
}
