"use client";

import React, { useRef, Suspense, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  useGLTF,
  Center,
  OrbitControls,
  ContactShadows,
  Environment,
} from "@react-three/drei";
import * as THREE from "three";

function PorscheMesh() {
  const { scene } = useGLTF("/model/porsche.glb");
  const modelRef = useRef<THREE.Group>(null);

  // Smooth continuous rotation around central vertical axis
  useFrame((_, delta) => {
    if (modelRef.current) {
      modelRef.current.rotation.y += delta * 0.18;
    }
  });

  return (
    // Model size maintained exactly as requested (115x scale)
    <Center top={false}>
      <group ref={modelRef} dispose={null} scale={115}>
        <primitive object={scene} />
      </group>
    </Center>
  );
}

// Preload the GLTF asset so it streams immediately
useGLTF.preload("/model/porsche.glb");

export default function CarModel() {
  // CarModel is dynamically imported with ssr: false, so window is available
  // on first render. Detect the md breakpoint (Tailwind: 768px) synchronously so
  // the camera is framed correctly before the canvas paints.
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    // Unconstrained, transparent wrapper with overflow-visible to prevent clipping
    <div className="w-full h-full relative select-none bg-transparent border-0 shadow-none overflow-visible">
      <Canvas
        // Remount across the md breakpoint so the camera reframes cleanly for the
        // short mobile canvas (300px) vs. the overlapping desktop layout. Rare on
        // phones (the viewport never crosses 768px during use); on desktop resizing
        // across the breakpoint, a brief reload is acceptable.
        key={isMobile ? "mobile" : "desktop"}
        camera={
          isMobile
            ? // Mobile: pull the camera back and open the FOV a touch so the full
              // car fits inside the shorter 300px canvas without being clipped.
              { position: [6.0, 1.7, 6.0], fov: 40 }
            : // Desktop: tight framing that lets the model bleed behind the text.
              { position: [4.4, 1.7, 4.4], fov: 37 }
        }
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        className="w-full h-full bg-transparent border-0 shadow-none overflow-visible cursor-grab active:cursor-grabbing"
      >
        <Suspense fallback={null}>
          {/* Studio Lighting tuned for rich reflections on metallic paint */}
          <ambientLight intensity={1.8} />
          <directionalLight position={[9, 12, 7]} intensity={2.8} />
          <directionalLight position={[-9, 8, -6]} intensity={1.8} color="#ffffff" />

          {/* Crimson-Red Neon Rim Light from Behind */}
          <spotLight
            position={[-7, 5, -7]}
            intensity={6.0}
            color="#E50914"
            angle={0.75}
            penumbra={1}
          />

          {/* Overhead Key Fill */}
          <directionalLight position={[0, 11, 0]} intensity={1.5} />

          {/* 3D Car Model */}
          <PorscheMesh />

          {/* Ground Contact Shadow aligned under the wheel base */}
          <ContactShadows
            position={[0, -0.73, 0]}
            opacity={0.75}
            scale={14}
            blur={2.0}
            far={5}
            color="#000000"
          />

          {/* Photorealistic Clear-Coat Reflections */}
          <Environment preset="city" />

          {/* Orbit Controls (Zoom disabled so page scrolling works smoothly) */}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={false}
            maxPolarAngle={Math.PI / 2.05}
            minPolarAngle={Math.PI / 6}
            dampingFactor={0.06}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
