import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Notification({ notification, onClose }) {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onClose();
    }, 6000);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  if (!notification) return null;

  const { type = 'info', message, title } = notification;

  const styles = {
    success: {
      bar: 'border-l-4 border-l-[#15803D]',
      icon: <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />,
    },
    error: {
      bar: 'border-l-4 border-l-[#B91C1C]',
      icon: <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0 mt-0.5" />,
    },
    info: {
      bar: 'border-l-4 border-l-[#0F766E]',
      icon: <Info className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />,
    },
  }[type] || {
    bar: 'border-l-4 border-l-[#52616B]',
    icon: <Info className="w-4 h-4 text-[#52616B] shrink-0 mt-0.5" />,
  };

  return (
    <div className="fixed top-4 right-4 sm:top-5 sm:right-5 z-50 max-w-[calc(100vw-32px)] sm:max-w-sm w-full animate-in fade-in slide-in-from-top-4 duration-200">
      <div className={`bg-white rounded-lg border border-[#DCE4E1] shadow-lg p-3.5 flex items-start gap-3 ${styles.bar}`}>
        {styles.icon}
        <div className="flex-1 min-w-0 pr-1">
          {title && <h4 className="font-bold text-xs text-[#17212B] leading-tight break-words">{title}</h4>}
          <p className="text-xs text-[#52616B] font-medium mt-0.5 break-words leading-relaxed">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-[#52616B] hover:text-[#17212B] p-1 rounded transition-colors shrink-0"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
