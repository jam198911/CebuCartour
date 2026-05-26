import { useState } from "react";
import { fmtPeso } from "../utils/helpers.js";
import { Stars, ShareButton } from "./SharedUI.jsx";

export default function TourCard({ tour, onClick, onBook, vendor }) {
  const [imgErr, setImgErr] = useState(false);
  const rawSrc = (tour.images && tour.images.length > 0) ? tour.images[0] : (tour.image || null);
  const imgSrc = imgErr ? null : rawSrc;

  return (
    <div className="card fade-in" style={{ cursor: "pointer" }} onClick={onClick}>

      {/* ── Image ── */}
      <div className="card-img-wrap" style={{ position: "relative" }}>
        {imgSrc
          ? <img src={imgSrc} alt={tour.name} onError={() => setImgErr(true)}
              style={{ width: "100%", height: 170, objectFit: "cover", display: "block" }} />
          : <div style={{ width: "100%", height: 170, background: "#F1F5F9",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "2.5rem", color: "#D1D5DB" }}>
              <i className="fa-solid fa-umbrella-beach"/>
            </div>
        }
        {!tour.available && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.42)",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ background: "#6B7280", color: "#fff", borderRadius: 8,
              padding: "0.3rem 0.75rem", fontSize: "0.75rem", fontWeight: 700 }}>
              Unavailable
            </span>
          </div>
        )}
        {tour.images && tour.images.length > 1 && (
          <div style={{ position: "absolute", bottom: 8, right: 8,
            background: "rgba(0,0,0,0.55)", color: "#fff",
            fontSize: "0.65rem", fontWeight: 700, padding: "0.12rem 0.45rem", borderRadius: 50 }}>
            1/{tour.images.length} <i className="fa-solid fa-camera"/>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "0.9rem 1rem 1rem", textAlign: "left" }}>

        {/* Row 1: Name + Price */}
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.3rem" }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem",
            fontWeight: 700, color: "var(--ink)", lineHeight: 1.2,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
            {tour.name}
          </div>
          <div style={{ textAlign: "right", flexShrink: 0, whiteSpace: "nowrap" }}>
            <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--ocean)" }}>{fmtPeso(tour.price)}</span>
            <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--muted)" }}>/person</span>
          </div>
        </div>

        {/* Row 2: Category badge + Rating */}
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "0.55rem" }}>
          <span style={{ background: "#7C3AED", color: "#fff",
            fontSize: "0.65rem", fontWeight: 700, padding: "0.18rem 0.6rem",
            borderRadius: 50, letterSpacing: ".04em" }}>
            {tour.category}
          </span>
          <Stars rating={tour.rating} />
        </div>

        {/* Row 3: Vendor */}
        {vendor && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem",
            marginBottom: "0.3rem" }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", overflow: "hidden",
              flexShrink: 0, border: "1px solid var(--border)" }}>
              {vendor.profilePhoto
                ? <img src={vendor.profilePhoto} alt={vendor.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%",
                    background: "linear-gradient(135deg,var(--ocean),var(--teal))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.6rem", color: "#fff" }}>
                    <i className="fa-solid fa-building"/>
                  </div>
              }
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 500,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {vendor.company || vendor.name}
            </span>
          </div>
        )}

        {/* Row 4: Location */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem",
          fontSize: "0.78rem", color: "var(--muted)", marginBottom: "0.55rem" }}>
          <i className="fa-solid fa-location-dot" style={{ color: "#7C3AED", fontSize: "0.72rem" }}/>
          {tour.location}
        </div>

        {/* Row 5: Spec tags */}
        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          <span className="tag"><i className="fa-solid fa-calendar-days"/> {tour.duration}</span>
          <span className="tag"><i className="fa-solid fa-users"/> Max {tour.groupSize}</span>
        </div>

        {/* Row 6: Book + Share */}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {tour.available ? (
            <button className="book-now-btn" style={{ margin: 0, padding: "0.7rem",
              background: "#7C3AED", flex: 1 }}
              onClick={e => { e.stopPropagation(); onBook(); }}>
              <i className="fa-solid fa-calendar-check"/> Book This Tour
            </button>
          ) : (
            <button style={{ flex: 1, background: "#F3F4F6", color: "#9CA3AF",
              border: "none", borderRadius: 10, padding: "0.7rem",
              cursor: "default", fontWeight: 700, fontSize: "0.88rem" }}>
              Unavailable
            </button>
          )}
          <ShareButton
            url={`${window.location.origin}/tours`}
            title={tour.name}
            text={`Check out ${tour.name} — ${fmtPeso(tour.price)}/person in ${tour.location}! Book on Cebu Car Tour.`}
          />
        </div>
      </div>
    </div>
  );
}
