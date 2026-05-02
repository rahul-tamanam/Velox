import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../../utils/api';

const CHIPS = [
  'Explain my health score',
  'What is the current macro regime?',
  'Should I rebalance?',
  'Latest news on my holdings',
  'Current price of NVIDIA shares',
  'What is a mutual fund?',
];

const panelTransition = {
  type: 'spring',
  stiffness: 420,
  damping: 34,
  mass: 0.72,
};

export default function ChatbotDrawer({ open, onOpenChange, portfolioSummary, macroRegime, portfolioTickers }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! Ask me anything about your Velox portfolio — plain English only.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMessages([
      { role: 'assistant', content: 'Hi! Ask me anything about your Velox portfolio — plain English only.' },
    ]);
  }, [open]);

  async function send(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const next = [...messages, { role: 'user', content: trimmed }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const { data } = await api.post('/chatbot/message', {
        messages: next.map((m) => ({ role: m.role, content: m.content })),
        portfolioContext: portfolioSummary,
        macroRegime,
        portfolioTickers: portfolioTickers || [],
      });
      setMessages([...next, { role: 'assistant', content: data.reply }]);
    } catch (e) {
      setMessages([
        ...next,
        {
          role: 'assistant',
          content:
            e.response?.data?.reply ||
            'Assistant unavailable — please verify GROQ_API_KEY in server .env.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            key="chatbot-backdrop"
            type="button"
            aria-label="Dismiss assistant"
            className="fixed inset-0 z-[90] cursor-default bg-black/35 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            key="chatbot-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="velox-assistant-title"
            className="fixed bottom-24 right-4 z-[100] flex max-h-[min(72vh,540px)] w-[min(calc(100vw-2rem),400px)] flex-col overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] sm:right-6"
            initial={{ opacity: 0, y: 28, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.94 }}
            transition={panelTransition}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-4 py-3 sm:px-5 sm:py-4"
              style={{
                background:
                  'linear-gradient(180deg, rgba(254,101,7,0.22) 0%, rgba(254,101,7,0.10) 42%, rgba(17,17,17,0.94) 100%)',
              }}
            >
              <div className="min-w-0 pr-2">
                <p id="velox-assistant-title" className="font-display text-lg text-[var(--text-primary)]">
                  Velox Assistant
                </p>
                <p className="text-xs text-[#FFD2B2]">Powered by Groq</p>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-white/5 hover:text-[var(--text-primary)]"
              >
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3 text-sm sm:px-4 sm:py-4">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className={`max-w-[90%] rounded-[12px] border px-4 py-2 leading-relaxed ${
                    m.role === 'user'
                      ? 'ml-auto border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)]'
                  }`}
                >
                  {m.role === 'assistant' ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ ...props }) => (
                          <a
                            {...props}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-[var(--text-secondary)] underline underline-offset-2 hover:text-[var(--text-primary)]"
                          />
                        ),
                        strong: ({ ...props }) => <strong className="text-[var(--text-primary)]" {...props} />,
                        ul: ({ ...props }) => <ul className="mb-2 list-disc space-y-1 pl-4 last:mb-0" {...props} />,
                        ol: ({ ...props }) => <ol className="mb-2 list-decimal space-y-1 pl-4 last:mb-0" {...props} />,
                        p: ({ ...props }) => (
                          <p className="mb-2 text-[var(--text-primary)]/95 last:mb-0" {...props} />
                        ),
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  ) : (
                    m.content
                  )}
                </motion.div>
              ))}
              {!messages.some((m) => m.role === 'user') && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {CHIPS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="rounded-lg border border-[var(--border)] bg-transparent px-3 py-1 text-[11px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
                      onClick={() => send(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
              {loading && <p className="text-xs text-[var(--text-secondary)]">Thinking…</p>}
            </div>
            <div className="shrink-0 border-t border-[var(--border)] p-3 sm:p-4">
              <div className="flex gap-2">
                <input
                  className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  placeholder="Ask Velox…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send(input)}
                />
                <button
                  type="button"
                  onClick={() => send(input)}
                  className="shrink-0 rounded-lg border border-[#FE6507] bg-[#FE6507] px-3 py-2 text-sm font-medium text-[#F0F0F0] transition-colors hover:bg-[#ea580c] hover:border-[#ea580c]"
                >
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
