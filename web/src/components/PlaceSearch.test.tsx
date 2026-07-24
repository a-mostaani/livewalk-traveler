import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import styles from '../styles.css?raw';
import type { Place, PlaceDraft } from '../types';
import { PlaceSearch } from './PlaceSearch';

const longPlace: Place = {
  label: 'Museo Nacional Centro de Arte Reina Sofía, Calle de Santa Isabel, Madrid, Spain',
  lat: 40.4086,
  lng: -3.6947,
};

function Picker({ initial, search = vi.fn(async () => []) }: { initial: PlaceDraft; search?: (query: string, signal?: AbortSignal) => Promise<Place[]> }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <PlaceSearch label="Starting point" placeholder="Search" value={value} onChange={setValue} search={search} />
      <output data-testid="place-value">{JSON.stringify(value)}</output>
    </>
  );
}

function RoutePicker({ search }: { search: (query: string, signal?: AbortSignal) => Promise<Place[]> }) {
  const [origin, setOrigin] = useState<PlaceDraft>({ label: '' });
  const [destination, setDestination] = useState<PlaceDraft>({ label: '' });
  const [active, setActive] = useState<'origin' | 'destination' | null>(null);
  return (
    <div className="route-stack">
      <PlaceSearch
        label="Starting point"
        placeholder="Search"
        value={origin}
        onChange={setOrigin}
        active={active === 'origin'}
        onActivate={() => setActive('origin')}
        onDeactivate={() => setActive((current) => current === 'origin' ? null : current)}
        search={search}
      />
      <PlaceSearch
        label="Destination"
        placeholder="Search"
        value={destination}
        onChange={setDestination}
        active={active === 'destination'}
        onActivate={() => setActive('destination')}
        onDeactivate={() => setActive((current) => current === 'destination' ? null : current)}
        search={search}
      />
    </div>
  );
}

test('renders a selected place as stable truncated text with protected status and a change action', () => {
  render(<Picker initial={longPlace} />);

  const selectedLabel = screen.getByTitle(longPlace.label);
  expect(selectedLabel).toHaveClass('selected-place');
  expect(screen.queryByRole('textbox', { name: 'Starting point' })).not.toBeInTheDocument();
  expect(screen.getByLabelText('Coordinates selected')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Change' }));

  expect(screen.getByRole('textbox', { name: 'Starting point' })).toHaveValue(longPlace.label);
  expect(screen.getByTestId('place-value')).toHaveTextContent(JSON.stringify({ label: longPlace.label }));
});

test('moves search results into selected coordinate state', async () => {
  vi.useFakeTimers();
  const search = vi.fn(async () => [longPlace]);
  render(<Picker initial={{ label: '' }} search={search} />);

  fireEvent.change(screen.getByRole('textbox', { name: 'Starting point' }), { target: { value: 'Museo' } });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(400);
  });

  expect(screen.getByRole('listbox', { name: 'Starting point results' })).toBeInTheDocument();
  fireEvent.click(screen.getByText(longPlace.label));

  expect(screen.getByTitle(longPlace.label)).toBeInTheDocument();
  expect(screen.getByTestId('place-value')).toHaveTextContent(JSON.stringify(longPlace));
  vi.useRealTimers();
});

test('shows suggestions only for the active route field and switches cleanly with focus', async () => {
  vi.useFakeTimers();
  const search = vi.fn(async (query: string) => [{ ...longPlace, label: `${query} result` }]);
  render(<RoutePicker search={search} />);

  const origin = screen.getByRole('textbox', { name: 'Starting point' });
  const destination = screen.getByRole('textbox', { name: 'Destination' });
  fireEvent.focus(origin);
  fireEvent.change(origin, { target: { value: 'Luxembourg' } });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(400);
  });
  expect(screen.getByRole('listbox', { name: 'Starting point results' })).toBeInTheDocument();

  fireEvent.blur(origin, { relatedTarget: destination });
  fireEvent.focus(destination);
  expect(screen.queryByRole('listbox', { name: 'Starting point results' })).not.toBeInTheDocument();
  fireEvent.change(destination, { target: { value: 'Kirchberg' } });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(400);
  });
  expect(screen.getByRole('listbox', { name: 'Destination results' })).toBeInTheDocument();
  expect(screen.queryByRole('listbox', { name: 'Starting point results' })).not.toBeInTheDocument();
  vi.useRealTimers();
});

test('keeps the active mobile picker in flow with separation and selected text in an ellipsis container', () => {
  expect(styles).toContain('.place-field.active { z-index: 30; }');
  expect(styles).toContain('.place-field.picker-open { margin-bottom: 28px; }');
  expect(styles).toContain('.place-results { position: static; width: 100%; max-height: min(220px, 30dvh); margin: 8px 0 0; overflow-y: auto; overscroll-behavior: contain; }');
  expect(styles).toContain('.selected-place { min-width: 0; flex: 1; overflow: hidden; color: var(--white); text-overflow: ellipsis; white-space: nowrap; }');
});
