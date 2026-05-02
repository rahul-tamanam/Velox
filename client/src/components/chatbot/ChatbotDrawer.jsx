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

export default function ChatbotDrawer({ open, onClose, portfolioSummary, macroRegime, portfolioTickers }) {
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
          <motion.div
            className="fixed inset-0 z-40 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col border-l border-[var(--border)] bg-[var(--bg-secondary)] shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <div>
                <p className="font-display text-lg text-[var(--accent-gold)]">Velox Assistant</p>
                <p className="text-xs text-[var(--text-secondary)]">Powered by Groq (optional)</p>
              </div>
              <button type="button" onClick={onClose} className="text-sm text-[var(--text-secondary)]">
                Close
              </button>
            </div>
            <div className="flex flex-wrap gap-2 border-b border-[var(--border)] px-4 py-3">
              {CHIPS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="rounded-full bg-white/5 px-3 py-1 text-[11px] text-[var(--text-secondary)]"
                  onClick={() => send(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[90%] rounded-2xl px-4 py-2 leading-relaxed ${
                    m.role === 'user'
                      ? 'ml-auto bg-[var(--accent-gold)]/15 text-[var(--text-primary)]'
                      : 'bg-[var(--bg-card)] text-[var(--text-primary)]'
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
                            className="font-medium text-[var(--accent-gold)] underline underline-offset-2"
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
                </div>
              ))}
              {loading && <p className="text-xs text-[var(--text-secondary)]">Thinking…</p>}
            </div>
            <div className="border-t border-[var(--border)] p-4">
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm"
                  placeholder="Ask Velox…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send(input)}
                />
                <button
                  type="button"
                  onClick={() => send(input)}
                  className="rounded-xl bg-[var(--accent-gold)] px-4 py-2 text-sm font-semibold text-[var(--bg-primary)]"
                >
                  Send
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
