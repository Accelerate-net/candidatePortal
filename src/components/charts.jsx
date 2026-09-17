import React from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, LabelList, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { minutes } from '../lib/format';

// Answer-status colours shared with the CSS tokens (--status-*).
export const STATUS = { correct: '#146a62', skipped: '#94a3b8', wrong: '#ff3b6b' };
const BRAND = { danger: '#ff3b6b', warning: '#ffb703', midnightblue: '#005f73', info: '#2e9da1' };
const AXIS = { fill: '#94a3b8', fontSize: 12, fontFamily: 'inherit' };

const tooltipStyle = {
  contentStyle: { background: '#1e293b', border: 'none', borderRadius: 10, color: '#fff', fontSize: 12.5, fontWeight: 600, padding: '6px 10px' },
  itemStyle: { color: '#fff' },
  labelStyle: { color: '#fff' },
  cursor: { fill: 'rgba(0, 95, 115, 0.06)' },
};

// ── Test series: one bar per mock test, as a condensed bar chart ──────────
// Attempted tests show their score in green; the rest are grey placeholder
// 2px stubs on the baseline marked with a cross.
const NOT_ATTEMPTED = '#d5dde6';

export function ProgressChart({ courses }) {
  const scored = courses.map((course, index) => {
    const score = course.previousAttemptId && course.lastScore !== null && course.lastScore !== undefined
      ? parseInt((course.lastScore / 100).toFixed(0), 10)
      : null;
    return { x: index + 1, title: course.title || course.name || `Test ${index + 1}`, score: Number.isNaN(score) ? null : score };
  });
  const best = Math.max(10, ...scored.map((p) => p.score || 0));
  // Tests not attempted have no value; `minPointSize` leaves a 2px stub on the baseline.
  const points = scored.map((p) => ({ ...p, attempted: p.score !== null, bar: p.score !== null ? Math.max(p.score, 0) : 0 }));

  const renderLabel = ({ x, y, width, index }) => {
    const pt = points[index];
    if (!pt) return null;
    return (
      <text x={x + width / 2} y={y - 4} textAnchor="middle" fontSize={pt.attempted ? 9.5 : 11} fontWeight={700} fill={pt.attempted ? '#334155' : '#94a3b8'}>
        {pt.attempted ? pt.score : '×'}
      </text>
    );
  };

  return (
    <div className="cp-chart-scroll">
      {/* Fixed slot per bar keeps them slim and close together; long series scroll. */}
      <div className="cp-chart" style={{ height: 112, width: points.length * 24 + 8, margin: '0 auto' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} margin={{ top: 14, right: 4, bottom: 0, left: 4 }} barCategoryGap={5}>
            <XAxis dataKey="x" tickFormatter={(x) => `T${x}`} tick={{ ...AXIS, fontSize: 9.5 }} tickLine={false} axisLine={false} interval={0} height={16} tickMargin={2} />
            <YAxis hide domain={[0, Math.ceil(best * 1.15)]} />
            <Tooltip
              {...tooltipStyle}
              formatter={(_value, _name, item) => (item.payload.attempted ? [item.payload.score, 'Score'] : ['Not attempted', 'Status'])}
              labelFormatter={(_x, items) => items?.[0]?.payload?.title || ''}
            />
            <Bar dataKey="bar" radius={[4, 4, 0, 0]} maxBarSize={14} minPointSize={2} isAnimationActive={false}>
              {points.map((pt) => <Cell key={pt.x} fill={pt.attempted ? STATUS.correct : NOT_ATTEMPTED} />)}
              <LabelList dataKey="bar" content={renderLabel} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Report: total / attempted / correct per section ───────────────────────
export function SectionStatsChart({ sections }) {
  const data = sections.map((section) => ({
    name: section.sectionName.substring(0, 3),
    total: section.sectionSummary.total,
    attempted: section.sectionSummary.attempted,
    correct: section.sectionSummary.correct,
  }));
  const names = { total: 'Total Questions', attempted: 'Attempted', correct: 'Correct' };
  return (
    <div className="cp-chart" style={{ height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }} barGap={2}>
          <CartesianGrid vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={AXIS} tickLine={false} axisLine={false} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip {...tooltipStyle} formatter={(value, key) => [value, names[key]]} />
          <Legend iconType="square" wrapperStyle={{ fontSize: 12, fontWeight: 600, color: '#64748b' }} formatter={(key) => ({ total: 'Total Questions', attempted: 'Question Attempted', correct: 'Correct Answers' }[key])} />
          <Bar dataKey="total" fill="#e2e8f0" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Bar dataKey="attempted" fill="#94a3b8" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Bar dataKey="correct" fill={STATUS.correct} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Report: share of correct answers per subject ──────────────────────────
export function SubjectStrengthDonut({ sections }) {
  const totalCorrect = sections.reduce((sum, s) => sum + s.sectionSummary.correct, 0);
  const data = sections.map((section) => {
    let percentage = totalCorrect >= 1 ? (section.sectionSummary.correct / totalCorrect) * 100 : 0;
    percentage = Number(Math.max(0, percentage).toFixed(2));
    const name = section.sectionName;
    const color = name === 'Physics' ? BRAND.danger : name === 'Chemistry' ? BRAND.warning : name === 'Mathematics' ? BRAND.midnightblue : BRAND.info;
    return { name, value: percentage, color };
  });
  const allZero = data.every((d) => d.value < 1);
  if (totalCorrect === 0 || allZero) {
    return <p className="cp-empty" style={{ textAlign: 'center', padding: '80px 0' }}>You have not scored in any of the Subjects.</p>;
  }
  const renderLabel = ({ cx, cy, midAngle, outerRadius, name, value }) => {
    const RADIAN = Math.PI / 180;
    const r = outerRadius + 12;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fontWeight={600} fill="#64748b">
        {name} {Math.round(value)}%
      </text>
    );
  };
  return (
    <div className="cp-chart" style={{ height: 250 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="38%" outerRadius="60%" paddingAngle={1} label={renderLabel} labelLine={false} isAnimationActive={false}>
            {data.map((d) => <Cell key={d.name} fill={d.color} stroke="#fff" />)}
          </Pie>
          <Tooltip {...tooltipStyle} formatter={(value, name) => [`${Math.round(value)}%`, name]} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Report: seconds spent per question, coloured by outcome ───────────────
export function TimeDistributionChart({ sections, onOpenQuestion }) {
  const bars = [];
  let order = 1;
  let maxTime = 0;
  sections.forEach((section) => {
    [...section.questions].sort((a, b) => a.order - b.order).forEach((q) => {
      maxTime = Math.max(maxTime, q.timeSpent);
      const color = q.attempt === '' ? STATUS.skipped : q.attempt === q.answer ? STATUS.correct : STATUS.wrong;
      bars.push({ x: order, y: q.timeSpent, qi: q.qi, color });
      order += 1;
    });
  });
  const total = order - 1;

  const step = maxTime > 100 ? 20 : maxTime > 50 ? 10 : 5;
  const yTicks = [0];
  for (let i = step; i <= maxTime + step; i += step) yTicks.push(i);

  const xTicks = [1];
  for (let i = 5; i < total; i += 5) xTicks.push(i);
  if (total !== 1 && !xTicks.includes(total)) xTicks.push(total);

  return (
    <div className="cp-chart" style={{ height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={bars} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="20%">
          <CartesianGrid vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="x" ticks={xTicks} tickFormatter={(x) => `Q${x}`} tick={AXIS} tickLine={false} axisLine={false} />
          <YAxis domain={[0, maxTime + 10]} ticks={yTicks} tickFormatter={minutes} tick={AXIS} tickLine={false} axisLine={false} width={52} />
          <Tooltip {...tooltipStyle} formatter={(value, _k, item) => [`${minutes(value)} spent on Qn #${item.payload.x}`, '']} labelFormatter={() => ''} separator="" />
          <Bar dataKey="y" isAnimationActive={false} onClick={(entry) => { if (entry?.qi !== undefined) onOpenQuestion?.(entry.qi); }} style={{ cursor: 'pointer' }}>
            {bars.map((b) => <Cell key={b.x} fill={b.color} fillOpacity={0.85} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
