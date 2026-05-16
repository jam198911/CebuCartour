import { useState } from "react";

export default function SearchResultsPage({ cars, tours, setModal, openBooking, users = [], searchFilters = {}, clearSearch, goTo }) {
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy]       = useState("rating");

  const activeVendorIds = new Set(
    users.filter(u => u.role === "vendor" && u.status === "active" && u.approvalStatus === "approved").map(u => u.id)
  );
  const loc  = searchFilters.location;
  const date = searchFilters.date;

  const sorter = (a, b) =>
    sortBy === "price_asc"  ? a.price - b.price :
    sortBy === "price_desc" ? b.price - a.price :
    b.rating - a.rating;

  const filteredCars  = cars.filter(c => activeVendorIds.has(c.vendorId) && (!loc || c.location.toLowerCase().includes(loc.toLowerCase()))).sort(sorter);
  const filteredTours = tours.filter(t => activeVendorIds.has(t.vendorId) && (!loc || t.location.toLowerCase().includes(loc.toLowerCase()))).sort(sorter);
  const totalResults  = filteredCars.length + filteredTours.length;
  const showCars  = activeTab === "all" || activeTab === "cars";
  const showTours = activeTab === "all" || activeTab === "tours";

  const fmtDate = d => { if (!d) return null; return new Date(d + "T00:00:00").toLocaleDateString("en-PH", { weekday:"short", month:"short", day:"numeric", year:"numeric" }); };

  const chip = (label) => (
    <span style={{ background:"rgba(255,255,255,0.15)", borderRadius:50, padding:"0.28rem 0.85rem", fontSize:"0.78rem", fontWeight:600, backdropFilter:"blur(4px)", border:"1px solid rgba(255,255,255,0.2)" }}>
      {label}
    </span>
  );

  const specTag = (icon, val) => (
    <span key={val} style={{ background:"#F3F4F6", borderRadius:6, padding:"0.2rem 0.55rem", fontSize:"0.74rem", color:"#374151", fontWeight:500, display:"inline-flex", alignItems:"center", gap:"0.25rem" }}>
      {icon} {val}
    </span>
  );

  const ResultCard = ({ item, type }) => {
    const isCar = type === "car";
    const accentColor = isCar ? "#2563EB" : "#7C3AED";
    const accentBg    = isCar ? "#DBEAFE"  : "#EDE9FE";
    const specs = isCar
      ? [[<i className="fa-solid fa-chair"/>, `${item.seats} seats`], [<i className="fa-solid fa-gas-pump"/>, item.fuel], [<i className="fa-solid fa-gear"/>, item.transmission]]
      : [[<i className="fa-solid fa-clock"/>, item.duration], [<i className="fa-solid fa-users"/>, `Up to ${item.groupSize} pax`]];
    return (
      <div
        onClick={() => setModal({ ...item, itemType: type })}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.13)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.07)"; e.currentTarget.style.transform = "translateY(0)"; }}
        style={{ background:"#fff", borderRadius:16, border:"1px solid #E9ECF0", boxShadow:"0 2px 8px rgba(0,0,0,0.07)", overflow:"hidden", display:"flex", cursor:"pointer", transition:"all .2s" }}>
        {/* Image */}
        <div style={{ width:190, flexShrink:0, position:"relative", overflow:"hidden" }}>
          <img src={item.image} alt={item.name}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
            onError={e => { e.target.src = `https://placehold.co/190x140?text=${isCar?"Car":"Tour"}`; }} />
          <div style={{ position:"absolute", top:10, left:10, background:accentColor, color:"#fff", borderRadius:6, padding:"0.18rem 0.55rem", fontSize:"0.68rem", fontWeight:700, letterSpacing:".04em" }}>
            {isCar ? item.type : item.category}
          </div>
          {item.available === false && (
            <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ background:"#DC2626", color:"#fff", borderRadius:8, padding:"0.3rem 0.7rem", fontSize:"0.75rem", fontWeight:700 }}>Unavailable</span>
            </div>
          )}
        </div>
        {/* Body */}
        <div style={{ flex:1, padding:"1rem 1.25rem", display:"flex", flexDirection:"column", justifyContent:"space-between", minWidth:0 }}>
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"0.5rem", marginBottom:"0.3rem" }}>
              <h3 style={{ margin:0, fontSize:"1rem", fontWeight:700, color:"#111827", lineHeight:1.3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.name}</h3>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontSize:"1.1rem", fontWeight:800, color:"#059669" }}>₱{Number(item.price).toLocaleString()}</div>
                <div style={{ fontSize:"0.68rem", color:"#9CA3AF", marginTop:1 }}>/{isCar ? "day" : "person"}</div>
              </div>
            </div>
            <div style={{ fontSize:"0.78rem", color:"#6B7280", marginBottom:"0.6rem", display:"flex", alignItems:"center", gap:"0.3rem" }}>
              <span style={{ color:accentColor }}><i className="fa-solid fa-location-dot"/></span> {item.location}
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"0.35rem" }}>
              {specs.map(([icon, val]) => specTag(icon, val))}
            </div>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"0.8rem", paddingTop:"0.75rem", borderTop:"1px solid #F3F4F6" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.35rem" }}>
              <span style={{ background:accentBg, borderRadius:6, padding:"0.2rem 0.5rem", display:"inline-flex", alignItems:"center", gap:"0.25rem", fontSize:"0.78rem", fontWeight:700, color:accentColor }}>
                <i className="fa-solid fa-star"/> {item.rating}
              </span>
              <span style={{ fontSize:"0.75rem", color:"#9CA3AF" }}>{item.reviews} reviews</span>
            </div>
            <button className="btn-primary"
              style={{ padding:"0.38rem 1rem", fontSize:"0.8rem", borderRadius:9 }}
              onClick={e => { e.stopPropagation(); openBooking({ ...item, itemType: type }); }}>
              Book Now
            </button>
          </div>
        </div>
      </div>
    );
  };

  const SectionHeader = ({ icon, label, count, color, bg, onViewAll }) => (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"0.65rem" }}>
        <div style={{ width:38, height:38, borderRadius:11, background:bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem" }}>{icon}</div>
        <div>
          <div style={{ fontSize:"1.05rem", fontWeight:800, color:"#111827" }}>{label}</div>
          <div style={{ fontSize:"0.72rem", color:"#9CA3AF" }}>{count} listing{count !== 1 ? "s" : ""}{loc ? ` in ${loc}` : ""}</div>
        </div>
      </div>
      <button onClick={onViewAll} style={{ background:bg, border:"none", borderRadius:9, padding:"0.38rem 1rem", fontSize:"0.8rem", fontWeight:700, cursor:"pointer", color }}>
        View all <i className="fa-solid fa-arrow-right"/>
      </button>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#F8FAFC" }}>

      {/* â”€â”€ Hero header â”€â”€ */}
      <div style={{ background:"linear-gradient(135deg,#051E34 0%,#0A4D68 55%,#0891B2 100%)", padding:"3rem 2rem 2.2rem", color:"#fff" }}>
        <div style={{ maxWidth:980, margin:"0 auto" }}>
          <div style={{ fontSize:"0.72rem", fontWeight:700, opacity:.65, textTransform:"uppercase", letterSpacing:".12em", marginBottom:"0.55rem" }}>Search Results</div>
          <h1 style={{ margin:"0 0 0.75rem", fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.6rem,3vw,2.4rem)", fontWeight:700, lineHeight:1.15 }}>
            {loc ? `Listings in ${loc}` : "All Available Listings"}
          </h1>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"0.55rem", alignItems:"center" }}>
            {loc  && chip(<><i className="fa-solid fa-location-dot"/> {loc}</>)}
            {date && chip(`ðŸ“… ${fmtDate(date)}`)}
            {chip(`${totalResults} result${totalResults !== 1 ? "s" : ""}`)}
            <button onClick={clearSearch}
              style={{ marginLeft:"auto", background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.28)", borderRadius:50, padding:"0.28rem 0.9rem", fontSize:"0.77rem", fontWeight:700, color:"#fff", cursor:"pointer" }}>
              âœ• New Search
            </button>
          </div>

          {/* Stat pills */}
          <div style={{ display:"flex", gap:"1.5rem", marginTop:"1.6rem", paddingTop:"1.5rem", borderTop:"1px solid rgba(255,255,255,0.15)", flexWrap:"wrap" }}>
            {[[<i className="fa-solid fa-car"/>, "Car Rentals",filteredCars.length],[<i className="fa-solid fa-map"/>, "Tour Packages",filteredTours.length]].map(([icon,label,count]) => (
              <div key={label} style={{ display:"flex", alignItems:"center", gap:"0.65rem" }}>
                <div style={{ width:40, height:40, borderRadius:11, background:"rgba(255,255,255,0.13)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.15rem", flexShrink:0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize:"1.3rem", fontWeight:800, lineHeight:1 }}>{count}</div>
                  <div style={{ fontSize:"0.71rem", opacity:.7, marginTop:"0.15rem" }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* â”€â”€ Sticky filter / sort bar â”€â”€ */}
      <div style={{ background:"#fff", borderBottom:"1px solid #E9ECF0", position:"sticky", top:64, zIndex:10, boxShadow:"0 2px 6px rgba(0,0,0,0.05)" }}>
        <div style={{ maxWidth:980, margin:"0 auto", padding:"0 2rem", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"1rem", flexWrap:"wrap", minHeight:52 }}>
          <div style={{ display:"flex", gap:"0.2rem" }}>
            {[["all","All",totalResults],["cars",<i className="fa-solid fa-car"/>,"Cars",filteredCars.length],["tours",<i className="fa-solid fa-map"/>,"Tours",filteredTours.length]].map(([val,icon,label,count]) => (
              <button key={val} onClick={() => setActiveTab(val)} style={{
                border:"none", borderRadius:8, padding:"0.42rem 0.85rem", cursor:"pointer", fontWeight:700, fontSize:"0.8rem",
                background: activeTab === val ? "var(--ocean)" : "transparent",
                color: activeTab === val ? "#fff" : "#6B7280",
                display:"flex", alignItems:"center", gap:"0.38rem", transition:"all .15s",
              }}>
                {icon}{label}
                <span style={{ background: activeTab === val ? "rgba(255,255,255,0.22)" : "#F3F4F6", borderRadius:50, fontSize:"0.67rem", fontWeight:800, padding:"0.1rem 0.42rem", color: activeTab === val ? "#fff" : "#6B7280" }}>
                  {count}
                </span>
              </button>
            ))}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
            <span style={{ fontSize:"0.75rem", color:"#9CA3AF", fontWeight:600 }}>Sort by</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ border:"1.5px solid #E5E7EB", borderRadius:8, padding:"0.3rem 0.65rem", fontSize:"0.8rem", fontWeight:600, color:"#374151", background:"#fff", cursor:"pointer", outline:"none" }}>
              <option value="rating">⭐ Top Rated</option>
              <option value="price_asc">ðŸ’° Price: Low → High</option>
              <option value="price_desc">ðŸ’° Price: High → Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* â”€â”€ Results â”€â”€ */}
      <div style={{ maxWidth:980, margin:"0 auto", padding:"2rem" }}>
        {totalResults === 0 ? (
          <div style={{ textAlign:"center", padding:"5rem 2rem", background:"#fff", borderRadius:20, border:"1px solid #E9ECF0", boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize:"4rem", marginBottom:"1rem" }}><i className="fa-solid fa-magnifying-glass"/></div>
            <h2 style={{ marginBottom:"0.5rem", color:"#111827" }}>No listings found{loc ? ` in "${loc}"` : ""}</h2>
            <p style={{ color:"#6B7280", marginBottom:"2rem", maxWidth:380, margin:"0 auto 2rem" }}>Try a different location or browse all available listings.</p>
            <div style={{ display:"flex", gap:"0.75rem", justifyContent:"center", flexWrap:"wrap" }}>
              <button className="btn-primary" onClick={() => goTo("cars")}><i className="fa-solid fa-car"/> Browse All Cars</button>
              <button onClick={() => goTo("tours")} style={{background:"#fff",color:"var(--ocean)",border:"2px solid var(--ocean)",borderRadius:50,padding:"0.75rem 1.8rem",cursor:"pointer",fontWeight:700,fontSize:"0.95rem",transition:"all .2s",display:"inline-flex",alignItems:"center",gap:"0.5rem"}}><i className="fa-solid fa-map"/> Browse All Tours</button>
            </div>
          </div>
        ) : (
          <>
            {showCars && filteredCars.length > 0 && (
              <div style={{ marginBottom:"2.5rem" }}>
                <SectionHeader icon={<i className="fa-solid fa-car"/>} label="Car Rentals" count={filteredCars.length} color="#2563EB" bg="#DBEAFE" onViewAll={() => goTo("cars")} />
                <div style={{ display:"flex", flexDirection:"column", gap:"0.85rem" }}>
                  {filteredCars.map(car => <ResultCard key={car.id} item={car} type="car" />)}
                </div>
              </div>
            )}

            {showCars && showTours && filteredCars.length > 0 && filteredTours.length > 0 && (
              <div style={{ borderTop:"2px dashed #E9ECF0", marginBottom:"2.5rem" }} />
            )}

            {showTours && filteredTours.length > 0 && (
              <div>
                <SectionHeader icon={<i className="fa-solid fa-map"/>} label="Tour Packages" count={filteredTours.length} color="#7C3AED" bg="#EDE9FE" onViewAll={() => goTo("tours")} />
                <div style={{ display:"flex", flexDirection:"column", gap:"0.85rem" }}>
                  {filteredTours.map(tour => <ResultCard key={tour.id} item={tour} type="tour" />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

