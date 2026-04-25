"use client";

import { Cpu, HardDrive, Activity, Clock } from "lucide-react";

const stats = [
  {
    label: "算子总数",
    value: "24",
    icon: Activity,
    color: "text-cyber-glow",
  },
  {
    label: "已安装",
    value: "23",
    icon: HardDrive,
    color: "text-cyber-neon",
  },
  {
    label: "运行中",
    value: "3",
    icon: Cpu,
    color: "text-cyber-orange",
  },
  {
    label: "平均耗时",
    value: "1.2s",
    icon: Clock,
    color: "text-cyber-pink",
  },
];

export function StatsBar() {
  return (
    <div className="flex-shrink-0 border-t border-border bg-card/80 backdrop-blur-sm px-6 py-2.5">
      <div className="flex items-center gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-2">
            <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
            <span className="text-[10px] text-muted-foreground">
              {stat.label}
            </span>
            <span className={`text-xs font-mono font-medium ${stat.color}`}>
              {stat.value}
            </span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyber-neon animate-pulse" />
          <span className="text-[10px] text-muted-foreground">系统正常</span>
        </div>
      </div>
    </div>
  );
}
