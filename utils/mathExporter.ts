
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { SimulationConfig, GlobalSettings } from '../types';

export const generateMathSummary = (config: SimulationConfig, globalSettings: GlobalSettings): string => {
  const gTotal = config.gravity * globalSettings.gravityMultiplier;
  const fricTotal = config.friction; // Friction is often not scaled globally in the same way in this engine, simplified
  const restTotal = config.restitution * globalSettings.bouncinessMultiplier;
  const rotTotal = config.rotationSpeed * globalSettings.rotationMultiplier;
  
  const isOscillating = config.rotationMode === 'oscillate';

  return `MATHEMATICAL MODEL SUMMARY
==========================
Simulation: ${config.name}
ID: ${config.id}

1. SYSTEM PARAMETERS
--------------------
• Particle Count (N): ${config.ballCount}
• Container Geometry: ${config.shapeType.charAt(0).toUpperCase() + config.shapeType.slice(1)} (${config.vertexCount || config.customPolygon?.length || 0} vertices)
• Gravity Vector (g): [0, ${gTotal.toFixed(4)}] units/frame²
• Coeff. of Restitution (e): ${restTotal.toFixed(4)} (Elasticity)
• Drag Coefficient (μ): ${fricTotal.toFixed(4)} (Air Resistance)
• Stickiness Factor (k): ${(config.stickiness || 0).toFixed(4)}

2. KINEMATICS (Discrete Time Integration)
-----------------------------------------
The simulation evolves the state of each particle $i$ using semi-implicit Euler integration:

   v[t+1] = v[t] * (1 - μ) + g * Δt
   p[t+1] = p[t] + v[t+1] * Δt * TimeScale

   Where:
   • v is velocity vector
   • p is position vector
   • Δt is the time step (approx 16ms at 60fps)

3. BOUNDARY DYNAMICS (Container)
--------------------------------
${isOscillating 
? `The container oscillates using a sine wave function:
   θ(t) = sin(t * ω) * A
   
   Where:
   • Frequency (ω): ${(config.rotationSpeed * 10).toFixed(4)}
   • Amplitude (A): ${config.oscillationAmplitude?.toFixed(4) || 0} radians`
: `The container rotates with constant angular velocity:
   θ(t) = θ(0) + ω * t
   
   Where:
   • Angular Velocity (ω): ${rotTotal.toFixed(5)} rad/frame`}

4. COLLISION RESOLUTION
-----------------------
A. Wall Collisions:
   For each edge defined by vertices V_j and V_{j+1}, we calculate the signed distance (d) 
   from particle position (p) to the edge plane with normal (n).

   If d < radius (r):
     1. Position Correction: p' = p + n * (r - d)
     2. Velocity Reflection: v' = v - (1 + e) * (v · n) * n
     ${(config.stickiness || 0) > 0 ? `3. Adhesion Force: v'' = v' + (n * -k * 0.5) (Attraction due to stickiness)` : ''}

B. Particle-Particle Collisions:
   For any pair of particles i, j with distance d_ij < (r_i + r_j):
   
   1. Impulse Normal: n_ij = (p_j - p_i) / |p_j - p_i|
   2. Relative Velocity: v_rel = v_j - v_i
   3. Impulse Magnitude (J): 
      J = -(1 + e) * (v_rel · n_ij) / (1/m_i + 1/m_j)
   
   (Assuming uniform mass m=1 for standard particles)

5. INITIAL CONDITIONS
---------------------
• Initial Speed Range: 0 to ${config.initialSpeed.toFixed(2)} units/frame
• Distribution: ${config.initialBalls ? 'Pre-defined Cartesian coordinates' : 'Radial Random Distribution'}
`;
};
