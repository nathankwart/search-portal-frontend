import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { searchResponseSchema } from "@shared";
import { ImagePlus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { suggestSchema } from "@/lib/contracts";
import { api } from "@/lib/api";
import { keys } from "@/lib/keys";
import { searchPath } from "@/lib/searchState";
import { getSessionId } from "@/lib/session";
import { useDebounced } from "@/lib/useDebounced";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  "PVC water supply pipes",
  "Perfume factory in Guangdong with OEM",
  "Tin boxes for tea packaging",
  "Supermarket display racks",
  "Car lift for workshop",
];

export function SearchBox({
  id = "portal-search",
  size,
  value = "",
  onSearch,
  rotatePlaceholder = false,
}: {
  id?: string;
  size: "hero" | "compact";
  value?: string;
  onSearch: (query: string) => void;
  rotatePlaceholder?: boolean;
}) {
  const listId = useId();
  const imageInput = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [text, setText] = useState(value);
  const [readingImage, setReadingImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [example, setExample] = useState(0);
  const debounced = useDebounced(text.trim(), 200);
  const suggest = useQuery({
    queryKey: keys.suggest(debounced),
    queryFn: () => api.get("/search/suggest", suggestSchema, { q: debounced }),
    enabled: open && debounced.length >= 2,
  });
  const suggestions = suggest.data?.suggestions ?? [];

  useEffect(() => setText(value), [value]);
  useEffect(() => setActive(-1), [debounced]);
  useEffect(() => {
    if (!rotatePlaceholder || text) return;
    const timer = window.setInterval(() => setExample((index) => (index + 1) % EXAMPLES.length), 3500);
    return () => window.clearInterval(timer);
  }, [rotatePlaceholder, text]);

  function choose(next: string) {
    setText(next);
    setOpen(false);
    onSearch(next);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (open && active >= 0 && suggestions[active]) {
      choose(suggestions[active]);
      return;
    }
    const query = text.trim();
    if (!query) return;
    setOpen(false);
    onSearch(query);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  async function onImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || readingImage) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Images must be jpg, png, or webp");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Images must be no larger than 5 MB");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setReadingImage(true);
    setOpen(false);
    try {
      const body = new FormData();
      body.set("image", file);
      body.set("sessionId", getSessionId());
      const result = await api.postForm("/search/image", body, searchResponseSchema);
      navigate(searchPath({ q: result.query, page: 1, filters: {}, suppressed: [] }), { state: { imageSearch: result } });
    } catch {
      // The API client already shows the error.
    } finally {
      setReadingImage(false);
      URL.revokeObjectURL(url);
      setPreviewUrl(null);
    }
  }

  const hero = size === "hero";

  return (
    <form onSubmit={onSubmit} className="relative w-full" role="search">
      <label htmlFor={id} className={hero ? "mb-2 block text-left text-sm font-medium" : "sr-only"}>
        {hero ? "What do you need from China?" : "Search"}
      </label>
      <div
        className={cn(
          "flex items-center",
          hero ? "gap-2 rounded-2xl border border-border bg-background p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-ring" : "gap-2",
        )}
      >
        {hero ? <Search className="ml-2.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" /> : null}
        <input
          id={id}
          className={cn(
            "min-w-0 flex-1 bg-white outline-none",
            hero
              ? "h-12 border-0 bg-transparent px-1 text-base focus-visible:ring-0"
              : "min-h-11 rounded-md border border-border px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring",
          )}
          value={text}
          maxLength={300}
          placeholder={rotatePlaceholder ? EXAMPLES[example] : "Search products or suppliers"}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && debounced.length >= 2}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          onChange={(event) => {
            setText(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        <Button type="submit" variant="primary" className={cn("shrink-0 rounded-xl", hero ? "h-12 px-5" : "h-11 px-3")} disabled={readingImage}>
          {hero ? null : <Search className="h-4 w-4" aria-hidden="true" />}
          <span className={size === "compact" ? "hidden sm:inline" : undefined}>Search</span>
        </Button>
        <input ref={imageInput} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void onImage(event)} />
        <Button type="button" variant="outline" className={cn("shrink-0 rounded-xl px-3", hero ? "h-12" : "h-11")} disabled={readingImage} aria-busy={readingImage} onClick={() => imageInput.current?.click()}>
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">{readingImage ? "Reading the photo" : "Search by image"}</span>
        </Button>
      </div>
      {previewUrl ? (
        <p className="mt-2 flex items-center gap-2 text-left text-sm text-muted-foreground" role="status">
          <img src={previewUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
          Reading the photo…
        </p>
      ) : null}
      {open && debounced.length >= 2 ? (
        <ul id={listId} role="listbox" className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-border bg-card text-left shadow-lg">
          {suggest.isLoading ? <li className="px-3 py-3 text-sm text-muted-foreground">Looking up suggestions…</li> : null}
          {!suggest.isLoading && suggestions.length === 0 ? <li className="px-3 py-3 text-sm text-muted-foreground">No suggestions</li> : null}
          {suggestions.map((item, index) => (
            <li key={item} id={`${listId}-${index}`} role="option" aria-selected={index === active}>
              <button
                type="button"
                className={cn("min-h-11 w-full px-3 text-left text-sm hover:bg-muted", index === active && "bg-muted")}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(item)}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}
