"use client";
import { useEffect, useRef, useId, useState } from "react";
export default function Modal({
  title,
  children,
  onClose,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [closing, setClosing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const close = () => {
    if (closing) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onClose();
      return;
    }
    setClosing(true);
    timer.current = setTimeout(onClose, 170);
  };
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    const d = ref.current!;
    d.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      d.close();
      document.body.style.overflow = previous;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${className} ${closing ? "is-closing" : ""}`}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <div className="modal-top">
        <span className="eyebrow" id={id}>
          {title}
        </span>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={close}
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}
