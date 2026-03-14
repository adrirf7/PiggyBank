import React from "react";
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";

export interface DonutSegment {
  value: number;
  color: string;
  label: string;
}

interface Props {
  data: DonutSegment[];
  radius?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSubLabel?: string;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function buildArcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const s = polarToCartesian(cx, cy, r, startDeg);
  const e = polarToCartesian(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

export default function DonutChart({ data, radius = 76, strokeWidth = 22, centerLabel, centerSubLabel }: Props) {
  const size = (radius + strokeWidth + 4) * 2;
  const cx = size / 2;
  const cy = size / 2;
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={radius} fill="none" stroke="#E2E8F0" strokeWidth={strokeWidth} />
      </Svg>
    );
  }

  let currentAngle = 0;
  const segments = data.map((seg, i) => {
    const sweep = (seg.value / total) * 358; // 358 to leave a small gap
    const start = currentAngle;
    const end = currentAngle + sweep;
    currentAngle = end + 2; // 2° gap between segments
    return { ...seg, start, end, key: i };
  });

  return (
    <Svg width={size} height={size}>
      {segments.map((seg) => (
        <Path key={seg.key} d={buildArcPath(cx, cy, radius, seg.start, seg.end)} fill="none" stroke={seg.color} strokeWidth={strokeWidth} strokeLinecap="round" />
      ))}
      {centerLabel && (
        <G>
          <SvgText x={cx} y={cy - 6} textAnchor="middle" fontSize={16} fontWeight="700" fill="#0F172A">
            {centerLabel}
          </SvgText>
          {centerSubLabel && (
            <SvgText x={cx} y={cy + 14} textAnchor="middle" fontSize={11} fill="#64748B">
              {centerSubLabel}
            </SvgText>
          )}
        </G>
      )}
    </Svg>
  );
}
