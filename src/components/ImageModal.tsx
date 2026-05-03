type ImageModalProps = {
  imageUrl: string;
  title: string;
  onClose: () => void;
};

export const ImageModal = ({ imageUrl, title, onClose }: ImageModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/80 p-4" role="dialog" aria-modal="true">
    <div className="relative w-full max-w-4xl overflow-hidden rounded-[1.75rem] bg-white shadow-card">
      <button
        className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-ink-900"
        onClick={onClose}
        type="button"
      >
        Close
      </button>
      <img className="max-h-[80vh] w-full object-cover" src={imageUrl} alt={title} />
    </div>
  </div>
);
