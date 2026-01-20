'use client';

import { useCallback, useRef } from 'react';
import { AppState } from '@/src/model/types';
import * as State from '@/src/model/state';

interface TouchState {
  touches: { id: number; x: number; y: number }[];
  initialDistance: number | null;
  initialZoom: number;
  initialPanX: number;
  initialPanY: number;
  initialMidpoint: { x: number; y: number } | null;
}

interface UseTouchGesturesProps {
  appState: AppState;
  svgRef: React.RefObject<SVGSVGElement | null>;
  updateState: (state: AppState, recordInHistory?: boolean) => void;
}

/**
 * Hook for handling multi-touch gestures (pinch-to-zoom, two-finger pan)
 */
export function useTouchGestures({
  appState,
  svgRef,
  updateState,
}: UseTouchGesturesProps) {
  const touchStateRef = useRef<TouchState>({
    touches: [],
    initialDistance: null,
    initialZoom: 1,
    initialPanX: 0,
    initialPanY: 0,
    initialMidpoint: null,
  });

  const getDistance = (t1: { x: number; y: number }, t2: { x: number; y: number }) => {
    const dx = t2.x - t1.x;
    const dy = t2.y - t1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getMidpoint = (t1: { x: number; y: number }, t2: { x: number; y: number }) => ({
    x: (t1.x + t2.x) / 2,
    y: (t1.y + t2.y) / 2,
  });

  const handleTouchStart = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    const touches = Array.from(e.touches).map(t => ({
      id: t.identifier,
      x: t.clientX,
      y: t.clientY,
    }));

    touchStateRef.current.touches = touches;

    // Two-finger gesture starting
    if (touches.length === 2) {
      e.preventDefault();
      const distance = getDistance(touches[0], touches[1]);
      const midpoint = getMidpoint(touches[0], touches[1]);
      
      touchStateRef.current = {
        touches,
        initialDistance: distance,
        initialZoom: appState.zoom,
        initialPanX: appState.panX,
        initialPanY: appState.panY,
        initialMidpoint: midpoint,
      };
    }
  }, [appState.zoom, appState.panX, appState.panY]);

  const handleTouchMove = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    const touches = Array.from(e.touches).map(t => ({
      id: t.identifier,
      x: t.clientX,
      y: t.clientY,
    }));

    // Two-finger gesture (pinch-zoom + pan)
    if (touches.length === 2 && touchStateRef.current.initialDistance !== null) {
      e.preventDefault();
      
      const currentDistance = getDistance(touches[0], touches[1]);
      const currentMidpoint = getMidpoint(touches[0], touches[1]);
      
      const { initialDistance, initialZoom, initialPanX, initialPanY, initialMidpoint } = touchStateRef.current;
      
      if (initialMidpoint) {
        // Calculate new zoom
        const scale = currentDistance / initialDistance!;
        const newZoom = Math.max(0.1, Math.min(3, initialZoom * scale));
        
        // Calculate pan adjustment for zoom origin at midpoint
        const zoomDelta = newZoom / initialZoom;
        
        // Pan to keep midpoint stable + add two-finger drag
        const panDeltaX = currentMidpoint.x - initialMidpoint.x;
        const panDeltaY = currentMidpoint.y - initialMidpoint.y;
        
        // Adjust pan for zoom centering at touch midpoint
        const svgRect = svgRef.current?.getBoundingClientRect();
        if (svgRect) {
          const midpointInSvgX = initialMidpoint.x - svgRect.left;
          const midpointInSvgY = initialMidpoint.y - svgRect.top;
          
          // Pan adjustment to zoom around midpoint
          const zoomPanAdjustX = midpointInSvgX * (1 - zoomDelta);
          const zoomPanAdjustY = midpointInSvgY * (1 - zoomDelta);
          
          const newPanX = initialPanX * zoomDelta + zoomPanAdjustX + panDeltaX;
          const newPanY = initialPanY * zoomDelta + zoomPanAdjustY + panDeltaY;
          
          updateState(State.updateViewport(appState, newPanX, newPanY, newZoom), false);
        }
      }
    }
    
    touchStateRef.current.touches = touches;
  }, [appState, svgRef, updateState]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    const remainingTouches = Array.from(e.touches).map(t => ({
      id: t.identifier,
      x: t.clientX,
      y: t.clientY,
    }));

    // Reset two-finger gesture state when less than 2 fingers
    if (remainingTouches.length < 2) {
      touchStateRef.current = {
        touches: remainingTouches,
        initialDistance: null,
        initialZoom: appState.zoom,
        initialPanX: appState.panX,
        initialPanY: appState.panY,
        initialMidpoint: null,
      };
    }
  }, [appState.zoom, appState.panX, appState.panY]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
