'use client';

import { useMemo } from 'react';

// Pure CSS 3D mini disco ball — 12 solid color tiles, no Three.js needed
// Arranged in a sphere-like pattern, auto-rotating

const COLORS = [
  '#D4AF37', // gold
  '#F4D03F', // gold-light
  '#B8860B', // gold-dark
  '#FFBF00', // amber
  '#DC143C', // crimson
  '#D4AF37',
  '#F4D03F',
  '#B8860B',
  '#FFBF00',
  '#DC143C',
  '#D4AF37',
  '#F4D03F',
];

// Distribute 12 tiles on a sphere using simple ring approach
function getTileTransforms(count: number): string[] {
  const transforms: string[] = [];
  // Top ring: 4 tiles
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * 360;
    transforms.push(`rotateY(${angle}deg) rotateX(-30deg) translateZ(14px)`);
  }
  // Middle ring: 4 tiles (offset)
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * 360 + 45;
    transforms.push(`rotateY(${angle}deg) rotateX(5deg) translateZ(15px)`);
  }
  // Bottom ring: 4 tiles
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * 360 + 22;
    transforms.push(`rotateY(${angle}deg) rotateX(35deg) translateZ(14px)`);
  }
  return transforms.slice(0, count);
}

export default function MiniDiscoBall({ size = 36 }: { size?: number }) {
  const tiles = useMemo(() => {
    const transforms = getTileTransforms(12);
    return transforms.map((transform, i) => ({
      transform,
      color: COLORS[i % COLORS.length],
    }));
  }, []);

  const halfSize = size / 2;
  const tileSize = Math.round(size * 0.22);

  return (
    <div
      className="mini-disco-wrap"
      style={{
        width: size,
        height: size,
        perspective: size * 3,
        flexShrink: 0,
      }}
    >
      <style jsx>{`
        .mini-disco-wrap {
          position: relative;
        }
        .mini-ball {
          position: absolute;
          inset: 0;
          transform-style: preserve-3d;
          animation: mini-ball-spin 8s linear infinite;
        }
        .mini-tile {
          position: absolute;
          border-radius: 2px;
          opacity: 0.85;
          backface-visibility: hidden;
        }
        @keyframes mini-ball-spin {
          from { transform: rotateY(0deg) rotateX(-15deg); }
          to { transform: rotateY(360deg) rotateX(-15deg); }
        }
      `}</style>
      <div className="mini-ball">
        {tiles.map((tile, i) => (
          <div
            key={i}
            className="mini-tile"
            style={{
              width: tileSize,
              height: tileSize,
              background: tile.color,
              left: halfSize - tileSize / 2,
              top: halfSize - tileSize / 2,
              transform: tile.transform,
            }}
          />
        ))}
      </div>
    </div>
  );
}
