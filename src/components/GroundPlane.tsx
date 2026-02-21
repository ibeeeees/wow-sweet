// ============================================================
// SweetReturns — GroundPlane: Chocolate ground (no sector zones)
// ============================================================

export default function GroundPlane() {
  return (
    <group>
      {/* Main chocolate ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[1500, 1500]} />
        <meshStandardMaterial color="#3E2723" roughness={0.9} />
      </mesh>
    </group>
  );
}
