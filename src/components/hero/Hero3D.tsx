import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Line, Stars, Html, AdaptiveDpr } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

// Reduced-motion detection
function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduce;
}

// Hook to read HSL tokens from the design system (index.css)
function useThemeHsl(varName: string, fallback: string) {
  const [color, setColor] = useState<string>(fallback);
  useEffect(() => {
    const update = () => {
      const root = getComputedStyle(document.documentElement);
      const val = root.getPropertyValue(varName).trim();
      if (val) setColor(`hsl(${val})`);
    };
    update();

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", update);

    return () => {
      observer.disconnect();
      mq.removeEventListener("change", update);
    };
  }, [varName]);
  return color;
}

function Packet({ a, b, color, speed = 0.3, offset = 0 }: { a: [number, number, number]; b: [number, number, number]; color: string; speed?: number; offset?: number }) {
  const ref = useRef<any>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.getElapsedTime() * speed + offset) % 1;
    const x = a[0] + (b[0] - a[0]) * t;
    const y = a[1] + (b[1] - a[1]) * t;
    const z = a[2] + (b[2] - a[2]) * t;
    ref.current.position.set(x, y, z);
    ref.current.scale.setScalar(0.6 + Math.sin(t * Math.PI) * 0.6);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.05, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} roughness={0.1} />
    </mesh>
  );
}

function AgentSphere({ position = [0, 0, 0], color, size = 0.2, phase = 0, name, reducedMotion = false }: { position?: [number, number, number]; color: string; size?: number; phase?: number; name: string; reducedMotion?: boolean }) {
  const ref = useRef<any>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() + phase;
    const floatAmp = reducedMotion ? 0.05 : 0.2;
    ref.current.position.y = position[1] + Math.sin(t * 1.2) * floatAmp;
    ref.current.rotation.y = t * 0.6;

    const target = hovered ? 1.4 : 1;
    const s = ref.current.scale.x + (target - ref.current.scale.x) * 0.08;
    ref.current.scale.setScalar(s);
  });

  return (
    <Float speed={reducedMotion ? 0.5 : 2} rotationIntensity={reducedMotion ? 0.2 : 0.6} floatIntensity={reducedMotion ? 0.2 : 0.6}>
      <mesh
        ref={ref}
        position={position as any}
        castShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? 0.6 : 0.25} roughness={0.3} metalness={0.2} />
        <Html center distanceFactor={8} transform style={{ pointerEvents: "none" }}>
          <div className={`px-2.5 py-1 rounded-md text-xs font-medium shadow-sm ${hovered ? "opacity-100 scale-100" : "opacity-0 scale-90"} transition-all duration-200 bg-secondary/80 text-secondary-foreground backdrop-blur`}>{name}</div>
        </Html>
      </mesh>
    </Float>
  );
}

function Connections({ points, color = "hsl(142 72% 45%)" }: { points: [number, number, number][]; color?: string }) {
  const lines = useMemo(() => {
    const arr: [number, number, number][][] = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      arr.push([a, b]);
    }
    return arr;
  }, [points]);

  return (
    <group>
      {lines.map((pts, i) => (
        <group key={i}>
          <Line points={pts as any} color={color} lineWidth={1.2} dashed={false} />
          {/* flowing packets to suggest data movement */}
          <Packet a={pts[0]} b={pts[1]} color={color} speed={0.25 + (i % 3) * 0.1} offset={(i * 0.13) % 1} />
        </group>
      ))}
    </group>
  );
}

function AgentWorkflow({ sceneRef }: { sceneRef: any }) {
  const primary = useThemeHsl("--primary", "hsl(262 83% 58%)");
  const secondary = useThemeHsl("--secondary", "hsl(210 40% 96%)");
  const accent = useThemeHsl("--accent", "hsl(12 100% 50%)");
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();

  const names = [
    "Matcher",
    "Analyzer",
    "Optimizer",
    "Cover Letter",
    "Insights",
    "Network",
    "Skills"
  ];

  const points = useMemo<[number, number, number][]>(() => {
    const r = isMobile ? 1.5 : 1.9;
    const n = 7;
    return new Array(n).fill(0).map((_, i) => {
      const a = (i / n) * Math.PI * 2;
      return [Math.cos(a) * r, Math.sin(a) * 0.2, Math.sin(a) * r];
    });
  }, [isMobile]);

  // Parallax
  useFrame(() => {
    if (!sceneRef.current) return;
    sceneRef.current.rotation.x += (targetRot.current.x - sceneRef.current.rotation.x) * 0.04;
    sceneRef.current.rotation.y += (targetRot.current.y - sceneRef.current.rotation.y) * 0.04;
  });

  const starCount = isMobile ? 600 : 1400;

  return (
    <group ref={sceneRef}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 2]} intensity={1.2} castShadow />
      <pointLight position={[-3, -2, -2]} intensity={0.6} />

      <Connections points={points} color={primary} />
      {points.map((p, i) => (
        <AgentSphere
          key={i}
          position={p}
          color={i % 3 === 0 ? primary : i % 3 === 1 ? accent : secondary}
          phase={i * 0.35}
          name={names[i % names.length]}
          reducedMotion={reduce}
        />
      ))}

      <Stars radius={30} depth={40} count={starCount} factor={isMobile ? 1.6 : 2} saturation={0} fade speed={reduce ? 0 : 0.6} />
    </group>
  );
}

const targetRot = { current: { x: 0, y: 0 } } as any;

export const Hero3D = memo(function Hero3D() {
  const isMobile = useIsMobile();
  const sceneRef = useRef<any>(null);

  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-secondary/30 to-background" />

      <div className="container mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="relative grid lg:grid-cols-2 gap-10 items-center">
          {/* Left: Content */}
          <header className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-balance">
              Orchestrated AI Agents for Effortless Hiring
            </h1>
            <p className="text-lg text-muted-foreground max-w-prose">
              Watch specialized agents collaborate in real time—matching, analyzing, and drafting tailored applications so you can hire or get hired faster.
            </p>

            <nav className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild className="group">
                <Link to="/register">
                  Start Free
                  <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/jobs">Explore Jobs</Link>
              </Button>
            </nav>

            <aside className="flex flex-wrap items-center gap-6 pt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Live agent orchestration
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent" />
                AI‑written cover letters
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-secondary-foreground/70" />
                Energy‑aware performance
              </div>
            </aside>
          </header>

          {/* Right: 3D Scene */}
          <div className="relative h-[420px] md:h-[520px] rounded-2xl glass-panel overflow-hidden">
            <Canvas
              shadows
              camera={{ position: [0, 2.2, 4.8], fov: 50 }}
              dpr={isMobile ? [1, 1.5] : [1, 2]}
              onPointerMove={(e) => {
                const x = (e.clientX / window.innerWidth) * 2 - 1;
                const y = (e.clientY / window.innerHeight) * 2 - 1;
                targetRot.current.x = -y * 0.12;
                targetRot.current.y = x * 0.22;
              }}
            >
              <AdaptiveDpr pixelated />
              <AgentWorkflow sceneRef={sceneRef} />
            </Canvas>

            {/* Subtle gradient glow */}
            <div className="pointer-events-none absolute -inset-16 -z-10 blur-3xl opacity-60 bg-gradient-to-tr from-primary/20 via-accent/10 to-secondary/10" />
          </div>
        </div>
      </div>
    </section>
  );
});

export default Hero3D;
