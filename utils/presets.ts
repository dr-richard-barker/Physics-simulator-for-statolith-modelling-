
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { SimulationConfig, Ball } from '../types';

const baseConfig: Omit<SimulationConfig, 'id' | 'name' | 'nuanceDescription'> = {
  shapeType: 'square',
  vertexCount: 4,
  gravity: 0.15,
  friction: 0.001,
  restitution: 0.8,
  stickiness: 0,
  rotationSpeed: 0.005,
  ballCount: 3,
  ballSize: 8,
  initialSpeed: 5,
};

// Helper to generate the "Shaker" ball layout
const getShakerBalls = (): Partial<Ball>[] => {
    const balls: Partial<Ball>[] = [];
    
    // 10 Medium Yellow Balls on bottom
    // Assume box is roughly -150 to 150. Bottom is +150.
    for (let i = 0; i < 10; i++) {
        balls.push({
            pos: { x: (Math.random() * 200) - 100, y: 100 + Math.random() * 40 },
            radius: 12,
            color: '#FACC15', // Yellow
            vel: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 }
        });
    }

    // 1 Large Red Sticky Ball at Top
    balls.push({
        pos: { x: 0, y: -120 },
        radius: 30,
        color: '#EF4444', // Red
        stickiness: 0.5, // Sticky edges
        vel: { x: 0, y: 0 }
    });

    // 20 Smaller Purple Domes (Balls) scattered
    for (let i = 0; i < 20; i++) {
        balls.push({
            pos: { x: (Math.random() * 240) - 120, y: (Math.random() * 240) - 120 },
            radius: 6,
            color: '#A855F7', // Purple
            vel: { x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 4 }
        });
    }
    
    return balls;
};

export const presets: SimulationConfig[] = [
  {
    ...baseConfig,
    id: 20,
    name: "Earth Shaker",
    shapeType: 'square',
    gravity: 1.0, // 1g down
    rotationMode: 'oscillate',
    oscillationAmplitude: 0.61, // ~35 degrees
    rotationSpeed: 0.3, // Used as frequency
    ballCount: 31,
    nuanceDescription: "1g gravity. Container oscillates 35° L/R. Sticky red ball at top.",
    initialBalls: getShakerBalls(),
  },
  {
    ...baseConfig,
    id: 21,
    name: "Lunar Shaker",
    shapeType: 'square',
    gravity: 0.16, // 0.16g
    rotationMode: 'oscillate',
    oscillationAmplitude: 0.61, // ~35 degrees
    rotationSpeed: 0.3,
    ballCount: 31,
    nuanceDescription: "Moon gravity (0.16g). Oscillating container with mixed balls.",
    initialBalls: getShakerBalls(),
  },
  {
    ...baseConfig,
    id: 22,
    name: "Space Shaker",
    shapeType: 'square',
    gravity: 0.0, // Microgravity
    rotationMode: 'oscillate',
    oscillationAmplitude: 0.61, // ~35 degrees
    rotationSpeed: 0.3,
    ballCount: 31,
    nuanceDescription: "Zero gravity. Oscillating container creates artificial chaos.",
    initialBalls: getShakerBalls(),
  },
  {
    ...baseConfig,
    id: 1,
    name: "Standard Square",
    shapeType: 'square',
    nuanceDescription: "Classic physics. Moderate gravity and bounce.",
    rotationSpeed: 0.005,
  },
  {
    ...baseConfig,
    id: 2,
    name: "High Gravity Triangle",
    shapeType: 'triangle',
    vertexCount: 3,
    gravity: 0.5,
    restitution: 0.6,
    nuanceDescription: "Heavy balls in a tight space.",
    ballCount: 2,
  },
  {
    ...baseConfig,
    id: 3,
    name: "Zero-G Hexagon",
    shapeType: 'hexagon',
    vertexCount: 6,
    gravity: 0,
    friction: 0,
    restitution: 1.0,
    ballCount: 6,
    nuanceDescription: "No gravity, perfect energy conservation.",
    rotationSpeed: 0.01,
  },
  {
    ...baseConfig,
    id: 4,
    name: "Fast Spin Octagon",
    shapeType: 'octagon',
    vertexCount: 8,
    rotationSpeed: 0.04,
    gravity: 0.1,
    ballCount: 15,
    ballSize: 4,
    nuanceDescription: "Centrifugal chaos with many small particles.",
  },
  {
    ...baseConfig,
    id: 5,
    name: "Sticky Pentagon",
    shapeType: 'pentagon',
    vertexCount: 5,
    restitution: 0.4,
    friction: 0.05,
    stickiness: 0.05,
    nuanceDescription: "Low bounciness, balls tend to roll.",
  },
  {
    ...baseConfig,
    id: 7,
    name: "Reverse Gravity",
    shapeType: 'square',
    gravity: -0.1,
    ballCount: 5,
    nuanceDescription: "Gravity pulls upwards.",
  },
  {
    ...baseConfig,
    id: 8,
    name: "Heavy Friction",
    shapeType: 'hexagon',
    friction: 0.1,
    restitution: 0.5,
    rotationSpeed: 0.02,
    nuanceDescription: "Balls slow down rapidly in air.",
  },
  {
    ...baseConfig,
    id: 9,
    name: "Swarm",
    shapeType: 'octagon',
    ballCount: 40,
    ballSize: 2,
    gravity: 0.05,
    nuanceDescription: "Massive amount of tiny particles.",
  },
  {
    ...baseConfig,
    id: 10,
    name: "Slow Motion",
    shapeType: 'pentagon',
    initialSpeed: 1,
    gravity: 0.02,
    rotationSpeed: 0.002,
    nuanceDescription: "Everything moves at a glacial pace.",
  },
  {
    ...baseConfig,
    id: 11,
    name: "Hyper Speed",
    shapeType: 'triangle',
    initialSpeed: 15,
    gravity: 0.3,
    restitution: 0.9,
    nuanceDescription: "High velocity impacts.",
  },
  {
    ...baseConfig,
    id: 12,
    name: "Heavy Ball",
    shapeType: 'square',
    ballCount: 1,
    ballSize: 25,
    gravity: 0.4,
    nuanceDescription: "One massive ball dominates the space.",
  },
  {
    ...baseConfig,
    id: 13,
    name: "Reverse Spin",
    shapeType: 'hexagon',
    rotationSpeed: -0.03,
    ballCount: 4,
    nuanceDescription: "Shape rotates counter-clockwise quickly.",
  },
  {
    ...baseConfig,
    id: 16,
    name: "Horizontal Gravity",
    shapeType: 'square',
    gravity: 0, 
    restitution: 0.95,
    ballCount: 4,
    nuanceDescription: "Near perpetual motion machine.",
  },
  {
    ...baseConfig,
    id: 17,
    name: "Crowded House",
    shapeType: 'triangle',
    ballCount: 10,
    ballSize: 10,
    nuanceDescription: "Too many large balls for this shape.",
  },
  {
    ...baseConfig,
    id: 18,
    name: "Nano Bots",
    shapeType: 'hexagon',
    ballCount: 50,
    ballSize: 1.5,
    gravity: 0,
    initialSpeed: 8,
    nuanceDescription: "Cloud of tiny particles in zero G.",
  },
  {
    ...baseConfig,
    id: 19,
    name: "Lazy Spinner",
    shapeType: 'octagon',
    rotationSpeed: 0.001,
    gravity: 0.2,
    ballCount: 5,
    nuanceDescription: "Barely rotating container.",
  },
];
