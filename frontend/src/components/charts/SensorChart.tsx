import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { SensorReading } from "@/types";

interface SeriesConfig {
  key: keyof SensorReading;
  color: string;
  label: string;
  unit?: string;
}

export function SensorChart({
  data,
  series,
  height = 220,
}: {
  data: SensorReading[];
  series: SeriesConfig[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid stroke="#1a2023" vertical={false} />
        <XAxis
          dataKey="timestamp"
          tickFormatter={(v: string) => new Date(v).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })}
          stroke="#6f7d81"
          tick={{ fontSize: 10, fontFamily: "IBM Plex Mono" }}
          minTickGap={40}
        />
        <YAxis stroke="#6f7d81" tick={{ fontSize: 10, fontFamily: "IBM Plex Mono" }} width={36} />
        <Tooltip
          contentStyle={{
            background: "#12171a",
            border: "1px solid #232b2f",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelFormatter={(v) => new Date(String(v)).toLocaleString("en-IN")}
          labelStyle={{ color: "#aab6b9", marginBottom: 4 }}
        />
        {series.map((s) => (
          <Line
            key={String(s.key)}
            type="monotone"
            dataKey={s.key}
            name={`${s.label}${s.unit ? ` (${s.unit})` : ""}`}
            stroke={s.color}
            strokeWidth={1.75}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
