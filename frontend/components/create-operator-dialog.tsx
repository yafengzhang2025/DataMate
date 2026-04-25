"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Code2,
  Loader2,
  Copy,
  Check,
  ChevronRight,
  Zap,
  FileText,
  Settings2,
  Cpu,
  Brain,
  RefreshCw,
  Pencil,
  Play,
  Download,
  ChevronDown,
  MessageSquare,
  History,
  Trash2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CreateOperatorDialogProps {
  open: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  codeBlock?: {
    language: string;
    code: string;
  };
  operatorPreview?: {
    name: string;
    description: string;
    inputType: string;
    outputType: string;
    tags: string[];
    category: string;
  };
}

interface ConversationHistory {
  id: string;
  title: string;
  timestamp: Date;
  preview: string;
}

const suggestedPrompts = [
  { label: "文本去重算子", prompt: "帮我创建一个文本去重算子，能够对输入文本进行精确去重和模糊去重", icon: FileText },
  { label: "JSON 格式转换", prompt: "创建一个 JSON 格式转换算子，支持将 JSON 数据按照指定 schema 进行映射和转换", icon: Code2 },
  { label: "敏感信息脱敏", prompt: "帮我生成一个敏感信息脱敏算子，支持手机号、身份证号、邮箱等信息的自动识别和脱敏", icon: Settings2 },
  { label: "文本摘要提取", prompt: "创建一个文本摘要提取算子，使用 LLM 对长文本进行关键信息提取和摘要生成", icon: Brain },
  { label: "图像尺寸标准化", prompt: "创建一个图像处理算子，将输入图像统一调整为指定尺寸，支持多种填充和裁剪策略", icon: Cpu },
  { label: "数据质量校验", prompt: "帮我创建一个数据质量校验算子，检测数据中的空值、异常值和格式错误", icon: Zap },
];

const modelOptions = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", description: "最强大的代码生成能力" },
  { id: "claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic", description: "优秀的代码理解和生成" },
  { id: "qwen-2.5-72b", name: "Qwen 2.5 72B", provider: "阿里云", description: "中文场景优化" },
  { id: "deepseek-coder", name: "DeepSeek Coder", provider: "DeepSeek", description: "专注代码生成" },
];

// Demo conversation history
const demoConversations: ConversationHistory[] = [
  { id: "conv-1", title: "文本清洗算子", timestamp: new Date(Date.now() - 3600000), preview: "创建一个文本清洗算子..." },
  { id: "conv-2", title: "图像分类器", timestamp: new Date(Date.now() - 86400000), preview: "帮我设计一个图像分类算子..." },
];

// Simulated AI responses based on context
function getSimulatedResponse(userMessage: string) {
  const lowerMessage = userMessage.toLowerCase();
  
  let operatorName = "自定义处理算子";
  let description = "根据用户需求自动生成的数据处理算子";
  let inputType = "text";
  let outputType = "text";
  let category = "数据处理";
  let tags = ["自定义", "Python", "LOCAL CPU"];
  let code = "";

  if (lowerMessage.includes("去重")) {
    operatorName = "文本去重算子";
    description = "支持精确去重和模糊去重的文本处理算子";
    category = "数据清洗";
    tags = ["去重", "Python", "LOCAL CPU"];
    code = `from datamate.ops import BaseOperator, register_op
from typing import Dict, Any, List, Set
import hashlib
from difflib import SequenceMatcher

@register_op("text_deduplicator")
class TextDeduplicator(BaseOperator):
    """文本去重算子 - 支持精确去重和模糊去重"""
    
    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config)
        self.mode = config.get("mode", "exact")  # exact | fuzzy
        self.similarity_threshold = config.get("similarity_threshold", 0.85)
        self._seen_hashes: Set[str] = set()
        self._seen_texts: List[str] = []
    
    def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """处理输入数据，返回去重结果"""
        text = data.get("text", "")
        
        if self.mode == "exact":
            is_duplicate = self._exact_match(text)
        else:
            is_duplicate = self._fuzzy_match(text)
        
        return {
            "text": text,
            "is_duplicate": is_duplicate,
            "metadata": {
                "mode": self.mode,
                "total_seen": len(self._seen_hashes) if self.mode == "exact" else len(self._seen_texts),
            }
        }
    
    def _exact_match(self, text: str) -> bool:
        """精确匹配去重"""
        text_hash = hashlib.md5(text.encode()).hexdigest()
        if text_hash in self._seen_hashes:
            return True
        self._seen_hashes.add(text_hash)
        return False
    
    def _fuzzy_match(self, text: str) -> bool:
        """模糊匹配去重"""
        for seen_text in self._seen_texts:
            similarity = SequenceMatcher(None, text, seen_text).ratio()
            if similarity >= self.similarity_threshold:
                return True
        self._seen_texts.append(text)
        return False`;
  } else if (lowerMessage.includes("json") || lowerMessage.includes("格式转换")) {
    operatorName = "JSON 格式转换算子";
    description = "将 JSON 数据按照指定 schema 进行映射和转换";
    inputType = "json";
    outputType = "json";
    category = "数据转换";
    tags = ["JSON", "Schema", "LOCAL CPU"];
    code = `from datamate.ops import BaseOperator, register_op
from typing import Dict, Any
import json

@register_op("json_transformer")
class JsonTransformer(BaseOperator):
    """JSON 格式转换算子"""
    
    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config)
        self.schema_mapping = config.get("schema_mapping", {})
        self.default_values = config.get("default_values", {})
        self.drop_unmapped = config.get("drop_unmapped", False)
    
    def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """处理输入数据，按照 schema 进行转换"""
        input_data = data.get("data", {})
        
        result = {}
        for target_key, source_path in self.schema_mapping.items():
            value = self._get_nested_value(input_data, source_path)
            if value is not None:
                result[target_key] = value
            elif target_key in self.default_values:
                result[target_key] = self.default_values[target_key]
        
        if not self.drop_unmapped:
            for key, value in input_data.items():
                if key not in [p.split(".")[0] for p in self.schema_mapping.values()]:
                    result[key] = value
        
        return {"data": result, "transformed": True}
    
    def _get_nested_value(self, data: Dict, path: str) -> Any:
        """获取嵌套字段值"""
        keys = path.split(".")
        current = data
        for key in keys:
            if isinstance(current, dict) and key in current:
                current = current[key]
            else:
                return None
        return current`;
  } else if (lowerMessage.includes("脱敏") || lowerMessage.includes("敏感")) {
    operatorName = "敏感信息脱敏算子";
    description = "自动识别和脱敏手机号、身份证号、邮箱等敏感信息";
    category = "数据安全";
    tags = ["脱敏", "正则", "LOCAL CPU"];
    code = `from datamate.ops import BaseOperator, register_op
from typing import Dict, Any, List
import re

@register_op("sensitive_data_masker")
class SensitiveDataMasker(BaseOperator):
    """敏感信息脱敏算子"""
    
    PATTERNS = {
        "phone": (r"1[3-9]\\d{9}", lambda m: m[:3] + "****" + m[-4:]),
        "id_card": (r"\\d{17}[\\dXx]", lambda m: m[:6] + "********" + m[-4:]),
        "email": (r"[\\w.-]+@[\\w.-]+\\.\\w+", lambda m: m.split("@")[0][:2] + "***@" + m.split("@")[1]),
        "bank_card": (r"\\d{16,19}", lambda m: m[:4] + " **** **** " + m[-4:]),
    }
    
    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config)
        self.mask_types = config.get("mask_types", list(self.PATTERNS.keys()))
        self.replacement_char = config.get("replacement_char", "*")
    
    def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """处理输入数据，脱敏敏感信息"""
        text = data.get("text", "")
        masked_text = text
        masked_count = {}
        
        for mask_type in self.mask_types:
            if mask_type in self.PATTERNS:
                pattern, masker = self.PATTERNS[mask_type]
                matches = re.findall(pattern, text)
                masked_count[mask_type] = len(matches)
                masked_text = re.sub(pattern, lambda m: masker(m.group()), masked_text)
        
        return {
            "text": masked_text,
            "original_length": len(text),
            "masked_count": masked_count,
        }`;
  } else if (lowerMessage.includes("摘要") || lowerMessage.includes("llm")) {
    operatorName = "文本摘要提取算子";
    description = "使用 LLM 对长文本进行关键信息提取和摘要生成";
    category = "知识生成";
    tags = ["LLM", "摘要", "LOCAL GPU"];
    code = `from datamate.ops import BaseOperator, register_op
from typing import Dict, Any
import openai

@register_op("text_summarizer")
class TextSummarizer(BaseOperator):
    """文本摘要提取算子 - 使用 LLM 生成摘要"""
    
    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config)
        self.model = config.get("model", "gpt-4o-mini")
        self.max_length = config.get("max_length", 200)
        self.language = config.get("language", "zh")
        self.client = openai.OpenAI()
    
    def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """处理输入数据，生成文本摘要"""
        text = data.get("text", "")
        
        prompt = f"""请对以下文本生成一个不超过{self.max_length}字的摘要，
        使用{self.language}语言，保留关键信息：
        
        {text}
        """
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=self.max_length * 2,
            temperature=0.3,
        )
        
        summary = response.choices[0].message.content
        
        return {
            "original_text": text,
            "summary": summary,
            "original_length": len(text),
            "summary_length": len(summary),
            "compression_ratio": len(summary) / len(text) if text else 0,
        }`;
  } else {
    code = `from datamate.ops import BaseOperator, register_op
from typing import Dict, Any

@register_op("custom_processor")
class CustomProcessor(BaseOperator):
    """自定义数据处理算子"""
    
    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config)
        self.config = config or {}
    
    def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """处理输入数据"""
        text = data.get("text", "")
        
        # 核心处理逻辑
        result = self._transform(text)
        
        return {
            "text": result,
            "metadata": {
                "original_length": len(text),
                "processed_length": len(result),
            }
        }
    
    def _transform(self, text: str) -> str:
        """数据转换逻辑"""
        # TODO: 实现具体的转换逻辑
        return text.strip()
    
    def validate_input(self, data: Dict[str, Any]) -> bool:
        return "text" in data`;
  }

  return {
    responses: [
      {
        text: "好的，我来帮你创建这个自定义算子。让我先分析你的需求，然后生成对应的实现代码。",
      },
      {
        text: "根据你的描述，我设计了以下算子实现方案：",
        preview: { name: operatorName, description, inputType, outputType, tags, category },
        code: { language: "python", code },
      },
      {
        text: "算子代码已生成。你可以：\n- 点击「编辑代码」进行修改\n- 点击「测试运行」验证逻辑\n- 满意后点击「创建算子」添加到算子库\n\n有任何调整需求，随时告诉我！",
      },
    ],
  };
}

export function CreateOperatorDialog({ open, onClose }: CreateOperatorDialogProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "你好！我是算子生成助手。描述你想要创建的数据处理算子，我会帮你自动生成代码和配置。\n\n你可以描述：\n- 算子的功能和处理逻辑\n- 输入输出数据类型\n- 需要的配置参数\n- 特殊的处理要求",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [showModelSelect, setShowModelSelect] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<ConversationHistory[]>(demoConversations);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSend = async (text?: string) => {
    const content = text || input.trim();
    if (!content || isGenerating) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsGenerating(true);

    // Get context-aware responses
    const { responses } = getSimulatedResponse(content);
    
    for (let i = 0; i < responses.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 800));
      const r = responses[i];
      const msg: ChatMessage = {
        id: `assistant-${Date.now()}-${i}`,
        role: "assistant",
        content: r.text,
        timestamp: new Date(),
        codeBlock: r.code,
        operatorPreview: r.preview,
      };
      setMessages((prev) => [...prev, msg]);
    }
    setIsGenerating(false);
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewConversation = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "你好！我是算子生成助手。描述你想要创建的数据处理算子，我会帮你自动生成代码和配置。",
        timestamp: new Date(),
      },
    ]);
    setShowHistory(false);
  };

  const handleRegenerateCode = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    
    // 添加重新生成的消息
    const msg: ChatMessage = {
      id: `assistant-regen-${Date.now()}`,
      role: "assistant",
      content: "好的，我正在重新生成代码，这次会尝试不同的实现方式...",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, msg]);
    
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsGenerating(false);
  };

  const currentModel = modelOptions.find((m) => m.id === selectedModel);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-4xl h-[90vh] mx-4 rounded-xl border border-border bg-card shadow-2xl flex overflow-hidden">
        {/* Sidebar - History */}
        <div className={cn(
          "w-64 border-r border-border bg-muted/30 flex flex-col transition-all duration-200",
          showHistory ? "translate-x-0" : "-translate-x-full absolute"
        )}>
          <div className="p-4 border-b border-border">
            <button
              onClick={handleNewConversation}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              新建对话
            </button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground truncate">{conv.title}</span>
                    <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{conv.preview}</p>
                  <span className="text-[9px] text-muted-foreground/60">
                    {conv.timestamp.toLocaleDateString("zh-CN")}
                  </span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  showHistory ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <History className="h-4 w-4" />
              </button>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">AI 算子生成器</h2>
                <p className="text-[10px] text-muted-foreground">描述你的需求，自动生成自定义算子</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Model Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowModelSelect(!showModelSelect)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/50 hover:border-primary/30 transition-colors"
                >
                  <Brain className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs text-foreground">{currentModel?.name}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
                {showModelSelect && (
                  <div className="absolute right-0 top-full mt-1 w-64 py-1 rounded-lg border border-border bg-card shadow-lg z-10">
                    {modelOptions.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => { setSelectedModel(model.id); setShowModelSelect(false); }}
                        className={cn(
                          "w-full flex items-start gap-3 px-3 py-2 text-left hover:bg-muted transition-colors",
                          model.id === selectedModel && "bg-primary/5"
                        )}
                      >
                        <Brain className={cn("h-4 w-4 mt-0.5", model.id === selectedModel ? "text-primary" : "text-muted-foreground")} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-foreground">{model.name}</span>
                            <span className="text-[9px] text-muted-foreground">{model.provider}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">{model.description}</p>
                        </div>
                        {model.id === selectedModel && <Check className="h-3.5 w-3.5 text-primary ml-auto" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-5 py-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "")}>
                  {/* Avatar */}
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border",
                    msg.role === "assistant"
                      ? "bg-primary/10 border-primary/20"
                      : "bg-cyber-orange/10 border-cyber-orange/20"
                  )}>
                    {msg.role === "assistant" ? (
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <User className="h-3.5 w-3.5 text-cyber-orange" />
                    )}
                  </div>

                  {/* Content */}
                  <div className={cn("max-w-[85%] space-y-3", msg.role === "user" ? "items-end" : "")}>
                    <div className={cn(
                      "rounded-lg px-3.5 py-2.5 text-xs leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/60 text-foreground border border-border/60"
                    )}>
                      {msg.content.split("\n").map((line, i) => (
                        <p key={i} className={i > 0 ? "mt-1.5" : ""}>{line}</p>
                      ))}
                    </div>

                    {/* Operator Preview Card */}
                    {msg.operatorPreview && (
                      <div className="rounded-lg border border-primary/25 bg-primary/[0.03] p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <Zap className="h-4.5 w-4.5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="text-xs font-semibold text-foreground">{msg.operatorPreview.name}</h4>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-cyber-purple/10 text-cyber-purple border border-cyber-purple/15">
                                {msg.operatorPreview.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">{msg.operatorPreview.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/15">
                            {"输入: "}{msg.operatorPreview.inputType}
                          </span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          <span className="px-1.5 py-0.5 rounded bg-cyber-neon/10 text-cyber-neon border border-cyber-neon/15">
                            {"输出: "}{msg.operatorPreview.outputType}
                          </span>
                          <div className="ml-auto flex gap-1">
                            {msg.operatorPreview.tags.map((t) => (
                              <span key={t} className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/60">{t}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Code Block */}
                    {msg.codeBlock && (
                      <div className="rounded-lg border border-border overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 bg-[oklch(0.18_0.01_260)] border-b border-border/30">
                          <div className="flex items-center gap-2">
                            <Code2 className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground font-mono">{msg.codeBlock.language}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingCode(editingCode === msg.id ? null : msg.id)}
                              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 rounded hover:bg-muted/50"
                            >
                              <Pencil className="h-3 w-3" />
                              编辑
                            </button>
                            <button
                              onClick={handleRegenerateCode}
                              disabled={isGenerating}
                              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 rounded hover:bg-muted/50 disabled:opacity-50"
                            >
                              <RefreshCw className={cn("h-3 w-3", isGenerating && "animate-spin")} />
                              重新生成
                            </button>
                            <button
                              onClick={() => handleCopy(msg.codeBlock!.code, msg.id)}
                              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 rounded hover:bg-muted/50"
                            >
                              {copiedId === msg.id ? (
                                <><Check className="h-3 w-3 text-cyber-neon" /> 已复制</>
                              ) : (
                                <><Copy className="h-3 w-3" /> 复制</>
                              )}
                            </button>
                          </div>
                        </div>
                        <pre className="px-4 py-3 bg-[oklch(0.15_0.01_260)] overflow-x-auto max-h-[400px] overflow-y-auto">
                          <code className="text-[11px] leading-5 font-mono text-[oklch(0.85_0.005_260)]">
                            {msg.codeBlock.code}
                          </code>
                        </pre>
                        {/* Code Actions */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-[oklch(0.16_0.01_260)] border-t border-border/30">
                          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-medium text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors">
                            <Play className="h-3 w-3" />
                            测试运行
                          </button>
                          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] text-muted-foreground bg-muted/50 border border-border hover:border-primary/30 transition-colors">
                            <Download className="h-3 w-3" />
                            下载代码
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isGenerating && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="rounded-lg bg-muted/60 border border-border/60 px-3.5 py-2.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      {"正在使用 "}{currentModel?.name}{" 生成..."}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Suggested Prompts */}
          {messages.length <= 1 && (
            <div className="px-5 pb-3 flex-shrink-0">
              <p className="text-[10px] text-muted-foreground mb-2">快速开始</p>
              <div className="grid grid-cols-3 gap-2">
                {suggestedPrompts.map((sp) => (
                  <button
                    key={sp.label}
                    onClick={() => handleSend(sp.prompt)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-[11px] text-muted-foreground bg-muted/30 border border-border hover:border-primary/30 hover:text-primary transition-colors group"
                  >
                    <sp.icon className="h-4 w-4 flex-shrink-0 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                    <span className="truncate">{sp.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="flex-shrink-0 border-t border-border p-4">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="描述你想创建的算子，例如：帮我创建一个文本清洗算子..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-muted/50 border border-border text-xs text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 leading-relaxed"
                />
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isGenerating}
                  className={cn(
                    "p-2.5 rounded-lg transition-colors",
                    input.trim() && !isGenerating
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  <Send className="h-4 w-4" />
                </button>
                {messages.some((m) => m.operatorPreview) && (
                  <button
                    onClick={onClose}
                    className="px-3 py-2 rounded-lg bg-cyber-neon/10 text-cyber-neon text-[10px] font-medium border border-cyber-neon/25 hover:bg-cyber-neon/20 transition-colors whitespace-nowrap"
                  >
                    创建算子
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-[10px] text-muted-foreground/50">
                {"按 Enter 发送，Shift + Enter 换行"}
              </p>
              <p className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
                <Brain className="h-3 w-3" />
                {"使用 "}{currentModel?.name}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
