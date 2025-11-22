/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { Vector2, Ball } from '../types';
import { computeConvexHull } from './math';

export const processImageForSimulation = async (
  imageSrc: string, 
  canvasSize: number = 400
): Promise<{ polygon: Vector2[], balls: Partial<Ball>[] } | null> => {
  
  return new Promise((resolve) => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
          resolve(null);
          return;
      }

      // Draw image to fit canvas, maintaining aspect ratio or filling?
      // Filling simplifies coordinates mapping
      ctx.drawImage(img, 0, 0, canvasSize, canvasSize);
      const imageData = ctx.getImageData(0, 0, canvasSize, canvasSize);
      const data = imageData.data;

      const bluePoints: Vector2[] = [];
      const yellowPixels: Vector2[] = [];

      // Single pass to find potential pixels
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        if (a < 128) continue;

        const x = (i / 4) % canvasSize;
        const y = Math.floor((i / 4) / canvasSize);

        // Blue detection (Blue dominant)
        // Allow some tolerance, but generally Blue should be higher than Red and Green
        if (b > r + 20 && b > g + 20 && b > 80) {
           // Subsample to reduce hull complexity
           if (x % 2 === 0 && y % 2 === 0) { 
             bluePoints.push({ x: x - canvasSize / 2, y: y - canvasSize / 2 });
           }
        }

        // Yellow detection (Red and Green high, Blue low)
        if (r > 130 && g > 130 && b < 100) {
            yellowPixels.push({ x: x - canvasSize / 2, y: y - canvasSize / 2 });
        }
      }

      // 1. Process Polygon (Blue Rim)
      let polygon: Vector2[] = [];
      if (bluePoints.length > 20) {
         // Compute convex hull
         polygon = computeConvexHull(bluePoints);
      } else {
         // Fallback if no blue shape found, return null or default?
         // We'll return empty to signal failure to find shape
         console.warn("No blue shape detected");
      }

      // 2. Process Balls (Yellow blobs)
      // Simple clustering: Group yellow pixels that are close
      const balls: Partial<Ball>[] = [];
      
      // Using a grid-based clustering.
      const gridSize = 10;
      const gridMap = new Map<string, { sumX: number, sumY: number, count: number }>();

      yellowPixels.forEach(p => {
          const gx = Math.floor(p.x / gridSize);
          const gy = Math.floor(p.y / gridSize);
          const key = `${gx},${gy}`;
          
          const cell = gridMap.get(key) || { sumX: 0, sumY: 0, count: 0 };
          cell.sumX += p.x;
          cell.sumY += p.y;
          cell.count++;
          gridMap.set(key, cell);
      });

      // Merge adjacent grid cells
      const blobs: { x: number, y: number, mass: number }[] = [];
      
      gridMap.forEach((cell) => {
         blobs.push({ x: cell.sumX / cell.count, y: cell.sumY / cell.count, mass: cell.count });
      });

      // Merge blobs that are close (likely part of same ball)
      const mergedBlobs: typeof blobs = [];
      const mergeDist = 25; // Max radius of a ball roughly

      blobs.forEach(blob => {
          let merged = false;
          for (let existing of mergedBlobs) {
             const dx = existing.x - blob.x;
             const dy = existing.y - blob.y;
             if (Math.sqrt(dx*dx + dy*dy) < mergeDist) {
                 // Weighted average merge
                 const totalMass = existing.mass + blob.mass;
                 existing.x = (existing.x * existing.mass + blob.x * blob.mass) / totalMass;
                 existing.y = (existing.y * existing.mass + blob.y * blob.mass) / totalMass;
                 existing.mass = totalMass;
                 merged = true;
                 break;
             }
          }
          if (!merged) {
              mergedBlobs.push({ ...blob });
          }
      });

      mergedBlobs.forEach((blob, idx) => {
         // Estimate radius from mass (area) roughly
         // Area ~= mass (pixel count) * sampling_factor
         // r = sqrt(area / pi)
         const approximateRadius = Math.max(4, Math.sqrt(blob.mass) * 0.8);
         
         balls.push({
             id: `custom-${idx}`,
             pos: { x: blob.x, y: blob.y },
             radius: Math.min(approximateRadius, 20), // Cap size
             vel: { x: (Math.random() - 0.5) * 5, y: (Math.random() - 0.5) * 5 },
             color: '#FACC15'
         });
      });

      resolve({ polygon, balls });
    };
    
    img.onerror = () => {
        resolve(null);
    };
  });
};