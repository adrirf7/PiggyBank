import { formatCurrency } from "@/utils/calculations";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NativeSyntheticEvent, NativeTouchEvent, View } from "react-native";
import { Text } from "@/components/text";
import Svg, { G, Line, Rect, Text as SvgText } from "react-native-svg";

export interface BarGroup {
  label: string;
  income: number;
  expense: number;
  dayLabel?: string;
}

interface Props {
  data: BarGroup[];
  height?: number;
  incomeColor?: string;
  expenseColor?: string;
  isDark?: boolean;
  currencyCode?: string;
  onTouchActiveChange?: (isActive: boolean) => void;
}

const INCOME_COLOR = "#22C55E";
const EXPENSE_COLOR = "#EF4444";

function formatYVal(val: number): string {
  if (val === 0) return "0";
  if (val >= 10000) return `${Math.round(val / 1000)}k`;
  if (val >= 1000) return `${(val / 1000).toFixed(1).replace(".0", "")}k`;
  return `${Math.round(val)}`;
}

export default function BarChart({ data, height = 180, incomeColor = INCOME_COLOR, expenseColor = EXPENSE_COLOR, isDark = false, currencyCode, onTouchActiveChange }: Props) {
  const hasData = data.length > 0;
  const yAxisWidth = 32;
  const chartPaddingRight = 8;
  const chartPaddingTop = 10;
  const verticalXLabels = data.length > 12;
  const bottomLabelHeight = 20;
  const svgHeight = height + bottomLabelHeight;
  const svgWidth = 320;
  const drawWidth = svgWidth - yAxisWidth - chartPaddingRight;

  const maxVal = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  const paddedMaxVal = maxVal * 1.12;
  const nonZeroValues = data.flatMap((d) => [d.income, d.expense]).filter((v) => v > 0);
  const minNonZeroVal = nonZeroValues.length > 0 ? Math.max(1, Math.min(...nonZeroValues)) : 1;
  const rangeRatio = paddedMaxVal / minNonZeroVal;
  const yIntervals = rangeRatio >= 15 ? 6 : 4;
  const yStepRaw = paddedMaxVal / yIntervals;
  const yExp = Math.floor(Math.log10(Math.max(1, yStepRaw)));
  const yMagnitude = Math.pow(10, yExp);
  const yFraction = yStepRaw / yMagnitude;
  const yNiceFraction =
    yFraction <= 1
      ? 1
      : yFraction <= 1.2
        ? 1.2
        : yFraction <= 1.5
          ? 1.5
          : yFraction <= 2
            ? 2
            : yFraction <= 2.5
              ? 2.5
              : yFraction <= 3
                ? 3
                : yFraction <= 4
                  ? 4
                  : yFraction <= 5
                    ? 5
                    : 10;
  const yStep = yNiceFraction * yMagnitude;
  const yMax = yStep * yIntervals;

  const groupWidth = drawWidth / Math.max(data.length, 1);
  const barWidth = Math.min(groupWidth * 0.35, 14);
  const gap = 2;

  const yLines = Array.from({ length: yIntervals + 1 }, (_, i) => i / yIntervals);
  const LONG_PRESS_DELAY_MS = 220;
  const MOVE_CANCEL_THRESHOLD = 8;
  const [touchState, setTouchState] = useState<{
    isActive: boolean;
    lineX: number;
    hoveredBar: null | {
      type: "income" | "expense";
      value: number;
      topY: number;
      dayLabel?: string;
    };
  }>({ isActive: false, lineX: yAxisWidth, hoveredBar: null });

  const barsMeta = useMemo(
    () =>
      data.map((group, i) => {
        const groupX = yAxisWidth + i * groupWidth + groupWidth / 2;
        const incomeX = groupX - barWidth - gap / 2;
        const expenseX = groupX + gap / 2;

        const incomeRatio = Math.min(1, Math.max(0, group.income / yMax));
        const expenseRatio = Math.min(1, Math.max(0, group.expense / yMax));
        const incomeH = Math.max(incomeRatio * (height - chartPaddingTop), group.income > 0 ? 2 : 0);
        const expenseH = Math.max(expenseRatio * (height - chartPaddingTop), group.expense > 0 ? 2 : 0);
        const incomeY = height - incomeH;
        const expenseY = height - expenseH;

        return {
          group,
          groupX,
          income: { x: incomeX, y: incomeY, width: barWidth, height: incomeH },
          expense: { x: expenseX, y: expenseY, width: barWidth, height: expenseH },
        };
      }),
    [barWidth, chartPaddingTop, data, gap, groupWidth, height, yAxisWidth, yMax],
  );

  const updateTouchAtX = useCallback(
    (locationX: number) => {
      const minX = yAxisWidth;
      const maxX = svgWidth - chartPaddingRight;
      const clampedX = Math.min(maxX, Math.max(minX, locationX));

      let hoveredBar: {
        type: "income" | "expense";
        value: number;
        topY: number;
        dayLabel?: string;
      } | null = null;

      for (const item of barsMeta) {
        if (item.income.height > 0 && clampedX >= item.income.x && clampedX <= item.income.x + item.income.width) {
          hoveredBar = { type: "income", value: item.group.income, topY: item.income.y, dayLabel: item.group.dayLabel };
          break;
        }

        if (item.expense.height > 0 && clampedX >= item.expense.x && clampedX <= item.expense.x + item.expense.width) {
          hoveredBar = { type: "expense", value: item.group.expense, topY: item.expense.y, dayLabel: item.group.dayLabel };
          break;
        }
      }

      setTouchState({
        isActive: true,
        lineX: clampedX,
        hoveredBar,
      });
    },
    [barsMeta, chartPaddingRight, svgWidth, yAxisWidth],
  );

  const tooltip = useMemo(() => {
    if (!touchState.isActive || !touchState.hoveredBar) return null;

    const title = touchState.hoveredBar.type === "income" ? "Ingreso" : "Gasto";
    const amount = formatCurrency(touchState.hoveredBar.value, currencyCode);
    const text = `${title}: ${amount}`;
    
    // Ancho fijo más reducido
    const tooltipWidth = 110;
    const tooltipHeight = touchState.hoveredBar.dayLabel ? 38 : 22;
    const x = Math.min(svgWidth - chartPaddingRight - tooltipWidth, Math.max(yAxisWidth, touchState.lineX - tooltipWidth / 2));
    const y = chartPaddingTop + 2;
    return { 
      text, 
      x, 
      y, 
      width: tooltipWidth, 
      height: tooltipHeight, 
      dayLabel: touchState.hoveredBar.dayLabel 
    };
  }, [chartPaddingRight, chartPaddingTop, currencyCode, svgWidth, touchState, yAxisWidth]);

  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStartRef = useRef<{ pageX: number; pageY: number } | null>(null);
  const lastLocationXRef = useRef<number>(yAxisWidth);
  const chartBoundsRef = useRef<{ left: number; width: number }>({ left: 0, width: svgWidth });
  const chartContainerRef = useRef<View>(null);

  const updateChartBounds = useCallback(() => {
    chartContainerRef.current?.measureInWindow((x, _y, width) => {
      chartBoundsRef.current = { left: x, width };
    });
  }, []);

  const getRelativeX = useCallback((event: NativeSyntheticEvent<NativeTouchEvent>) => {
    const relativeX = event.nativeEvent.pageX - chartBoundsRef.current.left;
    if (Number.isFinite(relativeX)) return relativeX;
    return event.nativeEvent.locationX;
  }, []);

  const clearLongPressTimer = useCallback(() => {
    if (!longPressTimeoutRef.current) return;
    clearTimeout(longPressTimeoutRef.current);
    longPressTimeoutRef.current = null;
  }, []);

  const activateTouchAtX = useCallback(
    (locationX: number) => {
      onTouchActiveChange?.(true);
      updateTouchAtX(locationX);
    },
    [onTouchActiveChange, updateTouchAtX],
  );

  const deactivateTouch = useCallback(() => {
    clearLongPressTimer();
    pressStartRef.current = null;
    setTouchState({ isActive: false, lineX: yAxisWidth, hoveredBar: null });
    onTouchActiveChange?.(false);
  }, [clearLongPressTimer, onTouchActiveChange, yAxisWidth]);

  const handleTouchStart = useCallback(
    (event: NativeSyntheticEvent<NativeTouchEvent>) => {
      if (touchState.isActive) return;

      updateChartBounds();
      clearLongPressTimer();
      const { pageX, pageY } = event.nativeEvent;
      pressStartRef.current = { pageX, pageY };
      lastLocationXRef.current = getRelativeX(event);

      longPressTimeoutRef.current = setTimeout(() => {
        activateTouchAtX(lastLocationXRef.current);
      }, LONG_PRESS_DELAY_MS);
    },
    [activateTouchAtX, clearLongPressTimer, getRelativeX, touchState.isActive, updateChartBounds],
  );

  const handleTouchMove = useCallback(
    (event: NativeSyntheticEvent<NativeTouchEvent>) => {
      const { pageX, pageY } = event.nativeEvent;
      const relativeX = getRelativeX(event);
      lastLocationXRef.current = relativeX;

      if (touchState.isActive) {
        updateTouchAtX(relativeX);
        return;
      }

      const pressStart = pressStartRef.current;
      if (!pressStart || !longPressTimeoutRef.current) return;

      const movedX = Math.abs(pageX - pressStart.pageX);
      const movedY = Math.abs(pageY - pressStart.pageY);
      if (movedX > MOVE_CANCEL_THRESHOLD || movedY > MOVE_CANCEL_THRESHOLD) {
        clearLongPressTimer();
        pressStartRef.current = null;
      }
    },
    [clearLongPressTimer, getRelativeX, touchState.isActive, updateTouchAtX],
  );

  const handleTouchEnd = useCallback(() => {
    if (!touchState.isActive) {
      clearLongPressTimer();
      pressStartRef.current = null;
      return;
    }
    deactivateTouch();
  }, [clearLongPressTimer, deactivateTouch, touchState.isActive]);

  useEffect(
    () => () => {
      clearLongPressTimer();
      onTouchActiveChange?.(false);
    },
    [clearLongPressTimer, onTouchActiveChange],
  );

  useEffect(() => {
    updateChartBounds();
  }, [updateChartBounds]);

  const shouldStartResponder = useCallback(() => false, []);
  const shouldMoveResponder = useCallback(() => touchState.isActive, [touchState.isActive]);
  const shouldAllowTermination = useCallback(() => false, []);
  const handleResponderTerminate = useCallback(() => {
    deactivateTouch();
  }, [deactivateTouch]);

  if (!hasData) return null;

  return (
    <View ref={chartContainerRef} className="w-full" onLayout={updateChartBounds}>
      <Svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ alignSelf: "center" }}
        onStartShouldSetResponder={shouldStartResponder}
        onMoveShouldSetResponder={shouldMoveResponder}
        onResponderTerminationRequest={shouldAllowTermination}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onResponderRelease={deactivateTouch}
        onResponderTerminate={handleResponderTerminate}
      >
        {/* Y-axis labels */}
        {yLines.map((ratio) => {
          const y = chartPaddingTop + (1 - ratio) * (height - chartPaddingTop);
          const val = yMax * ratio;
          return (
            <SvgText key={`lbl-${ratio}`} x={yAxisWidth - 4} y={y + 3.5} textAnchor="end" fontSize={9} fill="#94A3B8">
              {formatYVal(val)}
            </SvgText>
          );
        })}

        {/* Grid lines */}
        {yLines.map((ratio) => {
          const y = chartPaddingTop + (1 - ratio) * (height - chartPaddingTop);
          return (
            <Line
              key={`line-${ratio}`}
              x1={yAxisWidth}
              x2={svgWidth - chartPaddingRight}
              y1={y}
              y2={y}
              stroke="#2a2a2a"
              strokeWidth={1}
              strokeDasharray={ratio === 0 ? "" : "3,3"}
            />
          );
        })}

        {/* Bars */}
        {barsMeta.map((item, index) => {
          const shouldShowLabel = data.length > 12 ? index % 5 === 0 || index === data.length - 1 : true;
          const labelY = height + bottomLabelHeight - 5;
          const labelX = item.groupX;

          return (
            <G key={`${item.group.label}-${item.groupX}`}>
              <Rect x={item.income.x} y={item.income.y} width={item.income.width} height={item.income.height} rx={3} ry={3} fill={incomeColor} opacity={0.9} />
              <Rect x={item.expense.x} y={item.expense.y} width={item.expense.width} height={item.expense.height} rx={3} ry={3} fill={expenseColor} opacity={0.9} />
              {shouldShowLabel && (
                <SvgText
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#94A3B8"
                  fontWeight="500"
                  transform={verticalXLabels ? `rotate(-90 ${labelX} ${labelY})` : undefined}
                >
                  {item.group.label}
                </SvgText>
              )}
            </G>
          );
        })}

        {touchState.isActive && <Line x1={touchState.lineX} x2={touchState.lineX} y1={chartPaddingTop} y2={height} stroke="#64748B" strokeWidth={1.25} strokeDasharray="3,3" />}
        {tooltip && (
          <G>
            <Rect x={tooltip.x} y={tooltip.y} width={tooltip.width} height={tooltip.height} rx={6} ry={6} fill="#0F172A" opacity={0.95} />
            {tooltip.dayLabel && (
              <SvgText x={tooltip.x + tooltip.width / 2} y={tooltip.y + 10} textAnchor="middle" fontSize={9} fill="#94A3B8">
                {tooltip.dayLabel}
              </SvgText>
            )}
            <SvgText 
              x={tooltip.x + tooltip.width / 2} 
              y={tooltip.dayLabel ? tooltip.y + 26 : tooltip.y + 14.5} 
              textAnchor="middle" 
              fontSize={10} 
              fill="#FFFFFF" 
              fontWeight="600"
            >
              {tooltip.text}
            </SvgText>
          </G>
        )}
      </Svg>

      {/* Legend */}
      <View className="flex-row justify-center gap-x-5 mt-4">
        <View className="flex-row items-center gap-x-1.5">
          <View className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: incomeColor }} />
          <Text className="text-xs text-slate-500 dark:text-slate-400">Ingresos</Text>
        </View>
        <View className="flex-row items-center gap-x-1.5">
          <View className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: expenseColor }} />
          <Text className="text-xs text-slate-500 dark:text-slate-400">Gastos</Text>
        </View>
      </View>
    </View>
  );
}
