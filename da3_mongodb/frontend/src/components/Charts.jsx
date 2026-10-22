import React, { useState } from 'react';

export function BarChart({ data = [], xKey = 'name', yKey = 'value', height = 220, color = 'bg-[#0F766E]', formatValue = (v) => v }) {
  const [tooltip, setTooltip] = useState(null);

  if (!data || data.length === 0) {
    return <div className="h-44 flex items-center justify-center text-[#52616B] text-xs">No data available</div>;
  }

  const maxValue = Math.max(...data.map((d) => Number(d[yKey]) || 0), 1);

  return (
    <div className="w-full relative" style={{ height: `${height}px` }}>
      {tooltip && (
        <div
          className="absolute z-20 pointer-events-none bg-[#17212B] text-white text-xs px-2.5 py-1.5 rounded-md border border-[#243342] shadow-md -translate-x-1/2 -translate-y-full mb-2 whitespace-nowrap"
          style={{ left: `${Math.min(Math.max(tooltip.x, 10), 90)}%`, top: `${tooltip.y}%` }}
        >
          <div className="font-semibold text-slate-100">{tooltip.label}</div>
          <div className="text-teal-300 font-medium">{formatValue(tooltip.value)}</div>
        </div>
      )}
      <div className="h-full flex items-end gap-2 pt-6 pb-6 px-2 border-b border-[#DCE4E1]">
        {data.map((item, idx) => {
          const val = Number(item[yKey]) || 0;
          const pct = Math.max(Math.round((val / maxValue) * 100), 2);
          const xPercent = ((idx + 0.5) / data.length) * 100;

          return (
            <div
              key={idx}
              className="flex-1 min-w-0 flex flex-col items-center h-full justify-end group cursor-pointer relative"
              onMouseEnter={() => setTooltip({ x: xPercent, y: 100 - pct - 5, label: item[xKey], value: val })}
              onMouseLeave={() => setTooltip(null)}
            >
              <div
                className={`w-full max-w-[44px] rounded-t transition-all duration-200 ${color} group-hover:brightness-110 origin-bottom`}
                style={{ height: `${pct}%` }}
              />
              <span className="text-[11px] text-[#52616B] font-medium mt-2 truncate w-full text-center block" title={item[xKey]}>
                {item[xKey]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LineChart({ data = [], xKey = 'date', yKey = 'revenue', height = 220, formatValue = (v) => `₹${v.toLocaleString()}` }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return <div className="h-44 flex items-center justify-center text-[#52616B] text-xs">No sales data recorded yet</div>;
  }

  const values = data.map((d) => Number(d[yKey]) || 0);
  const maxVal = Math.max(...values, 100);
  const paddingX = 52;
  const paddingY = 28;
  const chartWidth = 560;
  const chartHeight = height;

  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(data.length - 1, 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - ((Number(d[yKey]) || 0) / maxVal) * (chartHeight - paddingY * 2);
    return { x, y, data: d };
  });

  const pathD = points.length === 1
    ? `M ${points[0].x - 20} ${points[0].y} L ${points[0].x + 20} ${points[0].y}`
    : points.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;

  return (
    <div className="w-full relative">
      {hoveredIdx !== null && (
        <div className="absolute top-2 right-4 bg-[#17212B] text-white text-xs px-3 py-1.5 rounded-md border border-[#243342] shadow pointer-events-none whitespace-nowrap z-10">
          <span className="text-[#8A9BA8] font-medium">{data[hoveredIdx][xKey]}: </span>
          <span className="font-semibold text-teal-300">{formatValue(data[hoveredIdx][yKey])}</span>
          {data[hoveredIdx].count !== undefined && (
            <span className="text-slate-300 ml-2">({data[hoveredIdx].count} sales)</span>
          )}
        </div>
      )}
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="areaGradientTeal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0F766E" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0F766E" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* Horizontal gridlines */}
        {[0, 0.5, 1].map((pct, i) => {
          const y = chartHeight - paddingY - pct * (chartHeight - paddingY * 2);
          return (
            <g key={i}>
              <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="#DCE4E1" strokeDasharray="3 3" />
              <text x={paddingX - 8} y={y + 4} textAnchor="end" className="text-[10px] fill-[#52616B] font-medium">
                ₹{Math.round(pct * maxVal).toLocaleString()}
              </text>
            </g>
          );
        })}
        {/* Fill Area */}
        <path d={areaD} fill="url(#areaGradientTeal)" />
        {/* Line */}
        <path d={pathD} fill="none" stroke="#0F766E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Interactive Dots */}
        {points.map((pt, i) => (
          <g key={i}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r={hoveredIdx === i ? 5.5 : 3.5}
              fill="#ffffff"
              stroke="#0F766E"
              strokeWidth={hoveredIdx === i ? 2.5 : 2}
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
            <text
              x={pt.x}
              y={chartHeight - 8}
              textAnchor="middle"
              className="text-[10px] fill-[#52616B] font-medium select-none"
            >
              {pt.data[xKey].slice(5)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function StatCard({ title, value, subtitle, icon: Icon, color = 'blue' }) {
  const colorMap = {
    blue: 'bg-teal-50 text-[#0F766E] border-teal-200',
    purple: 'bg-[#E4EBE7] text-[#40574D] border-[#C8D6CF]',
    teal: 'bg-teal-50 text-[#0F766E] border-teal-200',
    sage: 'bg-[#E4EBE7] text-[#40574D] border-[#C8D6CF]',
    emerald: 'bg-emerald-50 text-[#15803D] border-emerald-200',
    amber: 'bg-amber-50 text-[#B45309] border-amber-200',
    rose: 'bg-rose-50 text-[#B91C1C] border-rose-200',
  }[color] || 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <div className="bg-white rounded-xl p-5 border border-[#DCE4E1] transition-all hover:border-[#0F766E] flex flex-col justify-between min-h-[128px] min-w-0">
      <div className="flex items-start justify-between gap-2.5">
        <span
          className="text-[11px] font-bold uppercase tracking-wider text-[#52616B] leading-snug break-words min-w-0 flex-1"
          title={title}
        >
          {title}
        </span>
        <div className={`p-2 rounded-lg border shrink-0 ${colorMap}`}>
          {Icon && <Icon className="w-4 h-4" />}
        </div>
      </div>
      <div className="mt-3 min-w-0">
        <div
          className="text-2xl font-bold text-[#17212B] tracking-tight truncate"
          title={typeof value === 'string' || typeof value === 'number' ? String(value) : undefined}
        >
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-[#52616B] font-medium mt-1 truncate" title={subtitle}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
