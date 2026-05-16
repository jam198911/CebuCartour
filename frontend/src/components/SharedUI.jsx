import { useEffect } from "react";

export function Stars({ rating, size = "0.9rem" }) {
  const filled = Math.round(+rating || 0);
  return (
    <div className="card-rating" style={{ gap:"0.15rem" }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= filled ? "#F59E0B" : "#D1D5DB", fontSize: size, lineHeight:1 }}>★</span>
      ))}
      {rating > 0 && <span style={{ marginLeft:"0.25rem", fontSize:"0.8rem", color:"var(--muted)", fontWeight:600 }}>{(+rating).toFixed(1)}</span>}
    </div>
  );
}

export function StatusBadge({ status }) {
  return <span className={`status ${status}`}>{status}</span>;
}

export function Toast({ msg, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return <div className="toast"><i className="fa-solid fa-check"/> {msg}</div>;
}
