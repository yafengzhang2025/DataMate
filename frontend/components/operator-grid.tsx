"use client";

import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, Sparkles, Plus, Upload, Puzzle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OperatorCard } from "@/components/operator-card";
import { cn } from "@/lib/utils";
import { type OperatorCategory, type Operator } from "@/lib/operators";
import { useOperators } from "@/hooks/use-operators";
import { adaptOperator, adaptCategories } from "@/lib/adapters";

type FilterTab = "all" | "installed" | "custom";

interface OperatorGridProps {
  selectedCategory: OperatorCategory | "all";
  onOperatorClick?: (operator: Operator) => void;
  onCreateCustom?: () => void;
  onUploadCustom?: () => void;
}

export function OperatorGrid({ selectedCategory, onOperatorClick, onCreateCustom, onUploadCustom }: OperatorGridProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [sortBy, setSortBy] = useState<"all" | OperatorCategory>("all");

  const { operators: rawOperators, categories: rawCategories, loading, error } = useOperators();
  const operators = useMemo(() => rawOperators.map(adaptOperator), [rawOperators]);
  const categories = useMemo(() => adaptCategories(rawCategories, operators), [rawCategories, operators]);

  const filteredOperators = useMemo(() => {
    let result = operators;

    // Filter by category from sidebar
    if (selectedCategory !== "all") {
      result = result.filter((op) => op.category === selectedCategory);
    }

    // Filter by sort dropdown
    if (sortBy !== "all") {
      result = result.filter((op) => op.category === sortBy);
    }

    // Filter by tab
    if (activeTab === "installed") {
      result = result.filter((op) => op.installed);
    } else if (activeTab === "custom") {
      result = []; // No custom operators yet
    }

    // Filter by search
    if (search) {
      result = result.filter(
        (op) =>
          op.name.includes(search) ||
          op.description.includes(search) ||
          op.tags.some((tag) => tag.includes(search))
      );
    }

    return result;
  }, [selectedCategory, sortBy, activeTab, search]);

  const tabs: { id: FilterTab; label: string }[] = [
    { id: "all", label: "全部算子" },
    { id: "installed", label: "已安装" },
    { id: "custom", label: "自定义" },
  ];

  const currentCategoryLabel =
    selectedCategory === "all"
      ? "算子市场"
      : categories.find((c) => c.id === selectedCategory)?.label || "算子市场";

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border bg-card/60 backdrop-blur-sm">
        <div className="px-6 pt-5 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-semibold text-foreground tracking-tight">
                {currentCategoryLabel}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {loading ? "加载中..." : error ? `加载失败: ${error}` : "浏览和安装用于构建工作流的高级算子"}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative pb-3 text-xs font-medium transition-colors",
                  activeTab === tab.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Search bar */}
      <div className="flex-shrink-0 px-6 py-3 flex items-center gap-3 border-b border-border/60">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="搜索算子名称或描述..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-muted/50 border-border focus-visible:ring-primary/30 text-xs placeholder:text-muted-foreground/60"
          />
        </div>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "all" | OperatorCategory)
            }
            className="appearance-none h-9 pl-8 pr-8 text-xs bg-muted/50 border border-border rounded-md text-foreground focus:ring-1 focus:ring-primary/30 focus:border-primary/30 outline-none cursor-pointer"
          >
            <option value="all">全部算子</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
          <SlidersHorizontal className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Grid */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {activeTab === "custom" ? (
            // Custom operators tab content
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-cyber-purple/10 border border-cyber-purple/20 flex items-center justify-center mx-auto mb-4">
                  <Puzzle className="h-7 w-7 text-cyber-purple" />
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-2">自定义算子</h2>
                <p className="text-sm text-muted-foreground">
                  创建专属于您的算子，扩展平台能力
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* AI Generate Card */}
                <button
                  onClick={onCreateCustom}
                  className="group relative flex flex-col items-start p-6 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">AI 生成算子</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    通过自然语言描述，让 AI 自动生成符合您需求的自定义算子代码
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                    开始创建
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                </button>

                {/* Upload Card */}
                <button
                  onClick={onUploadCustom}
                  className="group relative flex flex-col items-start p-6 rounded-xl border-2 border-dashed border-border hover:border-foreground/30 bg-muted/30 hover:bg-muted/50 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">上传算子</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    上传您已开发的算子代码包，支持 Python、JavaScript 等多种语言
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground group-hover:text-foreground">
                    选择文件
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                </button>
              </div>

              {/* Empty custom operators list */}
              <div className="mt-8 pt-8 border-t border-border">
                <h3 className="text-sm font-medium text-foreground mb-4">我的自定义算子</h3>
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed border-border rounded-lg bg-muted/20">
                  <Puzzle className="h-8 w-8 mb-3 opacity-30" />
                  <p className="text-sm">暂无自定义算子</p>
                  <p className="text-xs mt-1 opacity-60">
                    使用上方功能创建您的第一个自定义算子
                  </p>
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-8 w-8 mb-3 opacity-50 animate-spin" />
              <p className="text-sm">加载算子中...</p>
            </div>
          ) : filteredOperators.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredOperators.map((op) => (
                  <div key={op.id} onClick={() => onOperatorClick?.(op)} className="cursor-pointer">
                    <OperatorCard operator={op} />
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center text-xs text-muted-foreground">
                共找到{" "}
                <span className="text-primary font-mono">
                  {filteredOperators.length}
                </span>
                {" "}个算子
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Search className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">未找到匹配的算子</p>
              <p className="text-xs mt-1 opacity-60">
                尝试调整搜索条件或筛选器
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
