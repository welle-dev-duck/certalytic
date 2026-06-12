"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

import { useChartTheme } from "@/hooks/use-chart-theme";

export type RadarPoint = { subject: string; value: number };

type IntegrityRadarChartProps = {
  data: RadarPoint[];
  height?: number;
  className?: string;
};

export function IntegrityRadarChart({
  data,
  height = 220,
  className,
}: IntegrityRadarChartProps) {
  const theme = useChartTheme();

  return (
    <div className={className} style={{ height, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
          data={data}
          margin={{ top: 16, right: 24, bottom: 16, left: 24 }}
        >
          <PolarGrid stroke={theme.border} />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: theme.mutedForeground, fontSize: 9 }}
          />
          <Radar
            dataKey="value"
            stroke={theme.primary}
            fill={theme.primary}
            fillOpacity={0.22}
            strokeWidth={1.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
