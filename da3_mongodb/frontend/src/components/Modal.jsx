import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
  }[size] || 'max-w-xl';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#17212B]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className={`bg-white rounded-xl shadow-xl border border-[#DCE4E1] w-full ${sizeClasses} max-h-[calc(100vh-32px)] flex flex-col overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#DCE4E1] bg-[#F5F7F6] shrink-0">
          <h3 className="text-sm sm:text-base font-bold text-[#17212B] truncate pr-2">{title}</h3>
          <button
            onClick={onClose}
            className="text-[#52616B] hover:text-[#17212B] hover:bg-[#EAEFEc] p-1.5 rounded-lg transition-colors shrink-0"
            title="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 min-h-0 overscroll-contain">{children}</div>
      </div>
    </div>
  );
}
