import React, { useMemo } from 'react';

// ─── Bar Chart ────────────────────────────────────────────────────────────────

interface BarItem { label: string; value: number; color?: string; }

interface BarChartProps {
  data: BarItem[];
  height?: number;
  unit?: string;
  title?: string;
  color?: string;
  language?: string;
}

export function BarChart({ data, height = 160, unit = '', title, color = 'var(--primary)', language = 'fr' }: BarChartProps) {
  const max = Math.max(...data.map(d => d.value), 1);
  const W = 100 / data.length;

  return (
    <div>
      {title && <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'gray', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>}
      <div style={{ position: 'relative', height: `${height}px`, display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
        {data.map((d, i) => {
          const pct = max > 0 ? (d.value / max) * 100 : 0;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '2px' }}>
              {d.value > 0 && (
                <span style={{ fontSize: '0.62rem', color, fontWeight: 700, direction: 'ltr' }}>
                  {d.value.toLocaleString()}{unit}
                </span>
              )}
              <div
                style={{
                  width: '100%', background: d.color ?? color, borderRadius: '3px 3px 0 0',
                  height: `${pct}%`, minHeight: d.value > 0 ? '4px' : '0',
                  transition: 'height 0.4s ease', opacity: 0.85,
                }}
                title={`${d.label}: ${d.value.toLocaleString()}${unit}`}
              />
              <span style={{ fontSize: '0.6rem', color: 'gray', textAlign: 'center', lineHeight: 1.2, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Horizontal Bar Chart (for rankings) ─────────────────────────────────────

interface HBarItem { label: string; value: number; sublabel?: string; }

interface HBarChartProps {
  data: HBarItem[];
  unit?: string;
  title?: string;
  color?: string;
  maxRows?: number;
}

export function HBarChart({ data, unit = '', title, color = 'var(--primary)', maxRows = 6 }: HBarChartProps) {
  const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, maxRows);
  const max = Math.max(...sorted.map(d => d.value), 1);

  return (
    <div>
      {title && <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'gray', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {sorted.map((d, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 56px', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.label}>
              {i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : `${i + 1}. `}{d.label}
            </span>
            <div style={{ background: 'var(--neutral-border)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '999px',
                background: i === 0 ? 'var(--accent)' : color,
                width: `${(d.value / max) * 100}%`,
                transition: 'width 0.5s ease',
              }} />
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'gray', direction: 'ltr', textAlign: 'right' }}>
              {d.value.toLocaleString()}{unit}
            </span>
          </div>
        ))}
        {sorted.length === 0 && <span style={{ fontSize: '0.8rem', color: 'gray' }}>— Aucune donnée —</span>}
      </div>
    </div>
  );
}

// ─── Funnel Chart (conversion) ────────────────────────────────────────────────

interface FunnelStep { label: string; value: number; color?: string; }

export function FunnelChart({ steps, title }: { steps: FunnelStep[]; title?: string }) {
  const max = steps[0]?.value ?? 1;
  const COLORS = ['var(--primary)', '#2980b9', '#27ae60', '#f39c12'];

  return (
    <div>
      {title && <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'gray', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {steps.map((s, i) => {
          const pct = max > 0 ? Math.round((s.value / max) * 100) : 0;
          const barWidth = 40 + pct * 0.6;
          const conversionFromPrev = i > 0 && steps[i - 1].value > 0
            ? Math.round((s.value / steps[i - 1].value) * 100)
            : null;

          return (
            <div key={i}>
              {conversionFromPrev !== null && (
                <div style={{ textAlign: 'center', fontSize: '0.65rem', color: 'gray', marginBottom: '2px' }}>
                  ↓ {conversionFromPrev}%
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  height: '32px', borderRadius: '4px',
                  background: s.color ?? COLORS[i % COLORS.length],
                  width: `${barWidth}%`, minWidth: '40px',
                  display: 'flex', alignItems: 'center', paddingLeft: '0.5rem',
                  transition: 'width 0.5s ease', flexShrink: 0,
                }}>
                  <span style={{ color: 'white', fontSize: '0.8rem', fontWeight: 700 }}>{s.value.toLocaleString()}</span>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{s.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sparkline (mini trend line) ─────────────────────────────────────────────

export function Sparkline({ values, color = 'var(--primary)', width = 80, height = 30 }: {
  values: number[]; color?: string; width?: number; height?: number;
}) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / Math.max(values.length - 1, 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function buildMonthlyData(
  items: { createdAt?: string; availabilityDate?: string }[],
  valueKey: 'count' | ((item: any) => number),
  nMonths = 6
): BarItem[] {
  const now = new Date();
  const months: BarItem[] = [];

  for (let m = nMonths - 1; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('fr-DZ', { month: 'short' });

    const matching = items.filter(it => {
      const date = it.createdAt ?? it.availabilityDate ?? '';
      return date.startsWith(key);
    });

    const value = valueKey === 'count'
      ? matching.length
      : matching.reduce((s, it) => s + (valueKey as (i: any) => number)(it), 0);

    months.push({ label, value });
  }
  return months;
}
