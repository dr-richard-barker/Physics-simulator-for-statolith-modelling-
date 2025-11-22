
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useEffect, useState } from 'react';
import { SimulationConfig, GlobalSettings, Ball, Vector2 } from '../types';
import { generatePolygon, generateStar, add, mult, dot, sub, normalize, mag } from '../utils/math';

interface CanvasProps {
  config: SimulationConfig;
  globalSettings: GlobalSettings;
}

const Canvas: React.FC<CanvasProps> = ({ config, globalSettings }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const userImageRef = useRef<HTMLImageElement | null>(null);
  
  // Interaction State
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef<{x: number, y: number} | null>(null);
  const manualRotationOffset = useRef<number>(0);

  const stateRef = useRef<{
    balls: Ball[];
    rotation: number;
    time: number;
  }>({
    balls: [],
    rotation: 0,
    time: 0,
  });

  // Handle user image loading
  useEffect(() => {
    if (globalSettings.userImage) {
        const img = new Image();
        img.src = globalSettings.userImage;
        img.onload = () => {
            userImageRef.current = img;
        };
        img.onerror = () => {
            userImageRef.current = null;
        }
    } else {
        userImageRef.current = null;
    }
  }, [globalSettings.userImage]);

  // Initialize Simulation
  useEffect(() => {
    // Reset manual rotation on config change
    manualRotationOffset.current = 0;

    let balls: Ball[] = [];
    
    if (config.initialBalls && config.initialBalls.length > 0) {
        // Use detected or preset balls
        balls = config.initialBalls.map((b, i) => ({
            id: `${config.id}-${i}`,
            pos: { x: b.pos!.x, y: b.pos!.y },
            vel: { x: b.vel?.x || 0, y: b.vel?.y || 0 },
            radius: b.radius || config.ballSize,
            color: b.color || '#FACC15',
            stickiness: b.stickiness,
            restitution: b.restitution
        }));
    } else {
        // Generate Random balls
        const count = Math.floor(config.ballCount * 1); 
        
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * 30;
          const speed = config.initialSpeed * (0.5 + Math.random());
          const velAngle = Math.random() * Math.PI * 2;

          balls.push({
            id: `${config.id}-${i}`,
            pos: { x: 0 + Math.cos(angle) * dist, y: 0 + Math.sin(angle) * dist },
            vel: { x: Math.cos(velAngle) * speed, y: Math.sin(velAngle) * speed },
            radius: config.ballSize,
            color: '#FACC15', 
          });
        }
    }

    stateRef.current = {
      balls,
      rotation: 0,
      time: 0,
    };
  }, [config.id, config.ballCount, config.initialSpeed, config.ballSize, config.initialBalls]);

  const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging || !lastMousePos.current) return;
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calculate angle delta
      const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      const lastAngle = Math.atan2(lastMousePos.current.y - centerY, lastMousePos.current.x - centerX);
      
      let delta = currentAngle - lastAngle;
      
      // Normalize delta to avoid jumps when crossing -PI/PI
      if (delta > Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;

      manualRotationOffset.current += delta;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
      setIsDragging(false);
      lastMousePos.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
          manualRotationOffset.current -= 0.1;
      } else if (e.key === 'ArrowRight') {
          manualRotationOffset.current += 0.1;
      }
  };

  const updatePhysics = (width: number, height: number) => {
    const state = stateRef.current;
    const { gravityMultiplier, timeScale, rotationMultiplier, bouncinessMultiplier, stickinessMultiplier } = globalSettings;
    
    const shapeRadius = Math.min(width, height) * 0.45;

    // 1. Update Rotation
    // Base rotation + Manual Interaction offset
    if (config.rotationMode === 'oscillate') {
        state.time += 0.02 * timeScale * rotationMultiplier;
        const amp = config.oscillationAmplitude || 0.6; // default approx 35 deg
        // Use rotationSpeed as frequency here
        const freq = config.rotationSpeed * 10; 
        state.rotation = Math.sin(state.time * freq) * amp;
    } else {
        const autoRotation = config.rotationSpeed * rotationMultiplier * timeScale;
        state.rotation += autoRotation;
    }
    
    // The effective rotation for collision logic needs to include the manual offset
    const totalRotation = state.rotation + manualRotationOffset.current;

    // 2. Generate Shape Vertices (Local Space relative to 0,0)
    let localVertices: Vector2[] = [];
    
    if (config.customPolygon) {
        // If custom polygon, rotate the base points
        // Custom polygon points are assumed to be centered at 0,0
        localVertices = config.customPolygon.map(p => {
            const cos = Math.cos(totalRotation);
            const sin = Math.sin(totalRotation);
            return {
                x: p.x * cos - p.y * sin,
                y: p.x * sin + p.y * cos
            };
        });
    } else if (config.shapeType === 'star') {
         localVertices = generateStar(config.vertexCount || 5, shapeRadius, shapeRadius * 0.4, {x:0,y:0}, totalRotation);
    } else {
         localVertices = generatePolygon(config.vertexCount || 4, shapeRadius, {x:0,y:0}, totalRotation);
    }

    // 3. Update Balls
    state.balls.forEach(ball => {
        // Apply Forces & Velocity
        ball.vel.y += config.gravity * gravityMultiplier * timeScale;
        ball.vel = mult(ball.vel, 1 - config.friction * timeScale);
        ball.pos = add(ball.pos, mult(ball.vel, timeScale));

        // Collision with Walls
        const restitution = (ball.restitution ?? config.restitution) * bouncinessMultiplier;
        // Use ball specific stickiness if defined, otherwise global/config
        const ballStickiness = ball.stickiness !== undefined ? ball.stickiness : config.stickiness;
        const effectiveStickiness = ballStickiness * (stickinessMultiplier || 1);

        for (let i = 0; i < localVertices.length; i++) {
            const p1 = localVertices[i];
            const p2 = localVertices[(i + 1) % localVertices.length];
            const edge = sub(p2, p1);
            
            // Calculate normal pointing inward
            let edgeNormal = normalize({ x: -edge.y, y: edge.x }); 
            if (dot(sub({x:0,y:0}, p1), edgeNormal) < 0) {
                 edgeNormal = mult(edgeNormal, -1);
            }

            const relPos = sub(ball.pos, p1);
            const dist = dot(relPos, edgeNormal);
            
            // Check for Stickiness/Attraction range (slightly larger than collision)
            // If stickiness is high, we apply a force opposing the normal (pulling towards wall)
            if (effectiveStickiness > 0 && dist < ball.radius + 20) {
                // Force points towards wall (opposite to normal)
                // Strength increases as it gets closer
                const attractionStrength = effectiveStickiness * 0.5 * timeScale; 
                const attraction = mult(edgeNormal, -attractionStrength);
                ball.vel = add(ball.vel, attraction);
            }

            if (dist < ball.radius) {
                // Position correction
                const penetration = ball.radius - dist;
                ball.pos = add(ball.pos, mult(edgeNormal, penetration));

                // Reflect Velocity
                const velDotNormal = dot(ball.vel, edgeNormal);
                if (velDotNormal < 0) {
                    const reflect = mult(edgeNormal, 2 * velDotNormal);
                    ball.vel = sub(ball.vel, mult(reflect, 1));
                    
                    // If very sticky, reduce velocity significantly on impact too
                    const bounceFactor = Math.max(0, restitution - effectiveStickiness);
                    ball.vel = mult(ball.vel, bounceFactor);
                    
                    // Nudge to prevent sticking
                    ball.vel = add(ball.vel, mult(edgeNormal, 0.1));
                }
            }
        }
    });

    // 4. Ball-to-Ball Collisions
    const balls = state.balls;
    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            const ballA = balls[i];
            const ballB = balls[j];

            const distVec = sub(ballB.pos, ballA.pos);
            const distance = mag(distVec);
            const totalRadius = ballA.radius + ballB.radius;

            if (distance < totalRadius) {
                // Position Correction
                const overlap = totalRadius - distance;
                const correctionNormal = distance === 0 ? {x: 1, y: 0} : normalize(distVec);
                const correctionA = mult(correctionNormal, -overlap / 2);
                const correctionB = mult(correctionNormal, overlap / 2);
                ballA.pos = add(ballA.pos, correctionA);
                ballB.pos = add(ballB.pos, correctionB);

                // Velocity Update
                const collisionNormal = normalize(distVec);
                const relativeVelocity = sub(ballB.vel, ballA.vel);
                const speedAlongNormal = dot(relativeVelocity, collisionNormal);

                if (speedAlongNormal < 0) {
                    const v1n_scalar = dot(ballA.vel, collisionNormal);
                    const v2n_scalar = dot(ballB.vel, collisionNormal);

                    const v1n_vec = mult(collisionNormal, v1n_scalar);
                    const v2n_vec = mult(collisionNormal, v2n_scalar);
                    
                    const v1t_vec = sub(ballA.vel, v1n_vec);
                    const v2t_vec = sub(ballB.vel, v2n_vec);

                    ballA.vel = add(v1t_vec, v2n_vec);
                    ballB.vel = add(v2t_vec, v1n_vec);
                }
            }
        }
    }

    // Bounds Check
    const limit = config.customPolygon ? Math.max(width, height) : shapeRadius + 50;
    balls.forEach(ball => {
      if (mag(ball.pos) > limit) {
           ball.pos = {x: 0, y: 0};
           ball.vel = {x: 0, y: 0};
      }
    });
  };

  const draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    
    const center = { x: width / 2, y: height / 2 };
    const state = stateRef.current;
    const shapeRadius = Math.min(width, height) * 0.45;
    const totalRotation = state.rotation + manualRotationOffset.current;

    // Draw Shape
    let points: Vector2[] = [];
    if (config.customPolygon) {
        points = config.customPolygon.map(p => {
            const cos = Math.cos(totalRotation);
            const sin = Math.sin(totalRotation);
            return {
                x: center.x + (p.x * cos - p.y * sin),
                y: center.y + (p.x * sin + p.y * cos)
            };
        });
    } else if (config.shapeType === 'star') {
         points = generateStar(config.vertexCount || 5, shapeRadius, shapeRadius * 0.4, center, totalRotation);
    } else {
         points = generatePolygon(config.vertexCount || 4, shapeRadius, center, totalRotation);
    }

    ctx.beginPath();
    if (points.length > 0) {
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
    }
    
    // Style Shape
    ctx.strokeStyle = '#22D3EE'; // cyan-400
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.fillStyle = 'rgba(34, 211, 238, 0.05)';
    ctx.fill();

    // Draw Balls
    state.balls.forEach(ball => {
        const screenX = center.x + ball.pos.x;
        const screenY = center.y + ball.pos.y;

        ctx.beginPath();
        ctx.arc(screenX, screenY, ball.radius, 0, Math.PI * 2);
        ctx.closePath();
        
        if (userImageRef.current) {
            ctx.save();
            ctx.clip();
            ctx.drawImage(userImageRef.current, screenX - ball.radius, screenY - ball.radius, ball.radius * 2, ball.radius * 2);
            ctx.restore();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        } else {
            ctx.fillStyle = ball.color;
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    });
  };

  const tick = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { clientWidth, clientHeight } = canvas;
    if (canvas.width !== clientWidth || canvas.height !== clientHeight) {
        canvas.width = clientWidth;
        canvas.height = clientHeight;
    }

    updatePhysics(canvas.width, canvas.height);
    draw(ctx, canvas.width, canvas.height);
    requestRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tick);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [globalSettings, config]); // Dependencies

  return (
    <canvas 
        ref={canvasRef} 
        className={`w-full h-full block outline-none ${config.customPolygon || isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        tabIndex={0} // Make focusable for keyboard
        onKeyDown={handleKeyDown}
        title="Drag to rotate shape, Arrow keys to fine-tune"
    />
  );
};

export default Canvas;
