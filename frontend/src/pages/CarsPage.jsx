import { useState, useEffect } from "react";
import CarCard from "../components/CarCard.jsx";
import { ListingPager, PAGE_SIZE } from "../components/ListingPager.jsx";

export default function CarsPage({ cars, setModal, openBooking, users = [], searchFilters = {}, clearSearch }) {
  const [filters, setFilters] = useState({ type: "all", location: searchFilters.location || "all", maxPrice: 99999, sort: "rating" });
  const [page, setPage] = useState(1);

  const setF = (update) => { setFilters(f => ({ ...f, ...update })); setPage(1); };

  useEffect(() => {
    if (searchFilters.location) { setFilters(f => ({ ...f, location: searchFilters.location })); setPage(1); }
  }, [searchFilters.location]);

  const activeVendorIds = new Set(
    users.filter(u => u.role === "vendor" && u.status === "active" && u.approvalStatus === "approved").map(u => u.id)
  );
  const activeCars = cars.filter(c => activeVendorIds.has(c.vendorId));
  const filtered = activeCars
    .filter(c => filters.type === "all" || c.type === filters.type)
    .filter(c => filters.location === "all" || c.location.includes(filters.location))
    .filter(c => c.price <= filters.maxPrice)
    .sort((a, b) => filters.sort === "price" ? a.price - b.price : b.rating - a.rating);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const start      = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end        = Math.min(page * PAGE_SIZE, filtered.length);

  const types     = [...new Set(activeCars.map(c => c.type))];
  const locations = [...new Set(activeCars.map(c => c.location))];

  return (
    <div className="listing-page">
      <div className="page-header">
        <h1>Car Rentals</h1>
        <p>Browse our fleet of {activeCars.length} available vehicles across Eastern Visayas.</p>
      </div>
      {searchFilters.location && (
        <div style={{display:"flex",alignItems:"center",gap:"0.6rem",padding:"0.6rem 1.5rem",background:"#EFF6FF",borderBottom:"1px solid #BFDBFE"}}>
          <span style={{fontSize:"0.82rem",color:"#1D4ED8",fontWeight:600}}>
            <i className="fa-solid fa-location-dot"/> Showing results for: <strong>{searchFilters.location}</strong>
            {searchFilters.date && <span style={{marginLeft:"0.4rem"}}>· <i className="fa-solid fa-calendar"/> {searchFilters.date}</span>}
          </span>
          <button onClick={() => { if(clearSearch) clearSearch(); setF({ location: "all" }); }}
            style={{marginLeft:"auto",background:"none",border:"1px solid #93C5FD",borderRadius:6,padding:"0.2rem 0.6rem",fontSize:"0.75rem",fontWeight:700,color:"#1D4ED8",cursor:"pointer"}}>
            <i className="fa-solid fa-xmark"/> Clear search
          </button>
        </div>
      )}
      <div className="section">
        <div className="filters">
          <span className="filter-label">Filter:</span>
          <select className="filter-select" value={filters.type} onChange={e => setF({ type: e.target.value })}>
            <option value="all">All Types</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="filter-select" value={filters.location} onChange={e => setF({ location: e.target.value })}>
            <option value="all">All Locations</option>
            {locations.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select className="filter-select" value={filters.maxPrice} onChange={e => setF({ maxPrice: +e.target.value })}>
            <option value={99999}>Any Price</option>
            <option value={1500}>Under ₱1,500</option>
            <option value={2500}>Under ₱2,500</option>
            <option value={3500}>Under ₱3,500</option>
          </select>
          <select className="filter-select" value={filters.sort} onChange={e => setF({ sort: e.target.value })}>
            <option value="rating">Top Rated</option>
            <option value="price">Price: Low to High</option>
          </select>
        </div>
        {filtered.length === 0 ? (
          <div className="no-results"><h3>No vehicles found</h3><p>Try adjusting your filters.</p></div>
        ) : (
          <>
            <div style={{ fontSize:"0.83rem", color:"var(--muted)", marginBottom:"1rem" }}>
              Showing {start}–{end} of {filtered.length} vehicle{filtered.length !== 1 ? "s" : ""}
            </div>
            <div className="grid-3">
              {paginated.map(car => <CarCard key={car.id} car={car} vendor={users.find(u => u.id === car.vendorId)} onClick={() => setModal({...car, itemType:"car"})} onBook={() => openBooking(car, "car")} />)}
            </div>
            <ListingPager page={page} totalPages={totalPages} onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior:"smooth" }); }} />
          </>
        )}
      </div>
    </div>
  );
}
