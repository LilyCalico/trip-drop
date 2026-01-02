import { cn } from "@/lib/utils";

interface ModalConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onClick: () => void;
  title?: string;
  text?: string;
  children?: React.ReactNode;
  className?: string;
  buttonColor?: string;
}

export default function ModalConfirm({
  isOpen,
  onClose,
  onClick,
  title,
  text,
  children,
  className,
  buttonColor = "bg-black"
}: ModalConfirmProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center cursor-default"
      aria-modal="true"
      role="dialog"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className={cn(
          "relative z-10 w-[90%] max-w-[40rem] rounded-[1.2rem] bg-white p-[2.4rem] shadow-xl",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-[1.4rem] px-[8px] py-[4px] rounded hover:bg-black/5 absolute top-[1.6rem] right-[1.6rem] cursor-pointer"
          aria-label="Close"
        >
          ×
        </button>
        <div className="mt-[1.6rem]">
          {title && (
            <h2 className="text-[1.8rem] font-bold mb-[1.6rem]">{title}</h2>
          )}
          {text && (
            <p className="text-[1.4rem] text-gray-600 mb-[2.4rem]">{text}</p>
          )}
          {children && <div className="mb-[2.4rem]">{children}</div>}
          <div className="flex gap-[1.2rem] justify-end">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="px-[2.4rem] py-[1.2rem] rounded-[0.8rem] border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className={cn(
                "px-[2.4rem] py-[1.2rem] rounded-[0.8rem] text-white hover:opacity-90 transition-colors cursor-pointer",
                buttonColor
              )}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
