// ============================================================
// SweetReturns — GroundPlane: Chocolate ground (no sector zones)
// ============================================================

export default function GroundPlane() {
  return (
    <group>
      {/* Main chocolate ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[180, 310]} />
        <meshStandardMaterial color="#001A4D" roughness={0.9} />
      </mesh>
    </group>
  );
}
