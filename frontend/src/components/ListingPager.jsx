export const PAGE_SIZE = 50;

export function ListingPager({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const nums = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) nums.push(i);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  const btnBase = { border:"1.5px solid #E5E7EB", borderRadius:8, padding:"0.4rem 0.75rem", cursor:"pointer", fontWeight:700, fontSize:"0.85rem", transition:"all .15s" };
  return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:"0.4rem", marginTop:"2.5rem", flexWrap:"wrap" }}>
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        style={{ ...btnBase, background: page === 1 ? "#F9FAFB" : "#fff", color: page === 1 ? "#CBD5E1" : "var(--ocean)", cursor: page === 1 ? "default" : "pointer" }}>
        ← Prev
      </button>
      {nums.map((n, i) => n === "…"
        ? <span key={`d${i}`} style={{ color:"#94A3B8", padding:"0 0.2rem" }}>…</span>
        : <button key={n} onClick={() => onChange(n)}
            style={{ ...btnBase, background: n === page ? "var(--ocean)" : "#fff", color: n === page ? "#fff" : "var(--ink)", borderColor: n === page ? "var(--ocean)" : "#E5E7EB" }}>
            {n}
          </button>
      )}
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
        style={{ ...btnBase, background: page === totalPages ? "#F9FAFB" : "#fff", color: page === totalPages ? "#CBD5E1" : "var(--ocean)", cursor: page === totalPages ? "default" : "pointer" }}>
        Next →
      </button>
    </div>
  );
}
