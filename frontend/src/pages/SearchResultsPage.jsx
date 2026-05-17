import { useState } from "react";
import CarCard from "../components/CarCard.jsx";
import TourCard from "../components/TourCard.jsx";

export default function SearchResultsPage({ cars, tours, setModal, openBooking, users = [], searchFilters = {}, clearSearch, goTo }) {
  const [activeTab,    setActiveTab]    = useState("all");
  const [sortBy,       setSortBy]       = useState("rating");
  const [priceFilter,  setPriceFilter]  = useState("any");
  const [ratingFilter, setRatingFilter] = useState("any");

  const activeVendorIds = new Set(
    users.filter(u => u.role === "vendor" && u.status === "active" && u.approvalStatus === "approved").map(u => u.id)
  );
  const loc  = searchFilters.location;
  const date = searchFilters.date;

  const priceMatch = (price) => {
    if (priceFilter === "low")  return price < 1000;
    if (priceFilter === "mid")  return price >= 1000 && price < 3000;
    if (priceFilter === "high") return price >= 3000;
    return true;
  };

  const ratingMatch = (rating) =>
    ratingFilter === "4+" ? +rating >= 4 :
    ratingFilter === "3+" ? +rating >= 3 : true;

  const sorter = (a, b) =>
    sortBy === "price_asc"  ? a.price - b.price :
    sortBy === "price_desc" ? b.price - a.price :
    b.rating - a.rating;

  const baseFilter = (item) =>
    activeVendorIds.has(item.vendorId) &&
    (!loc || item.location.toLowerCase().includes(loc.toLowerCase())) &&
    priceMatch(item.price) && ratingMatch(item.rating);

  const filteredCars  = cars.filter(baseFilter).sort(sorter);
  const filteredTours = tours.filter(baseFilter).sort(sorter);
  const showCars  = activeTab === "all" || activeTab === "cars";
  const showTours = activeTab === "all" || activeTab === "tours";
  const visibleCount = (showCars ? filteredCars.length : 0) + (showTours ? filteredTours.length : 0);
  const totalResults  = filteredCars.length + filteredTours.length;
  const hasFilters    = priceFilter !== "any" || ratingFilter !== "any";

  const fmtDate = d => d
    ? new Date(d + "T00:00:00").toLocaleDateString("en-PH", { weekday:"short", month:"short", day:"numeric" })
    : null;

  const FilterGroup = ({ label, options, value, onChange }) => (
    <div style={{ marginBottom:"1.4rem" }}>
      <div style={{ fontSize:"0.68rem", fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:"#94A3B8", marginBottom:"0.55rem" }}>{label}</div>
      <div style={{ display:"flex", flexDirection:"column", gap:"0.22rem" }}>
        {options.map(([val, lbl]) => (
          <button key={val} onClick={() => onChange(val)}
            style={{ display:"flex", alignItems:"center", gap:"0.5rem", background: value === val ? "#EFF6FF" : "none",
              border:"none", cursor:"pointer", padding:"0.38rem 0.55rem", borderRadius:8, textAlign:"left", width:"100%",
              color: value === val ? "#2563EB" : "#374151", transition:"all .12s" }}>
            <div style={{ width:15, height:15, borderRadius:"50%", flexShrink:0, transition:"all .15s",
              border: value === val ? "4.5px solid #2563EB" : "2px solid #CBD5E1" }} />
            <span style={{ fontSize:"0.83rem", fontWeight: value === val ? 700 : 500 }}>{lbl}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const SectionHead = ({ icon, label, count, accentColor, accentBg, onViewAll }) => (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"0.6rem" }}>
        <div style={{ width:36, height:36, borderRadius:10, background:accentBg,
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.95rem" }}>
          <i className={icon} style={{ color:accentColor }}/>
        </div>
        <div>
          <div style={{ fontSize:"0.98rem", fontWeight:800, color:"#111827" }}>{label}</div>
          <div style={{ fontSize:"0.7rem", color:"#9CA3AF" }}>{count} listing{count !== 1 ? "s" : ""}</div>
        </div>
      </div>
      <button onClick={onViewAll}
        style={{ background:accentBg, border:"none", borderRadius:8, padding:"0.32rem 0.85rem",
          fontSize:"0.75rem", fontWeight:700, cursor:"pointer", color:accentColor }}>
        View all <i className="fa-solid fa-arrow-right"/>
      </button>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#F1F5F9" }}>

      {/* ── Compact dark header ── */}
      <div style={{ background:"linear-gradient(135deg,#051E34 0%,#0A4D68 60%,#0891B2 100%)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"1.6rem 2rem" }}>
          <button onClick={clearSearch}
            style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.22)",
              color:"rgba(255,255,255,0.8)", borderRadius:8, padding:"0.28rem 0.75rem",
              fontSize:"0.74rem", fontWeight:600, cursor:"pointer", marginBottom:"0.9rem",
              display:"inline-flex", alignItems:"center", gap:"0.4rem" }}>
            <i className="fa-solid fa-arrow-left"/> Back to Search
          </button>

          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem" }}>
            <div>
              <div style={{ color:"rgba(255,255,255,0.5)", fontSize:"0.76rem", fontWeight:600, marginBottom:"0.25rem" }}>
                {totalResults} result{totalResults !== 1 ? "s" : ""} found
              </div>
              <h1 style={{ margin:0, color:"#fff", fontFamily:"'Playfair Display',serif",
                fontSize:"clamp(1.35rem,3vw,1.9rem)", fontWeight:700, lineHeight:1.2 }}>
                {loc ? `Listings in ${loc}` : "All Available Listings"}
              </h1>
              {date && (
                <div style={{ color:"rgba(255,255,255,0.62)", fontSize:"0.78rem", marginTop:"0.3rem",
                  display:"flex", alignItems:"center", gap:"0.35rem" }}>
                  <i className="fa-solid fa-calendar-days"/> {fmtDate(date)}
                </div>
              )}
            </div>

            {/* Stat pills */}
            <div style={{ display:"flex", gap:"0.7rem" }}>
              {[
                ["fa-solid fa-car",  filteredCars.length,  "Cars"],
                ["fa-solid fa-map",  filteredTours.length, "Tours"],
              ].map(([icon, count, label]) => (
                <div key={label} style={{ background:"rgba(255,255,255,0.11)", borderRadius:12,
                  padding:"0.6rem 1rem", textAlign:"center", minWidth:64, border:"1px solid rgba(255,255,255,0.14)" }}>
                  <div style={{ color:"#fff", fontSize:"1.25rem", fontWeight:800, lineHeight:1 }}>{count}</div>
                  <div style={{ color:"rgba(255,255,255,0.55)", fontSize:"0.66rem", marginTop:"0.18rem" }}>
                    <i className={icon}/> {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body: sidebar + results ── */}
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"1.8rem 2rem", display:"flex", gap:"1.6rem", alignItems:"flex-start" }}>

        {/* Left sidebar */}
        <div style={{ width:210, flexShrink:0, background:"#fff", borderRadius:16, padding:"1.3rem",
          boxShadow:"0 2px 10px rgba(0,0,0,0.06)", border:"1px solid #E2E8F0", position:"sticky", top:80 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.2rem" }}>
            <div style={{ fontWeight:800, fontSize:"0.9rem", color:"#111827",
              display:"flex", alignItems:"center", gap:"0.4rem" }}>
              <i className="fa-solid fa-sliders" style={{ color:"var(--ocean)" }}/> Filters
            </div>
            {hasFilters && (
              <button onClick={() => { setPriceFilter("any"); setRatingFilter("any"); }}
                style={{ background:"none", border:"none", color:"#EF4444",
                  fontSize:"0.7rem", fontWeight:700, cursor:"pointer", padding:0 }}>
                Clear all
              </button>
            )}
          </div>

          <FilterGroup label="Category"
            options={[["all","All Listings"],["cars","Car Rentals"],["tours","Tour Packages"]]}
            value={activeTab} onChange={setActiveTab} />

          <div style={{ borderTop:"1px solid #F1F5F9", margin:"0 0 1.4rem" }} />

          <FilterGroup label="Price Range"
            options={[["any","Any price"],["low","Under ₱1,000"],["mid","₱1,000 – ₱3,000"],["high","Over ₱3,000"]]}
            value={priceFilter} onChange={setPriceFilter} />

          <div style={{ borderTop:"1px solid #F1F5F9", margin:"0 0 1.4rem" }} />

          <FilterGroup label="Rating"
            options={[["any","Any rating"],["4+","4+ stars ★"],["3+","3+ stars ★"]]}
            value={ratingFilter} onChange={setRatingFilter} />
        </div>

        {/* Main results area */}
        <div style={{ flex:1, minWidth:0 }}>

          {/* Toolbar */}
          <div style={{ background:"#fff", borderRadius:12, padding:"0.65rem 1rem",
            marginBottom:"1.3rem", display:"flex", alignItems:"center", justifyContent:"space-between",
            gap:"1rem", flexWrap:"wrap", boxShadow:"0 1px 4px rgba(0,0,0,0.05)", border:"1px solid #E2E8F0" }}>
            <div style={{ fontSize:"0.83rem", color:"#6B7280" }}>
              Showing <strong style={{ color:"#111827" }}>{visibleCount}</strong> listing{visibleCount !== 1 ? "s" : ""}
              {loc && <span style={{ color:"#9CA3AF" }}> in <strong style={{ color:"#374151" }}>{loc}</strong></span>}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
              <span style={{ fontSize:"0.74rem", color:"#9CA3AF", fontWeight:600 }}>Sort by</span>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{ border:"1.5px solid #E5E7EB", borderRadius:8, padding:"0.28rem 0.6rem",
                  fontSize:"0.78rem", fontWeight:600, color:"#374151", background:"#fff",
                  cursor:"pointer", outline:"none" }}>
                <option value="rating">Top Rated</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
              </select>
            </div>
          </div>

          {/* Empty state */}
          {visibleCount === 0 && (
            <div style={{ textAlign:"center", padding:"4rem 2rem", background:"#fff",
              borderRadius:18, border:"1px solid #E9ECF0" }}>
              <div style={{ fontSize:"3rem", marginBottom:"0.9rem", color:"#CBD5E1" }}>
                <i className="fa-solid fa-magnifying-glass"/>
              </div>
              <h2 style={{ marginBottom:"0.4rem", color:"#111827", fontSize:"1.2rem" }}>
                No listings found{loc ? ` in "${loc}"` : ""}
              </h2>
              <p style={{ color:"#6B7280", maxWidth:320, margin:"0 auto 1.6rem", fontSize:"0.9rem" }}>
                {hasFilters ? "Try adjusting your filters." : "Try a different location."}
              </p>
              <div style={{ display:"flex", gap:"0.65rem", justifyContent:"center", flexWrap:"wrap" }}>
                {hasFilters && (
                  <button onClick={() => { setPriceFilter("any"); setRatingFilter("any"); }} className="btn-primary">
                    <i className="fa-solid fa-sliders"/> Clear Filters
                  </button>
                )}
                <button className="btn-primary" onClick={() => goTo("cars")}>
                  <i className="fa-solid fa-car"/> Browse All Cars
                </button>
                <button onClick={() => goTo("tours")}
                  style={{ background:"#fff", color:"var(--ocean)", border:"2px solid var(--ocean)",
                    borderRadius:50, padding:"0.65rem 1.4rem", cursor:"pointer", fontWeight:700,
                    fontSize:"0.88rem", display:"inline-flex", alignItems:"center", gap:"0.45rem" }}>
                  <i className="fa-solid fa-map"/> Browse Tours
                </button>
              </div>
            </div>
          )}

          {/* Car results */}
          {showCars && filteredCars.length > 0 && (
            <div style={{ marginBottom:"2.2rem" }}>
              <SectionHead icon="fa-solid fa-car" label="Car Rentals" count={filteredCars.length}
                accentColor="#2563EB" accentBg="#DBEAFE" onViewAll={() => goTo("cars")} />
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:"1.2rem" }}>
                {filteredCars.map(car => (
                  <CarCard key={car.id} car={car}
                    vendor={users.find(u => u.id === car.vendorId)}
                    onClick={() => setModal({ ...car, itemType:"car" })}
                    onBook={() => openBooking(car, "car")} />
                ))}
              </div>
            </div>
          )}

          {showCars && showTours && filteredCars.length > 0 && filteredTours.length > 0 && (
            <div style={{ borderTop:"2px dashed #E2E8F0", marginBottom:"2.2rem" }} />
          )}

          {/* Tour results */}
          {showTours && filteredTours.length > 0 && (
            <div>
              <SectionHead icon="fa-solid fa-map" label="Tour Packages" count={filteredTours.length}
                accentColor="#7C3AED" accentBg="#EDE9FE" onViewAll={() => goTo("tours")} />
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:"1.2rem" }}>
                {filteredTours.map(tour => (
                  <TourCard key={tour.id} tour={tour}
                    vendor={users.find(u => u.id === tour.vendorId)}
                    onClick={() => setModal({ ...tour, itemType:"tour" })}
                    onBook={() => openBooking(tour, "tour")} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
