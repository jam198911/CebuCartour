export function BarChart({ data, color = "#2563EB", valuePrefix = "" }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display:"flex", gap:"4px" }}>
      {data.map((d, i) => {
        const barH = Math.max((d.value / max) * 62, d.value > 0 ? 3 : 1);
        return (
          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center" }}>
            <div style={{ flex:1 }} />
            {d.value > 0 && (
              <div style={{ fontSize:"0.55rem", fontWeight:700, color, lineHeight:1, textAlign:"center", marginBottom:2, whiteSpace:"nowrap" }}>
                {valuePrefix}{d.value >= 1000 ? (d.value / 1000).toFixed(d.value < 10000 ? 1 : 0) + "k" : d.value}
              </div>
            )}
            <div style={{ width:"100%", height:`${barH}px`, background: d.value > 0 ? color : "#E9ECF0", borderRadius:"3px 3px 0 0", flexShrink:0 }} />
            <div style={{ fontSize:"0.57rem", color:"#9CA3AF", paddingTop:3, textAlign:"center", width:"100%", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {d.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DonutChart({ segments, size = 160 }) {
  const total = segments.reduce((s, g) => s + g.value, 0);
  const cx = size / 2, cy = size / 2, outerR = size * 0.4, innerR = size * 0.26;
  if (!total) return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <circle cx={cx} cy={cy} r={(outerR + innerR) / 2} fill="none" stroke="#E5E7EB" strokeWidth={outerR - innerR} />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={60} fontWeight="800" fill="#9CA3AF">0</text>
    </svg>
  );
  let angle = -Math.PI / 2;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {segments.map((seg, i) => {
        if (!seg.value) return null;
        const sweep = (seg.value / total) * 2 * Math.PI;
        const a1 = angle, a2 = angle + sweep;
        angle = a2;
        const large = sweep > Math.PI ? 1 : 0;
        const d = [
          `M${(cx + innerR * Math.cos(a1)).toFixed(2)},${(cy + innerR * Math.sin(a1)).toFixed(2)}`,
          `L${(cx + outerR * Math.cos(a1)).toFixed(2)},${(cy + outerR * Math.sin(a1)).toFixed(2)}`,
          `A${outerR},${outerR} 0 ${large} 1 ${(cx + outerR * Math.cos(a2)).toFixed(2)},${(cy + outerR * Math.sin(a2)).toFixed(2)}`,
          `L${(cx + innerR * Math.cos(a2)).toFixed(2)},${(cy + innerR * Math.sin(a2)).toFixed(2)}`,
          `A${innerR},${innerR} 0 ${large} 0 ${(cx + innerR * Math.cos(a1)).toFixed(2)},${(cy + innerR * Math.sin(a1)).toFixed(2)} Z`,
        ].join(" ");
        return <path key={i} d={d} fill={seg.color} />;
      })}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={60} fontWeight="800" fill="#111827">{total}</text>
    </svg>
  );
}

export function AreaSparkline({ data, color = "#2563EB" }) {
  const values = data.map(d => (typeof d === "number" ? d : d.value));
  const labels = data.map(d => (typeof d === "object" ? d.label : null));
  const max = Math.max(...values, 1);
  const W = 300, H = 54, padT = 4, padB = 4;
  const chartH = H - padT - padB;
  const n = values.length;
  const pts = values.map((v, i) => ({
    x: n > 1 ? (i / (n - 1)) * W : W / 2,
    y: padT + chartH - (v / max) * chartH,
  }));
  const lineD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaD = `${lineD} L${W},${H - padB} L0,${H - padB} Z`;
  const gradId = `asg${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#${gradId})`} />
        <path d={lineD} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => values[i] > 0 && (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} stroke="#fff" strokeWidth="1.5" />
        ))}
      </svg>
      {labels.some(Boolean) && (
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:2 }}>
          {labels.map((l, i) => <span key={i} style={{ fontSize:"0.6rem", color:"#9CA3AF" }}>{l}</span>)}
        </div>
      )}
    </div>
  );
}
