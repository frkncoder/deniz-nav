export async function generateWindHeatmap(windData: any[]): Promise<string> {
  const uData = windData[0];
  const vData = windData[1];
  
  const header = uData.header;
  const uArr = uData.data;
  const vArr = vData.data;
  
  const nx = header.nx; // 360
  const ny = header.ny; // 181
  
  // Hedef çözünürlük (kare olmalı çünkü Mercator harita kare şeklinde)
  const W = 1024;
  const H = 1024;
  
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(W, H);
  const data = imgData.data;
  
  // Windy benzeri renk paleti
  const colorStops = [
    { speed: 0,  color: [46,  100, 158] }, // Koyu Mavi
    { speed: 3,  color: [60,  157, 194] }, // Açık Mavi
    { speed: 6,  color: [128, 205, 193] }, // Turkuaz
    { speed: 10, color: [151, 218, 168] }, // Yeşil
    { speed: 15, color: [238, 247, 217] }, // Sarımsı Yeşil
    { speed: 20, color: [255, 217, 125] }, // Sarı
    { speed: 25, color: [252, 150, 75]  }, // Turuncu
    { speed: 30, color: [245, 64,  32]  }, // Kırmızı
    { speed: 40, color: [180, 0,   35]  }  // Bordo
  ];

  function getColor(speed: number) {
    if (speed <= colorStops[0].speed) return colorStops[0].color;
    if (speed >= colorStops[colorStops.length - 1].speed) return colorStops[colorStops.length - 1].color;
    
    for (let i = 0; i < colorStops.length - 1; i++) {
      if (speed >= colorStops[i].speed && speed <= colorStops[i+1].speed) {
        const t = (speed - colorStops[i].speed) / (colorStops[i+1].speed - colorStops[i].speed);
        const c1 = colorStops[i].color;
        const c2 = colorStops[i+1].color;
        return [
          c1[0] + (c2[0] - c1[0]) * t,
          c1[1] + (c2[1] - c1[1]) * t,
          c1[2] + (c2[2] - c1[2]) * t
        ];
      }
    }
    return [0,0,0];
  }

  // Web Mercator Y to Latitude
  function yToLat(yNorm: number) {
    const y = 0.5 - yNorm; // 0.5 to -0.5
    return 90 - 360 * Math.atan(Math.exp(-y * 2 * Math.PI)) / Math.PI;
  }

  function bilinearInterpolate(x: number, y: number, arr: number[]) {
    const x0 = Math.floor(x);
    const x1 = Math.min(x0 + 1, nx - 1);
    const y0 = Math.floor(y);
    const y1 = Math.min(y0 + 1, ny - 1);
    
    const tx = x - x0;
    const ty = y - y0;
    
    const v00 = arr[y0 * nx + x0];
    const v10 = arr[y0 * nx + x1];
    const v01 = arr[y1 * nx + x0];
    const v11 = arr[y1 * nx + x1];
    
    return (1 - tx) * (1 - ty) * v00 +
           tx * (1 - ty) * v10 +
           (1 - tx) * ty * v01 +
           tx * ty * v11;
  }

  for (let y = 0; y < H; y++) {
    const lat = yToLat(y / H);
    // wind.json y ekseni: satır 0 -> lat 90 (Kuzey Kutbu), satır 180 -> lat -90 (Güney Kutbu)
    let srcY = ((90 - lat) / 180) * (ny - 1);
    if (srcY < 0) srcY = 0;
    if (srcY > ny - 1) srcY = ny - 1;

    for (let x = 0; x < W; x++) {
      const lon = (x / W) * 360 - 180;
      let srcX = ((lon + 180) / 360) * nx;
      
      // Wrap around longitude
      if (srcX >= nx) srcX -= nx;
      if (srcX < 0) srcX += nx;

      const u = bilinearInterpolate(srcX, srcY, uArr);
      const v = bilinearInterpolate(srcX, srcY, vArr);
      const speed = Math.sqrt(u * u + v * v);

      const color = getColor(speed);
      
      const idx = (y * W + x) * 4;
      data[idx] = color[0];
      data[idx+1] = color[1];
      data[idx+2] = color[2];
      data[idx+3] = 180; // Opaklık (0-255)
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}
