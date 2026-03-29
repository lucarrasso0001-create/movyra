import { AnimatePresence, motion } from "framer-motion";

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoKey: string | null;
  title: string;
}

const TrailerModal = ({ isOpen, onClose, videoKey, title }: TrailerModalProps) => {
  if (!isOpen || !videoKey) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="w-full max-w-4xl aspect-video" onClick={(e) => e.stopPropagation()}>
          <iframe
            src={`https://www.youtube.com/embed/${videoKey}?autoplay=1`}
            title={title}
            className="w-full h-full rounded-xl"
            allowFullScreen
            allow="autoplay"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TrailerModal;
