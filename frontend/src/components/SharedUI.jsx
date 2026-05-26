import { useEffect, useState, useRef } from "react";

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

export function ShareButton({ url, title, text }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const handleClick = (e) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({ title, text, url }).catch(() => {});
    } else {
      setOpen(o => !o);
    }
  };

  const fbUrl  = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const waUrl  = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + '\n' + url)}`;

  const copyLink = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => { setCopied(false); setOpen(false); }, 1800);
    });
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={handleClick} title="Share this"
        style={{ width: 40, height: 40, borderRadius: 10, border: "1.5px solid var(--border)",
          background: "#fff", cursor: "pointer", color: "var(--ocean)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className="fa-solid fa-share-nodes"/>
      </button>
      {open && (
        <div style={{ position: "absolute", bottom: "calc(100% + 6px)", right: 0,
          background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          border: "1px solid var(--border)", padding: "0.5rem", zIndex: 50,
          display: "flex", gap: "0.4rem" }}>
          <a href={fbUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
            title="Share on Facebook"
            style={{ width: 38, height: 38, borderRadius: 8, background: "#1877F2",
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1rem", textDecoration: "none" }}>
            <i className="fa-brands fa-facebook-f"/>
          </a>
          <a href={waUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
            title="Share on WhatsApp"
            style={{ width: 38, height: 38, borderRadius: 8, background: "#25D366",
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1rem", textDecoration: "none" }}>
            <i className="fa-brands fa-whatsapp"/>
          </a>
          <button onClick={copyLink} title={copied ? "Copied!" : "Copy link"}
            style={{ width: 38, height: 38, borderRadius: 8,
              background: copied ? "#10B981" : "#F1F5F9", color: copied ? "#fff" : "var(--ink)",
              border: "none", cursor: "pointer", fontSize: "0.9rem",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className={copied ? "fa-solid fa-check" : "fa-solid fa-link"}/>
          </button>
        </div>
      )}
    </div>
  );
}
