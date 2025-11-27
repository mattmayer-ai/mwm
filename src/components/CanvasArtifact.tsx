import { useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import type { Artifact, ExperienceItem } from '@stores/artifacts.store';
import type { Project } from '@lib/projects';
import { useArtifactsStore } from '@stores/artifacts.store';
import { screenToCanvas, canvasToScreen, snapToGrid } from '@lib/grid-snap';

interface CanvasArtifactProps {
  artifact: Artifact;
  canvasTransform: { scale: number; x: number; y: number };
  isDesktop: boolean;
}

export function CanvasArtifact({ artifact, canvasTransform, isDesktop }: CanvasArtifactProps) {
  const { removeArtifact, updateArtifactPosition } = useArtifactsStore();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const artifactRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Don't start drag if clicking close button or other interactive elements
      if ((e.target as HTMLElement).closest('button, a, input, textarea')) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);

      // Calculate offset from pointer to artifact center (since we use translate(-50%, -50%))
      const rect = artifactRef.current?.getBoundingClientRect();
      if (rect) {
        // Since artifact is centered, offset is the difference from center
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const offsetX = e.clientX - centerX;
        const offsetY = e.clientY - centerY;
        setDragOffset({ x: offsetX, y: offsetY });
      }

      // Set pointer capture
      artifactRef.current?.setPointerCapture(e.pointerId);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;

      e.preventDefault();
      e.stopPropagation();

      // Calculate new screen position (center of artifact)
      const newScreenX = e.clientX - dragOffset.x;
      const newScreenY = e.clientY - dragOffset.y;

      // Update visual position during drag (will be snapped on pointer up)
      if (artifactRef.current) {
        artifactRef.current.style.left = `${newScreenX}px`;
        artifactRef.current.style.top = `${newScreenY}px`;
      }
    },
    [isDragging, dragOffset]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;

      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      // Release pointer capture
      artifactRef.current?.releasePointerCapture(e.pointerId);

      // Get final screen position (center of artifact)
      const finalScreenX = e.clientX - dragOffset.x;
      const finalScreenY = e.clientY - dragOffset.y;

      // Convert to canvas coordinates first
      const canvasPos = screenToCanvas(finalScreenX, finalScreenY, canvasTransform);

      // Snap to grid in canvas space
      const snappedCanvas = snapToGrid(canvasPos.x, canvasPos.y);

      // Update artifact position with snapped coordinates
      updateArtifactPosition(artifact.id, snappedCanvas);

      // Reset inline styles - position will be recalculated from canvas coordinates
      if (artifactRef.current) {
        artifactRef.current.style.left = '';
        artifactRef.current.style.top = '';
      }
    },
    [isDragging, dragOffset, canvasTransform, artifact.id, updateArtifactPosition]
  );

  const handleClose = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      removeArtifact(artifact.id);
    },
    [artifact.id, removeArtifact]
  );

  if (!artifact.visible || !isDesktop) return null;

  const isPortfolio = artifact.type === 'portfolio';
  const project = isPortfolio ? (artifact.data as Project) : null;
  const experience = !isPortfolio ? (artifact.data as ExperienceItem) : null;

  // Convert canvas position to screen position for rendering
  const screenPos = canvasToScreen(artifact.position.x, artifact.position.y, canvasTransform);

  return (
      <div
        ref={artifactRef}
        className="canvas-artifact absolute cursor-grab active:cursor-grabbing select-none"
        style={{
          left: `${screenPos.x}px`,
          top: `${screenPos.y}px`,
          transform: `translate(-50%, -50%)`,
          zIndex: artifact.zIndex,
          pointerEvents: 'auto',
        }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="group relative w-[320px] rounded-[10px] border border-gray-200/70 bg-white/95 px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.12)] transition-all duration-200 hover:shadow-[0_12px_32px_rgba(15,23,42,0.16)] dark:border-gray-800/60 dark:bg-gray-900/90">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-500 opacity-0 transition-opacity hover:bg-gray-200 hover:text-gray-700 group-hover:opacity-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          aria-label="Close artifact"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        {isPortfolio && project ? (
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-blue">
              <span>{project.year}</span>
              <span className="inline-flex h-1 w-1 rounded-full bg-brand-blue/60" aria-hidden="true" />
              <span>{project.role?.[0] || 'Lead'}</span>
            </div>
            <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
              {project.title}
            </h3>
            <p className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
              {project.summary}
            </p>
          </div>
        ) : experience ? (
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {experience.company}
              </h3>
              <span className="text-xs uppercase tracking-widest text-slate-500 whitespace-nowrap">
                {experience.range}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-brand-blue">{experience.role}</p>
            <p className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
              {experience.copy[0] || ''}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

