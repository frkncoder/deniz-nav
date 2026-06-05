import { useEffect, useRef } from 'react';

interface WindLayerProps {
  windSpeedKnots: number | null;
  windDirectionDeg: number | null;
  isActive: boolean;
}

interface Particle {
  x: number;
  y: number;
  age: number;
  maxAge: number;
}

export function WindLayer({ windSpeedKnots, windDirectionDeg, isActive }: WindLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isActive || windSpeedKnots == null || windDirectionDeg == null || windSpeedKnots === 0) {
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas boyutlandırma
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    // Animasyon Parametreleri
    const PARTICLE_COUNT = Math.floor((canvas.width * canvas.height) / 10000); // Yoğunluk
    const MAX_AGE = 60; 
    
    // Rüzgar Yönü -> Radyan Dönüşümü
    // 0 derece = Kuzey (yukarıdan aşağıya değil, rüzgar *geldiği* yönü gösterir, ama akış *gittiği* yöne doğrudur).
    // Yani 0 derece rüzgar, Kuzeyden Güneye doğru akar.
    // Ancak Open-Meteo direction rüzgarın geldiği yön mü yoksa gittiği yön mü? Meteorolojide yön rüzgarın GELDİĞİ yöndür.
    // 0 -> North (Kuzeyden gelir, Güneye gider).
    // Güneye gidiş açısı = +90 derece (veya Math.PI/2) HTML canvas'ta.
    const windAngleRad = (windDirectionDeg + 90) * (Math.PI / 180);
    
    // Hız Çarpanı (Knot -> piksel/frame)
    // 10 knot -> normal hız.
    const speedMultiplier = Math.max(0.5, (windSpeedKnots / 10) * 2);
    
    const velocityX = Math.cos(windAngleRad) * speedMultiplier;
    const velocityY = Math.sin(windAngleRad) * speedMultiplier;

    // Partiküller
    let particles: Particle[] = Array.from({ length: PARTICLE_COUNT }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      age: Math.random() * MAX_AGE,
      maxAge: MAX_AGE + Math.random() * 20
    }));

    // Fade trail çizimi (saydam arka plan bırakarak gölge efekti yapımı)
    const draw = () => {
      // Önceki kareyi hafifçe sil (Karanlık tema izi)
      // Destination-out ile alpha kanalını azaltarak trail yapabiliriz.
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = 1.5;
      
      // Hıza göre renk (Mavi -> Yeşil -> Turuncu -> Kırmızı)
      let strokeColor = 'rgba(14, 165, 233, 0.7)'; // Default açık mavi
      if (windSpeedKnots > 20) strokeColor = 'rgba(245, 158, 11, 0.7)'; // Turuncu
      if (windSpeedKnots > 35) strokeColor = 'rgba(239, 68, 68, 0.7)'; // Kırmızı
      
      ctx.strokeStyle = strokeColor;
      ctx.beginPath();

      particles.forEach(p => {
        const nextX = p.x + velocityX;
        const nextY = p.y + velocityY;

        ctx.moveTo(p.x, p.y);
        ctx.lineTo(nextX, nextY);

        p.x = nextX;
        p.y = nextY;
        p.age += 1;

        // Ekrana veya yaş sınırına ulaşırsa sıfırla
        if (p.age >= p.maxAge || p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
          p.x = Math.random() * canvas.width;
          p.y = Math.random() * canvas.height;
          p.age = 0;
        }
      });

      ctx.stroke();

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, windSpeedKnots, windDirectionDeg]);

  return (
    <canvas
      ref={canvasRef}
      className="wind-layer"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5, // Harita ile UI bileşenleri arasında
        opacity: isActive ? 1 : 0,
        transition: 'opacity 0.5s ease-in-out'
      }}
    />
  );
}
