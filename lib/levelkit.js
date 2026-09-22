// 关卡场景工具箱：toast / 我画好了按钮 / 手绘笔画 / 指针绑定
// 各关 installXxx(S) 里用 with (S) 调用，减少复制粘贴。
(function () {
  function pointSegDist(px, py, ax, ay, bx, by) {
    const abx = bx - ax;
    const aby = by - ay;
    const apx = px - ax;
    const apy = py - ay;
    const ab2 = abx * abx + aby * aby || 1;
    let t = (apx * abx + apy * aby) / ab2;
    t = Math.max(0, Math.min(1, t));
    const cx = ax + abx * t;
    const cy = ay + aby * t;
    return Math.hypot(px - cx, py - cy);
  }

  function strokeNearPoint(stroke, x, y, r) {
    const pts = stroke.points;
    for (let i = 0; i < pts.length - 1; i++) {
      if (pointSegDist(x, y, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y) <= r) return true;
    }
    for (let i = 0; i < pts.length; i++) {
      if (Math.hypot(pts[i].x - x, pts[i].y - y) <= r) return true;
    }
    return false;
  }

  function strokesTouch(a, b) {
    const ptsA = a.points;
    const ptsB = b.points;
    const r = (a.width + b.width) * 0.55;
    for (let i = 0; i < ptsA.length; i++) {
      if (strokeNearPoint(b, ptsA[i].x, ptsA[i].y, r)) return true;
    }
    for (let i = 0; i < ptsB.length; i++) {
      if (strokeNearPoint(a, ptsB[i].x, ptsB[i].y, r)) return true;
    }
    return false;
  }

  /**
   * 手绘笔画工具。scene 需有：strokes, drawing, ink, inkSpent?, phase
   */
  function createStrokeTool(opts) {
    const {
      sceneRef, // () => scene | null
      strokeWidth = 16,
      minPts = 2,
      clampPoint, // (x, y) => {x,y}
      onStatus, // () => void  刷新 statusLabel
      onInkOut, // () => void
      makeStroke, // optional (p, width) => stroke object extras
    } = opts;

    function begin(wx, wy) {
      const scene = sceneRef();
      if (!scene || scene.phase !== "draw" || scene.done || !(scene.ink > 0)) return false;
      if (!Number.isFinite(wx) || !Number.isFinite(wy)) return false;
      end();
      const p = clampPoint(wx, wy);
      scene.drawing = makeStroke
        ? makeStroke(p, strokeWidth)
        : { points: [p], width: strokeWidth, wet: false };
      if (!scene.drawing.points) scene.drawing.points = [p];
      if (scene.drawing.width == null) scene.drawing.width = strokeWidth;
      scene.strokes.push(scene.drawing);
      if (onStatus) onStatus();
      return true;
    }

    function extend(wx, wy) {
      const scene = sceneRef();
      if (!scene || scene.phase !== "draw" || scene.done || !scene.drawing || !(scene.ink > 0)) return;
      if (!Number.isFinite(wx) || !Number.isFinite(wy)) return;
      const p = clampPoint(wx, wy);
      const pts = scene.drawing.points;
      const last = pts[pts.length - 1];
      const dx = p.x - last.x;
      const dy = p.y - last.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 2.5) return;

      let use = dist;
      if (use > scene.ink) {
        const t = scene.ink / use;
        p.x = last.x + dx * t;
        p.y = last.y + dy * t;
        use = scene.ink;
      }
      scene.ink -= use;
      scene.inkSpent = (scene.inkSpent || 0) + use;
      pts.push(p);
      if (onStatus) onStatus();
      if (Number.isFinite(scene.ink) && scene.ink <= 0) {
        scene.ink = 0;
        end();
        if (onInkOut) onInkOut();
      }
    }

    function end() {
      const scene = sceneRef();
      if (!scene) return;
      if (scene.drawing && scene.drawing.points.length < minPts) {
        const i = scene.strokes.indexOf(scene.drawing);
        if (i >= 0) scene.strokes.splice(i, 1);
      }
      scene.drawing = null;
    }

    return {
      begin,
      extend,
      end,
      strokeWidth,
      minPts,
      pointSegDist,
      strokeNearPoint,
      strokesTouch,
    };
  }

  /** 在画布上绑定指针画画（自动转世界坐标 + 指针捕获） */
  function bindDrawPointer(cfg) {
    const {
      canvas,
      sceneRef,
      clientToWorld,
      isBlocked, // () => bool  界面弹层挡住时 true
      tool, // createStrokeTool 返回值
      boundKey, // 例如 "_p32DrawBound"
    } = cfg;
    if (!canvas) return () => {};
    if (canvas[boundKey]) return canvas[boundKey];
    let pointerId = null;
    let activeScene = null;

    function stop() {
      if (pointerId === null) return;
      const id = pointerId;
      pointerId = null;
      // 不要在切关后结束新场景中的笔画。
      if (sceneRef() === activeScene) tool.end();
      else if (activeScene) activeScene.drawing = null;
      activeScene = null;
      try {
        canvas.releasePointerCapture(id);
      } catch (_) {}
    }

    function down(e) {
      const scene = sceneRef();
      if (!scene || pointerId !== null) return;
      if (isBlocked && isBlocked()) return;
      if (e.button != null && e.button !== 0) return;
      const world = clientToWorld(e.clientX, e.clientY);
      if (tool.begin(world.x, world.y)) {
        pointerId = e.pointerId;
        activeScene = scene;
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch (_) {}
        e.preventDefault();
      }
    }
    function move(e) {
      if (pointerId === null || e.pointerId !== pointerId) return;
      const scene = sceneRef();
      if (scene !== activeScene || !scene || !scene.drawing || (isBlocked && isBlocked())) {
        stop();
        return;
      }
      const world = clientToWorld(e.clientX, e.clientY);
      tool.extend(world.x, world.y);
    }
    function up(e) {
      if (e.pointerId === pointerId) stop();
    }
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("lostpointercapture", up);
    window.addEventListener("pointerup", up);
    window.addEventListener("blur", stop);
    const dispose = () => {
      stop();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("lostpointercapture", up);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("blur", stop);
      delete canvas[boundKey];
    };
    canvas[boundKey] = dispose;
    return dispose;
  }

  /** 绑定「我画好了」类按钮 */
  function bindReadyButton(btn, handler) {
    if (!btn || btn._levelKitReady) return;
    btn._levelKitReady = true;
    btn.addEventListener("click", handler);
  }

  function syncReadyButton(btn, show) {
    if (!btn) return;
    btn.classList.toggle("hidden", !show);
    btn.setAttribute("aria-hidden", show ? "false" : "true");
  }

  /** 简单 toast 写进 scene.toast / toastT */
  function makeToast(sceneRef, defaultSeconds = 2.5) {
    return function toast(msg, sec) {
      const scene = sceneRef();
      if (!scene) return;
      scene.toast = msg;
      scene.toastT = Number.isFinite(sec) && sec > 0 ? sec : defaultSeconds;
    };
  }

  /** 每帧衰减 toast */
  function tickToast(scene, dt) {
    if (!scene || !(scene.toastT > 0) || !Number.isFinite(dt) || dt <= 0) return;
    scene.toastT = Math.max(0, scene.toastT - dt);
    if (scene.toastT <= 0) scene.toast = "";
  }

  /** 墨水显示 */
  function inkLabel(scene) {
    if (!scene) return "0";
    if (!Number.isFinite(scene.ink)) return "∞";
    return String(Math.ceil(scene.ink));
  }

  /** 沿 stroke 插值取点 */
  function sampleStroke(stroke, t01) {
    const pts = stroke.points;
    if (pts.length < 2) return null;
    const total = pts.length - 1;
    const f = Math.max(0, Math.min(1, t01)) * total;
    const i0 = Math.min(Math.floor(f), total - 1);
    const lt = f - i0;
    return {
      x: pts[i0].x + (pts[i0 + 1].x - pts[i0].x) * lt,
      y: pts[i0].y + (pts[i0 + 1].y - pts[i0].y) * lt,
      dx: pts[i0 + 1].x - pts[i0].x,
      dy: pts[i0 + 1].y - pts[i0].y,
    };
  }

  window.GameLevelKit = {
    pointSegDist,
    strokeNearPoint,
    strokesTouch,
    createStrokeTool,
    bindDrawPointer,
    bindReadyButton,
    syncReadyButton,
    makeToast,
    tickToast,
    inkLabel,
    sampleStroke,
  };
})();
