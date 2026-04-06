"use client";

import { type ReactNode, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { COLORS } from "@/lib/constants";

function createSeededRandom(seed: number): () => number {
  let value = seed % 2147483647;
  if (value <= 0) {
    value += 2147483646;
  }

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function sampleBrainPoint(
  random: () => number,
  minRadius: number,
  radiusRange: number
): [number, number, number] {
  const theta = random() * Math.PI * 2;
  const phi = Math.acos(2 * random() - 1);
  const radius = minRadius + random() * radiusRange;

  return [
    radius * Math.sin(phi) * Math.cos(theta) * 1.15,
    radius * Math.sin(phi) * Math.sin(theta) * 0.75,
    radius * Math.cos(phi),
  ];
}

function BrainMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(COLORS.cyan) },
      uColor2: { value: new THREE.Color(COLORS.green) },
      uGlow: { value: new THREE.Color(COLORS.cyanGlow) },
    }),
    []
  );

  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(1.6, 64, 48);
    const position = geo.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < position.count; i++) {
      vertex.fromBufferAttribute(position, i);
      vertex.y *= 0.75;
      vertex.x *= 1.15;

      const fissure = Math.exp(-vertex.x * vertex.x * 8) * 0.15;
      vertex.y -= fissure;

      const wrinkleA = Math.sin(vertex.x * 6 + vertex.y * 4) * 0.06;
      const wrinkleB = Math.sin(vertex.y * 8 + vertex.z * 5) * 0.04;
      const wrinkleC = Math.sin(vertex.x * 3 - vertex.z * 7) * 0.05;
      const noise = wrinkleA + wrinkleB + wrinkleC;

      vertex.addScaledVector(vertex.clone().normalize(), noise);
      position.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta * 0.5;
    }

    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        transparent
        side={THREE.FrontSide}
        vertexShader={`
          varying vec3 vNormal;
          varying vec3 vPosition;

          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform vec3 uColor1;
          uniform vec3 uColor2;
          uniform vec3 uGlow;
          varying vec3 vNormal;
          varying vec3 vPosition;

          void main() {
            vec3 viewDir = normalize(cameraPosition - vPosition);
            float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);

            float pulse1 = sin(vPosition.x * 4.0 + vPosition.y * 3.0 + uTime * 2.0) * 0.5 + 0.5;
            float pulse2 = sin(vPosition.y * 5.0 - vPosition.z * 4.0 + uTime * 1.5 + 1.5) * 0.5 + 0.5;
            float pulse3 = sin(vPosition.z * 3.0 + vPosition.x * 6.0 + uTime * 2.5 + 3.0) * 0.5 + 0.5;
            float pulses = max(max(pulse1, pulse2), pulse3);
            pulses = smoothstep(0.7, 1.0, pulses);

            vec3 baseColor = vec3(0.02, 0.05, 0.07);
            vec3 synapseColor = mix(uColor1, uColor2, pulse2);
            vec3 color = baseColor;

            color += synapseColor * pulses * 0.5;
            color += uGlow * fresnel * 0.6;

            float alpha = 0.7 + fresnel * 0.3;
            gl_FragColor = vec4(color, alpha);
          }
        `}
      />
    </mesh>
  );
}

function SynapticSparks({ count = 300 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const { basePositions, positions, phases } = useMemo(() => {
    const random = createSeededRandom(count * 97 + 13);
    const base = new Float32Array(count * 3);
    const current = new Float32Array(count * 3);
    const phaseOffsets = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const index = i * 3;
      const [x, y, z] = sampleBrainPoint(random, 1.5, 0.5);

      base[index] = x;
      base[index + 1] = y;
      base[index + 2] = z;
      current[index] = x;
      current[index + 1] = y;
      current[index + 2] = z;
      phaseOffsets[i] = random() * Math.PI * 2;
    }

    return { basePositions: base, positions: current, phases: phaseOffsets };
  }, [count]);

  useFrame((_, delta) => {
    if (!ref.current) {
      return;
    }

    timeRef.current += delta;

    const position = ref.current.geometry.getAttribute("position");
    const values = position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const index = i * 3;
      const phase = phases[i] + timeRef.current * 0.6;

      values[index] = basePositions[index] + Math.sin(phase + i * 0.35) * 0.08;
      values[index + 1] = basePositions[index + 1] + Math.cos(phase * 1.2) * 0.05;
      values[index + 2] = basePositions[index + 2] + Math.sin(phase * 0.9 + 1.4) * 0.07;
    }

    position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={COLORS.cyan}
        size={0.025}
        transparent
        opacity={0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function NeuralPaths() {
  const ref = useRef<THREE.LineSegments>(null);

  const geometry = useMemo(() => {
    const random = createSeededRandom(404);
    const points: number[] = [];
    const opacities: number[] = [];
    const nodeCount = 40;
    const nodes: [number, number, number][] = [];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push(sampleBrainPoint(random, 1.55, 0.2));
    }

    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dx = nodes[i][0] - nodes[j][0];
        const dy = nodes[i][1] - nodes[j][1];
        const dz = nodes[i][2] - nodes[j][2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance < 1.5) {
          points.push(...nodes[i], ...nodes[j]);
          opacities.push(0.15, 0.15);
        }
      }
    }

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    lineGeometry.setAttribute("opacity", new THREE.Float32BufferAttribute(opacities, 1));
    return lineGeometry;
  }, []);

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(COLORS.cyan) },
    }),
    []
  );

  useFrame(({ clock }) => {
    if (!ref.current) {
      return;
    }

    const opacity = ref.current.geometry.getAttribute("opacity");
    const values = opacity.array as Float32Array;
    const elapsed = clock.getElapsedTime();

    for (let i = 0; i < values.length; i += 2) {
      const wave = Math.sin(elapsed * 2 + i * 0.5) * 0.5 + 0.5;
      values[i] = 0.03 + wave * 0.18;
      values[i + 1] = 0.03 + wave * 0.18;
    }

    opacity.needsUpdate = true;
  });

  return (
    <lineSegments ref={ref} geometry={geometry}>
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={`
          attribute float opacity;
          varying float vOpacity;

          void main() {
            vOpacity = opacity;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 uColor;
          varying float vOpacity;

          void main() {
            gl_FragColor = vec4(uColor, vOpacity);
          }
        `}
      />
    </lineSegments>
  );
}

function SceneRig({ children }: { children: ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleMouseMove = (event: MouseEvent) => {
      target.current.x = (event.clientX / window.innerWidth - 0.5) * 2;
      target.current.y = -(event.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame(() => {
    if (!groupRef.current) {
      return;
    }

    groupRef.current.rotation.y += (target.current.x * 0.2 - groupRef.current.rotation.y) * 0.03;
    groupRef.current.rotation.x += (target.current.y * 0.12 - groupRef.current.rotation.x) * 0.03;
  });

  return <group ref={groupRef}>{children}</group>;
}

export default function BrainScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.5], fov: 50 }}
      style={{ background: "transparent" }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.05} />
      <pointLight position={[2, 2, 3]} intensity={0.3} color={COLORS.cyan} />
      <pointLight position={[-2, -1, 2]} intensity={0.2} color={COLORS.green} />
      <pointLight position={[0, 3, -2]} intensity={0.15} color={COLORS.cyanGlow} />

      <SceneRig>
        <BrainMesh />
        <NeuralPaths />
        <SynapticSparks />
      </SceneRig>
    </Canvas>
  );
}
