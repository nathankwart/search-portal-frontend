import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  sheet,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  sheet?: boolean;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40" />
        <Dialog.Content
          className={cn(
            "fixed z-50 overflow-auto bg-white p-4 shadow-xl focus:outline-none sm:p-6",
            sheet
              ? "inset-x-0 bottom-0 max-h-[85vh] rounded-t-xl"
              : "left-1/2 top-1/2 max-h-[90vh] w-[min(100%-1rem,36rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
            <Dialog.Close className="inline-flex h-11 w-11 items-center justify-center rounded-md hover:bg-muted" aria-label="Close">
              <X aria-hidden className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className={description ? "mt-1 text-sm text-muted-foreground" : "sr-only"}>
            {description || title}
          </Dialog.Description>
          <div className="mt-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  destructive,
  pending,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onOpenChange={(next) => !next && onClose()} title={title} description={body}>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" variant={destructive ? "destructive" : "primary"} disabled={pending} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
