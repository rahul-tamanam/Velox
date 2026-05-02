import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';

export default function ChatbotButton({ onClick }) {
  return (
    <motion.button
      type="button"
      aria-label="Open assistant"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-gold)] text-[var(--bg-primary)] shadow-2xl shadow-[var(--accent-gold)]/30"
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
    >
      <ChatBubbleLeftRightIcon className="h-7 w-7" />
    </motion.button>
  );
}
