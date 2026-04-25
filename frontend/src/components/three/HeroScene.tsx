'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Line, MeshDistortMaterial, OrbitControls, Sphere, Stars } from '@react-three/drei'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

function NeuralSphere() {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)

  const points = useMemo(() => {
    const generated: [number, number, number][] = []
    for (let i = 0; i < 18; i += 1) {
      const phi = Math.acos(-1 + (2 * i) / 18)
      const theta = Math.sqrt(18 * Math.PI) * phi
      generated.push([
        2.2 * Math.cos(theta) * Math.sin(phi),
        2.2 * Math.sin(theta) * Math.sin(phi),
        2.2 * Math.cos(phi),
      ])
    }
    return generated
  }, [])

  const lines = useMemo(() => points.map((p, i) => [p, points[(i + 4) % points.length]]), [points])

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2
      groupRef.current.rotation.y += 0.003
      const scale = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.02
      groupRef.current.scale.set(scale, scale, scale)
    }
  })

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <group ref={groupRef}>
        <mesh>
          <sphereGeometry args={[2, 64, 64]} />
          <MeshDistortMaterial
            color="#6366f1"
            attach="material"
            distort={0.3}
            speed={2}
            roughness={0}
            metalness={0.8}
            transparent
            opacity={0.7}
            emissive="#6366f1"
            emissiveIntensity={hovered ? 1.4 : 0.9}
          />
        </mesh>

        {points.map((point, idx) => (
          <Sphere
            key={`node-${idx}`}
            args={[0.08, 16, 16]}
            position={point}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
          >
            <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={hovered ? 2 : 1.1} />
          </Sphere>
        ))}

        {lines.map((line, idx) => (
          <Line key={`line-${idx}`} points={line} color="#22d3ee" transparent opacity={0.5} lineWidth={1} />
        ))}
      </group>
    </Float>
  )
}

export default function HeroScene() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 60 }} style={{ background: 'transparent' }}>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#6366f1" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#22d3ee" />
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
      <NeuralSphere />
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
    </Canvas>
  )
}
