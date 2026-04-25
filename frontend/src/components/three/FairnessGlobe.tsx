'use client'

import { Canvas } from '@react-three/fiber'
import { Html, OrbitControls, Sphere, Stars } from '@react-three/drei'

const basePositions: Array<[number, number, number]> = [
  [0.9, 0.6, 1.6],
  [-1.3, -0.4, 1.3],
  [1.4, -1.1, 0.9],
  [-0.6, 1.2, 1.2],
  [1.1, 1.1, 1.1],
  [-1.1, -1.1, 1.0],
]

type GlobeNode = { label: string; value: number }

export function FairnessGlobe({ nodes = [] }: { nodes?: GlobeNode[] }) {
  const hotspots = (nodes.length ? nodes : [{ label: 'Overall', value: 0 }]).slice(0, basePositions.length).map((node, idx) => {
    const intensity = Math.min(2.4, 0.6 + Math.abs(node.value) * 3)
    return {
      position: basePositions[idx],
      label: node.label,
      intensity,
    }
  })

  return (
    <div className="h-[320px] w-full">
      <Canvas camera={{ position: [0, 0, 5], fov: 55 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[4, 4, 4]} intensity={1.2} color="#22d3ee" />
        <Stars radius={80} depth={20} count={1000} factor={2} fade speed={0.8} />
        <Sphere args={[1.8, 48, 48]}>
          <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={0.55} transparent opacity={0.75} />
        </Sphere>
        {hotspots.map((spot) => (
          <group key={spot.label} position={spot.position as [number, number, number]}>
            <Sphere args={[0.09, 12, 12]}>
              <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={spot.intensity} />
            </Sphere>
            <Html center distanceFactor={7}>
              <span className="rounded bg-black/70 px-2 py-1 text-xs text-cyan-200">{spot.label}</span>
            </Html>
          </group>
        ))}
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.35} />
      </Canvas>
    </div>
  )
}
