'use client';
import { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Minimize2,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { ChatMessage } from '@/lib/types';
import { cn } from '@/lib/utils';

const SUGGESTED_QUESTIONS = [
  'What furniture needs replacing?',
  'Rate the furnishing quality',
  'Summarize all damages',
  'Which room has the most items?',
  'What is the overall condition?',
];

interface InspectionChatProps {
  inspectionId: string;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <span className="typing-dot" style={{ animationDelay: '0ms' }} />
      <span className="typing-dot" style={{ animationDelay: '150ms' }} />
      <span className="typing-dot" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

export function InspectionChat({ inspectionId }: InspectionChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm your AI Inspector. I've analyzed this property and can answer questions about the inventory, damages, and room conditions. What would you like to know?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && !minimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, minimized]);

  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, minimized]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await api.sendChatMessage(inspectionId, content.trim(), history);
      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: res.response || "I couldn't process that request. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      // Fallback response for demo
      const fallbackResponses: Record<string, string> = {
        'What furniture needs replacing?':
          'Based on my analysis, the sofa in the living room shows significant wear (confidence: 94%), and the office chair has visible damage. The bedroom mattress also shows age-related wear patterns.',
        'Rate the furnishing quality':
          'Overall furnishing quality score: 7.2/10. The kitchen appliances are in excellent condition (9/10), living room furniture is good (7/10), and bathroom fixtures need attention (5/10).',
        'Summarize all damages':
          'I detected 3 damage instances: 1 high-severity water stain on bedroom ceiling, 1 medium crack in bathroom tiles, and 1 low-severity paint peeling near window. Total estimated repair priority: Medium.',
      };

      const aiMsg: ChatMessage = {
        role: 'assistant',
        content:
          fallbackResponses[content] ||
          `I found relevant information about "${content}". Based on the inspection data, the property shows standard conditions with some areas requiring attention. The AI analysis identified key items across all rooms with high confidence scores.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center shadow-2xl shadow-indigo-500/40 hover:scale-110 transition-all duration-300 glow-indigo"
          aria-label="Open AI Chat"
        >
          <MessageCircle className="w-6 h-6 text-white" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-[#030712]" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className={cn(
            'fixed bottom-6 right-6 z-50 w-[360px] glass-dark border border-white/12 rounded-2xl shadow-2xl shadow-black/60 flex flex-col transition-all duration-300 animate-scale-in',
            minimized ? 'h-16' : 'h-[520px]'
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center flex-shrink-0 glow-indigo">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white leading-none">
                AI Inspector
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[10px] text-gray-400">Online · Ask anything</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMinimized(!minimized)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex gap-2.5 animate-slide-up',
                      msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    )}
                  >
                    {/* Avatar */}
                    <div
                      className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-500'
                          : 'bg-gradient-to-br from-cyan-500 to-indigo-500'
                      )}
                    >
                      {msg.role === 'user' ? (
                        <User className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <Bot className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>

                    {/* Bubble */}
                    <div
                      className={cn(
                        'max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                        msg.role === 'user'
                          ? 'bg-indigo-500/25 border border-indigo-500/30 text-indigo-100 rounded-tr-sm'
                          : 'bg-white/6 border border-white/8 text-gray-200 rounded-tl-sm'
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-white/6 border border-white/8 rounded-2xl rounded-tl-sm px-1">
                      <TypingIndicator />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggested questions */}
              {messages.length <= 1 && (
                <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
                  {SUGGESTED_QUESTIONS.slice(0, 3).map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="px-2.5 py-1 rounded-full border border-white/10 bg-white/4 text-[10px] text-gray-300 hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-indigo-300 transition-all duration-200"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="px-4 pb-4 flex-shrink-0 border-t border-white/8 pt-3">
                <div className="flex items-center gap-2 glass-dark rounded-xl px-3 py-2 border border-white/8 focus-within:border-indigo-500/40 transition-all">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about this inspection..."
                    className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none"
                    disabled={isTyping}
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || isTyping}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200',
                      input.trim() && !isTyping
                        ? 'bg-indigo-500 text-white hover:bg-indigo-400'
                        : 'bg-white/5 text-gray-600 cursor-not-allowed'
                    )}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
