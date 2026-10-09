import { useEffect, useId, useState, type FormEvent, type KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { suggestSchema } from "@/lib/contracts";
import { api } from "@/lib/api";
import { keys } from "@/lib/keys";
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
  const [text, setText] = useState(value);
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

  return (
    <form onSubmit={onSubmit} className="relative w-full" role="search">
      <label htmlFor={id} className={size === "hero" ? "mb-2 block text-left text-sm font-medium" : "sr-only"}>
        {size === "hero" ? "What do you need from China?" : "Search"}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          className={cn(
            "min-w-0 flex-1 rounded-md border border-border bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring",
            size === "hero" ? "min-h-14 text-base" : "min-h-11 text-sm",
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
        <button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground">
          <Search className="h-4 w-4" aria-hidden />
          <span className={size === "compact" ? "hidden sm:inline" : undefined}>Search</span>
        </button>
      </div>
      {open && debounced.length >= 2 ? (
        <ul id={listId} role="listbox" className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border border-border bg-white text-left shadow-lg">
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
