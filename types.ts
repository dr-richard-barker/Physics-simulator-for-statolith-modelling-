
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface Vector2 {
  x: number;
  y: number;
}

export interface Ball {
  id: string;
  pos: Vector2;
  vel: Vector2;
  radius: number;
  color: string;
  // Per-ball physics overrides
  stickiness?: number; 
  restitution?: number;
  density?: number;
}

export interface SimulationConfig {
  id: number;
  name: string;
  shapeType: 'triangle' | 'square' | 'pentagon' | 'hexagon' | 'octagon' | 'star' | 'custom';
  vertexCount: number;
  gravity: number; // Multiplier relative to base
  friction: number; // 0 to 1
  restitution: number; // Bounciness (0 to 1+)
  stickiness: number; // Wall adhesion (0 to 1)
  rotationSpeed: number; // Radians per frame (or frequency if oscillating)
  
  // Rotation behavior
  rotationMode?: 'continuous' | 'oscillate';
  oscillationAmplitude?: number; // Radians

  ballCount: number;
  ballSize: number;
  initialSpeed: number;
  nuanceDescription: string;
  customPolygon?: Vector2[];
  initialBalls?: Partial<Ball>[];
}

export interface GlobalSettings {
  timeScale: number;
  gravityMultiplier: number;
  rotationMultiplier: number;
  bouncinessMultiplier: number;
  stickinessMultiplier: number;
  userImage?: string | null;
}
