import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className={`relative w-full bg-white rounded-lg shadow-xl animate-in zoom-in-95 duration-200 ${sizeClasses[size]}`} 
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between p-4 border-b">
            {title && <h3 className="text-lg font-semibold">{title}</h3>}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus:outline-none ml-auto">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="p-4 overflow-y-auto max-h-[calc(100vh-10rem)]">
          {children}
        </div>
        {footer && (
          <div className="flex items-center justify-end p-4 border-t gap-2 bg-gray-50 rounded-b-lg">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
