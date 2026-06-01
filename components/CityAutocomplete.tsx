"use client";

import { useState, useEffect, useRef, useCallback, useId } from "react";
import Fuse from "fuse.js";
import type { Place } from "@/scripts/fetch-places";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
  required?: boolean;
}

let fuseInstance: Fuse<Place> | null = null;
let placesCache: Place[] | null = null;

async function getFuse(): Promise<Fuse<Place>> {
  if (fuseInstance) return fuseInstance;
  if (!placesCache) {
    const res = await fetch("/api/places");
    placesCache = await res.json();
  }
  fuseInstance = new Fuse(placesCache!, {
    keys: ["name"],
    threshold: 0.35,
    distance: 80,
    includeScore: true,
  });
  return fuseInstance;
}

// Fully controlled: value/onChange live in the parent; no internal mirror state.
export default function CityAutocomplete({
  value,
  onChange,
  placeholder = "e.g. Portugal, Bangkok, Spain",
  label,
  required,
}: Props) {
  const listId = useId();
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [ready, setReady] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    getFuse().then(() => setReady(true)).catch(() => {});
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const fuse = await getFuse();
    const results = fuse.search(q, { limit: 8 }).map((r) => r.item);
    setSuggestions(results);
    setOpen(results.length > 0);
    setActiveIdx(-1);
  }, []);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setHasSearched(true);
    onChange(q);
    search(q);
  }

  function select(place: Place) {
    onChange(place.name);
    setSuggestions([]);
    setOpen(false);
    setActiveIdx(-1);
    setHasSearched(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      select(suggestions[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  useEffect(() => {
    if (activeIdx >= 0 && listRef.current) {
      const el = listRef.current.children[activeIdx] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIdx]);

  const showNoResults =
    hasSearched && value.trim().length > 1 && ready && !open && suggestions.length === 0;

  return (
    <div className="flex flex-col gap-1 relative">
      <label className="text-sm font-medium text-slate-600">{label}</label>
      <input
        ref={inputRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        dir="auto"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full"
      />

      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          ref={listRef}
          role="listbox"
          className="absolute top-full mt-1 left-0 right-0 z-50 bg-white border border-slate-200 rounded-md shadow-lg max-h-56 overflow-y-auto"
        >
          {suggestions.map((place, i) => (
            <li
              key={place.id}
              role="option"
              aria-selected={i === activeIdx}
              onMouseDown={() => select(place)}
              className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between gap-2 ${
                i === activeIdx ? "bg-indigo-50 text-indigo-900" : "hover:bg-slate-50"
              }`}
            >
              <span>{place.name}</span>
              {place.level === "city" && (
                <span className="text-xs text-slate-400 shrink-0">city</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {showNoResults && (
        <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
          No data for &ldquo;{value}&rdquo; — try a nearby city or the country name (e.g. Israel,
          Portugal).
        </p>
      )}
    </div>
  );
}
