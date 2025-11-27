/**
 * Grid snapping utility for canvas artifacts
 */

export const GRID_SIZE = 40; // pixels

/**
 * Snap coordinates to the nearest grid intersection
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param gridSize - Grid size in pixels (default: GRID_SIZE)
 * @returns Snapped coordinates
 */
export function snapToGrid(
  x: number,
  y: number,
  gridSize: number = GRID_SIZE
): { x: number; y: number } {
  return {
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize,
  };
}

/**
 * Snap coordinates to grid accounting for canvas transform (zoom/pan)
 * This converts screen coordinates to canvas coordinates, snaps to grid,
 * then converts back to screen coordinates
 * @param screenX - Screen X coordinate
 * @param screenY - Screen Y coordinate
 * @param transform - Canvas transform (scale, x, y)
 * @param gridSize - Grid size in pixels (default: GRID_SIZE)
 * @returns Snapped screen coordinates
 */
export function snapToGridWithTransform(
  screenX: number,
  screenY: number,
  transform: { scale: number; x: number; y: number },
  gridSize: number = GRID_SIZE
): { x: number; y: number } {
  // Get viewport center (transform origin is 'center center')
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
  const centerX = viewportWidth / 2;
  const centerY = viewportHeight / 2;

  // Convert screen coordinates to canvas coordinates
  // Reverse the transform: (screen - center - translate) / scale + center
  const canvasX = (screenX - centerX - transform.x) / transform.scale + centerX;
  const canvasY = (screenY - centerY - transform.y) / transform.scale + centerY;

  // Snap to grid in canvas space
  const snapped = snapToGrid(canvasX, canvasY, gridSize);

  // Convert back to screen coordinates
  // screen = center + translate + (canvas - center) * scale
  const snappedScreenX = centerX + transform.x + (snapped.x - centerX) * transform.scale;
  const snappedScreenY = centerY + transform.y + (snapped.y - centerY) * transform.scale;

  return { x: snappedScreenX, y: snappedScreenY };
}

/**
 * Convert screen coordinates to canvas coordinates
 * @param screenX - Screen X coordinate
 * @param screenY - Screen Y coordinate
 * @param transform - Canvas transform (scale, x, y)
 * @returns Canvas coordinates
 */
export function screenToCanvas(
  screenX: number,
  screenY: number,
  transform: { scale: number; x: number; y: number }
): { x: number; y: number } {
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
  const centerX = viewportWidth / 2;
  const centerY = viewportHeight / 2;

  const canvasX = (screenX - centerX - transform.x) / transform.scale + centerX;
  const canvasY = (screenY - centerY - transform.y) / transform.scale + centerY;

  return { x: canvasX, y: canvasY };
}

/**
 * Convert canvas coordinates to screen coordinates
 * @param canvasX - Canvas X coordinate
 * @param canvasY - Canvas Y coordinate
 * @param transform - Canvas transform (scale, x, y)
 * @returns Screen coordinates
 */
export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  transform: { scale: number; x: number; y: number }
): { x: number; y: number } {
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
  const centerX = viewportWidth / 2;
  const centerY = viewportHeight / 2;

  const screenX = centerX + transform.x + (canvasX - centerX) * transform.scale;
  const screenY = centerY + transform.y + (canvasY - centerY) * transform.scale;

  return { x: screenX, y: screenY };
}

