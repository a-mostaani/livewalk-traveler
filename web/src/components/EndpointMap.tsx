import { MAPBOX_TOKEN } from '../config';
import { isSelectedPlace } from '../requestModel';
import type { PlaceDraft } from '../types';

export function EndpointMap({
  origin,
  destination,
}: {
  origin: PlaceDraft;
  destination: PlaceDraft;
}) {
  if (!isSelectedPlace(origin) || !isSelectedPlace(destination)) return null;

  const mapUrl = MAPBOX_TOKEN ? staticMapUrl(origin, destination, MAPBOX_TOKEN) : '';

  return (
    <figure className="endpoint-map">
      {mapUrl ? (
        <img
          src={mapUrl}
          alt={`Map showing the selected endpoints: ${origin.label} and ${destination.label}`}
        />
      ) : (
        <div className="endpoint-map-fallback" aria-label="Selected endpoint coordinates">
          <span>A</span>
          <span>B</span>
        </div>
      )}
      <figcaption>
        <span>Selected endpoints only</span>
        <small>No street route has been calculated or drawn.</small>
      </figcaption>
    </figure>
  );
}

function staticMapUrl(origin: Required<PlaceDraft>, destination: Required<PlaceDraft>, token: string) {
  const overlays = [
    `pin-s-a+21d4fd(${origin.lng},${origin.lat})`,
    `pin-s-b+7357ff(${destination.lng},${destination.lat})`,
  ].join(',');
  return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${overlays}/auto/800x360@2x?padding=70&access_token=${encodeURIComponent(token)}`;
}
