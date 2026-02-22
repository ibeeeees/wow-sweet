// ============================================================
// SweetReturns — Crowd Rendering: Oompa Loompa agents
// Based on Willy Wonka's classic Oompa Loompas:
//   - Green curly hair (tall puff)
//   - Orange/brown skin face
//   - Brown chocolate shirt with white striped collar
//   - White puffy overalls / pants
//   - Brown arms (sleeves) with white glove hands
//   - Brown shoes
// 10 InstancedMeshes = 10 draw calls total for all 10,000 agents
// ============================================================

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useCrowdSimulation } from '../hooks/useCrowdSimulation.ts';
import { useStore } from '../store/useStore.ts';

// Agent state constants (must match useCrowdSimulation.ts)
const STATE_INSIDE = 3;
const STATE_DOOR_FIGHTING = 2;

export function CrowdSimulation() {
  const { positions, velocities, states, count, featuredAgents, storeAgentCounts, storeDoorCounts, storeLaneCounts, update } = useCrowdSimulation();
  const setStoreCrowdData = useStore((s) => s.setStoreCrowdData);
  const crowdFrameRef = useRef(0);
  const [bubbles, setBubbles] = useState<Array<{
    x: number; y: number; z: number;
    name: string; action: string; reasoning: string; ticker: string;
  }>>([]);

  // Refs for all body parts (10 InstancedMeshes)
  const overallsRef = useRef<THREE.InstancedMesh>(null);
  const shirtRef = useRef<THREE.InstancedMesh>(null);
  const headRef = useRef<THREE.InstancedMesh>(null);
  const hairRef = useRef<THREE.InstancedMesh>(null);
  const leftLegRef = useRef<THREE.InstancedMesh>(null);
  const rightLegRef = useRef<THREE.InstancedMesh>(null);
  const leftArmRef = useRef<THREE.InstancedMesh>(null);
  const rightArmRef = useRef<THREE.InstancedMesh>(null);
  const leftShoeRef = useRef<THREE.InstancedMesh>(null);
  const rightShoeRef = useRef<THREE.InstancedMesh>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // ── Geometry ──────────────────────────────────────────────────────
  // White puffy overalls (wide, short — the iconic baggy pants)
  const overallsGeo = useMemo(() => new THREE.CapsuleGeometry(0.14, 0.10, 4, 8), []);
  // Brown chocolate shirt (slightly narrower, sits above overalls)
  const shirtGeo = useMemo(() => new THREE.CapsuleGeometry(0.11, 0.12, 4, 8), []);
  // Orange Oompa Loompa head
  const headGeo = useMemo(() => new THREE.SphereGeometry(0.085, 6, 6), []);
  // Green hair — taller puff (ellipsoid via scale)
  const hairGeo = useMemo(() => new THREE.SphereGeometry(0.09, 6, 5), []);
  // Legs: white puffy pant legs
  const legGeo = useMemo(() => new THREE.CapsuleGeometry(0.04, 0.10, 3, 6), []);
  // Arms: brown chocolate sleeves
  const armGeo = useMemo(() => new THREE.CapsuleGeometry(0.025, 0.12, 3, 6), []);
  // Shoes: brown rounded
  const shoeGeo = useMemo(() => new THREE.SphereGeometry(0.035, 4, 4), []);

  // ── Materials — Oompa Loompa palette ─────────────────────────────
  // Overalls: per-instance color (white normally, golden for featured/AI agents)
  const overallsMat = useMemo(() => new THREE.MeshLambertMaterial(), []);
  // Brown chocolate shirt
  const shirtMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#5C3317' }), []);
  // Orange skin
  const headMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#D4721A' }), []);
  // Green hair
  const hairMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#228B22' }), []);
  // White puffy pants
  const legMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#F0EDE5' }), []);
  // Brown sleeves (same as shirt)
  const armMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#5C3317' }), []);
  // Dark brown shoes
  const shoeMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#3D1C02' }), []);

  useFrame((_state, delta) => {
    if (!bodyRef.current || !headRef.current || !hairRef.current
      || !leftLegRef.current || !rightLegRef.current || count === 0) return;

    // Run physics
    update(delta);

    const overallsMesh = overallsRef.current;
    const shirtMesh = shirtRef.current;
    const headMesh = headRef.current;
    const hairMesh = hairRef.current;
    const leftLeg = leftLegRef.current;
    const rightLeg = rightLegRef.current;
    const leftArm = leftArmRef.current;
    const rightArm = rightArmRef.current;
    const leftShoe = leftShoeRef.current;
    const rightShoe = rightShoeRef.current;
    const time = _state.clock.elapsedTime;

    // Ensure instanceColor on overalls (white with per-agent variation)
    if (!overallsMesh.instanceColor) {
      overallsMesh.instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(count * 3), 3,
      );
    }

    const overallsColorArray = overallsMesh.instanceColor.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const px = positions[i3];
      const pz = positions[i3 + 2];
      const state = states[i];

      // ── Agents inside stores — idle standing ──────────────────
      if (state === STATE_INSIDE) {
        const idlePhase = time * 2 + i * 1.3;
        const idleSway = Math.sin(idlePhase) * 0.008;
        const baseY = 0.22;

        // White overalls (lower torso / puffy pants)
        dummy.position.set(px + idleSway, baseY - 0.02, pz);
        dummy.scale.set(1, 1, 1);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        overallsMesh.setMatrixAt(i, dummy.matrix);

        // Brown chocolate shirt (upper torso)
        dummy.position.set(px + idleSway, baseY + 0.16, pz);
        dummy.updateMatrix();
        shirtMesh.setMatrixAt(i, dummy.matrix);

        // Orange head
        dummy.position.set(px + idleSway, baseY + 0.32, pz);
        dummy.updateMatrix();
        headMesh.setMatrixAt(i, dummy.matrix);

        // Green hair puff (tall, slightly squished — iconic curly volume)
        dummy.position.set(px + idleSway, baseY + 0.44, pz);
        dummy.scale.set(0.9, 0.7, 0.9);
        dummy.updateMatrix();
        hairMesh.setMatrixAt(i, dummy.matrix);

        // Legs (standing still)
        dummy.scale.set(1, 1, 1);
        dummy.position.set(px - 0.05 + idleSway, baseY - 0.16, pz);
        dummy.updateMatrix();
        leftLeg.setMatrixAt(i, dummy.matrix);
        dummy.position.set(px + 0.05 + idleSway, baseY - 0.16, pz);
        dummy.updateMatrix();
        rightLeg.setMatrixAt(i, dummy.matrix);

        // Arms (resting at sides)
        dummy.position.set(px - 0.14 + idleSway, baseY + 0.12, pz);
        dummy.rotation.set(0, 0, 0.15); // slight outward angle
        dummy.updateMatrix();
        leftArm.setMatrixAt(i, dummy.matrix);
        dummy.position.set(px + 0.14 + idleSway, baseY + 0.12, pz);
        dummy.rotation.set(0, 0, -0.15);
        dummy.updateMatrix();
        rightArm.setMatrixAt(i, dummy.matrix);

        // Shoes
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1.0, 0.6, 1.3); // flattened, elongated
        dummy.position.set(px - 0.05 + idleSway, baseY - 0.24, pz);
        dummy.updateMatrix();
        leftShoe.setMatrixAt(i, dummy.matrix);
        dummy.position.set(px + 0.05 + idleSway, baseY - 0.24, pz);
        dummy.updateMatrix();
        rightShoe.setMatrixAt(i, dummy.matrix);

        // White overalls color
        overallsColorArray[i3] = 0.94;
        overallsColorArray[i3 + 1] = 0.91;
        overallsColorArray[i3 + 2] = 0.87;
        continue;
      }

      // ── Rushing / Door-fighting agents — animated ─────────────
      const phase = time * 8 + i * 1.7;
      const runBob = Math.abs(Math.sin(phase)) * 0.04;
      const legSwing = Math.sin(phase) * 0.4;
      const armSwing = Math.sin(phase) * 0.5; // arms swing opposite to legs
      const isFighting = state === STATE_DOOR_FIGHTING;

      const fightBob = isFighting ? Math.sin(time * 12 + i * 2.3) * 0.03 : 0;
      const baseY = 0.22;
      const y = baseY + runBob + fightBob;

      // Facing direction from velocity
      const vx = velocities[i3];
      const vz = velocities[i3 + 2];
      const speed = Math.sqrt(vx * vx + vz * vz);
      const facingAngle = speed > 0.1 ? Math.atan2(vx, vz) : 0;

      // Forward lean proportional to speed
      const lean = isFighting ? 0.2 : Math.min(0.15, speed * 0.02);

      // Facing offsets for legs/arms
      const sinF = Math.sin(facingAngle);
      const cosF = Math.cos(facingAngle);

      // White puffy overalls (lower torso)
      dummy.position.set(px, y - 0.02, pz);
      dummy.scale.set(1, 1, 1);
      dummy.rotation.set(lean * 0.5, facingAngle, 0);
      dummy.updateMatrix();
      overallsMesh.setMatrixAt(i, dummy.matrix);

      // Brown chocolate shirt (upper torso)
      dummy.position.set(px, y + 0.16, pz);
      dummy.rotation.set(lean, facingAngle, 0);
      dummy.updateMatrix();
      shirtMesh.setMatrixAt(i, dummy.matrix);

      // Orange Oompa Loompa head
      dummy.position.set(px, y + 0.32, pz);
      dummy.rotation.set(0, facingAngle, 0);
      dummy.updateMatrix();
      headMesh.setMatrixAt(i, dummy.matrix);

      // Green hair puff (tall, bouncing)
      const hairBob = Math.sin(phase * 0.5) * 0.012;
      dummy.position.set(px, y + 0.44 + hairBob, pz);
      dummy.scale.set(0.9, 0.7, 0.9);
      dummy.rotation.set(0, facingAngle, 0);
      dummy.updateMatrix();
      hairMesh.setMatrixAt(i, dummy.matrix);

      // Left leg (forward swing)
      const llx = px + sinF * (-0.05);
      const llz = pz + cosF * (-0.05);
      dummy.position.set(llx, y - 0.16, llz);
      dummy.rotation.set(legSwing, facingAngle, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      leftLeg.setMatrixAt(i, dummy.matrix);

      // Right leg (opposite swing)
      const rlx = px + sinF * 0.05;
      const rlz = pz + cosF * 0.05;
      dummy.position.set(rlx, y - 0.16, rlz);
      dummy.rotation.set(-legSwing, facingAngle, 0);
      dummy.updateMatrix();
      rightLeg.setMatrixAt(i, dummy.matrix);

      // Left arm (swing opposite to left leg — natural running motion)
      const lax = px + cosF * (-0.14) + sinF * 0.02;
      const laz = pz - sinF * (-0.14) + cosF * 0.02;
      dummy.position.set(lax, y + 0.12, laz);
      dummy.rotation.set(-armSwing, facingAngle, 0.2);
      dummy.updateMatrix();
      leftArm.setMatrixAt(i, dummy.matrix);

      // Right arm (swing opposite to right leg)
      const rax = px + cosF * 0.14 + sinF * 0.02;
      const raz = pz - sinF * 0.14 + cosF * 0.02;
      dummy.position.set(rax, y + 0.12, raz);
      dummy.rotation.set(armSwing, facingAngle, -0.2);
      dummy.updateMatrix();
      rightArm.setMatrixAt(i, dummy.matrix);

      // Left shoe (follows left leg)
      const lsSwing = Math.sin(phase) * 0.08; // forward/back with leg
      dummy.position.set(llx + sinF * lsSwing, y - 0.24, llz + cosF * lsSwing);
      dummy.rotation.set(0, facingAngle, 0);
      dummy.scale.set(1.0, 0.6, 1.3);
      dummy.updateMatrix();
      leftShoe.setMatrixAt(i, dummy.matrix);

      // Right shoe (follows right leg)
      const rsSwing = -Math.sin(phase) * 0.08;
      dummy.position.set(rlx + sinF * rsSwing, y - 0.24, rlz + cosF * rsSwing);
      dummy.updateMatrix();
      rightShoe.setMatrixAt(i, dummy.matrix);

      // White overalls color (slight per-agent warmth variation)
      const warmth = ((i * 7) % 13) / 130;
      overallsColorArray[i3] = 0.94 + warmth;
      overallsColorArray[i3 + 1] = 0.91;
      overallsColorArray[i3 + 2] = 0.87 - warmth;
    }

    // Highlight featured (Gemini-powered) agents with golden overalls
    for (const agent of featuredAgents) {
      const idx = agent.index;
      if (idx < count) {
        overallsColorArray[idx * 3] = 1.0;
        overallsColorArray[idx * 3 + 1] = 0.84;
        overallsColorArray[idx * 3 + 2] = 0.0;
      }
    }

    overallsMesh.instanceMatrix.needsUpdate = true;
    overallsMesh.instanceColor.needsUpdate = true;
    shirtMesh.instanceMatrix.needsUpdate = true;
    headMesh.instanceMatrix.needsUpdate = true;
    hairMesh.instanceMatrix.needsUpdate = true;
    leftLeg.instanceMatrix.needsUpdate = true;
    rightLeg.instanceMatrix.needsUpdate = true;
    leftArm.instanceMatrix.needsUpdate = true;
    rightArm.instanceMatrix.needsUpdate = true;
    leftShoe.instanceMatrix.needsUpdate = true;
    rightShoe.instanceMatrix.needsUpdate = true;

    // Push per-store crowd data to Zustand every 60 frames (~1s)
    crowdFrameRef.current++;
    if (crowdFrameRef.current % 60 === 0) {
      setStoreCrowdData(storeAgentCounts, storeDoorCounts, storeLaneCounts);
    }

    // Update thought bubbles every 30 frames
    if (Math.floor(time * 60) % 30 === 0) {
      const newBubbles = featuredAgents
        .filter((a) => a.decision && Date.now() - a.lastUpdated < 15000 && a.index < count)
        .slice(0, 5)
        .map((a) => ({
          x: positions[a.index * 3],
          y: 1.2,
          z: positions[a.index * 3 + 2],
          name: a.name,
          action: a.decision!.action,
          reasoning: a.decision!.reasoning,
          ticker: a.decision!.targetTicker,
        }));
      setBubbles(newBubbles);
    }
  });

  if (count === 0) return null;

  const actionColors: Record<string, string> = {
    BUY: '#00FF7F', CALL: '#00BFFF', PUT: '#FFD700', SHORT: '#FF4500',
  };

  return (
    <group>
      {/* White puffy overalls (lower torso) */}
      <instancedMesh ref={overallsRef} args={[overallsGeo, overallsMat, count]} frustumCulled={false} />
      {/* Brown chocolate shirt (upper torso) */}
      <instancedMesh ref={shirtRef} args={[shirtGeo, shirtMat, count]} frustumCulled={false} />
      {/* Orange Oompa Loompa head */}
      <instancedMesh ref={headRef} args={[headGeo, headMat, count]} frustumCulled={false} />
      {/* Green curly hair puff */}
      <instancedMesh ref={hairRef} args={[hairGeo, hairMat, count]} frustumCulled={false} />
      {/* White puffy pant legs */}
      <instancedMesh ref={leftLegRef} args={[legGeo, legMat, count]} frustumCulled={false} />
      <instancedMesh ref={rightLegRef} args={[legGeo, legMat, count]} frustumCulled={false} />
      {/* Brown chocolate sleeve arms */}
      <instancedMesh ref={leftArmRef} args={[armGeo, armMat, count]} frustumCulled={false} />
      <instancedMesh ref={rightArmRef} args={[armGeo, armMat, count]} frustumCulled={false} />
      {/* Dark brown shoes */}
      <instancedMesh ref={leftShoeRef} args={[shoeGeo, shoeMat, count]} frustumCulled={false} />
      <instancedMesh ref={rightShoeRef} args={[shoeGeo, shoeMat, count]} frustumCulled={false} />

      {/* Gemini AI thought bubbles */}
      {bubbles.map((b, i) => (
        <Html key={i} position={[b.x, b.y, b.z]} center
          style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div style={{
            background: 'rgba(10, 8, 20, 0.92)',
            border: `1px solid ${actionColors[b.action] || '#FFD700'}`,
            borderRadius: 8,
            padding: '6px 10px',
            maxWidth: 180,
            fontFamily: "'Leckerli One', cursive",
            fontSize: 10,
            lineHeight: 1.3,
            color: '#fff',
            boxShadow: `0 0 12px ${actionColors[b.action] || '#FFD700'}44`,
          }}>
            <div style={{ fontWeight: 700, color: '#FFFFFF', marginBottom: 2 }}>
              {b.name} <span style={{ color: actionColors[b.action], fontSize: 9 }}>{b.action}</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9 }}>
              {b.ticker}: {b.reasoning}
            </div>
          </div>
        </Html>
      ))}
    </group>
  );
}
