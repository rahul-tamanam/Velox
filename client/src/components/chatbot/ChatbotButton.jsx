import { ChatBubbleLeftRightIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';

export default function ChatbotButton({ open, onOpenChange }) {
  return (
    <motion.button
      type="button"
      aria-label={open ? 'Close assistant' : 'Open assistant'}
      aria-expanded={open}
      onClick={() => onOpenChange(!open)}
      className="fixed bottom-6 right-4 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-gold)] text-[var(--bg-primary)] shadow-2xl shadow-[var(--accent-gold)]/30 sm:right-6"
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.span
        key={open ? 'x' : 'chat'}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-center"
      >
        {open ? <XMarkIcon className="h-7 w-7" /> : <ChatBubbleLeftRightIcon className="h-7 w-7" />}
      </motion.span>
    </motion.button>
  );
}
