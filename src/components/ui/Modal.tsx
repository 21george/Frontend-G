'use client';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useCallback, useRef, useId } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

/** Track how many Modal instances currently have open === true so body
 *  overflow is only locked/unlocked when the count transitions 0↔1. */
let openModalCount = 0

/** Stack of onClose callbacks for open modals, ordered bottom → top.
 *  Only the topmost modal should respond to Escape. */
const modalStack: (() => void)[] = []

/** Global keydown handler — only fires for the topmost modal. */
function handleGlobalEscape(e: KeyboardEvent) {
  if (e.key === 'Escape' && modalStack.length > 0) {
    const topOnClose = modalStack[modalStack.length - 1];
    topOnClose();
  }
}

export function Modal({ open, onClose, title, children, size = 'md' }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const isOnStackRef = useRef(false);

  /** Keep focus trapped inside the panel when Tab / Shift+Tab is pressed. */
  const handleTabTrap = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !panelRef.current) return;

    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (open) {
      // Save the element that had focus before the modal opened
      previouslyFocusedRef.current = document.activeElement as HTMLElement;

      // Push this modal onto the stack
      modalStack.push(onClose);
      isOnStackRef.current = true;

      // Register global escape listener only once (when first modal opens)
      if (modalStack.length === 1) {
        document.addEventListener('keydown', handleGlobalEscape);
      }
      document.addEventListener('keydown', handleTabTrap);

      openModalCount++;
      if (openModalCount === 1) {
        document.body.style.overflow = 'hidden';
      }

      // Move focus into the modal — prefer the close button, else first focusable
      requestAnimationFrame(() => {
        const closeBtn = panelRef.current?.querySelector<HTMLButtonElement>('button[aria-label="Close"]');
        if (closeBtn) {
          closeBtn.focus();
        } else {
          const first = panelRef.current?.querySelector<HTMLElement>(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
          );
          first?.focus();
        }
      });
    }

    return () => {
      if (open) {
        // Pop this modal from the stack
        if (isOnStackRef.current) {
          const idx = modalStack.lastIndexOf(onClose);
          if (idx !== -1) modalStack.splice(idx, 1);
          isOnStackRef.current = false;
        }

        // Remove global escape listener when stack is empty
        if (modalStack.length === 0) {
          document.removeEventListener('keydown', handleGlobalEscape);
        }
        document.removeEventListener('keydown', handleTabTrap);

        openModalCount--;
        if (openModalCount === 0) {
          document.body.style.overflow = '';
        }
        // Restore focus to the element that was focused before the modal opened
        previouslyFocusedRef.current?.focus();
        previouslyFocusedRef.current = null;
      }
    };
  }, [open, onClose, handleTabTrap]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          'relative w-full animate-scale-in',
          'bg-[var(--bg-card)] border border-[var(--border)]  dark:-elevated',
          sizes[size]
        )}
      >
        {/* Close button — always visible, positioned absolutely in top-right */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-white/[0.06] transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 pr-10 border-b border-[var(--border)] ">
            <h2 id={titleId} className="text-lg font-semibold text-[var(--text-primary)] ">{title}</h2>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
