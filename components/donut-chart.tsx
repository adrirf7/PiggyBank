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
  centerLabelColor?: string;
  centerSubLabelColor?: string;
  centerBackgroundColor?: string;
  morph?: {
    activeIndex: number;
    progress: number;
  } | null;
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

export default function DonutChart({
  data,
  radius = 76,
  strokeWidth = 22,
  centerLabel,
  centerSubLabel,
  centerLabelColor = "#0F172A",
  centerSubLabelColor = "#64748B",
  centerBackgroundColor = "#FFFFFF",
  morph = null,
}: Props) {
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

  const baseGapAngle = data.length > 1 ? 2.5 : 0;
  const totalGap = data.length * baseGapAngle;
  const availableAngle = Math.max(360 - totalGap, 0);
  let currentAngle = 0;
  const baseSegments = data.map((seg, i) => {
    const sweep = (seg.value / total) * availableAngle;
    const start = currentAngle;
    const end = currentAngle + sweep;
    currentAngle = end + baseGapAngle;
    return { ...seg, start, end, key: i };
  });

  const segments = (() => {
    if (!morph || data.length <= 1) return baseSegments;

    const activeIndex = morph.activeIndex;
    const p = Math.min(1, Math.max(0, morph.progress));
    if (activeIndex < 0 || activeIndex >= baseSegments.length) return baseSegments;

    const activeBase = baseSegments[activeIndex];
    if (p >= 0.999) {
      return [{ ...activeBase, start: 0, end: 360, key: activeBase.key }];
    }

    const activeBaseSweep = activeBase.end - activeBase.start;
    const activeCenter = (activeBase.start + activeBase.end) / 2;
    const fixedGap = baseGapAngle;
    const drawableTotal = Math.max(360 - fixedGap * data.length, 0);
    const activeSweep = activeBaseSweep + (drawableTotal - activeBaseSweep) * p;
    const activeStart = activeCenter - activeSweep / 2;
    const activeEnd = activeCenter + activeSweep / 2;

    const others = data.map((seg, index) => ({ ...seg, index })).filter((seg) => seg.index !== activeIndex);

    const othersTotal = others.reduce((sum, seg) => sum + seg.value, 0);
    const othersAvailable = Math.max(drawableTotal - activeSweep, 0);

    const orderedOthers = [...others.filter((seg) => seg.index > activeIndex), ...others.filter((seg) => seg.index < activeIndex)];

    let cursor = activeEnd + fixedGap;
    const morphedOthers = orderedOthers.map((seg) => {
      const sweep = othersTotal > 0 ? (seg.value / othersTotal) * othersAvailable : 0;
      const start = cursor;
      const end = cursor + sweep;
      cursor = end + fixedGap;
      return { ...seg, start, end, key: seg.index };
    });

    return [{ ...activeBase, start: activeStart, end: activeEnd, key: activeBase.key }, ...morphedOthers];
  })();

  return (
    <Svg width={size} height={size}>
      {segments.map((seg) => {
        const normalizedSweep = seg.end - seg.start;
        if (normalizedSweep <= 0.001) return null;
        if (normalizedSweep >= 359.9) {
          return <Circle key={seg.key} cx={cx} cy={cy} r={radius} fill="none" stroke={seg.color} strokeWidth={strokeWidth} />;
        }
        return <Path key={seg.key} d={buildArcPath(cx, cy, radius, seg.start, seg.end)} fill="none" stroke={seg.color} strokeWidth={strokeWidth} strokeLinecap="butt" />;
      })}
      {centerLabel && (
        <G>
          <Circle cx={cx} cy={cy} r={Math.max(radius - strokeWidth / 2 - 2, 1)} fill={centerBackgroundColor} />
          <SvgText x={cx} y={cy - 6} textAnchor="middle" fontSize={16} fontWeight="700" fill={centerLabelColor}>
            {centerLabel}
          </SvgText>
          {centerSubLabel && (
            <SvgText x={cx} y={cy + 14} textAnchor="middle" fontSize={11} fill={centerSubLabelColor}>
              {centerSubLabel}
            </SvgText>
          )}
        </G>
      )}
    </Svg>
  );
}
