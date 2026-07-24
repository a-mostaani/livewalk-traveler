import { useEffect, useId, useRef, useState } from 'react';
import { searchPlaces } from '../mapbox';
import { isSelectedPlace, retainSelectedCoordinates, updatePlaceQuery } from '../requestModel';
import type { Place, PlaceDraft } from '../types';

export function PlaceSearch({
  label,
  placeholder,
  value,
  onChange,
  active = true,
  onActivate,
  onDeactivate,
  search = searchPlaces,
}: {
  label: string;
  placeholder: string;
  value: PlaceDraft;
  onChange: (next: PlaceDraft) => void;
  active?: boolean;
  onActivate?: () => void;
  onDeactivate?: () => void;
  search?: (query: string, signal?: AbortSignal) => Promise<Place[]>;
}) {
  const inputId = useId();
  const labelId = useId();
  const listId = useId();
  const fieldRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionInteractionRef = useRef(false);
  const [query, setQuery] = useState(value.label);
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const selected = isSelectedPlace(value);

  useEffect(() => {
    if (value.label !== query) setQuery(value.label);
  }, [query, value.label]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!active || selected || trimmed.length < 3) {
      setResults([]);
      setLoading(false);
      setError('');
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        setResults(await search(trimmed, controller.signal));
      } catch (reason) {
        if ((reason as { name?: string }).name !== 'AbortError') {
          setResults([]);
          setError(reason instanceof Error ? reason.message : 'Place search failed.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 320);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [active, query, search, selected]);

  const choose = (place: Place) => {
    optionInteractionRef.current = false;
    setQuery(place.label);
    setResults([]);
    setError('');
    onChange(retainSelectedCoordinates(place));
    onDeactivate?.();
  };

  const keepPickerVisible = () => {
    if (!window.matchMedia?.('(max-width: 700px)').matches) return;
    window.setTimeout(() => {
      const field = inputRef.current?.closest('.place-field');
      if (field && 'scrollIntoView' in field) field.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }, 120);
  };

  const changeSelection = () => {
    onChange(updatePlaceQuery(value.label));
    onActivate?.();
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
      keepPickerVisible();
    });
  };

  useEffect(() => {
    if (active && results.length && inputRef.current === document.activeElement) keepPickerVisible();
  }, [active, results.length]);

  const pickerOpen = active && results.length > 0;

  return (
    <div
      ref={fieldRef}
      className={`place-field${active ? ' active' : ''}${pickerOpen ? ' picker-open' : ''}`}
      onBlur={(event) => {
        if (optionInteractionRef.current) return;
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onDeactivate?.();
      }}
    >
      <label id={labelId} htmlFor={selected ? undefined : inputId}>{label}</label>
      {selected ? (
        <div className="input-shell selected" aria-labelledby={labelId}>
          <span aria-hidden="true" className="field-icon">⌖</span>
          <span className="selected-place" title={value.label}>{value.label}</span>
          <span className="selected-check" aria-label="Coordinates selected">✓</span>
        </div>
      ) : (
        <div className="input-shell">
          <span aria-hidden="true" className="field-icon">⌖</span>
          <input
            ref={inputRef}
            id={inputId}
            aria-autocomplete="list"
            aria-controls={pickerOpen ? listId : undefined}
            aria-expanded={pickerOpen}
            autoComplete="off"
            placeholder={placeholder}
            value={query}
            onFocus={() => {
              onActivate?.();
              keepPickerVisible();
            }}
            onChange={(event) => {
              const next = event.target.value;
              onActivate?.();
              setQuery(next);
              setResults([]);
              setError('');
              onChange(updatePlaceQuery(next));
            }}
          />
          {loading ? <span className="spinner spinner-dark" aria-label="Searching places" /> : null}
        </div>
      )}
      {selected ? (
        <div className="field-status">
          <p className="field-success">Real coordinates selected</p>
          <button className="change-place" type="button" onClick={changeSelection}>Change</button>
        </div>
      ) : <p className="field-help">Choose a search result to lock the route point.</p>}
      {error ? <p className="field-error" role="alert">{error}</p> : null}
      {!loading && !error && query.trim().length >= 3 && !selected && results.length === 0 ? <p className="field-help">Keep typing or try a nearby landmark.</p> : null}
      {pickerOpen ? (
        <div
          id={listId}
          className="place-results"
          role="listbox"
          aria-label={`${label} results`}
          onPointerDownCapture={() => {
            optionInteractionRef.current = true;
          }}
          onPointerCancelCapture={() => {
            optionInteractionRef.current = false;
          }}
          onTouchStartCapture={() => {
            optionInteractionRef.current = true;
          }}
          onTouchCancelCapture={() => {
            optionInteractionRef.current = false;
          }}
        >
          {results.map((place) => (
            <button key={`${place.label}-${place.lat}-${place.lng}`} type="button" role="option" onClick={() => choose(place)}>
              <span className="result-pin">⌖</span>
              <span>{place.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
