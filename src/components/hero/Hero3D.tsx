import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Line, Stars } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

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

function AgentSphere({ position = [0, 0, 0], color = "#7c3aed", size = 0.18, phase = 0 }) {
  const ref = useRef<any>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() + phase;
    ref.current.position.y = position[1] + Math.sin(t * 1.2) * 0.2;
    ref.current.rotation.y = t * 0.6;
  });
  return (
    <Float speed={2} rotationIntensity={0.6} floatIntensity={0.5}>
      <mesh ref={ref} position={position as any} castShadow>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} roughness={0.3} metalness={0.2} />
      </mesh>
    </Float>
  );
}

function Connections({ points, color = "#22c55e" }: { points: [number, number, number][]; color?: string }) {
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
        <Line key={i} points={pts as any} color={color} lineWidth={1.2} dashed={false} />
      ))}
    </group>
  );
}

function AgentWorkflow() {
  const primary = useThemeHsl("--primary", "hsl(262 83% 58%)");
  const secondary = useThemeHsl("--secondary", "hsl(210 40% 96%)");
  const accent = useThemeHsl("--accent", "hsl(12 100% 50%)");

  const points = useMemo<[number, number, number][]>(() => {
    const r = 1.8;
    const n = 7;
    return new Array(n).fill(0).map((_, i) => {
      const a = (i / n) * Math.PI * 2;
      return [Math.cos(a) * r, Math.sin(a) * 0.2, Math.sin(a) * r];
    });
  }, []);

  return (
    <group>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 2]} intensity={1.2} castShadow />
      <pointLight position={[-3, -2, -2]} intensity={0.6} />

      <Connections points={points} color={primary} />
      {points.map((p, i) => (
        <AgentSphere key={i} position={p} color={i % 3 === 0 ? primary : i % 3 === 1 ? accent : secondary} phase={i * 0.35} />
      ))}

      <Stars radius={30} depth={40} count={1500} factor={2} saturation={0} fade speed={0.6} />
    </group>
  );
}

export const Hero3D = memo(function Hero3D() {
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

            <aside className="flex items-center gap-6 pt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Live agent orchestration
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent" />
                AI‑written cover letters
              </div>
            </aside>
          </header>

          {/* Right: 3D Scene */}
          <div className="relative h-[420px] md:h-[520px] rounded-2xl glass-panel overflow-hidden">
            <Canvas shadows camera={{ position: [0, 2.2, 4.8], fov: 50 }} dpr={[1, 2]}>
              <AgentWorkflow />
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
