import { useEffect, useId, useState } from 'react';
import { searchPlaces } from '../mapbox';
import { isSelectedPlace, retainSelectedCoordinates, updatePlaceQuery } from '../requestModel';
import type { Place, PlaceDraft } from '../types';

export function PlaceSearch({
  label,
  placeholder,
  value,
  onChange,
  search = searchPlaces,
}: {
  label: string;
  placeholder: string;
  value: PlaceDraft;
  onChange: (next: PlaceDraft) => void;
  search?: (query: string, signal?: AbortSignal) => Promise<Place[]>;
}) {
  const listId = useId();
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
    if (selected || trimmed.length < 3) {
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
  }, [query, search, selected]);

  const choose = (place: Place) => {
    setQuery(place.label);
    setResults([]);
    setError('');
    onChange(retainSelectedCoordinates(place));
  };

  return (
    <div className="place-field">
      <label htmlFor={listId}>{label}</label>
      <div className={`input-shell ${selected ? 'selected' : ''}`}>
        <span aria-hidden="true" className="field-icon">⌖</span>
        <input
          id={listId}
          aria-autocomplete="list"
          aria-expanded={results.length > 0}
          autoComplete="off"
          placeholder={placeholder}
          value={query}
          onChange={(event) => {
            const next = event.target.value;
            setQuery(next);
            setResults([]);
            setError('');
            onChange(updatePlaceQuery(next));
          }}
        />
        {loading ? <span className="spinner spinner-dark" aria-label="Searching places" /> : null}
        {selected ? <span className="selected-check" aria-label="Coordinates selected">✓</span> : null}
      </div>
      {selected ? <p className="field-success">Real coordinates selected</p> : <p className="field-help">Choose a search result to lock the route point.</p>}
      {error ? <p className="field-error" role="alert">{error}</p> : null}
      {!loading && !error && query.trim().length >= 3 && !selected && results.length === 0 ? <p className="field-help">Keep typing or try a nearby landmark.</p> : null}
      {results.length ? (
        <div className="place-results" role="listbox" aria-label={`${label} results`}>
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
