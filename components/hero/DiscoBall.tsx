'use client';

import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import dramasData from '@/lib/dramas-data.json';

// ─── Config (from prototype v4.0) ───
const R = 16;
const CUT_Y = 0.4;
const TILE_W = 0.08;
const TILE_H = 0.14;
const GAP = 0.08;
const GRID_N = 16;
const HOVER_SC = 1.4;
const HOVER_LRP = 0.12;
const AUTO_ROT = 0.0015;
const DRAG_K = 0.008;
const DAMP = 0.96;
const GOLD = 0xD4AF37;
const AMBER = 0xFFBF00;
const CRIMSON = 0xDC143C;
const BG = 0x0A0A0A;

const SHRINK_DELAY = 300;
const SWITCH_DELAY = 150;

// Mobile thresholds
const MOBILE_BREAKPOINT = 768;

// Proxy poster URLs through Next.js Image Optimization (same-origin, no CORS)
function getProxiedPosterUrl(originalUrl: string): string {
  const encoded = encodeURIComponent(originalUrl);
  return `/_next/image?url=${encoded}&w=256&q=75`;
}

function structuredGrid(gridN: number, isMobile: boolean) {
  const pts: THREE.Vector3[] = [];
  const phiMax = Math.asin(CUT_Y);
  const margin = TILE_H / 2;
  const phiCenterMin = -phiMax + margin;
  const phiCenterMax = phiMax - margin;
  const phiRange = phiCenterMax - phiCenterMin;

  const minVGap = 0.018;
  const numRows = Math.max(1, Math.floor(phiRange / (TILE_H + minVGap)));
  const rowSpacing = phiRange / numRows;
  const minLinearGap = 0.25;

  let totalCount = 0;
  const maxTiles = isMobile ? 200 : 500;

  for (let row = 0; row < numRows; row++) {
    const phi = phiCenterMin + (row + 0.5) * rowSpacing;
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);

    const minAngGap = minLinearGap / (R * cosPhi);
    const nTiles = Math.floor(2 * Math.PI / (TILE_W + minAngGap));

    const stagger = (row % 2 === 1) ? Math.PI / nTiles : 0;

    for (let j = 0; j < nTiles; j++) {
      if (totalCount >= maxTiles) break;
      const theta = (2 * Math.PI * j / nTiles) + stagger;
      const x = cosPhi * Math.cos(theta);
      const y = sinPhi;
      const z = cosPhi * Math.sin(theta);
      pts.push(new THREE.Vector3(x, y, z));
      totalCount++;
    }
    if (totalCount >= maxTiles) break;
  }
  return pts;
}

function createCurvedTile(
  center: THREE.Vector3,
  tangentU: THREE.Vector3,
  tangentV: THREE.Vector3,
  radius: number
) {
  const hw = TILE_W / 2, hh = TILE_H / 2;
  const verts: number[] = [], uvs: number[] = [], faces: number[] = [];
  const n = GRID_N;
  const grid: { wp: THREE.Vector3; inside: boolean }[][] = [];

  for (let j = 0; j <= n; j++) {
    grid[j] = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, v = j / n;
      const lx = (u - 0.5) * TILE_W;
      const ly = (v - 0.5) * TILE_H;
      const inside = Math.abs(lx) <= hw && Math.abs(ly) <= hh;
      let wp: THREE.Vector3;
      if (inside) {
        const tp = center.clone()
          .add(tangentU.clone().multiplyScalar(lx))
          .add(tangentV.clone().multiplyScalar(ly));
        wp = tp.clone().normalize().multiplyScalar(radius);
      } else {
        wp = center.clone().multiplyScalar(100);
      }
      grid[j][i] = { wp, inside };
      verts.push(wp.x, wp.y, wp.z);
      uvs.push(u, v);
    }
  }

  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const a = j * (n + 1) + i, b = a + 1, c = (j + 1) * (n + 1) + i, d = c + 1;
      if (grid[j][i].inside && grid[j][i + 1].inside && grid[j + 1][i].inside && grid[j + 1][i + 1].inside) {
        faces.push(a, c, b, b, c, d);
      }
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  if (faces.length) geom.setIndex(faces);

  const posArr = geom.attributes.position.array;
  const norms = new Float32Array(posArr.length);
  for (let i = 0; i < posArr.length; i += 3) {
    const len = Math.sqrt(posArr[i] ** 2 + posArr[i + 1] ** 2 + posArr[i + 2] ** 2);
    norms[i] = posArr[i] / len;
    norms[i + 1] = posArr[i + 1] / len;
    norms[i + 2] = posArr[i + 2] / len;
  }
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(norms, 3));
  return geom;
}

export default function DiscoBall() {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const mobileLabelsRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const hoveredSlugRef = useRef<string>('');
  const clearHoverSignalRef = useRef(false);
  const [isMobileState, setIsMobileState] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    // ─── Mobile detection ───
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    setIsMobileState(isMobile);
    const PART_N = isMobile ? 100 : 300;
    const PART2_N = isMobile ? 30 : 60;
    const pixelRatio = isMobile ? 1 : Math.min(window.devicePixelRatio, 2);

    // ─── Get poster URLs (proxied through _next/image for same-origin loading) ───
    const dramas = (dramasData as any).dramas || [];
    const posterUrls: string[] = dramas.slice(0, 200).map((d: any) => d.coverUrl ? getProxiedPosterUrl(d.coverUrl) : '').filter(Boolean);

    // ─── Renderer ───
    const renderer = new THREE.WebGLRenderer({ antialias: !isMobile });
    renderer.setSize(rect.width, rect.height);
    renderer.setPixelRatio(pixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // ─── Scene ───
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BG);

    // ─── Camera ───
    const camera = new THREE.PerspectiveCamera(60, rect.width / rect.height, 0.1, 500);
    camera.position.set(0, 0, 32);
    camera.lookAt(0, 0, 0);

    // ─── Group ───
    const group = new THREE.Group();
    scene.add(group);

    // ─── Base sphere (truncated) ───
    const baseGeom = new THREE.SphereGeometry(R, 128, 64);
    const bp = baseGeom.attributes.position;
    const bi = baseGeom.index;
    const keep: boolean[] = [];
    for (let i = 0; i < bp.count; i++) keep.push(Math.abs(bp.getY(i)) <= R * CUT_Y);
    if (bi) {
      const ni: number[] = [];
      for (let i = 0; i < bi.count; i += 3) {
        const a = bi.getX(i), b = bi.getX(i + 1), c = bi.getX(i + 2);
        if (keep[a] && keep[b] && keep[c]) ni.push(a, b, c);
      }
      baseGeom.setIndex(ni);
    }
    baseGeom.computeVertexNormals();
    const baseMat = new THREE.MeshStandardMaterial({
      color: BG, metalness: 0, roughness: 1, envMapIntensity: 0
    });
    const baseSphere = new THREE.Mesh(baseGeom, baseMat);
    group.add(baseSphere);

    // ─── Create tiles ───
    const textureLoader = new THREE.TextureLoader();
    // No crossOrigin needed — URLs are proxied through _next/image (same-origin)
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const pts = structuredGrid(GRID_N, isMobile);
    const allTileMeshes: THREE.Mesh[] = [];
    const glowMeshes: THREE.Mesh[] = [];
    const texCache: Record<string, THREE.Texture> = {};

    pts.forEach((center, idx) => {
      const worldUp = new THREE.Vector3(0, 1, 0);
      const tangentU = new THREE.Vector3().crossVectors(worldUp, center);
      if (tangentU.lengthSq() < 0.001) tangentU.crossVectors(center, new THREE.Vector3(1, 0, 0));
      tangentU.normalize();
      const tangentV = new THREE.Vector3().crossVectors(center, tangentU).normalize();
      const geom = createCurvedTile(center, tangentU, tangentV, R + GAP);

      // Fallback material
      const fallbackMat = new THREE.MeshStandardMaterial({
        color: 0x666666, metalness: 0.1, roughness: 0.4, side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geom, fallbackMat);
      // Store drama metadata for click navigation and overlay
      const dramaIdx = idx % dramas.length;
      const drama = dramas[dramaIdx];
      mesh.userData = {
        dramaIdx,
        slug: drama?.slug || '',
        title: drama?.title || '',
        coverUrl: drama?.coverUrl || '',
        posterUrl: drama?.coverUrl ? getProxiedPosterUrl(drama.coverUrl) : '',
      };
      group.add(mesh);
      allTileMeshes.push(mesh);

      // Gold glow plane behind tile
      const glowGeom = createCurvedTile(center, tangentU, tangentV, R + GAP - 0.02);
      const glowMat = new THREE.MeshBasicMaterial({
        color: GOLD, transparent: true, opacity: 0, side: THREE.DoubleSide
      });
      const glow = new THREE.Mesh(glowGeom, glowMat);
      glow.scale.set(1.25, 1.25, 1.25);
      group.add(glow);
      glowMeshes.push(glow);

      // Load poster texture
      if (posterUrls.length === 0) {
        const hue = (idx * 37 % 360) / 360;
        mesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL(hue, 0.4, 0.5),
          metalness: 0.1, roughness: 0.4, side: THREE.DoubleSide
        });
        return;
      }

      const posterUrl = posterUrls[idx % posterUrls.length];

      function applyTexture(tex: THREE.Texture) {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = maxAniso;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = true;
        (mesh.material as THREE.Material).dispose();
        mesh.material = new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.4, metalness: 0.05 });
      }

      if (texCache[posterUrl]) {
        applyTexture(texCache[posterUrl]);
      } else {
        const texture = textureLoader.load(
          posterUrl,
          (tex) => {
            texCache[posterUrl] = tex;
            applyTexture(tex);
          },
          undefined,
          () => {
            // Load failed — use gold fallback
            (mesh.material as THREE.Material).dispose();
            mesh.material = new THREE.MeshStandardMaterial({
              color: GOLD, metalness: 0.3, roughness: 0.5, side: THREE.DoubleSide
            });
          }
        );
        texture.colorSpace = THREE.SRGBColorSpace;
        texCache[posterUrl] = texture;
      }
    });

    // ─── Hollywood Lighting ───
    scene.add(new THREE.AmbientLight(0xFFF5E6, 1.2));

    const keyLight = new THREE.DirectionalLight(0xFFF0D0, 3);
    keyLight.position.set(-12, 18, 10);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xD4C5B0, 1.0);
    fillLight.position.set(15, 5, -8);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xFFAA33, 1.2);
    rimLight.position.set(0, -10, -15);
    scene.add(rimLight);

    const ptLight1 = new THREE.PointLight(GOLD, 3, 55);
    ptLight1.position.set(14, 8, 10);
    scene.add(ptLight1);

    const ptLight2 = new THREE.PointLight(AMBER, 2, 45);
    ptLight2.position.set(-10, -5, 12);
    scene.add(ptLight2);

    const ptLight3 = new THREE.PointLight(CRIMSON, 0.8, 35);
    ptLight3.position.set(5, 12, -14);
    scene.add(ptLight3);

    // ─── Mobile labels (show drama title under each tile) ───
    const mobileLabelEls: HTMLDivElement[] = [];
    if (isMobile && mobileLabelsRef.current) {
      const labelContainer = mobileLabelsRef.current;
      allTileMeshes.forEach((mesh, idx) => {
        const label = document.createElement('div');
        label.className = 'mobile-tile-label';
        label.textContent = mesh.userData?.title || '';
        label.style.cssText = `
          position: absolute;
          font-family: 'Outfit', sans-serif;
          font-size: 9px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.75);
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 70px;
          pointer-events: none;
          text-shadow: 0 1px 3px rgba(0,0,0,0.8);
          opacity: 0;
          transition: opacity 0.15s;
        `;
        labelContainer.appendChild(label);
        mobileLabelEls.push(label);
      });
    }

    // ─── Gold Particles ───
    const partPos = new Float32Array(PART_N * 3);
    const partVel = new Float32Array(PART_N);
    for (let i = 0; i < PART_N; i++) {
      partPos[i * 3] = (Math.random() - 0.5) * 90;
      partPos[i * 3 + 1] = (Math.random() - 0.5) * 70;
      partPos[i * 3 + 2] = (Math.random() - 0.5) * 50 - 10;
      partVel[i] = 0.01 + Math.random() * 0.025;
    }
    const partGeom = new THREE.BufferGeometry();
    partGeom.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
    const partMat = new THREE.PointsMaterial({
      color: GOLD, size: 0.14, transparent: true, opacity: 0.45,
      sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const particles = new THREE.Points(partGeom, partMat);
    scene.add(particles);

    // ─── Crimson Particles ───
    const part2Pos = new Float32Array(PART2_N * 3);
    const part2Vel = new Float32Array(PART2_N);
    for (let i = 0; i < PART2_N; i++) {
      part2Pos[i * 3] = (Math.random() - 0.5) * 80;
      part2Pos[i * 3 + 1] = (Math.random() - 0.5) * 60;
      part2Pos[i * 3 + 2] = (Math.random() - 0.5) * 40 - 15;
      part2Vel[i] = 0.008 + Math.random() * 0.018;
    }
    const part2Geom = new THREE.BufferGeometry();
    part2Geom.setAttribute('position', new THREE.BufferAttribute(part2Pos, 3));
    const part2Mat = new THREE.PointsMaterial({
      color: CRIMSON, size: 0.2, transparent: true, opacity: 0.25,
      sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const particles2 = new THREE.Points(part2Geom, part2Mat);
    scene.add(particles2);

    // ─── Drag (Y-axis only) + Click detection ───
    let dragging = false, prevX = 0, velY = 0;
    let mouseDownPos = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      mouseDownPos = { x: e.clientX, y: e.clientY };
      dragging = true;
      prevX = e.clientX;
      velY = 0;
    };
    const onMouseMoveGlobal = (e: MouseEvent) => {
      if (!dragging) return;
      const dx = e.clientX - prevX;
      group.rotation.y += dx * DRAG_K;
      velY = dx * DRAG_K;
      prevX = e.clientX;
    };
    const onMouseUp = () => { dragging = false; };

    const onTouchStart = (e: TouchEvent) => {
      mouseDownPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      dragging = true;
      prevX = e.touches[0].clientX;
      velY = 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!dragging) return;
      const dx = e.touches[0].clientX - prevX;
      group.rotation.y += dx * DRAG_K;
      velY = dx * DRAG_K;
      prevX = e.touches[0].clientX;
    };
    const onTouchEnd = () => { dragging = false; };

    // Click handler — navigate to drama detail page
    const onClickCanvas = (e: MouseEvent) => {
      const dx = e.clientX - mouseDownPos.x;
      const dy = e.clientY - mouseDownPos.y;
      if (Math.sqrt(dx * dx + dy * dy) > 5) return; // was a drag, not a click

      const clickMouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(clickMouse, camera);
      const hits = raycaster.intersectObjects(allTileMeshes, false);
      if (hits.length > 0) {
        const data = hits[0].object.userData;
        if (data?.slug) {
          window.location.href = `/drama/${data.slug}`;
        }
      }
    };
    const onTouchEndTap = (e: TouchEvent) => {
      if (e.changedTouches.length === 0) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - mouseDownPos.x;
      const dy = touch.clientY - mouseDownPos.y;
      if (Math.sqrt(dx * dx + dy * dy) > 10) return; // was a drag

      const tapMouse = new THREE.Vector2(
        ((touch.clientX - rect.left) / rect.width) * 2 - 1,
        -((touch.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(tapMouse, camera);
      const hits = raycaster.intersectObjects(allTileMeshes, false);
      if (hits.length > 0) {
        const data = hits[0].object.userData;
        if (data?.slug) {
          window.location.href = `/drama/${data.slug}`;
        }
      }
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMoveGlobal);
    window.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('click', onClickCanvas);
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    renderer.domElement.addEventListener('touchend', onTouchEndTap);

    // ─── Hover ───
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-9, -9);
    let hoveredIdx = -1;
    let mouseMoved = false;
    let shrinkTimer: ReturnType<typeof setTimeout> | null = null;
    let switchTimer: ReturnType<typeof setTimeout> | null = null;
    let pendingSwitchIdx = -1;

    const onMouseMoveCanvas = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouseMoved = true;
    };
    renderer.domElement.addEventListener('mousemove', onMouseMoveCanvas);

    function applyHover(idx: number) {
      if (hoveredIdx >= 0 && hoveredIdx !== idx) {
        allTileMeshes[hoveredIdx].userData.targetScale = 1.0;
        (glowMeshes[hoveredIdx].material as THREE.MeshBasicMaterial).opacity = 0;
      }
      if (idx >= 0) {
        allTileMeshes[idx].userData.targetScale = HOVER_SC;
        (glowMeshes[idx].material as THREE.MeshBasicMaterial).opacity = 0.18;
        renderer.domElement.style.cursor = 'pointer';
      } else {
        renderer.domElement.style.cursor = 'grab';
      }
      hoveredIdx = idx;
    }

    function clearTimers() {
      if (shrinkTimer) { clearTimeout(shrinkTimer); shrinkTimer = null; }
      if (switchTimer) { clearTimeout(switchTimer); switchTimer = null; pendingSwitchIdx = -1; }
    }

    function updateHover() {
      if (dragging) return;

      if (!mouseMoved) {
        for (const mesh of allTileMeshes) {
          const target = mesh.userData.targetScale || 1.0;
          const cur = mesh.scale.x;
          if (Math.abs(cur - target) > 0.001) {
            const ns = cur + (target - cur) * HOVER_LRP;
            mesh.scale.set(ns, ns, ns);
          }
        }
        return;
      }
      mouseMoved = false;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(allTileMeshes, false);
      const newIdx = hits.length > 0 ? allTileMeshes.indexOf(hits[0].object) : -1;

      if (newIdx >= 0 && newIdx === hoveredIdx) {
        clearTimers();
      } else if (newIdx >= 0 && newIdx !== hoveredIdx) {
        if (shrinkTimer) { clearTimeout(shrinkTimer); shrinkTimer = null; }
        if (pendingSwitchIdx !== newIdx) {
          if (switchTimer) clearTimeout(switchTimer);
          pendingSwitchIdx = newIdx;
          switchTimer = setTimeout(() => {
            applyHover(pendingSwitchIdx);
            switchTimer = null;
            pendingSwitchIdx = -1;
          }, SWITCH_DELAY);
        }
      } else if (newIdx < 0 && hoveredIdx >= 0) {
        if (switchTimer) { clearTimeout(switchTimer); switchTimer = null; pendingSwitchIdx = -1; }
        if (!shrinkTimer) {
          shrinkTimer = setTimeout(() => {
            applyHover(-1);
            shrinkTimer = null;
          }, SHRINK_DELAY);
        }
      }

      for (const mesh of allTileMeshes) {
        const target = mesh.userData.targetScale || 1.0;
        const cur = mesh.scale.x;
        if (Math.abs(cur - target) > 0.001) {
          const ns = cur + (target - cur) * HOVER_LRP;
          mesh.scale.set(ns, ns, ns);
        }
      }
    }

    // ─── Animation loop ───
    let animId: number;

    function animate() {
      animId = requestAnimationFrame(animate);

      if (!dragging && hoveredIdx < 0) {
        group.rotation.y += AUTO_ROT + velY;
        velY *= DAMP;
      } else if (dragging) {
        velY *= DAMP;
      }

      // Gold particles
      const pa = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < PART_N; i++) {
        pa[i * 3 + 1] += partVel[i];
        if (pa[i * 3 + 1] > 35) pa[i * 3 + 1] = -35;
      }
      particles.geometry.attributes.position.needsUpdate = true;
      particles.rotation.y += 0.00025;

      // Crimson particles
      const p2a = particles2.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < PART2_N; i++) {
        p2a[i * 3 + 1] += part2Vel[i];
        if (p2a[i * 3 + 1] > 30) p2a[i * 3 + 1] = -30;
      }
      particles2.geometry.attributes.position.needsUpdate = true;
      particles2.rotation.y -= 0.00018;

      // Point lights sway
      ptLight1.position.x = 14 + Math.sin(Date.now() * 0.0005) * 3;
      ptLight2.position.y = -4 + Math.cos(Date.now() * 0.0007) * 2;

      // Check if Back button was clicked — force clear hover
      if (clearHoverSignalRef.current) {
        mouse.set(-9, -9);
        mouseMoved = true;
        clearHoverSignalRef.current = false;
      }

      updateHover();

      // Update overlay position and visibility
      if (overlayRef.current) {
        if (hoveredIdx >= 0 && allTileMeshes[hoveredIdx]) {
          const mesh = allTileMeshes[hoveredIdx];
          const worldPos = new THREE.Vector3();
          mesh.getWorldPosition(worldPos);
          worldPos.project(camera);
          const rect = container.getBoundingClientRect();
          const x = (worldPos.x * 0.5 + 0.5) * rect.width;
          const y = (-worldPos.y * 0.5 + 0.5) * rect.height;
          overlayRef.current.style.left = `${x}px`;
          overlayRef.current.style.top = `${y + 50}px`;
          overlayRef.current.style.transform = 'translate(-50%, 0)';
          overlayRef.current.style.opacity = '1';
          hoveredSlugRef.current = mesh.userData?.slug || '';
        } else {
          overlayRef.current.style.opacity = '0';
          hoveredSlugRef.current = '';
        }
      }

      // Update mobile labels positions
      if (isMobile && mobileLabelEls.length > 0) {
        const rect = container.getBoundingClientRect();
        const cameraDir = new THREE.Vector3();
        camera.getWorldDirection(cameraDir);
        
        for (let i = 0; i < mobileLabelEls.length; i++) {
          const mesh = allTileMeshes[i];
          const label = mobileLabelEls[i];
          
          // Get tile world position and normal
          const worldPos = new THREE.Vector3();
          mesh.getWorldPosition(worldPos);
          
          // Check if tile is facing camera (dot product of camera direction and tile normal)
          const tileNormal = worldPos.clone().normalize();
          const toCamera = camera.position.clone().sub(worldPos).normalize();
          const dot = tileNormal.dot(toCamera);
          
          // Only show if facing camera (dot > 0.3 means reasonably facing)
          if (dot > 0.3) {
            // Project to screen
            const projected = worldPos.clone().project(camera);
            const x = (projected.x * 0.5 + 0.5) * rect.width;
            const y = (-projected.y * 0.5 + 0.5) * rect.height;
            
            // Check if within viewport
            if (x >= -50 && x <= rect.width + 50 && y >= -50 && y <= rect.height + 50) {
              label.style.left = `${x}px`;
              label.style.top = `${y + 22}px`; // Position below tile
              label.style.transform = 'translateX(-50%)';
              label.style.opacity = String(Math.min(1, (dot - 0.3) * 2));
            } else {
              label.style.opacity = '0';
            }
          } else {
            label.style.opacity = '0';
          }
        }
      }

      renderer.render(scene, camera);
    }
    animate();

    // ─── Resize ───
    const onResize = () => {
      const rect = container.getBoundingClientRect();
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
      renderer.setSize(rect.width, rect.height);
    };
    window.addEventListener('resize', onResize);

    // ─── Cleanup ───
    cleanupRef.current = () => {
      cancelAnimationFrame(animId);
      clearTimers();

      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMoveGlobal);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMoveCanvas);
      renderer.domElement.removeEventListener('click', onClickCanvas);
      renderer.domElement.removeEventListener('touchstart', onTouchStart);
      renderer.domElement.removeEventListener('touchend', onTouchEndTap);

      // Dispose all geometries and materials
      allTileMeshes.forEach(m => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      glowMeshes.forEach(m => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });

      baseGeom.dispose();
      baseMat.dispose();
      partGeom.dispose();
      partMat.dispose();
      part2Geom.dispose();
      part2Mat.dispose();

      // Dispose cached textures
      Object.values(texCache).forEach(tex => tex.dispose());

      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      // Remove mobile labels
      mobileLabelEls.forEach(el => el.remove());
    };

    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'auto',
        }}
      />
      {/* Mobile tile title overlays */}
      {isMobileState && (
        <div
          ref={mobileLabelsRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 50,
            overflow: 'hidden',
          }}
        />
      )}
      {/* Hover overlay with action buttons */}
      <div
        ref={overlayRef}
        style={{
          position: 'absolute',
          zIndex: 100,
          pointerEvents: 'auto',
          opacity: 0,
          transition: 'opacity 200ms ease',
          display: 'flex',
          gap: '8px',
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Signal the animate loop to clear hover state
            clearHoverSignalRef.current = true;
            hoveredSlugRef.current = '';
          }}
          style={{
            padding: '6px 14px',
            fontSize: '12px',
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 600,
            borderRadius: '9999px',
            border: '1px solid #D4AF37',
            background: 'rgba(10,10,10,0.85)',
            color: '#D4AF37',
            backdropFilter: 'blur(8px)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap' as const,
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.background = '#D4AF37';
            (e.target as HTMLButtonElement).style.color = '#0A0A0A';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.background = 'rgba(10,10,10,0.85)';
            (e.target as HTMLButtonElement).style.color = '#D4AF37';
          }}
        >
          ← Back
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            const slug = hoveredSlugRef.current;
            if (slug) window.location.href = `/drama/${slug}`;
          }}
          style={{
            padding: '6px 14px',
            fontSize: '12px',
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 600,
            borderRadius: '9999px',
            border: '1px solid #D4AF37',
            background: 'rgba(10,10,10,0.85)',
            color: '#D4AF37',
            backdropFilter: 'blur(8px)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap' as const,
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.background = '#D4AF37';
            (e.target as HTMLButtonElement).style.color = '#0A0A0A';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.background = 'rgba(10,10,10,0.85)';
            (e.target as HTMLButtonElement).style.color = '#D4AF37';
          }}
        >
          Details →
        </button>
      </div>
    </>
  );
}
