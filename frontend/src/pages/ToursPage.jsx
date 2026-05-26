import { useState, useEffect } from "react";
import TourCard from "../components/TourCard.jsx";
import { ListingPager, PAGE_SIZE } from "../components/ListingPager.jsx";

export default function ToursPage({ tours, setModal, openBooking, users = [], searchFilters = {}, clearSearch }) {
  const [filters, setFilters] = useState({ category: "all", location: searchFilters.location || "all", duration: "all", sort: "rating" });
  const [page, setPage] = useState(1);

  const setF = (update) => { setFilters(f => ({ ...f, ...update })); setPage(1); };

  useEffect(() => {
    if (searchFilters.location) { setFilters(f => ({ ...f, location: searchFilters.location })); setPage(1); }
  }, [searchFilters.location]);

  const categories  = [...new Set(tours.map(t => t.category))];
  const durations   = [...new Set(tours.map(t => t.duration))];
  const tourLocations = [...new Set(tours.map(t => t.location))];
  const filtered = tours
    .filter(t => filters.category === "all" || t.category === filters.category)
    .filter(t => filters.location === "all" || t.location.includes(filters.location))
    .filter(t => filters.duration === "all" || t.duration === filters.duration)
    .sort((a, b) => filters.sort === "price" ? a.price - b.price : b.rating - a.rating);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const start      = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end        = Math.min(page * PAGE_SIZE, filtered.length);

  return (
    <div className="listing-page">
      <div className="page-header">
        <h1>Tour Packages</h1>
        <p>Explore {tours.length} handcrafted experiences in Central Visayas.</p>
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
          <select className="filter-select" value={filters.location} onChange={e => setF({ location: e.target.value })}>
            <option value="all">All Locations</option>
            {tourLocations.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select className="filter-select" value={filters.category} onChange={e => setF({ category: e.target.value })}>
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="filter-select" value={filters.duration} onChange={e => setF({ duration: e.target.value })}>
            <option value="all">Any Duration</option>
            {durations.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="filter-select" value={filters.sort} onChange={e => setF({ sort: e.target.value })}>
            <option value="rating">Top Rated</option>
            <option value="price">Price: Low to High</option>
          </select>
        </div>
        {filtered.length === 0 ? (
          <div className="no-results"><h3>No tours found</h3><p>Try adjusting your filters.</p></div>
        ) : (
          <>
            <div style={{ fontSize:"0.83rem", color:"var(--muted)", marginBottom:"1rem" }}>
              Showing {start}–{end} of {filtered.length} tour{filtered.length !== 1 ? "s" : ""}
            </div>
            <div className="grid-3">
              {paginated.map(tour => <TourCard key={tour.id} tour={tour} vendor={users.find(u => u.id === tour.vendorId)} onClick={() => setModal({...tour, itemType:"tour"})} onBook={() => openBooking(tour, "tour")} />)}
            </div>
            <ListingPager page={page} totalPages={totalPages} onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior:"smooth" }); }} />
          </>
        )}
      </div>
    </div>
  );
}
