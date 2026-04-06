"use client";

import { type ReactNode, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { COLORS } from "@/lib/constants";

const HEMISPHERE_GAP = 0.14;

function brainHalfWidth(y: number, z: number): number {
  const normalizedY = y / 1.04;
  const normalizedZ = z / 1.1;

  const vertical = Math.max(0, 1 - Math.pow(Math.abs(normalizedY), 1.58));
  const depth = Math.max(0, 1 - Math.pow(Math.abs(normalizedZ), 1.76));

  if (vertical === 0 || depth === 0) {
    return 0;
  }

  let width = Math.pow(vertical * depth, 0.58) * 1.08;
  width *= 1 + 0.16 * Math.exp(-Math.pow(z - 0.2, 2) / 0.22);
  width *= 1 - 0.1 * Math.exp(-Math.pow(z + 0.9, 2) / 0.16);
  width *= 1 - Math.max(0, -normalizedY - 0.08) * 0.2;

  return Math.max(width, 0);
}

function isInsideBrain(x: number, y: number, z: number): boolean {
  const halfWidth = brainHalfWidth(y, z);
  const hemisphereX = Math.abs(x) - HEMISPHERE_GAP;

  return hemisphereX >= 0 && hemisphereX <= halfWidth;
}

function buildBrainGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.SphereGeometry(1, 84, 72);
  const position = geometry.attributes.position;
  const vertex = new THREE.Vector3();
  const contourVector = new THREE.Vector3();

  for (let index = 0; index < position.count; index++) {
    vertex.fromBufferAttribute(position, index).normalize();

    const hemisphere = vertex.x >= 0 ? 1 : -1;
    const y = vertex.y * 1.02;
    const z = vertex.z * 1.1 + 0.04;
    const width = brainHalfWidth(y, z);
    const hemisphereWeight = Math.pow(Math.abs(vertex.x), 0.72);

    let x = hemisphere * (HEMISPHERE_GAP + width * hemisphereWeight);
    const shapedY = y;
    let shapedZ = z;

    if (shapedY < -0.2) {
      x *= 0.93;
      shapedZ *= 0.95;
    }

    if (shapedZ > 0.28) {
      x *= 1.03;
    }

    const fold =
      (Math.sin(shapedY * 10.6 + shapedZ * 5.4 + hemisphere * 0.7) +
        Math.cos(shapedZ * 8.2 - shapedY * 6.8)) *
      0.011;

    contourVector.set(hemisphere * 0.84, 0.18, 0.42).normalize();

    vertex.set(x, shapedY, shapedZ);
    vertex.addScaledVector(contourVector, fold);

    position.setXYZ(index, vertex.x, vertex.y, vertex.z);
  }

  geometry.computeVertexNormals();
  return geometry;
}

function BrainShell() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPrimary: { value: new THREE.Color(COLORS.indigo) },
      uSecondary: { value: new THREE.Color(COLORS.indigoLight) },
      uHighlight: { value: new THREE.Color(COLORS.indigoGlow) },
    }),
    []
  );

  const geometry = useMemo(() => buildBrainGeometry(), []);

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta * 0.55;
    }

    if (meshRef.current) {
      meshRef.current.rotation.z = Math.sin((materialRef.current?.uniforms.uTime.value ?? 0) * 0.7) * 0.018;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        transparent
        side={THREE.FrontSide}
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vNormal;
          varying vec3 vWorldPosition;
          varying vec3 vLocalPosition;

          void main() {
            vNormal = normalize(normalMatrix * normal);
            vLocalPosition = position;
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform vec3 uPrimary;
          uniform vec3 uSecondary;
          uniform vec3 uHighlight;

          varying vec3 vNormal;
          varying vec3 vWorldPosition;
          varying vec3 vLocalPosition;

          void main() {
            vec3 viewDir = normalize(cameraPosition - vWorldPosition);
            float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.4);

            float latBand = smoothstep(0.62, 1.0, sin(vLocalPosition.y * 12.0 - uTime * 1.8) * 0.5 + 0.5);
            float depthBand = smoothstep(0.68, 1.0, sin(vLocalPosition.z * 10.0 + uTime * 0.7) * 0.5 + 0.5);
            float fissure = exp(-pow(vLocalPosition.x * 2.7, 2.0)) * 0.65;

            vec3 baseColor = vec3(0.04, 0.04, 0.08);
            vec3 shellColor = mix(uSecondary, uPrimary, 0.52 + depthBand * 0.24);
            vec3 color = mix(baseColor, shellColor, 0.38);

            color += uPrimary * latBand * 0.12;
            color += uSecondary * depthBand * 0.10;
            color += uHighlight * fresnel * 0.36;
            color -= fissure * 0.06;

            float alpha = 0.78 + fresnel * 0.08;
            gl_FragColor = vec4(color, alpha);
          }
        `}
      />
    </mesh>
  );
}

function BrainContours() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const points: number[] = [];

    const pushStrip = (strip: THREE.Vector3[]) => {
      for (let index = 0; index < strip.length - 1; index++) {
        points.push(
          strip[index].x, strip[index].y, strip[index].z,
          strip[index + 1].x, strip[index + 1].y, strip[index + 1].z
        );
      }
    };

    const hemisphereSigns = [-1, 1] as const;

    for (const sign of hemisphereSigns) {
      for (let z = -0.92; z <= 1.02; z += 0.18) {
        const strip: THREE.Vector3[] = [];
        for (let y = -0.94; y <= 0.98; y += 0.06) {
          const width = brainHalfWidth(y, z);
          if (width > 0.06) {
            strip.push(new THREE.Vector3(sign * (HEMISPHERE_GAP + width * 0.97), y, z));
          }
        }
        if (strip.length > 1) pushStrip(strip);
      }

      for (let y = -0.76; y <= 0.84; y += 0.2) {
        const strip: THREE.Vector3[] = [];
        for (let z = -1.02; z <= 1.06; z += 0.07) {
          const width = brainHalfWidth(y, z);
          if (width > 0.06) {
            strip.push(new THREE.Vector3(sign * (HEMISPHERE_GAP + width * 0.94), y, z));
          }
        }
        if (strip.length > 1) pushStrip(strip);
      }
    }

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return lineGeometry;
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPrimary: { value: new THREE.Color(COLORS.indigoGlow) },
      uSecondary: { value: new THREE.Color(COLORS.indigoLight) },
    }),
    []
  );

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <lineSegments geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vPosition;
          void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform vec3 uPrimary;
          uniform vec3 uSecondary;
          varying vec3 vPosition;
          void main() {
            float pulse = sin(vPosition.y * 7.5 + vPosition.z * 4.2 + uTime * 1.4) * 0.5 + 0.5;
            vec3 color = mix(uSecondary, uPrimary, 0.45 + pulse * 0.35);
            gl_FragColor = vec4(color, 0.16 + pulse * 0.08);
          }
        `}
      />
    </lineSegments>
  );
}

function NeuralMatrix() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const points: number[] = [];
    const phases: number[] = [];
    const nodes = new Map<string, THREE.Vector3>();
    const stepX = 0.32;
    const stepY = 0.26;
    const stepZ = 0.28;

    const keyFor = (xIndex: number, yIndex: number, zIndex: number) =>
      `${xIndex}:${yIndex}:${zIndex}`;

    for (let xIndex = 0; xIndex <= 10; xIndex++) {
      const x = -1.58 + xIndex * stepX;
      for (let yIndex = 0; yIndex <= 8; yIndex++) {
        const y = -0.84 + yIndex * stepY;
        for (let zIndex = 0; zIndex <= 8; zIndex++) {
          const z = -0.96 + zIndex * stepZ;
          if (isInsideBrain(x, y, z)) {
            nodes.set(keyFor(xIndex, yIndex, zIndex), new THREE.Vector3(x, y, z));
          }
        }
      }
    }

    const directions = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

    nodes.forEach((point, key) => {
      const [xIndex, yIndex, zIndex] = key.split(":").map(Number);
      directions.forEach(([dx, dy, dz], directionIndex) => {
        const neighbor = nodes.get(keyFor(xIndex + dx, yIndex + dy, zIndex + dz));
        if (!neighbor) return;

        points.push(point.x, point.y, point.z, neighbor.x, neighbor.y, neighbor.z);
        const phase = xIndex * 0.31 + yIndex * 0.47 + zIndex * 0.29 + directionIndex * 0.7;
        phases.push(phase, phase);
      });
    });

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    lineGeometry.setAttribute("phase", new THREE.Float32BufferAttribute(phases, 1));
    return lineGeometry;
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBase: { value: new THREE.Color(COLORS.indigoDim) },
      uActive: { value: new THREE.Color(COLORS.indigoGlow) },
    }),
    []
  );

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <lineSegments geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`
          attribute float phase;
          varying float vPhase;
          void main() {
            vPhase = phase;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform vec3 uBase;
          uniform vec3 uActive;
          varying float vPhase;
          void main() {
            float pulse = sin(uTime * 1.8 + vPhase) * 0.5 + 0.5;
            vec3 color = mix(uBase, uActive, pulse * 0.78);
            gl_FragColor = vec4(color, 0.08 + pulse * 0.18);
          }
        `}
      />
    </lineSegments>
  );
}

function SignalPulses() {
  const groupRef = useRef<THREE.Group>(null);

  const routes = useMemo(
    () => [
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.18, 0.18, 0.68),
        new THREE.Vector3(-0.72, 0.34, 0.32),
        new THREE.Vector3(-0.18, 0.42, 0.06),
        new THREE.Vector3(0.28, 0.38, 0.24),
        new THREE.Vector3(1.08, 0.2, 0.72),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.02, -0.18, -0.74),
        new THREE.Vector3(-0.58, -0.02, -0.28),
        new THREE.Vector3(0.04, 0.1, -0.08),
        new THREE.Vector3(0.62, -0.02, 0.22),
        new THREE.Vector3(1.02, -0.2, 0.62),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.92, 0.56, -0.28),
        new THREE.Vector3(-0.42, 0.6, 0.12),
        new THREE.Vector3(0.02, 0.54, 0.2),
        new THREE.Vector3(0.5, 0.58, 0.06),
        new THREE.Vector3(0.94, 0.5, -0.32),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.78, -0.48, -0.58),
        new THREE.Vector3(0.44, -0.3, -0.18),
        new THREE.Vector3(0.22, -0.08, 0.04),
        new THREE.Vector3(0.58, 0.04, 0.4),
        new THREE.Vector3(0.96, 0.18, 0.62),
      ]),
    ],
    []
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const elapsed = clock.getElapsedTime();
    groupRef.current.children.forEach((child, index) => {
      const route = routes[index];
      const progress = (elapsed * (0.1 + index * 0.018) + index * 0.23) % 1;
      const point = route.getPointAt(progress);
      const pulse = Math.sin(elapsed * 3.2 + index * 0.9) * 0.5 + 0.5;
      const mesh = child as THREE.Mesh;
      mesh.position.copy(point);
      mesh.scale.setScalar(0.9 + pulse * 0.5);
    });
  });

  return (
    <group ref={groupRef}>
      {routes.map((_, index) => (
        <mesh key={`pulse-${index}`}>
          <octahedronGeometry args={[0.05, 0]} />
          <meshBasicMaterial
            color={index % 2 === 0 ? COLORS.indigoGlow : COLORS.amber}
            transparent
            opacity={0.92}
          />
        </mesh>
      ))}
    </group>
  );
}

function ObservationRings() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const elapsed = clock.getElapsedTime();
    groupRef.current.rotation.z += delta * 0.018;
    groupRef.current.rotation.x = Math.sin(elapsed * 0.28) * 0.06;

    groupRef.current.children.forEach((child, index) => {
      const material = (child as THREE.Mesh).material;
      if (material instanceof THREE.MeshBasicMaterial) {
        material.opacity = 0.08 + Math.sin(elapsed * (0.52 + index * 0.08) + index) * 0.02;
      }
    });
  });

  return (
    <group ref={groupRef}>
      <mesh rotation={[Math.PI / 2.8, 0, 0.32]} scale={[1.16, 0.72, 1]}>
        <torusGeometry args={[2.08, 0.008, 10, 180]} />
        <meshBasicMaterial color={COLORS.indigoGlow} transparent opacity={0.1} />
      </mesh>
      <mesh rotation={[0.26, 0.44, Math.PI / 2.08]} scale={[0.96, 1, 1]}>
        <torusGeometry args={[1.86, 0.007, 10, 170]} />
        <meshBasicMaterial color={COLORS.amber} transparent opacity={0.06} />
      </mesh>
      <mesh rotation={[-0.36, 0.12, 0]} scale={[1.32, 0.82, 1]}>
        <torusGeometry args={[2.26, 0.005, 10, 160]} />
        <meshBasicMaterial color={COLORS.indigo} transparent opacity={0.07} />
      </mesh>
    </group>
  );
}

function InstrumentMarkers() {
  const groupRef = useRef<THREE.Group>(null);

  const markers = useMemo(
    () => [
      { radius: 2.14, angle: 0.36, y: 0.88 },
      { radius: 2.02, angle: 1.5, y: -0.84 },
      { radius: 2.28, angle: 2.56, y: 0.08 },
      { radius: 2.12, angle: 4.12, y: 1.02 },
      { radius: 2.08, angle: 5.12, y: -0.48 },
    ],
    []
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const elapsed = clock.getElapsedTime();
    groupRef.current.children.forEach((child, index) => {
      const marker = markers[index];
      const mesh = child as THREE.Mesh;
      const angle = marker.angle + elapsed * (0.065 + index * 0.012);
      mesh.position.set(
        Math.cos(angle) * marker.radius,
        marker.y + Math.sin(elapsed * 0.9 + index) * 0.024,
        Math.sin(angle) * marker.radius * 0.78
      );
      mesh.rotation.z = elapsed * 0.3 + index;
    });
  });

  return (
    <group ref={groupRef}>
      {markers.map((marker, index) => (
        <mesh
          key={`${marker.angle}-${marker.radius}`}
          position={[
            Math.cos(marker.angle) * marker.radius,
            marker.y,
            Math.sin(marker.angle) * marker.radius * 0.78,
          ]}
        >
          <boxGeometry args={[0.06, 0.06, 0.012]} />
          <meshBasicMaterial
            color={index % 2 === 0 ? COLORS.indigoGlow : COLORS.amber}
            transparent
            opacity={0.82}
          />
        </mesh>
      ))}
    </group>
  );
}

function SceneRig({ children }: { children: ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleMouseMove = (event: MouseEvent) => {
      target.current.x = (event.clientX / window.innerWidth - 0.5) * 2;
      target.current.y = -(event.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += (target.current.x * 0.15 - groupRef.current.rotation.y) * 0.022;
    groupRef.current.rotation.x += (target.current.y * 0.08 - groupRef.current.rotation.x) * 0.022;
  });

  return <group ref={groupRef}>{children}</group>;
}

export default function BrainScene() {
  return (
    <Canvas
      camera={{ position: [0, 0.02, 5.25], fov: 42 }}
      style={{ background: "transparent" }}
      dpr={[1, 1.8]}
    >
      <ambientLight intensity={0.06} />
      <directionalLight position={[2.8, 2.4, 4.2]} intensity={1.4} color={COLORS.indigoGlow} />
      <pointLight position={[-2.6, -1.2, 2.5]} intensity={0.28} color={COLORS.amber} />
      <pointLight position={[0, 2.4, -2]} intensity={0.12} color={COLORS.indigoDim} />

      <SceneRig>
        <ObservationRings />
        <BrainContours />
        <NeuralMatrix />
        <SignalPulses />
        <InstrumentMarkers />
        <BrainShell />
      </SceneRig>
    </Canvas>
  );
}
