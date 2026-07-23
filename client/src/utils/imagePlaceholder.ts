// A neutral "No image" placeholder shown when a product has no photo.
// It is an inline SVG (a data URI) so it needs no network request or asset file.
export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">' +
      '<rect width="100%" height="100%" fill="#f5f5f5"/>' +
      '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" ' +
      'fill="#bfbfbf" font-family="sans-serif" font-size="22">No image</text>' +
      "</svg>",
  );

// Use as an <img onError={handleImageError}> handler: if the image URL fails to
// load (e.g. a missing file that returns 404), swap in the placeholder. The
// guard stops an endless loop if the placeholder itself ever failed.
export function handleImageError(event: {
  currentTarget: HTMLImageElement;
}): void {
  const image = event.currentTarget;
  if (image.src !== PLACEHOLDER_IMAGE) {
    image.src = PLACEHOLDER_IMAGE;
  }
}
