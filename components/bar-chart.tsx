import React from "react";
import { Text, View } from "react-native";
import Svg, { G, Line, Rect, Text as SvgText } from "react-native-svg";

export interface BarGroup {
  label: string;
  income: number;
  expense: number;
}

interface Props {
  data: BarGroup[];
  height?: number;
  incomeColor?: string;
  expenseColor?: string;
}

const INCOME_COLOR = "#22C55E";
const EXPENSE_COLOR = "#EF4444";

function getNiceMax(val: number): number {
  if (val <= 0) return 100;
  const exp = Math.floor(Math.log10(val));
  const magnitude = Math.pow(10, exp);
  const fraction = val / magnitude;
  let nice: number;
  if (fraction <= 1) nice = 1;
  else if (fraction <= 2) nice = 2;
  else if (fraction <= 5) nice = 5;
  else nice = 10;
  return nice * magnitude;
}

function formatYVal(val: number): string {
  if (val === 0) return "0";
  if (val >= 10000) return `${Math.round(val / 1000)}k`;
  if (val >= 1000) return `${(val / 1000).toFixed(1).replace(".0", "")}k`;
  return `${Math.round(val)}`;
}

export default function BarChart({ data, height = 180, incomeColor = INCOME_COLOR, expenseColor = EXPENSE_COLOR }: Props) {
  if (data.length === 0) return null;

  const yAxisWidth = 38;
  const chartPaddingRight = 8;
  const chartPaddingTop = 10;
  const bottomLabelHeight = 22;
  const svgHeight = height + bottomLabelHeight;
  const svgWidth = 320;
  const drawWidth = svgWidth - yAxisWidth - chartPaddingRight;

  const maxVal = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  const niceMax = getNiceMax(maxVal);

  const groupWidth = drawWidth / data.length;
  const barWidth = Math.min(groupWidth * 0.35, 14);
  const gap = 2;

  const yLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <View className="w-full">
      <Svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ alignSelf: "center" }}>
        {/* Y-axis labels */}
        {yLines.map((ratio) => {
          const y = chartPaddingTop + (1 - ratio) * (height - chartPaddingTop);
          const val = niceMax * ratio;
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
              stroke="#E2E8F0"
              strokeWidth={1}
              strokeDasharray={ratio === 0 ? "" : "4,4"}
            />
          );
        })}

        {/* Bars */}
        {data.map((group, i) => {
          const groupX = yAxisWidth + i * groupWidth + groupWidth / 2;
          const incomeX = groupX - barWidth - gap / 2;
          const expenseX = groupX + gap / 2;

          const incomeH = Math.max((group.income / niceMax) * (height - chartPaddingTop), group.income > 0 ? 2 : 0);
          const expenseH = Math.max((group.expense / niceMax) * (height - chartPaddingTop), group.expense > 0 ? 2 : 0);
          const incomeY = height - incomeH;
          const expenseY = height - expenseH;
          const labelY = height + bottomLabelHeight - 4;

          return (
            <G key={i}>
              <Rect x={incomeX} y={incomeY} width={barWidth} height={incomeH} rx={3} ry={3} fill={incomeColor} opacity={0.9} />
              <Rect x={expenseX} y={expenseY} width={barWidth} height={expenseH} rx={3} ry={3} fill={expenseColor} opacity={0.9} />
              <SvgText x={groupX} y={labelY} textAnchor="middle" fontSize={10} fill="#94A3B8" fontWeight="500">
                {group.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>

      {/* Legend */}
      <View className="flex-row justify-center gap-x-5 mt-1">
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
