import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SafeImage } from "@/components/feedback";
import { Modal } from "@/components/ui/dialog";

export function Gallery({ images }: { images: { url: string; alt: string }[] }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const current = images[index] ?? images[0];
  if (!current) {
    return (
      <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted">
        <SafeImage src={null} alt="" className="h-full w-full" />
      </div>
    );
  }
  const previous = () => setIndex((value) => (value === 0 ? images.length - 1 : value - 1));
  const next = () => setIndex((value) => (value + 1) % images.length);
  return (
    <div>
      <div className="relative">
        <button type="button" className="block w-full" onClick={() => setOpen(true)} aria-label="Open image">
          <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted">
            <SafeImage src={current.url} alt={current.alt} eager className="h-full w-full object-cover" />
          </div>
        </button>
        {images.length > 1 ? (
          <>
            <button type="button" className="absolute left-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90" aria-label="Previous image" onClick={previous}>
              <ChevronLeft aria-hidden />
            </button>
            <button type="button" className="absolute right-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90" aria-label="Next image" onClick={next}>
              <ChevronRight aria-hidden />
            </button>
          </>
        ) : null}
      </div>
      {images.length > 1 ? (
        <ul className="mt-3 flex gap-2 overflow-x-auto snap-x">
          {images.map((image, imageIndex) => (
            <li key={`${image.url}-${imageIndex}`} className="snap-start">
              <button type="button" className="h-16 w-16 overflow-hidden rounded-md border border-border" aria-label={`Show image ${imageIndex + 1}`} onClick={() => setIndex(imageIndex)}>
                <SafeImage src={image.url} alt="" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <Modal open={open} onOpenChange={setOpen} title={current.alt} description="Product image">
        <SafeImage src={current.url} alt={current.alt} eager className="max-h-[70vh] w-full object-contain" />
        {images.length > 1 ? (
          <div className="mt-3 flex justify-between">
            <button type="button" className="min-h-11 px-3" onClick={previous}>
              Previous
            </button>
            <button type="button" className="min-h-11 px-3" onClick={next}>
              Next
            </button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
