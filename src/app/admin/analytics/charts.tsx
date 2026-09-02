"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ─────────────────────────────────────────────────────────────
// نمودارهای آمار پنل — فاز ۶ (C5)
// recharts + پالت برند (طلایی/بنفش)
// ─────────────────────────────────────────────────────────────

const GOLD = "#d4af37";
const PURPLE = "#7b4ddf";
const EMERALD = "#34d399";
const SKY = "#38bdf8";
const ROSE = "#fb7185";
const AMBER = "#fbbf24";

const tooltipStyle = {
  backgroundColor: "#12121a",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 12,
  fontSize: 12,
  color: "#f5f5f0",
  direction: "rtl" as const,
};

const axisTick = { fill: "rgba(245,245,240,0.5)", fontSize: 11 };

export function RegistrationsAreaChart({ data }: { data: { label: string; count: number }[] }) {
  return (
    <div dir="ltr" className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="regGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GOLD} stopOpacity={0.5} />
              <stop offset="100%" stopColor={GOLD} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={axisTick}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            interval="preserveStartEnd"
            minTickGap={28}
          />
          <YAxis
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={36}
            allowDecimals={false}
          />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#d4af37" }} />
          <Area
            type="monotone"
            dataKey="count"
            name="ثبت‌نام"
            stroke={GOLD}
            strokeWidth={2}
            fill="url(#regGold)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function EventsBarChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div dir="ltr" className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
          <XAxis type="number" tick={axisTick} tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ ...axisTick, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={150}
            orientation="right"
          />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="value" name="ثبت‌نام قطعی" fill={PURPLE} radius={[0, 8, 8, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const STATUS_COLORS = [EMERALD, AMBER, ROSE, "#f43f5e"];

export function StatusDonut({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex h-64 items-center" dir="rtl">
      <ResponsiveContainer width="60%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="58%"
            outerRadius="85%"
            paddingAngle={3}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-1 space-y-2 pe-2">
        <div className="text-2xl font-black tabular-nums">{total.toLocaleString("fa-IR")}</div>
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-2 text-xs text-white/70">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[i % STATUS_COLORS.length] }}
            />
            <span className="flex-1">{d.name}</span>
            <span className="tabular-nums text-white/90">{d.value.toLocaleString("fa-IR")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SourcesBarChart({ data }: { data: { name: string; value: number }[] }) {
  const colors = [GOLD, SKY, PURPLE, EMERALD, AMBER, ROSE, "#a78bfa", "#94a3b8"];
  return (
    <div dir="ltr" className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ ...axisTick, fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            interval={0}
          />
          <YAxis tick={axisTick} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="value" name="ثبت‌نام" radius={[8, 8, 0, 0]} barSize={26}>
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CheckinPie({ data }: { data: { name: string; value: number }[] }) {
  const colors = [GOLD, "#3f3f5a"];
  return (
    <div dir="rtl" className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={3} stroke="none">
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
