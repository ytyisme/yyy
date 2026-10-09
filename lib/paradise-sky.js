(() => {
  function makeSurface(width, height, resolution) {
    const surface = document.createElement("canvas");
    surface.width = Math.ceil(width * resolution);
    surface.height = Math.ceil(height * resolution);
    const painter = surface.getContext("2d");
    painter.scale(resolution, resolution);
    return { surface, painter };
  }

  function create(width, height, resolution = 1) {
    const density = Math.max(1, Math.min(2, resolution));
    // Paint gradients and cloud shading once; the animation only moves sprites.
    const { surface: backdrop, painter: bg } = makeSurface(width, height, density);
    const sky = bg.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#317bc8");
    sky.addColorStop(0.32, "#77bdeb");
    sky.addColorStop(0.67, "#bde3f3");
    sky.addColorStop(1, "#fff0d5");
    bg.fillStyle = sky;
    bg.fillRect(0, 0, width, height);

    const sunX = width * 0.79, sunY = height * 0.17;
    const glow = bg.createRadialGradient(sunX, sunY, 10, sunX, sunY, width * 0.31);
    glow.addColorStop(0, "rgba(255,249,218,0.76)");
    glow.addColorStop(0.18, "rgba(255,244,204,0.38)");
    glow.addColorStop(0.5, "rgba(255,244,219,0.13)");
    glow.addColorStop(1, "rgba(255,244,219,0)");
    bg.fillStyle = glow;
    bg.fillRect(0, 0, width, height);

    // Broad, quiet light shafts behind the clouds.
    bg.save();
    const rays = bg.createLinearGradient(sunX, sunY, sunX - 180, height);
    rays.addColorStop(0, "rgba(255,253,230,0.12)");
    rays.addColorStop(1, "rgba(255,253,230,0)");
    bg.fillStyle = rays;
    for (const [left, right] of [[-0.25, -0.04], [0.12, 0.25], [0.48, 0.55], [0.94, 1.12]]) {
      bg.beginPath();
      bg.moveTo(sunX - 10, sunY + 4);
      bg.lineTo(width * left, height);
      bg.lineTo(width * right, height);
      bg.lineTo(sunX + 10, sunY + 4);
      bg.closePath();
      bg.fill();
    }
    bg.restore();

    const disc = bg.createRadialGradient(sunX - 6, sunY - 6, 0, sunX, sunY, 27);
    disc.addColorStop(0, "#fffef3");
    disc.addColorStop(0.8, "#fff5cc");
    disc.addColorStop(1, "rgba(255,244,199,0.4)");
    bg.fillStyle = disc;
    bg.beginPath();
    bg.arc(sunX, sunY, 27, 0, Math.PI * 2);
    bg.fill();

    // Fine cirrus streaks blend into the upper sky.
    bg.lineCap = "round";
    for (let i = 0; i < 8; i++) {
      const x = i * 153 - 90, y = 34 + (i % 3) * 30;
      bg.strokeStyle = `rgba(255,255,255,${0.045 + (i % 3) * 0.018})`;
      bg.lineWidth = 3 + (i % 3) * 2;
      bg.beginPath();
      bg.moveTo(x, y + 10);
      bg.bezierCurveTo(x + 45, y - 8, x + 110, y + 12, x + 178, y - 4);
      bg.stroke();
    }

    const { surface: cloud, painter: c } = makeSurface(320, 150, density);
    c.translate(10, 10);
    c.beginPath();
    c.moveTo(28, 106);
    c.bezierCurveTo(-8, 104, -9, 65, 24, 59);
    c.bezierCurveTo(22, 31, 62, 19, 85, 41);
    c.bezierCurveTo(96, -5, 163, 0, 176, 41);
    c.bezierCurveTo(201, 20, 239, 40, 237, 65);
    c.bezierCurveTo(284, 54, 301, 102, 270, 111);
    c.bezierCurveTo(215, 125, 68, 128, 28, 106);
    c.closePath();
    const body = c.createLinearGradient(0, 10, 0, 128);
    body.addColorStop(0, "#fffdf4");
    body.addColorStop(0.45, "#f7fcff");
    body.addColorStop(0.8, "#dfedf8");
    body.addColorStop(1, "#bed8ee");
    c.fillStyle = body;
    c.save();
    c.shadowColor = "rgba(245,252,255,0.3)";
    c.shadowBlur = 6 * density;
    c.fill();
    c.restore();
    c.clip();
    for (const [x, y, r, alpha] of [[120, 24, 55, .76], [52, 54, 36, .55], [206, 53, 32, .48], [258, 84, 28, .4]]) {
      const light = c.createRadialGradient(x - 5, y - 8, 1, x, y, r);
      light.addColorStop(0, `rgba(255,255,251,${alpha})`);
      light.addColorStop(1, "rgba(255,255,251,0)");
      c.fillStyle = light;
      c.fillRect(x - r, y - r, r * 2, r * 2);
    }
    const shade = c.createRadialGradient(163, 137, 2, 163, 137, 100);
    shade.addColorStop(0, "rgba(141,183,218,0.28)");
    shade.addColorStop(1, "rgba(141,183,218,0)");
    c.fillStyle = shade;
    c.fillRect(25, 45, 270, 90);

    const clouds = [
      { x: 25, y: 170, size: .55, alpha: .4, speed: 1.5, parallax: .08 },
      { x: 280, y: 210, size: .42, alpha: .32, speed: 1.1, parallax: .06 },
      { x: 520, y: 172, size: .65, alpha: .46, speed: 1.7, parallax: .09 },
      { x: 850, y: 230, size: .48, alpha: .38, speed: 1.3, parallax: .07 },
      { x: 90, y: 60, size: .92, alpha: .92, speed: 3.1, parallax: .18 },
      { x: 470, y: 106, size: .67, alpha: .77, speed: 2.6, parallax: .14 },
      { x: 930, y: 42, size: 1.08, alpha: .94, speed: 3.6, parallax: .21 },
    ];
    const wrap = (value, span) => ((value % span) + span) % span;

    return {
      draw(ctx, cameraX, time) {
        ctx.save();
        ctx.drawImage(backdrop, 0, 0, width, height);
        for (const layer of clouds) {
          const w = 320 * layer.size, h = 150 * layer.size;
          const span = width + w + 80;
          const x = wrap(layer.x + time * layer.speed - cameraX * layer.parallax + w, span) - w;
          ctx.globalAlpha = layer.alpha;
          ctx.drawImage(cloud, x, layer.y, w, h);
        }
        ctx.globalAlpha = .5;
        ctx.strokeStyle = "#5e86a0";
        ctx.lineWidth = 1.3;
        ctx.lineCap = "round";
        for (let i = 0; i < 3; i++) {
          const x = wrap(415 + i * 21 + time * 7 - cameraX * .1, width + 100) - 50;
          const y = 164 + i * 8 + Math.sin(time * .7 + i) * 3;
          const wing = 3 + Math.sin(time * 3 + i) * 1.5;
          ctx.beginPath();
          ctx.moveTo(x - 6, y - wing);
          ctx.quadraticCurveTo(x - 2, y - 3, x, y);
          ctx.quadraticCurveTo(x + 2, y - 3, x + 6, y - wing);
          ctx.stroke();
        }
        ctx.restore();
      },
    };
  }
  window.ParadiseSky = { create };
})();
