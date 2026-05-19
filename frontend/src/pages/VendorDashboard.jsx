import { useState, useRef } from "react";
import { fmtMoney, fmtPeso } from "../utils/helpers.js";
import { StatusBadge } from "../components/SharedUI.jsx";
import { BarChart, DonutChart, AreaSparkline } from "../components/Charts.jsx";
import { ImageUploader, EditProfileModal, EditGcashModal, EditBankModal } from "./CustomerProfile.jsx";
import { api } from "../api.js";

export default function VendorDashboard({ user, bookings, cars, tours, onLogout, goTo, updateBookingStatus, deleteBooking, setCars, setTours, updateCar, updateTour, deleteCar, deleteTour, showToast, setPdfModal, allCars, allTours, serviceFee = 5, updateUser, requestDeletion }) {
  const [section, setSection]                 = useState("overview");
  const [addType, setAddType]                 = useState("car");
  const [deleteBookingId, setDeleteBookingId] = useState(null);
  const [editItem, setEditItem]               = useState(null);
  const [deleteListingConfirm, setDeleteListingConfirm] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditGcash, setShowEditGcash]     = useState(false);
  const [showEditBank, setShowEditBank]       = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason]       = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [viewProof, setViewProof]             = useState(null);
  const [vbTypeFilter, setVbTypeFilter]       = useState("all");
  const [vbSearch, setVbSearch]               = useState("");
  const [cancelModal, setCancelModal]         = useState(null); // { id, name }
  const [cancelReason, setCancelReason]       = useState("");

  const [pwForm, setPwForm]     = useState({ newPw:"", confirm:"" });
  const [pwError, setPwError]   = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  const [newCar, setNewCar]   = useState({ name:"",type:"Van",location:"",price:"",seats:"",fuel:"Diesel",transmission:"Manual",mileage:"",color:"",year:"",withDriver:false,features:[],description:"",images:[] });
  const [newTour, setNewTour] = useState({ name:"",category:"Island Tour",location:"",price:"",duration:"1 Day",groupSize:"",meetingPoint:"",includes:[],description:"",images:[] });
  const [carFeatureInput, setCarFeatureInput]       = useState("");
  const [tourIncludeInput, setTourIncludeInput]     = useState("");
  const [editCarFeatureInput, setEditCarFeatureInput]   = useState("");
  const [editTourIncludeInput, setEditTourIncludeInput] = useState("");

  const seenKey = `cebuCartour_seenBk_${user.id}`;
  const [seenIds, setSeenIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(seenKey) || "[]")); } catch { return new Set(); }
  });
  const pendingBookings = bookings.filter(b => b.status === "pending");
  const newBookingCount = pendingBookings.filter(b => !seenIds.has(b.id)).length;
  const markBookingsSeen = () => {
    const updated = new Set([...seenIds, ...pendingBookings.map(b => b.id)]);
    setSeenIds(updated);
    localStorage.setItem(seenKey, JSON.stringify([...updated]));
  };

  const revenue = bookings.filter(b => b.status === "approved").reduce((s, b) => s + (+b.total), 0);

  const handleAddCar = async () => {
    if (!newCar.name || !newCar.location || !newCar.price) { alert("Fill required fields."); return; }
    const images = newCar.images || [];
    const image  = images[0] || "";
    const carData = { ...newCar, vendorId: user.id, price: +newCar.price, seats: +newCar.seats, mileage: +newCar.mileage || 0, year: +newCar.year || null, available: true, rating: 5.0, reviews: 0, image };
    try {
      const created = await api.cars.create(carData);
      setCars(prev => [...prev, created]);
      setNewCar({ name:"",type:"Van",location:"",price:"",seats:"",fuel:"Diesel",transmission:"Manual",mileage:"",color:"",year:"",withDriver:false,features:[],description:"",images:[] });
      setCarFeatureInput("");
      showToast("Car listing added!");
    } catch (e) {
      console.error(e);
      showToast("Failed to save car: " + (e.message || "Server error. Is the backend running?"));
    }
  };

  const handleAddTour = async () => {
    if (!newTour.name || !newTour.location || !newTour.price) { alert("Fill required fields."); return; }
    const images = newTour.images || [];
    const image  = images[0] || "";
    const tourData = { ...newTour, vendorId: user.id, price: +newTour.price, groupSize: +newTour.groupSize, available: true, rating: 5.0, reviews: 0, image };
    try {
      const created = await api.tours.create(tourData);
      setTours(prev => [...prev, created]);
      setNewTour({ name:"",category:"Island Tour",location:"",price:"",duration:"1 Day",groupSize:"",meetingPoint:"",includes:[],description:"",images:[] });
      setTourIncludeInput("");
      showToast("Tour listing added!");
    } catch (e) {
      console.error(e);
      showToast("Failed to save tour: " + (e.message || "Server error. Is the backend running?"));
    }
  };

  const sidebarItems = [
    ["overview",   <i className="fa-solid fa-gauge-high"/>,    "Overview"],
    ["bookings",   <i className="fa-solid fa-calendar-days"/>, "My Bookings"],
    ["analytics",  <i className="fa-solid fa-chart-line"/>,    "Analytics"],
    ["listings",   <i className="fa-solid fa-tags"/>,          "My Listings"],
    ["add",        <i className="fa-solid fa-plus"/>,          "Add Listing"],
    ["profile",    <i className="fa-solid fa-user"/>,          "My Profile"],
  ];

  return (
    <>
    {/* â"€â"€ Vendor Cancel Booking Modal â"€â"€ */}
    {cancelModal && (
      <div className="overlay" onClick={() => setCancelModal(null)} style={{zIndex:600,background:"rgba(0,0,0,0.5)"}}>
        <div onClick={e => e.stopPropagation()} style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:440,padding:"2rem",boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>
          <div style={{textAlign:"center",marginBottom:"1.2rem"}}>
            <div style={{fontSize:"2.5rem",marginBottom:"0.5rem"}}><i className="fa-solid fa-ban" style={{color:"#EF4444"}}/></div>
            <h3 style={{margin:0,marginBottom:"0.4rem"}}>Cancel Booking</h3>
            <p style={{margin:0,fontSize:"0.88rem",color:"var(--muted)"}}>
              Cancelling booking <strong>{cancelModal.id}</strong> for <strong>{cancelModal.name}</strong>.<br/>
              The customer will be notified.
            </p>
          </div>
          <div style={{marginBottom:"1.2rem"}}>
            <label style={{display:"block",fontSize:"0.75rem",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:"0.4rem"}}>
              Reason for cancellation (optional)
            </label>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="e.g. Vehicle unavailable, schedule conflict, maintenance required..."
              rows={3}
              style={{width:"100%",border:"2px solid var(--border)",borderRadius:10,padding:"0.7rem",fontFamily:"inherit",fontSize:"0.88rem",resize:"vertical",outline:"none"}}
            />
          </div>
          <div style={{display:"flex",gap:"0.75rem"}}>
            <button onClick={() => setCancelModal(null)}
              style={{flex:1,border:"2px solid var(--border)",borderRadius:10,padding:"0.7rem",background:"#fff",fontWeight:700,cursor:"pointer",fontSize:"0.9rem"}}>
              Keep Booking
            </button>
            <button onClick={async () => {
              const reason = cancelReason.trim();
              await updateBookingStatus(cancelModal.id, "cancelled");
              if (reason) {
                try { await api.bookings.update(cancelModal.id, { notes: `[Cancelled by vendor: ${reason}]` }); } catch(e) {}
              }
              setCancelModal(null);
              setCancelReason("");
            }}
              style={{flex:1,background:"#DC2626",color:"#fff",border:"none",borderRadius:10,padding:"0.7rem",fontWeight:700,cursor:"pointer",fontSize:"0.9rem"}}>
              Yes, Cancel Booking
            </button>
          </div>
        </div>
      </div>
    )}

    {/* â"€â"€ Payment Proof Lightbox â"€â"€ */}
    {viewProof && (
      <div className="overlay" onClick={() => setViewProof(null)} style={{zIndex:500,background:"rgba(0,0,0,0.75)"}}>
        <div onClick={e => e.stopPropagation()} style={{
          background:"#fff",borderRadius:20,width:"100%",maxWidth:540,
          boxShadow:"0 24px 80px rgba(0,0,0,0.4)",overflow:"hidden"
        }}>
          <div style={{background:"linear-gradient(135deg,var(--ocean),var(--teal))",padding:"1rem 1.5rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontWeight:700,color:"#fff",fontSize:"0.95rem"}}><i className="fa-solid fa-credit-card"/> Payment Screenshot</div>
              <div style={{color:"rgba(255,255,255,0.75)",fontSize:"0.78rem"}}>
                {viewProof.id} — {viewProof.name}
              </div>
            </div>
            <button onClick={() => setViewProof(null)} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:8,padding:"0.4rem 0.8rem",cursor:"pointer",color:"#fff",fontWeight:700,fontSize:"1rem"}}>✕</button>
          </div>
          <div style={{padding:"1.5rem",textAlign:"center"}}>
            {viewProof.paymentProof?.startsWith("data:image") ? (
              <img src={viewProof.paymentProof} alt="Payment proof" style={{maxWidth:"100%",maxHeight:"60vh",borderRadius:12,border:"1px solid var(--border)",boxShadow:"0 4px 20px rgba(0,0,0,0.1)"}} />
            ) : (
              <div style={{padding:"3rem",color:"var(--muted)",fontSize:"0.9rem"}}>
                <i className="fa-solid fa-file-pdf"/> PDF receipt uploaded — preview not available.<br/>
                <span style={{fontSize:"0.8rem"}}>Filename visible only in backend storage.</span>
              </div>
            )}
            <div style={{marginTop:"1rem",display:"flex",gap:"0.8rem",justifyContent:"center"}}>
              <div style={{background:viewProof.status==="approved"?"#D1FAE5":viewProof.status==="cancelled"?"#FEE2E2":"#FEF3C7",color:viewProof.status==="approved"?"#065F46":viewProof.status==="cancelled"?"#991B1B":"#92400E",padding:"0.4rem 1rem",borderRadius:20,fontWeight:700,fontSize:"0.82rem"}}>
                {(viewProof.status||"pending").toUpperCase()}
              </div>
              <div style={{background:"#F3F4F6",padding:"0.4rem 1rem",borderRadius:20,fontSize:"0.82rem",color:"var(--ink)",fontWeight:600}}>
                {fmtPeso(viewProof.total)}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    {deleteBookingId && (() => {
      const b = bookings.find(bk => bk.id === deleteBookingId);
      if (!b) return null;
      return (
        <div className="overlay" onClick={() => setDeleteBookingId(null)} style={{zIndex:400}}>
          <div onClick={e => e.stopPropagation()} style={{
            background:"#fff", borderRadius:20, width:"100%", maxWidth:650,
            padding:"2rem", textAlign:"center", boxShadow:"0 20px 60px rgba(0,0,0,0.2)"
          }}>
            <div style={{fontSize:"3rem", marginBottom:"1rem"}}><i className="fa-solid fa-trash"/></div>
            <h3 style={{fontFamily:"'DM Sans',sans-serif", fontWeight:700, marginBottom:"0.5rem"}}>Delete Booking?</h3>
            <p style={{color:"var(--muted)", fontSize:"0.9rem", lineHeight:1.7, marginBottom:"0.5rem"}}>
              Permanently delete booking <strong>{b.id}</strong> for <strong>{b.name}</strong>?
            </p>
            <p style={{color:"var(--danger)", fontSize:"0.82rem", marginBottom:"1.5rem"}}>This cannot be undone.</p>
            <div style={{display:"flex", gap:"0.8rem"}}>
              <button onClick={() => { deleteBooking(deleteBookingId); setDeleteBookingId(null); }}
                style={{flex:1,background:"var(--danger)",color:"#fff",border:"none",padding:"0.85rem",borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:"0.95rem"}}>
                Yes, Delete
              </button>
              <button onClick={() => setDeleteBookingId(null)}
                style={{flex:1,background:"#F3F4F6",color:"var(--ink)",border:"none",padding:"0.85rem",borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:"0.95rem"}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      );
    })()}
    {showEditProfile && <EditProfileModal user={user} onSave={updateUser} onClose={() => setShowEditProfile(false)} />}
    {showEditGcash && <EditGcashModal user={user} onSave={updateUser} onClose={() => setShowEditGcash(false)} />}
    {showEditBank  && <EditBankModal  user={user} onSave={updateUser} onClose={() => setShowEditBank(false)} />}
    <div className="dash-layout">
      <div className="sidebar">
        <div className="sidebar-logo">
          <i className="fa-solid fa-store" style={{fontSize:"1.2rem"}}/>
          <div>Vendor Portal<span>CebuCarTour</span></div>
        </div>
        {sidebarItems.map(([id,icon,label]) => (
          <div key={id} className={`sidebar-item ${section === id ? "active" : ""}`}
            onClick={() => { setSection(id); if (id === "bookings") markBookingsSeen(); }}>
            <span className="sidebar-icon" data-tip={label}>{icon}</span>
            <span style={{flex:1}}>{label}</span>
            {id === "bookings" && newBookingCount > 0 && (
              <span style={{
                background: section === "bookings" ? "rgba(255,255,255,0.3)" : "#EF4444",
                color:"#fff", borderRadius:50, fontSize:"0.65rem", fontWeight:800,
                padding:"0.15rem 0.55rem", minWidth:20, textAlign:"center", lineHeight:1.4,
                animation: section !== "bookings" ? "notif-ping 1.4s ease infinite" : "none",
              }}>
                {newBookingCount}
              </span>
            )}
          </div>
        ))}
        <div className="sidebar-item" onClick={() => goTo("home")}><span className="sidebar-icon" data-tip="Go to Main Site"><i className="fa-solid fa-globe"/></span>View Site</div>
        <div className="sidebar-item" onClick={onLogout}><span className="sidebar-icon" data-tip="Sign Out"><i className="fa-solid fa-right-from-bracket"/></span>Logout</div>
      </div>

      <div className="dash-content fade-in">
        <div className="dash-header">
          <h1>{section === "overview" ? "Dashboard" : section === "add" ? "Add Listing" : section === "profile" ? "My Profile" : section.charAt(0).toUpperCase() + section.slice(1)}</h1>
          <p>Welcome, <strong>{user.name}</strong> {!user.approved && "— âš ï¸ Your account is pending admin approval."}</p>
        </div>

        {/* â"€â"€ APPROVAL GATE â"€â"€ show full screen if not approved â"€â"€ */}
        {user.approvalStatus === "pending" && (
          <div className="pending-screen">
            <div className="pending-icon">â³</div>
            <h2>Your Application is Under Review</h2>
            <p>Our admin team is currently reviewing your vendor profile. This typically takes <strong>24â€"48 hours</strong>. You will be notified once approved.</p>
            <div className="pending-steps">
              {[["fa-solid fa-circle-check","Application Submitted","Your details have been received."],
                ["fa-solid fa-magnifying-glass","Admin Review","Our team is verifying your information."],
                ["fa-solid fa-envelope","Decision Notification","You'll receive an email with the outcome."],
                ["fa-solid fa-rocket","Start Posting","Once approved, add your listings here."]].map(([icon,title,desc]) => (
                <div key={title} className="pending-step">
                  <div className="ps-icon">{icon.startsWith("fa-") ? <i className={icon}/> : icon}</div>
                  <strong style={{fontSize:"0.85rem",display:"block",marginBottom:"0.3rem"}}>{title}</strong>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
            <div style={{marginTop:"1.5rem",background:"var(--sand)",borderRadius:12,padding:"1rem 1.5rem",fontSize:"0.85rem",textAlign:"center"}}>
              Questions? Email us at <strong>hello@islatravelph.com</strong> or WhatsApp <strong>+63 917 XXX XXXX</strong>
            </div>
          </div>
        )}

        {user.approvalStatus === "rejected" && (
          <div className="rejected-screen">
            <div style={{fontSize:"3.5rem",marginBottom:"1rem"}}>âŒ</div>
            <h2>Application Not Approved</h2>
            <p style={{color:"var(--muted)",maxWidth:480,lineHeight:1.7}}>
              Unfortunately, your vendor application was not approved at this time. Please review the reason below and contact us if you have questions.
            </p>
            {user.rejectionReason && (
              <div className="rejected-box">
                <div style={{fontSize:"0.75rem",fontWeight:700,color:"#991B1B",textTransform:"uppercase",letterSpacing:".08em",marginBottom:"0.5rem"}}>Reason</div>
                <p>{user.rejectionReason}</p>
              </div>
            )}
            <div style={{display:"flex",gap:"1rem",marginTop:"1rem",flexWrap:"wrap",justifyContent:"center"}}>
              <button className="btn-primary" onClick={() => goTo("contact")}><i className="fa-solid fa-envelope"/> Contact Support</button>
              <button style={{background:"#F3F4F6",color:"var(--ink)",border:"none",padding:"0.75rem 1.8rem",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.95rem"}} onClick={() => goTo("home")}>Back to Home</button>
            </div>
          </div>
        )}

        {/* â"€â"€ APPROVED VENDOR CONTENT â"€â"€ */}
        {user.approvalStatus === "approved" && (<>

        {section === "overview" && (
          <>
            <div className="stats-grid">
              {[
                ["fa-solid fa-calendar","Total Bookings", bookings.length,                                    "bookings"],
                ["fa-solid fa-circle-check","Approved",        bookings.filter(b=>b.status==="approved").length,   "bookings"],
                ["fa-solid fa-hourglass-half","Pending",         bookings.filter(b=>b.status==="pending").length,    "bookings"],
                ["fa-solid fa-circle-xmark","Cancelled",       bookings.filter(b=>b.status==="cancelled").length,  "bookings"],
                ["fa-solid fa-money-bill-wave","Revenue",         fmtMoney(revenue),                                 "bookings"],
                ["fa-solid fa-car","My Cars",         cars.length,                                        "listings"],
                ["fa-solid fa-map","My Tours",       tours.length,                                       "listings"],
              ].map(([icon,label,val,dest]) => (
                <div key={label} className="stat-card"
                  onClick={() => setSection(dest)}
                  style={{cursor:"pointer",transition:"all .2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 12px 28px rgba(0,0,0,0.10)";e.currentTarget.style.borderColor="var(--teal)";}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="";e.currentTarget.style.borderColor="var(--border)";}}>
                  <div className="stat-icon" data-tip={label}>{icon.startsWith("fa-") ? <i className={icon}/> : icon}</div>
                  <h3>{label}</h3>
                  <div className="stat-val">{val}</div>
                  <div style={{fontSize:"0.72rem",color:"var(--teal)",fontWeight:700,marginTop:"0.4rem"}}>View <i className="fa-solid fa-arrow-right"/></div>
                </div>
              ))}
            </div>

            {/* â"€â"€ Vendor Analytics â"€â"€ */}
            {(() => {
              const CARD = {background:"#fff",borderRadius:14,border:"1px solid #E9ECF0",padding:"1.25rem 1.5rem",boxShadow:"0 1px 3px rgba(0,0,0,0.06)"};
              const CTITLE = {fontSize:"0.7rem",fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:".08em",marginBottom:"0.5rem"};
              const now2 = new Date();
              const vMonths = Array.from({length:6},(_,i)=>{
                const d = new Date(now2.getFullYear(), now2.getMonth()-5+i, 1);
                const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
                return {ym, label:d.toLocaleString("default",{month:"short"}),
                  revenue: bookings.filter(b=>b.status==="approved"&&(b.date||"").startsWith(ym)).reduce((s,b)=>s+(+b.total),0),
                  count:   bookings.filter(b=>(b.date||"").startsWith(ym)).length};
              });
              const listingMap = {};
              bookings.forEach(b=>{
                const k=`${b.type}_${b.itemId}`;
                if(!listingMap[k]) listingMap[k]={type:b.type,itemId:b.itemId,total:0,count:0};
                listingMap[k].total += +(b.total)||0;
                listingMap[k].count++;
              });
              const topVL = Object.values(listingMap).sort((a,b)=>b.total-a.total).slice(0,5)
                .map(x=>({...x, name:(x.type==="car"?cars:tours).find(i=>i.id===x.itemId)?.name||"Deleted Listing"}));
              const maxVLRev = topVL[0]?.total || 1;
              const approvedBk = bookings.filter(b=>b.status==="approved").length;
              const pendingBk  = bookings.filter(b=>b.status==="pending").length;
              const cancelBk   = bookings.filter(b=>b.status==="cancelled").length;
              const vLast6Rev  = vMonths.reduce((s,m)=>s+m.revenue, 0);
              return (
                <>
                  <div style={{fontSize:"0.7rem",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".1em",margin:"1.25rem 0 0.75rem",display:"flex",alignItems:"center",gap:"0.5rem"}}>
                    <i className="fa-solid fa-chart-line"/> Analytics Overview
                    <div style={{flex:1,height:1,background:"var(--border)"}}/>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:"1rem",marginBottom:"1rem"}}>
                    <div style={CARD}>
                      <div style={CTITLE}>Monthly Revenue (Last 6 Months)</div>
                      <div style={{fontSize:"1.5rem",fontWeight:800,color:"#111827",marginBottom:"0.3rem"}}>{fmtMoney(vLast6Rev)}</div>
                      <div style={{fontSize:"0.72rem",color:"#059669",marginBottom:"0.6rem"}}><i className="fa-solid fa-arrow-up-right"/> Total revenue over last 6 months</div>
                      <BarChart data={vMonths.map(m=>({label:m.label,value:m.revenue}))} color="#2563EB" valuePrefix="₱" />
                    </div>
                    <div style={CARD}>
                      <div style={CTITLE}>Booking Status</div>
                      <div style={{display:"flex",justifyContent:"center",margin:"0.4rem 0 0.7rem"}}>
                        <DonutChart segments={[
                          {label:"Approved", value:approvedBk, color:"#059669"},
                          {label:"Pending",  value:pendingBk,  color:"#D97706"},
                          {label:"Cancelled",value:cancelBk,   color:"#DC2626"},
                        ]} />
                      </div>
                      {[["Approved","#059669",approvedBk],["Pending","#D97706",pendingBk],["Cancelled","#DC2626",cancelBk]].map(([l,c,v])=>(
                        <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:"0.78rem",padding:"0.2rem 0"}}>
                          <span style={{display:"flex",alignItems:"center",gap:"0.4rem"}}>
                            <span style={{width:8,height:8,borderRadius:"50%",background:c,display:"inline-block"}}/>
                            <span style={{color:"var(--muted)"}}>{l}</span>
                          </span>
                          <span style={{fontWeight:700,color:"#111827"}}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {topVL.length > 0 && (
                    <div style={{...CARD,marginBottom:"1rem"}}>
                      <div style={CTITLE}>Top Listings Performance</div>
                      <div style={{display:"flex",flexDirection:"column",gap:"0.6rem"}}>
                        {topVL.map((l,idx)=>(
                          <div key={idx} style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
                            <span style={{fontSize:"0.72rem",fontWeight:700,color:"var(--muted)",width:18,textAlign:"center",flexShrink:0}}>#{idx+1}</span>
                            <div style={{flex:1}}>
                              <div style={{fontSize:"0.82rem",fontWeight:600,color:"#111827",marginBottom:3}}>{l.type==="car" ? <i className="fa-solid fa-car"/> : <i className="fa-solid fa-map"/>} {l.name}</div>
                              <div style={{height:6,background:"#F3F4F6",borderRadius:50}}>
                                <div style={{width:`${(l.total/maxVLRev)*100}%`,height:"100%",background:"#2563EB",borderRadius:50}}/>
                              </div>
                            </div>
                            <div style={{textAlign:"right",flexShrink:0}}>
                              <div style={{fontSize:"0.85rem",fontWeight:800,color:"#059669"}}>{fmtPeso(l.total)}</div>
                              <div style={{fontSize:"0.68rem",color:"var(--muted)"}}>{l.count} bookings</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            <div className="table-wrap">
              <div className="table-header"><h3>Recent Bookings</h3></div>
              {bookings.length === 0 ? (
                <div className="empty-state"><div className="empty-icon"><i className="fa-solid fa-magnifying-glass"/></div><p>No bookings yet. Add listings to get started!</p></div>
              ) : (
                <table>
                  <thead><tr><th>ID</th><th>Customer</th><th>Type</th><th>Date</th><th>Guests</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {bookings.map(b => (
                      <tr key={b.id}>
                        <td><strong>{b.id}</strong></td>
                        <td>{b.name}<br/><span style={{fontSize:"0.8rem",color:"var(--muted)"}}>{b.phone}</span></td>
                        <td>{b.type === "car" ? <><i className="fa-solid fa-car"/> Car</> : <><i className="fa-solid fa-map"/> Tour</>}</td>
                        <td>{b.date}</td>
                        <td>{b.guests}</td>
                        <td><strong>{fmtPeso(b.total)}</strong></td>
                        <td><StatusBadge status={b.status} /></td>
                        <td style={{display:"flex",gap:"0.3rem"}}>
                          {b.status === "pending" && <button className="action-btn approve" onClick={() => updateBookingStatus(b.id,"approved")} data-tip="Approve Booking"><i className="fa-solid fa-check"/> Approve</button>}
                          {b.status !== "cancelled" && <button className="action-btn reject" data-tip="Cancel Booking" onClick={() => { setCancelModal({id:b.id,name:b.name}); setCancelReason(""); }}><i className="fa-solid fa-xmark"/> Cancel</button>}
                          <button className="action-btn view" data-tip="Download PDF" onClick={() => { const itm = b.type==="car" ? cars.find(c=>c.id===b.itemId) : tours.find(t=>t.id===b.itemId); setPdfModal({ booking:b, itemName: itm?.name || "—", item: itm || null }); }}><i className="fa-solid fa-file-pdf"/> PDF</button>
                          <button className="action-btn delete" data-tip="Delete" onClick={() => setDeleteBookingId(b.id)}><i className="fa-solid fa-trash"/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {section === "bookings" && (() => {
          const vbFiltered = bookings.filter(b => {
            const q = vbSearch.toLowerCase();
            const matchQ = !q || (b.name||"").toLowerCase().includes(q)
              || (b.id||"").toLowerCase().includes(q)
              || (b.email||"").toLowerCase().includes(q);
            const matchType = vbTypeFilter === "all" || b.type === vbTypeFilter;
            return matchQ && matchType;
          });
          const fmtTs = (ts) => {
            if (!ts) return "—";
            const d = new Date(ts);
            return d.toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})
              + " " + d.toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit"});
          };
          return (
          <div className="table-wrap">
            <div className="table-header" style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"0.8rem"}}>
              <div style={{display:"flex",alignItems:"center",gap:"0.6rem",flexWrap:"wrap"}}>
                <h3 style={{margin:0}}>All My Bookings</h3>
                <span style={{background:"#EFF6FF",color:"#1D4ED8",borderRadius:8,padding:"0.2rem 0.7rem",fontWeight:700,fontSize:"0.8rem"}}>
                  {vbFiltered.length}
                </span>
                <div style={{display:"flex",gap:"0.3rem"}}>
                  {[["all","All"],["car",<i className="fa-solid fa-car"/>,"Car"],["tour",<i className="fa-solid fa-map"/> ,"Tour"]].map(([val,label]) => (
                    <button key={val} onClick={() => setVbTypeFilter(val)}
                      style={{border:"none",borderRadius:7,padding:"0.3rem 0.75rem",cursor:"pointer",fontWeight:700,fontSize:"0.78rem",
                        background: vbTypeFilter === val ? "var(--ocean)" : "#F3F4F6",
                        color: vbTypeFilter === val ? "#fff" : "#6B7280"}}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <input value={vbSearch} onChange={e => setVbSearch(e.target.value)}
                placeholder="Search by name, ID, emailâ€¦"
                style={{border:"1.5px solid var(--border)",borderRadius:8,padding:"0.4rem 0.85rem",fontSize:"0.83rem",width:230,outline:"none"}} />
            </div>
            {vbFiltered.length === 0 ? (
              <div className="empty-state"><div className="empty-icon"><i className="fa-solid fa-magnifying-glass"/></div><p>No bookings match.</p></div>
            ) : (
              <table>
                <thead><tr><th>ID</th><th>Customer</th><th>Phone</th><th>Type</th><th>Listing</th><th>Date</th><th>Pickup</th><th>Notes</th><th>Total</th><th>Proof</th><th>Status</th><th>Booked On</th><th>Actions</th></tr></thead>
                <tbody>
                  {vbFiltered.map(b => {
                    const bItm = b.type==="car" ? cars.find(c=>c.id===b.itemId) : tours.find(t=>t.id===b.itemId);
                    return (
                    <tr key={b.id}>
                      <td><strong>{b.id}</strong></td>
                      <td>{b.name}</td>
                      <td style={{fontSize:"0.82rem"}}>{b.phone}</td>
                      <td>
                        <span style={{background:b.type==="car"?"#EFF6FF":"#F0FDF4",color:b.type==="car"?"#1D4ED8":"#166534",fontSize:"0.75rem",fontWeight:700,padding:"0.2rem 0.55rem",borderRadius:50}}>
                          {b.type==="car" ? <><i className="fa-solid fa-car"/></> : <><i className="fa-solid fa-map"/></>}
                        </span>
                      </td>
                      <td style={{fontSize:"0.82rem"}}>
                        {bItm ? (
                          <div>
                            <div style={{fontWeight:600,color:"#111827"}}>{bItm.name}</div>
                            <div style={{color:"var(--muted)",fontSize:"0.75rem"}}>
                              {b.type==="car"
                                ? [bItm.seats&&`${bItm.seats} seats`,bItm.fuel,bItm.transmission].filter(Boolean).join(" · ")
                                : [bItm.category,bItm.duration,bItm.groupSize&&`${bItm.groupSize} pax`].filter(Boolean).join(" · ")}
                            </div>
                          </div>
                        ) : <span style={{color:"var(--muted)"}}>—</span>}
                      </td>
                      <td style={{whiteSpace:"nowrap"}}>
                        <div style={{fontSize:"0.82rem"}}>{b.date}</div>
                        {b.pickTime && <div style={{fontSize:"0.75rem",color:"var(--muted)"}}><i className="fa-solid fa-clock"/> {b.pickTime}</div>}
                        {b.returnDate && b.returnDate !== b.date && <div style={{fontSize:"0.75rem",color:"var(--muted)"}}>â†© {b.returnDate}</div>}
                      </td>
                      <td style={{fontSize:"0.82rem"}}>{b.pickup || "—"}</td>
                      <td style={{fontSize:"0.82rem",color:"var(--muted)",maxWidth:"120px"}}>{b.notes || "—"}</td>
                      <td style={{fontWeight:700}}>{fmtPeso(b.total)}</td>
                      <td style={{textAlign:"center"}}>
                        {b.paymentProof
                          ? <button className="action-btn view" data-tip="View Payment Screenshot" onClick={() => setViewProof(b)} style={{fontSize:"1rem",padding:"0.3rem 0.55rem"}}><i className="fa-solid fa-camera"/></button>
                          : <span style={{color:"var(--muted)",fontSize:"0.78rem"}}>{b.paymentMethod==="cash" ? "Cash" : "—"}</span>}
                      </td>
                      <td><StatusBadge status={b.status} /></td>
                      <td style={{fontSize:"0.76rem",color:"var(--muted)",whiteSpace:"nowrap"}}>{fmtTs(b.createdAt)}</td>
                      <td style={{display:"flex",gap:"0.3rem"}}>
                        {b.status === "pending" && <button className="action-btn approve" onClick={() => updateBookingStatus(b.id,"approved")} data-tip="Approve Booking"><i className="fa-solid fa-check"/></button>}
                        {b.status !== "cancelled" && <button className="action-btn reject" data-tip="Cancel Booking" onClick={() => { setCancelModal({id:b.id,name:b.name}); setCancelReason(""); }}><i className="fa-solid fa-xmark"/></button>}
                        <button className="action-btn view" data-tip="Download PDF" onClick={() => { const itm = b.type==="car" ? cars.find(c=>c.id===b.itemId) : tours.find(t=>t.id===b.itemId); setPdfModal({ booking:b, itemName: itm?.name || "—", item: itm || null }); }}><i className="fa-solid fa-file-pdf"/></button>
                        <button className="action-btn delete" data-tip="Delete" onClick={() => setDeleteBookingId(b.id)}><i className="fa-solid fa-trash"/></button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          );
        })()}

        {/* â"€â"€ ANALYTICS â"€â"€ */}
        {section === "analytics" && (() => {
          const CARD  = {background:"#fff",borderRadius:14,border:"1px solid #E9ECF0",padding:"1.25rem 1.5rem",boxShadow:"0 1px 3px rgba(0,0,0,0.06)"};
          const CTITLE= {fontSize:"0.7rem",fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:".08em",marginBottom:"0.5rem"};
          const now2  = new Date();
          const thisYm  = `${now2.getFullYear()}-${String(now2.getMonth()+1).padStart(2,"0")}`;
          const lastMonD= new Date(now2.getFullYear(), now2.getMonth()-1, 1);
          const lastYm  = `${lastMonD.getFullYear()}-${String(lastMonD.getMonth()+1).padStart(2,"0")}`;

          const vMonths = Array.from({length:6},(_,i) => {
            const d  = new Date(now2.getFullYear(), now2.getMonth()-5+i, 1);
            const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
            return {
              ym, label: d.toLocaleString("default",{month:"short"}),
              revenue:  bookings.filter(b=>b.status==="approved"&&(b.date||"").startsWith(ym)).reduce((s,b)=>s+(+b.total),0),
              count:    bookings.filter(b=>(b.date||"").startsWith(ym)).length,
            };
          });

          const approvedBk   = bookings.filter(b=>b.status==="approved");
          const pendingBk    = bookings.filter(b=>b.status==="pending");
          const cancelBk     = bookings.filter(b=>b.status==="cancelled");
          const totalRev     = approvedBk.reduce((s,b)=>s+(+(b.total)||0),0);
          const platformFee  = approvedBk.reduce((s,b)=>s+Math.round((b.total||0)-(b.total||0)/(1+serviceFee/100)),0);
          const netEarnings  = totalRev - platformFee;
          const avgBooking   = approvedBk.length>0 ? Math.round(totalRev/approvedBk.length) : 0;
          const approvalRate = bookings.length>0 ? Math.round((approvedBk.length/bookings.length)*100) : 0;
          const thisMonthRev = bookings.filter(b=>b.status==="approved"&&(b.date||"").startsWith(thisYm)).reduce((s,b)=>s+(+b.total),0);
          const lastMonthRev = bookings.filter(b=>b.status==="approved"&&(b.date||"").startsWith(lastYm)).reduce((s,b)=>s+(+b.total),0);
          const revTrend     = lastMonthRev>0 ? Math.round(((thisMonthRev-lastMonthRev)/lastMonthRev)*100) : null;

          const carBk   = bookings.filter(b=>b.type==="car");
          const tourBk  = bookings.filter(b=>b.type==="tour");
          const carRev  = carBk.filter(b=>b.status==="approved").reduce((s,b)=>s+(+b.total),0);
          const tourRev = tourBk.filter(b=>b.status==="approved").reduce((s,b)=>s+(+b.total),0);

          const listingMap = {};
          bookings.forEach(b => {
            const k = `${b.type}_${b.itemId}`;
            if (!listingMap[k]) listingMap[k] = {type:b.type,itemId:b.itemId,total:0,count:0,approved:0};
            listingMap[k].total += +(b.total)||0;
            listingMap[k].count++;
            if (b.status==="approved") listingMap[k].approved++;
          });
          const topListings = Object.values(listingMap).sort((a,b)=>b.total-a.total).slice(0,5)
            .map(x=>({...x, name:(x.type==="car"?cars:tours).find(i=>i.id===x.itemId)?.name||"Deleted Listing"}));
          const maxTopRev = topListings[0]?.total || 1;
          const vLast6Rev = vMonths.reduce((s,m)=>s+m.revenue,0);

          return (
          <div>
            {/* â"€â"€ Header banner â"€â"€ */}
            <div style={{background:"linear-gradient(135deg,var(--ocean),var(--teal))",borderRadius:16,padding:"1.8rem 2rem",color:"#fff",marginBottom:"1.5rem",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"1rem"}}>
              <div>
                <div style={{fontSize:"0.78rem",fontWeight:700,opacity:.75,textTransform:"uppercase",letterSpacing:".1em",marginBottom:"0.4rem"}}>Booking Analytics</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"2.2rem",fontWeight:700,marginBottom:"0.3rem"}}>{fmtMoney(totalRev)}</div>
                <div style={{opacity:.8,fontSize:"0.88rem"}}>
                  Total revenue from {approvedBk.length} approved booking{approvedBk.length!==1?"s":""}
                  {revTrend!==null && (
                    <span style={{marginLeft:"0.6rem",background:"rgba(255,255,255,0.15)",borderRadius:50,padding:"0.1rem 0.55rem",fontSize:"0.78rem",fontWeight:700}}>
                      {revTrend>=0?"â–²":"â–¼"} {Math.abs(revTrend)}% vs last month
                    </span>
                  )}
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.8rem"}}>
                {[
                  ["Net Earnings",  fmtMoney(netEarnings)],
                  ["Platform Fee",  fmtMoney(platformFee)],
                  ["This Month",    fmtMoney(thisMonthRev)],
                  ["Avg / Booking", fmtMoney(avgBooking)],
                ].map(([l,v])=>(
                  <div key={l} style={{background:"rgba(255,255,255,0.15)",borderRadius:10,padding:"0.65rem 1rem",textAlign:"center",backdropFilter:"blur(4px)"}}>
                    <div style={{fontSize:"0.65rem",fontWeight:700,opacity:.8,textTransform:"uppercase",letterSpacing:".06em"}}>{l}</div>
                    <div style={{fontSize:"1.05rem",fontWeight:700,marginTop:"0.15rem"}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* â"€â"€ Stat cards â"€â"€ */}
            <div className="stats-grid" style={{marginBottom:"1.5rem"}}>
              {[
                {icon:"fa-solid fa-calendar",label:"Total Bookings", val:bookings.length,      sub:`${approvedBk.length} approved · ${pendingBk.length} pending`,    color:"#2563EB"},
                {icon:"fa-solid fa-circle-check",label:"Approval Rate",  val:`${approvalRate}%`,    sub:`${approvedBk.length} of ${bookings.length} bookings`,              color:"#059669"},
                {icon:"fa-solid fa-money-bill-wave",label:"Gross Revenue",  val:fmtMoney(totalRev),    sub:`${serviceFee}% platform fee applied`,                             color:"#D97706"},
                {icon:"fa-solid fa-money-bill",label:"Net Earnings",   val:fmtMoney(netEarnings), sub:`After ${fmtMoney(platformFee)} fee`,                      color:"#059669"},
                {icon:"fa-solid fa-chart-bar",label:"Avg / Booking",  val:fmtMoney(avgBooking),  sub:"Per approved booking",                                            color:"#7C3AED"},
                {icon:"fa-solid fa-hourglass-half",label:"Pending",        val:pendingBk.length,      sub:pendingBk.length>0?"Awaiting your approval":"All up to date",       color:pendingBk.length>0?"#D97706":"#6B7280"},
                {icon:"fa-solid fa-circle-xmark",label:"Cancelled",      val:cancelBk.length,       sub:cancelBk.length>0?`${Math.round(cancelBk.length/bookings.length*100||0)}% cancellation rate`:"No cancellations", color:cancelBk.length>0?"#DC2626":"#6B7280"},
              ].map(({icon,label,val,sub,color})=>(
                <div key={label} className="stat-card" style={{borderTop:`3px solid ${color}`}}>
                  <div className="stat-icon" style={{background:`${color}18`,color}}>{icon.startsWith("fa-") ? <i className={icon}/> : icon}</div>
                  <h3>{label}</h3>
                  <div className="stat-val" style={{color}}>{val}</div>
                  <div className="stat-trend" style={{color:"var(--muted)"}}>{sub}</div>
                </div>
              ))}
            </div>

            {/* â"€â"€ Row 1: Revenue chart + Status donut â"€â"€ */}
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:"1rem",marginBottom:"1rem"}}>
              <div style={CARD}>
                <div style={CTITLE}>Monthly Revenue (Last 6 Months)</div>
                <div style={{fontSize:"1.4rem",fontWeight:800,color:"#111827",marginBottom:"0.2rem"}}>{fmtMoney(vLast6Rev)}</div>
                <div style={{fontSize:"0.72rem",color:"#059669",marginBottom:"0.75rem"}}>
                  <i className="fa-solid fa-arrow-up-right"/> Total approved revenue over last 6 months
                </div>
                <BarChart data={vMonths.map(m=>({label:m.label,value:m.revenue}))} color="#2563EB" valuePrefix="₱" />
              </div>
              <div style={CARD}>
                <div style={CTITLE}>Booking Status</div>
                <div style={{display:"flex",justifyContent:"center",margin:"0.5rem 0 0.8rem"}}>
                  <DonutChart segments={[
                    {label:"Approved",  value:approvedBk.length, color:"#059669"},
                    {label:"Pending",   value:pendingBk.length,  color:"#D97706"},
                    {label:"Cancelled", value:cancelBk.length,   color:"#DC2626"},
                  ]} />
                </div>
                {[["Approved","#059669",approvedBk.length],["Pending","#D97706",pendingBk.length],["Cancelled","#DC2626",cancelBk.length]].map(([l,c,v])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:"0.78rem",padding:"0.22rem 0",borderBottom:"1px solid #F9FAFB"}}>
                    <span style={{display:"flex",alignItems:"center",gap:"0.4rem"}}>
                      <span style={{width:8,height:8,borderRadius:"50%",background:c,display:"inline-block"}}/>
                      <span style={{color:"var(--muted)"}}>{l}</span>
                    </span>
                    <div style={{textAlign:"right"}}>
                      <span style={{fontWeight:700,color:"#111827"}}>{v}</span>
                      {bookings.length>0 && <span style={{color:"var(--muted)",fontSize:"0.7rem",marginLeft:"0.35rem"}}>({Math.round((v/bookings.length)*100)}%)</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* â"€â"€ Row 2: Monthly count chart (full width) â"€â"€ */}
            <div style={{marginBottom:"1rem"}}>
              <div style={CARD}>
                <div style={CTITLE}>Monthly Bookings Count (Last 6 Months)</div>
                <div style={{fontSize:"1.4rem",fontWeight:800,color:"#111827",marginBottom:"0.2rem"}}>{vMonths.reduce((s,m)=>s+m.count,0)}</div>
                <div style={{fontSize:"0.72rem",color:"var(--muted)",marginBottom:"0.75rem"}}>Total bookings over last 6 months</div>
                <BarChart data={vMonths.map(m=>({label:m.label,value:m.count}))} color="#7C3AED" />
              </div>
            </div>

            {/* â"€â"€ Row 3: Revenue by Listing Type â"€â"€ */}
            <div style={{marginBottom:"1rem"}}>
              <div style={CARD}>
                <div style={CTITLE}>Revenue by Listing Type</div>
                {/* Total */}
                <div style={{marginBottom:"1rem"}}>
                  <div style={{fontSize:"1.7rem",fontWeight:800,color:"#111827",lineHeight:1}}>{fmtMoney(carRev+tourRev)}</div>
                  <div style={{fontSize:"0.72rem",color:"var(--muted)",marginTop:"0.25rem"}}>Total approved revenue · {carBk.length+tourBk.length} bookings</div>
                </div>
                {/* Split bar */}
                <div style={{height:8,borderRadius:50,overflow:"hidden",display:"flex",marginBottom:"1.2rem",background:"#F3F4F6"}}>
                  {(carRev+tourRev)>0 ? <>
                    <div style={{width:`${Math.round((carRev/(carRev+tourRev))*100)}%`,background:"#2563EB",transition:"width .5s"}}/>
                    <div style={{flex:1,background:"#059669"}}/>
                  </> : <div style={{flex:1,background:"#E5E7EB"}}/>}
                </div>
                {/* Two panels */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
                  {[
                    ["fa-solid fa-car","Car Rental","#2563EB","#EFF6FF","#BFDBFE",carRev,carBk.length],
                    ["fa-solid fa-map","Tour Packages","#059669","#F0FDF4","#A7F3D0",tourRev,tourBk.length],
                  ].map(([icon,label,color,bg,border,rev,cnt])=>(
                    <div key={label} style={{background:bg,border:`1.5px solid ${border}`,borderRadius:12,padding:"1rem 1.1rem",borderTop:`3px solid ${color}`}}>
                      <div style={{fontSize:"1.5rem",marginBottom:"0.4rem"}}>{icon.startsWith("fa-") ? <i className={icon}/> : icon}</div>
                      <div style={{fontSize:"0.7rem",fontWeight:700,color:color,textTransform:"uppercase",letterSpacing:".07em",marginBottom:"0.3rem"}}>{label}</div>
                      <div style={{fontSize:"1.4rem",fontWeight:800,color:"#111827",lineHeight:1}}>{fmtMoney(rev)}</div>
                      <div style={{fontSize:"0.75rem",color:"var(--muted)",marginTop:"0.3rem"}}>{cnt} booking{cnt!==1?"s":""}</div>
                      {(carRev+tourRev)>0 && (
                        <div style={{marginTop:"0.75rem"}}>
                          <div style={{height:5,borderRadius:50,background:"rgba(0,0,0,0.08)"}}>
                            <div style={{width:`${Math.round((rev/(carRev+tourRev))*100)}%`,height:"100%",background:color,borderRadius:50,transition:"width .5s"}}/>
                          </div>
                          <div style={{fontSize:"0.7rem",color:color,fontWeight:700,marginTop:"0.3rem"}}>{Math.round((rev/(carRev+tourRev))*100)}% of revenue</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* â"€â"€ Earnings breakdown â"€â"€ */}
            <div style={{...CARD,marginBottom:"1rem"}}>
              <div style={CTITLE}>Earnings Breakdown</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"1rem",marginBottom:"0.9rem"}}>
                {[
                  ["Gross Revenue",  totalRev,    "#2563EB", "Total charged to customers"],
                  ["Platform Fee",   platformFee, "#DC2626", `${serviceFee}% deducted by platform`],
                  ["Net Earnings",   netEarnings, "#059669", "Your actual take-home"],
                ].map(([l,v,c,desc])=>(
                  <div key={l} style={{background:"#F9FAFB",borderRadius:12,padding:"1rem 1.1rem",borderLeft:`3px solid ${c}`}}>
                    <div style={{fontSize:"0.7rem",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:"0.3rem"}}>{l}</div>
                    <div style={{fontSize:"1.3rem",fontWeight:800,color:c,marginBottom:"0.2rem"}}>{fmtMoney(v)}</div>
                    <div style={{fontSize:"0.72rem",color:"var(--muted)"}}>{desc}</div>
                  </div>
                ))}
              </div>
              {totalRev>0 && (
                <>
                  <div style={{height:10,borderRadius:50,overflow:"hidden",display:"flex",marginBottom:"0.5rem"}}>
                    <div style={{width:`${(netEarnings/totalRev)*100}%`,background:"#059669",transition:"width .4s"}}/>
                    <div style={{flex:1,background:"#DC2626"}}/>
                  </div>
                  <div style={{display:"flex",gap:"1.2rem",fontSize:"0.72rem",color:"var(--muted)"}}>
                    <span style={{display:"flex",alignItems:"center",gap:"0.35rem"}}><span style={{width:8,height:8,borderRadius:"50%",background:"#059669",display:"inline-block"}}/> Net {Math.round((netEarnings/totalRev)*100)}%</span>
                    <span style={{display:"flex",alignItems:"center",gap:"0.35rem"}}><span style={{width:8,height:8,borderRadius:"50%",background:"#DC2626",display:"inline-block"}}/> Platform Fee {Math.round((platformFee/totalRev)*100)}%</span>
                  </div>
                </>
              )}
            </div>

            {/* â"€â"€ Top listings â"€â"€ */}
            {topListings.length>0 && (
              <div style={CARD}>
                <div style={CTITLE}>Top Listings by Revenue</div>
                <div style={{display:"flex",flexDirection:"column",gap:"0.7rem"}}>
                  {topListings.map((l,idx)=>(
                    <div key={idx} style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
                      <div style={{width:26,height:26,borderRadius:8,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.72rem",fontWeight:800,
                        background: idx===0?"#FEF9C3":idx===1?"#F3F4F6":idx===2?"#FEF0E7":"#F9FAFB",
                        color:      idx===0?"#D97706":idx===1?"#6B7280":idx===2?"#C2410C":"#9CA3AF"}}>
                        #{idx+1}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:"0.82rem",fontWeight:600,color:"#111827",marginBottom:4}}>{l.type==="car" ? <i className="fa-solid fa-car"/> : <i className="fa-solid fa-map"/>} {l.name}</div>
                        <div style={{height:6,background:"#F3F4F6",borderRadius:50}}>
                          <div style={{width:`${(l.total/maxTopRev)*100}%`,height:"100%",background:l.type==="car"?"#2563EB":"#059669",borderRadius:50,transition:"width .4s"}}/>
                        </div>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0,minWidth:90}}>
                        <div style={{fontSize:"0.88rem",fontWeight:800,color:l.type==="car"?"#2563EB":"#059669"}}>{fmtMoney(l.total)}</div>
                        <div style={{fontSize:"0.7rem",color:"var(--muted)"}}>{l.count} bk · {l.approved} appr.</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          );
        })()}

        {section === "listings" && (
          <div style={{display:"grid",gap:"2rem"}}>

            {/* â"€â"€ Delete listing confirm modal â"€â"€ */}
            {deleteListingConfirm && (
              <div className="overlay" onClick={() => setDeleteListingConfirm(null)} style={{zIndex:400}}>
                <div onClick={e => e.stopPropagation()} style={{
                  background:"#fff",borderRadius:20,width:"100%",maxWidth:420,
                  padding:"2rem",textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"
                }}>
                  <div style={{fontSize:"3rem",marginBottom:"1rem"}}><i className="fa-solid fa-trash"/></div>
                  <h3 style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,marginBottom:"0.5rem"}}>Remove Listing?</h3>
                  <p style={{color:"var(--muted)",fontSize:"0.9rem",lineHeight:1.7,marginBottom:"1.5rem"}}>
                    Permanently remove <strong>{deleteListingConfirm.name}</strong>? This cannot be undone.
                  </p>
                  <div style={{display:"flex",gap:"0.8rem"}}>
                    <button onClick={() => {
                      if (deleteListingConfirm.type==="car") deleteCar(deleteListingConfirm.id);
                      else deleteTour(deleteListingConfirm.id);
                      setDeleteListingConfirm(null);
                    }} style={{flex:1,background:"var(--danger)",color:"#fff",border:"none",padding:"0.85rem",borderRadius:12,cursor:"pointer",fontWeight:700}}>
                      Yes, Remove
                    </button>
                    <button onClick={() => setDeleteListingConfirm(null)}
                      style={{flex:1,background:"#F3F4F6",color:"var(--ink)",border:"none",padding:"0.85rem",borderRadius:12,cursor:"pointer",fontWeight:700}}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* â"€â"€ Edit listing modal â"€â"€ */}
            {editItem && (
              <div className="overlay" onClick={() => setEditItem(null)} style={{zIndex:400}}>
                <div onClick={e => e.stopPropagation()} style={{
                  background:"#fff",borderRadius:20,width:"100%",maxWidth:600,
                  maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"
                }}>
                  <div style={{background:"linear-gradient(135deg,var(--ocean),var(--teal))",padding:"1.3rem 1.8rem",borderRadius:"20px 20px 0 0",color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:"1rem"}}><i className="fa-solid fa-pen"/> Edit {editItem.type === "car" ? "Car" : "Tour"}</div>
                      <div style={{fontSize:"0.82rem",opacity:.8}}>{editItem.data.name}</div>
                    </div>
                    <button onClick={() => setEditItem(null)} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:8,padding:"0.4rem 0.8rem",cursor:"pointer",color:"#fff",fontWeight:700}}>✕</button>
                  </div>
                  <div style={{padding:"1.8rem"}}>
                    <div className="form-grid">
                      {editItem.type === "car" ? (<>
                        {[["name","Vehicle Name *"],["location","Location *"],["price","Price per Day (₱) *"],["seats","Seats"]].map(([k,lbl]) => (
                          <div key={k} className="form-group">
                            <label>{lbl}</label>
                            <input value={editItem.data[k]||""} onChange={e => setEditItem(ei=>({...ei,data:{...ei.data,[k]:e.target.value}}))} />
                          </div>
                        ))}
                        <div className="form-group">
                          <label>Vehicle Type</label>
                          <select value={editItem.data.type||"Van"} onChange={e=>setEditItem(ei=>({...ei,data:{...ei.data,type:e.target.value}}))}>
                            {["Van","SUV","Sedan","MPV","Jeepney","Truck"].map(t=><option key={t}>{t}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Fuel Type</label>
                          <select value={editItem.data.fuel||"Diesel"} onChange={e=>setEditItem(ei=>({...ei,data:{...ei.data,fuel:e.target.value}}))}>
                            <option>Diesel</option><option>Gasoline</option><option>Electric</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Transmission</label>
                          <select value={editItem.data.transmission||"Manual"} onChange={e=>setEditItem(ei=>({...ei,data:{...ei.data,transmission:e.target.value}}))}>
                            <option>Manual</option><option>Automatic</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Color</label>
                          <input value={editItem.data.color||""} onChange={e=>setEditItem(ei=>({...ei,data:{...ei.data,color:e.target.value}}))} placeholder="e.g. Pearl White" />
                        </div>
                        <div className="form-group">
                          <label>Year</label>
                          <input type="number" min="1990" max="2030" value={editItem.data.year||""} onChange={e=>setEditItem(ei=>({...ei,data:{...ei.data,year:e.target.value}}))} placeholder="e.g. 2022" />
                        </div>
                        <div className="form-group">
                          <label>With Driver</label>
                          <div style={{display:"flex",alignItems:"center",gap:"0.75rem",marginTop:"0.35rem"}}>
                            <button type="button"
                              onClick={()=>setEditItem(ei=>({...ei,data:{...ei.data,withDriver:!ei.data.withDriver}}))}
                              style={{width:44,height:24,borderRadius:12,border:"none",cursor:"pointer",background:editItem.data.withDriver?"var(--ocean)":"#D1D5DB",position:"relative",transition:"background 0.2s",flexShrink:0}}>
                              <span style={{position:"absolute",top:2,left:editItem.data.withDriver?22:2,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
                            </button>
                            <span style={{fontSize:"0.88rem",color:editItem.data.withDriver?"var(--ocean)":"var(--muted)",fontWeight:600}}>
                              {editItem.data.withDriver?"Yes — driver included":"No — self-drive"}
                            </span>
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Availability</label>
                          <select value={editItem.data.available?"available":"unavailable"} onChange={e=>setEditItem(ei=>({...ei,data:{...ei.data,available:e.target.value==="available"}}))}>
                            <option value="available">Available</option>
                            <option value="unavailable">Unavailable</option>
                          </select>
                        </div>
                        <div className="form-group full">
                          <label>Package Details</label>
                          <div style={{display:"flex",gap:"0.5rem",marginBottom:"0.5rem"}}>
                            <input value={editCarFeatureInput} onChange={e=>setEditCarFeatureInput(e.target.value)}
                              onKeyDown={e=>{if(e.key==="Enter"&&editCarFeatureInput.trim()){e.preventDefault();setEditItem(ei=>({...ei,data:{...ei.data,features:[...(ei.data.features||[]),editCarFeatureInput.trim()]}}));setEditCarFeatureInput("");}}}
                              placeholder="e.g. Free Fuel, Toll Fees Included"
                              style={{flex:1,border:"1.5px solid #E5E7EB",borderRadius:8,padding:"0.45rem 0.75rem",fontSize:"0.85rem",fontFamily:"inherit",outline:"none"}} />
                            <button type="button"
                              onClick={()=>{if(editCarFeatureInput.trim()){setEditItem(ei=>({...ei,data:{...ei.data,features:[...(ei.data.features||[]),editCarFeatureInput.trim()]}}));setEditCarFeatureInput("");}}}
                              style={{background:"#059669",color:"#fff",border:"none",borderRadius:8,padding:"0.45rem 1rem",cursor:"pointer",fontWeight:700,fontSize:"0.85rem",whiteSpace:"nowrap"}}>
                              <i className="fa-solid fa-plus"/> Add
                            </button>
                          </div>
                          {(editItem.data.features||[]).length > 0 && (
                            <ul style={{margin:0,padding:0,listStyle:"none",display:"flex",flexDirection:"column",gap:"0.3rem"}}>
                              {(editItem.data.features||[]).map((f,i) => (
                                <li key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:8,padding:"0.45rem 0.75rem",fontSize:"0.88rem"}}>
                                  <span style={{display:"flex",alignItems:"center",gap:"0.5rem",color:"#166534"}}>
                                    <i className="fa-solid fa-circle-dot" style={{fontSize:"0.5rem",color:"#059669"}}/>
                                    {f}
                                  </span>
                                  <button type="button" onClick={()=>setEditItem(ei=>({...ei,data:{...ei.data,features:ei.data.features.filter((_,j)=>j!==i)}}))}
                                    style={{background:"none",border:"none",cursor:"pointer",color:"#86EFAC",fontSize:"0.8rem",padding:"0 0.2rem",lineHeight:1}}>
                                    <i className="fa-solid fa-xmark"/>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="form-group full">
                          <ImageUploader images={editItem.data.images||[]} onChange={imgs=>setEditItem(ei=>({...ei,data:{...ei.data,images:imgs,image:imgs[0]||""}}))} maxImages={3} />
                        </div>
                        <div className="form-group full">
                          <label>Description</label>
                          <textarea value={editItem.data.description||""} onChange={e=>setEditItem(ei=>({...ei,data:{...ei.data,description:e.target.value}}))} />
                        </div>
                      </>) : (<>
                        {[["name","Tour Name *"],["location","Location *"],["price","Price per Person (₱) *"],["groupSize","Max Group Size"]].map(([k,lbl]) => (
                          <div key={k} className="form-group">
                            <label>{lbl}</label>
                            <input value={editItem.data[k]||""} onChange={e=>setEditItem(ei=>({...ei,data:{...ei.data,[k]:e.target.value}}))} />
                          </div>
                        ))}
                        <div className="form-group">
                          <label>Category</label>
                          <select value={editItem.data.category||"Island Tour"} onChange={e=>setEditItem(ei=>({...ei,data:{...ei.data,category:e.target.value}}))}>
                            {["Island Tour","Cultural Tour","Adventure Tour","Trekking","Food Tour"].map(c=><option key={c}>{c}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Duration</label>
                          <select value={editItem.data.duration||"1 Day"} onChange={e=>setEditItem(ei=>({...ei,data:{...ei.data,duration:e.target.value}}))}>
                            {["Half Day","1 Day","2 Days","3 Days","4 Days","1 Week"].map(d=><option key={d}>{d}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Availability</label>
                          <select value={editItem.data.available?"available":"unavailable"} onChange={e=>setEditItem(ei=>({...ei,data:{...ei.data,available:e.target.value==="available"}}))}>
                            <option value="available">Available</option>
                            <option value="unavailable">Unavailable</option>
                          </select>
                        </div>
                        <div className="form-group full">
                          <label>Meeting Point</label>
                          <input value={editItem.data.meetingPoint||""} onChange={e=>setEditItem(ei=>({...ei,data:{...ei.data,meetingPoint:e.target.value}}))} placeholder="e.g. SM City Cebu Parking, North Bus Terminal" />
                        </div>
                        <div className="form-group full">
                          <label>What's Included</label>
                          <div style={{display:"flex",gap:"0.5rem",marginBottom:"0.5rem"}}>
                            <input value={editTourIncludeInput} onChange={e=>setEditTourIncludeInput(e.target.value)}
                              onKeyDown={e=>{if(e.key==="Enter"&&editTourIncludeInput.trim()){e.preventDefault();setEditItem(ei=>({...ei,data:{...ei.data,includes:[...(ei.data.includes||[]),editTourIncludeInput.trim()]}}));setEditTourIncludeInput("");}}}
                              placeholder="e.g. Tour Guide, Meals, Snorkel Gear"
                              style={{flex:1,border:"1.5px solid #E5E7EB",borderRadius:8,padding:"0.45rem 0.75rem",fontSize:"0.85rem",fontFamily:"inherit",outline:"none"}} />
                            <button type="button"
                              onClick={()=>{if(editTourIncludeInput.trim()){setEditItem(ei=>({...ei,data:{...ei.data,includes:[...(ei.data.includes||[]),editTourIncludeInput.trim()]}}));setEditTourIncludeInput("");}}}
                              style={{background:"#059669",color:"#fff",border:"none",borderRadius:8,padding:"0.45rem 1rem",cursor:"pointer",fontWeight:700,fontSize:"0.85rem",whiteSpace:"nowrap"}}>
                              <i className="fa-solid fa-plus"/> Add
                            </button>
                          </div>
                          {(editItem.data.includes||[]).length > 0 && (
                            <ul style={{margin:0,padding:0,listStyle:"none",display:"flex",flexDirection:"column",gap:"0.3rem"}}>
                              {(editItem.data.includes||[]).map((inc,i) => (
                                <li key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:8,padding:"0.45rem 0.75rem",fontSize:"0.88rem"}}>
                                  <span style={{display:"flex",alignItems:"center",gap:"0.5rem",color:"#166534"}}>
                                    <i className="fa-solid fa-circle-dot" style={{fontSize:"0.5rem",color:"#059669"}}/>
                                    {inc}
                                  </span>
                                  <button type="button" onClick={()=>setEditItem(ei=>({...ei,data:{...ei.data,includes:ei.data.includes.filter((_,j)=>j!==i)}}))}
                                    style={{background:"none",border:"none",cursor:"pointer",color:"#86EFAC",fontSize:"0.8rem",padding:"0 0.2rem",lineHeight:1}}>
                                    <i className="fa-solid fa-xmark"/>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="form-group full">
                          <ImageUploader images={editItem.data.images||[]} onChange={imgs=>setEditItem(ei=>({...ei,data:{...ei.data,images:imgs,image:imgs[0]||""}}))} maxImages={3} />
                        </div>
                        <div className="form-group full">
                          <label>Description</label>
                          <textarea value={editItem.data.description||""} onChange={e=>setEditItem(ei=>({...ei,data:{...ei.data,description:e.target.value}}))} />
                        </div>
                      </>)}
                    </div>
                    <div style={{display:"flex",gap:"0.8rem",marginTop:"1.5rem"}}>
                      <button onClick={() => {
                        if (editItem.type==="car") updateCar(editItem.data.id, { ...editItem.data, price: +editItem.data.price, seats: +editItem.data.seats, year: +editItem.data.year || null });
                        else updateTour(editItem.data.id, { ...editItem.data, price: +editItem.data.price, groupSize: +editItem.data.groupSize });
                        setEditItem(null);
                      }} style={{flex:2,background:"var(--ocean)",color:"#fff",border:"none",padding:"0.9rem",borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:"0.95rem"}}>
                        <i className="fa-solid fa-floppy-disk"/> Save Changes
                      </button>
                      <button onClick={() => setEditItem(null)}
                        style={{flex:1,background:"#F3F4F6",color:"var(--ink)",border:"none",padding:"0.9rem",borderRadius:12,cursor:"pointer",fontWeight:700}}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* â"€â"€ Cars table â"€â"€ */}
            <div className="table-wrap">
              <div className="table-header">
                <h3>My Cars ({cars.length})</h3>
                <button className="action-btn approve" onClick={() => { setSection("add"); setAddType("car"); }} data-tip="Add New Car Listing"><i className="fa-solid fa-plus"/> Add Car</button>
              </div>
              {cars.length === 0 ? (
                <div className="empty-state"><div className="empty-icon"><i className="fa-solid fa-car"/></div><p>No cars listed yet.</p></div>
              ) : (
                <table>
                  <thead><tr><th>Name</th><th>Type</th><th>Location</th><th>Price/day</th><th>Seats</th><th>Fuel</th><th>Availability</th><th>Actions</th></tr></thead>
                  <tbody>
                    {cars.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.name}</strong></td>
                        <td><span className="tag" style={{fontSize:"0.72rem"}}>{c.type}</span></td>
                        <td style={{fontSize:"0.85rem"}}>{c.location}</td>
                        <td><strong>{fmtPeso(c.price)}</strong></td>
                        <td>{c.seats}</td>
                        <td style={{fontSize:"0.82rem"}}>{c.fuel}</td>
                        <td>
                          <button
                            onClick={() => { updateCar(c.id, { available: !c.available }); showToast(`${c.name} marked as ${!c.available ? "Active" : "Inactive"}.`); }}
                            title={c.available ? "Click to set Inactive" : "Click to set Active"}
                            style={{
                              display:"inline-flex", alignItems:"center", gap:"0.4rem",
                              background: c.available ? "#DCFCE7" : "#F3F4F6",
                              color: c.available ? "#15803D" : "#6B7280",
                              border: `1.5px solid ${c.available ? "#86EFAC" : "#D1D5DB"}`,
                              borderRadius:50, padding:"0.28rem 0.75rem 0.28rem 0.45rem",
                              cursor:"pointer", fontWeight:700, fontSize:"0.78rem",
                              transition:"all 0.18s ease", whiteSpace:"nowrap",
                            }}>
                            <span style={{
                              width:10, height:10, borderRadius:"50%", flexShrink:0,
                              background: c.available ? "#16A34A" : "#9CA3AF",
                              boxShadow: c.available ? "0 0 0 2px #BBF7D0" : "none",
                              transition:"background 0.18s",
                            }}/>
                            {c.available ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td>
                          <div style={{display:"flex",gap:"0.4rem"}}>
                            <button className="action-btn edit" data-tip="Edit Listing"
                              onClick={() => setEditItem({ type:"car", data:{...c} })}>
                              <i className="fa-solid fa-pen"/> Edit
                            </button>
                            <button className="action-btn delete" data-tip="Delete"
                              onClick={() => setDeleteListingConfirm({ type:"car", id:c.id, name:c.name })}>
                              <i className="fa-solid fa-trash"/> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* â"€â"€ Tours table â"€â"€ */}
            <div className="table-wrap">
              <div className="table-header">
                <h3>My Tours ({tours.length})</h3>
                <button className="action-btn approve" onClick={() => { setSection("add"); setAddType("tour"); }} data-tip="Add New Tour Listing"><i className="fa-solid fa-plus"/> Add Tour</button>
              </div>
              {tours.length === 0 ? (
                <div className="empty-state"><div className="empty-icon"><i className="fa-solid fa-map"/></div><p>No tours listed yet.</p></div>
              ) : (
                <table>
                  <thead><tr><th>Name</th><th>Category</th><th>Location</th><th>Price/pax</th><th>Duration</th><th>Max</th><th>Availability</th><th>Actions</th></tr></thead>
                  <tbody>
                    {tours.map(t => (
                      <tr key={t.id}>
                        <td><strong style={{fontSize:"0.88rem"}}>{t.name}</strong></td>
                        <td><span className="tag" style={{fontSize:"0.72rem"}}>{t.category}</span></td>
                        <td style={{fontSize:"0.85rem"}}>{t.location}</td>
                        <td><strong>{fmtPeso(t.price)}</strong></td>
                        <td style={{fontSize:"0.85rem"}}>{t.duration}</td>
                        <td>{t.groupSize}</td>
                        <td>
                          <button
                            onClick={() => { updateTour(t.id, { available: !t.available }); showToast(`${t.name} marked as ${!t.available ? "Active" : "Inactive"}.`); }}
                            title={t.available ? "Click to set Inactive" : "Click to set Active"}
                            style={{
                              display:"inline-flex", alignItems:"center", gap:"0.4rem",
                              background: t.available ? "#DCFCE7" : "#F3F4F6",
                              color: t.available ? "#15803D" : "#6B7280",
                              border: `1.5px solid ${t.available ? "#86EFAC" : "#D1D5DB"}`,
                              borderRadius:50, padding:"0.28rem 0.75rem 0.28rem 0.45rem",
                              cursor:"pointer", fontWeight:700, fontSize:"0.78rem",
                              transition:"all 0.18s ease", whiteSpace:"nowrap",
                            }}>
                            <span style={{
                              width:10, height:10, borderRadius:"50%", flexShrink:0,
                              background: t.available ? "#16A34A" : "#9CA3AF",
                              boxShadow: t.available ? "0 0 0 2px #BBF7D0" : "none",
                              transition:"background 0.18s",
                            }}/>
                            {t.available ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td>
                          <div style={{display:"flex",gap:"0.4rem"}}>
                            <button className="action-btn edit" data-tip="Edit Listing"
                              onClick={() => setEditItem({ type:"tour", data:{...t} })}>
                              <i className="fa-solid fa-pen"/> Edit
                            </button>
                            <button className="action-btn delete" data-tip="Delete"
                              onClick={() => setDeleteListingConfirm({ type:"tour", id:t.id, name:t.name })}>
                              <i className="fa-solid fa-trash"/> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {section === "add" && (
          <div>
            <div className="tabs">
              <div className={`tab ${addType === "car" ? "active" : ""}`} onClick={() => setAddType("car")}><i className="fa-solid fa-car"/> Add Car</div>
              <div className={`tab ${addType === "tour" ? "active" : ""}`} onClick={() => setAddType("tour")}><i className="fa-solid fa-map"/> Add Tour</div>
            </div>

            {addType === "car" && (
              <div className="add-listing-form">
                <h3>Add New Car Listing</h3>
                <div className="form-grid">
                  {[["name","Vehicle Name *","Toyota HiAce"],["location","Location *","Cebu City"],["price","Price per Day (₱) *","2500"],["seats","Seats *","8"]].map(([k,label,ph]) => (
                    <div key={k} className="form-group">
                      <label>{label}</label>
                      <input value={newCar[k]} onChange={e => setNewCar({...newCar,[k]:e.target.value})} placeholder={ph} />
                    </div>
                  ))}
                  <div className="form-group">
                    <label>Vehicle Type</label>
                    <select value={newCar.type} onChange={e => setNewCar({...newCar,type:e.target.value})}>
                      {["Van","SUV","Sedan","MPV","Jeepney","Truck"].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Fuel Type</label>
                    <select value={newCar.fuel} onChange={e => setNewCar({...newCar,fuel:e.target.value})}>
                      <option>Diesel</option><option>Gasoline</option><option>Electric</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Transmission</label>
                    <select value={newCar.transmission} onChange={e => setNewCar({...newCar,transmission:e.target.value})}>
                      <option>Manual</option><option>Automatic</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Mileage (km)</label>
                    <input value={newCar.mileage} onChange={e => setNewCar({...newCar,mileage:e.target.value})} placeholder="e.g. 45000" type="number" min="0" />
                  </div>
                  <div className="form-group">
                    <label>Color</label>
                    <input value={newCar.color} onChange={e => setNewCar({...newCar,color:e.target.value})} placeholder="e.g. Pearl White" />
                  </div>
                  <div className="form-group">
                    <label>Year</label>
                    <input value={newCar.year} onChange={e => setNewCar({...newCar,year:e.target.value})} placeholder="e.g. 2022" type="number" min="1990" max="2030" />
                  </div>
                  <div className="form-group">
                    <label>With Driver</label>
                    <div style={{display:"flex",alignItems:"center",gap:"0.75rem",marginTop:"0.35rem"}}>
                      <button type="button"
                        onClick={() => setNewCar({...newCar,withDriver:!newCar.withDriver})}
                        style={{
                          width:44, height:24, borderRadius:12, border:"none", cursor:"pointer",
                          background: newCar.withDriver ? "var(--ocean)" : "#D1D5DB",
                          position:"relative", transition:"background 0.2s", flexShrink:0,
                        }}>
                        <span style={{
                          position:"absolute", top:2, left: newCar.withDriver ? 22 : 2,
                          width:20, height:20, borderRadius:"50%", background:"#fff",
                          transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)",
                        }}/>
                      </button>
                      <span style={{fontSize:"0.88rem",color: newCar.withDriver ? "var(--ocean)" : "var(--muted)",fontWeight:600}}>
                        {newCar.withDriver ? "Yes — driver included" : "No — self-drive"}
                      </span>
                    </div>
                  </div>
                  <div className="form-group full">
                    <label>Package Details</label>
                    <div style={{display:"flex",gap:"0.5rem",marginBottom:"0.5rem"}}>
                      <input value={carFeatureInput} onChange={e=>setCarFeatureInput(e.target.value)}
                        onKeyDown={e=>{if(e.key==="Enter"&&carFeatureInput.trim()){e.preventDefault();setNewCar({...newCar,features:[...(newCar.features||[]),carFeatureInput.trim()]});setCarFeatureInput("");}}}
                        placeholder="e.g. Free Fuel, Toll Fees Included"
                        style={{flex:1,border:"1.5px solid #E5E7EB",borderRadius:8,padding:"0.45rem 0.75rem",fontSize:"0.85rem",fontFamily:"inherit",outline:"none"}} />
                      <button type="button"
                        onClick={()=>{if(carFeatureInput.trim()){setNewCar({...newCar,features:[...(newCar.features||[]),carFeatureInput.trim()]});setCarFeatureInput("");}}}
                        style={{background:"#059669",color:"#fff",border:"none",borderRadius:8,padding:"0.45rem 1rem",cursor:"pointer",fontWeight:700,fontSize:"0.85rem",whiteSpace:"nowrap"}}>
                        <i className="fa-solid fa-plus"/> Add
                      </button>
                    </div>
                    {(newCar.features||[]).length > 0 && (
                      <ul style={{margin:0,padding:0,listStyle:"none",display:"flex",flexDirection:"column",gap:"0.3rem"}}>
                        {(newCar.features||[]).map((f,i) => (
                          <li key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:8,padding:"0.45rem 0.75rem",fontSize:"0.88rem"}}>
                            <span style={{display:"flex",alignItems:"center",gap:"0.5rem",color:"#166534"}}>
                              <i className="fa-solid fa-circle-dot" style={{fontSize:"0.5rem",color:"#059669"}}/>
                              {f}
                            </span>
                            <button type="button" onClick={() => setNewCar({...newCar,features:newCar.features.filter((_,j)=>j!==i)})}
                              style={{background:"none",border:"none",cursor:"pointer",color:"#86EFAC",fontSize:"0.8rem",padding:"0 0.2rem",lineHeight:1}}>
                              <i className="fa-solid fa-xmark"/>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="form-group full">
                    <ImageUploader images={newCar.images||[]} onChange={imgs=>setNewCar({...newCar,images:imgs})} maxImages={3} />
                  </div>
                  <div className="form-group full">
                    <label>Description</label>
                    <textarea value={newCar.description} onChange={e => setNewCar({...newCar,description:e.target.value})} placeholder="Describe the vehicle, condition, pickup instructions..." />
                  </div>
                </div>
                <button className="submit-btn" onClick={handleAddCar}><i className="fa-solid fa-plus"/> Add Car Listing</button>
              </div>
            )}

            {addType === "tour" && (
              <div className="add-listing-form">
                <h3>Add New Tour Package</h3>
                <div className="form-grid">
                  {[["name","Tour Name *","Kalanggaman Island Tour"],["location","Location *","Palompon, Cebu"],["price","Price per Person (₱) *","1500"],["groupSize","Max Group Size *","15"]].map(([k,label,ph]) => (
                    <div key={k} className="form-group">
                      <label>{label}</label>
                      <input value={newTour[k]} onChange={e => setNewTour({...newTour,[k]:e.target.value})} placeholder={ph} />
                    </div>
                  ))}
                  <div className="form-group">
                    <label>Category</label>
                    <select value={newTour.category} onChange={e => setNewTour({...newTour,category:e.target.value})}>
                      {["Island Tour","Cultural Tour","Adventure Tour","Trekking","Food Tour","City Tour","Diving"].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Duration</label>
                    <select value={newTour.duration} onChange={e => setNewTour({...newTour,duration:e.target.value})}>
                      {["Half Day","1 Day","2 Days","3 Days","4 Days","1 Week"].map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group full">
                    <label>Meeting Point</label>
                    <input value={newTour.meetingPoint} onChange={e => setNewTour({...newTour,meetingPoint:e.target.value})} placeholder="e.g. SM City Cebu Parking, North Bus Terminal" />
                  </div>
                  <div className="form-group full">
                    <label>What's Included</label>
                    <div style={{display:"flex",gap:"0.5rem",marginBottom:"0.5rem"}}>
                      <input value={tourIncludeInput} onChange={e=>setTourIncludeInput(e.target.value)}
                        onKeyDown={e=>{if(e.key==="Enter"&&tourIncludeInput.trim()){e.preventDefault();setNewTour({...newTour,includes:[...(newTour.includes||[]),tourIncludeInput.trim()]});setTourIncludeInput("");}}}
                        placeholder="e.g. Tour Guide, Meals, Snorkel Gear"
                        style={{flex:1,border:"1.5px solid #E5E7EB",borderRadius:8,padding:"0.45rem 0.75rem",fontSize:"0.85rem",fontFamily:"inherit",outline:"none"}} />
                      <button type="button"
                        onClick={()=>{if(tourIncludeInput.trim()){setNewTour({...newTour,includes:[...(newTour.includes||[]),tourIncludeInput.trim()]});setTourIncludeInput("");}}}
                        style={{background:"#059669",color:"#fff",border:"none",borderRadius:8,padding:"0.45rem 1rem",cursor:"pointer",fontWeight:700,fontSize:"0.85rem",whiteSpace:"nowrap"}}>
                        <i className="fa-solid fa-plus"/> Add
                      </button>
                    </div>
                    {(newTour.includes||[]).length > 0 && (
                      <ul style={{margin:0,padding:0,listStyle:"none",display:"flex",flexDirection:"column",gap:"0.3rem"}}>
                        {(newTour.includes||[]).map((inc,i) => (
                          <li key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:8,padding:"0.45rem 0.75rem",fontSize:"0.88rem"}}>
                            <span style={{display:"flex",alignItems:"center",gap:"0.5rem",color:"#166534"}}>
                              <i className="fa-solid fa-circle-dot" style={{fontSize:"0.5rem",color:"#059669"}}/>
                              {inc}
                            </span>
                            <button type="button" onClick={() => setNewTour({...newTour,includes:newTour.includes.filter((_,j)=>j!==i)})}
                              style={{background:"none",border:"none",cursor:"pointer",color:"#86EFAC",fontSize:"0.8rem",padding:"0 0.2rem",lineHeight:1}}>
                              <i className="fa-solid fa-xmark"/>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="form-group full">
                    <ImageUploader images={newTour.images||[]} onChange={imgs=>setNewTour({...newTour,images:imgs})} maxImages={3} />
                  </div>
                  <div className="form-group full">
                    <label>Description</label>
                    <textarea value={newTour.description} onChange={e => setNewTour({...newTour,description:e.target.value})} placeholder="Describe the tour experience, highlights, what to bring..." />
                  </div>
                </div>
                <button className="submit-btn" onClick={handleAddTour}><i className="fa-solid fa-plus"/> Add Tour Listing</button>
              </div>
            )}
          </div>
        )}
        {section === "profile" && (
          <div style={{maxWidth:680}}>
            <div style={{background:"#fff",borderRadius:16,border:"1px solid var(--border)",overflow:"hidden",marginBottom:"1.5rem"}}>
              <div style={{background:"linear-gradient(135deg,var(--ocean),var(--teal))",padding:"1.8rem 2rem",color:"#fff",display:"flex",gap:"1.2rem",alignItems:"center"}}>
                <div style={{width:64,height:64,borderRadius:"50%",overflow:"hidden",flexShrink:0,border:"3px solid rgba(255,255,255,0.5)"}}>
                  {user.profilePhoto
                    ? <img src={user.profilePhoto} alt="Profile" style={{width:"100%",height:"100%",objectFit:"cover"}} />
                    : <div style={{width:"100%",height:"100%",background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.8rem"}}>{user.avatar||<i className="fa-solid fa-store"/>}</div>
                  }
                </div>
                <div style={{flex:1}}>
                  <h2 style={{fontSize:"1.4rem",marginBottom:"0.2rem"}}>{user.name}</h2>
                  <p style={{opacity:.8,fontSize:"0.85rem"}}>{user.company || "Vendor Account"} · {user.email}</p>
                </div>
                <button onClick={() => setShowEditProfile(true)}
                  style={{background:"rgba(255,255,255,0.2)",border:"2px solid rgba(255,255,255,0.5)",color:"#fff",padding:"0.6rem 1.2rem",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.88rem"}}>
                  <i className="fa-solid fa-pen"/> Edit Profile
                </button>
              </div>
              <div style={{padding:"1.5rem 2rem"}}>
                <div style={{marginBottom:"1rem",fontSize:"0.75rem",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".08em"}}>Personal Information</div>
                {[
                  ["Full Name",      user.name],
                  ["Email",          user.email],
                  ["Phone",          user.phone    || "Not set"],
                  ["Address",        user.address  || "Not set"],
                ].map(([k,v]) => (
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"0.6rem 0",borderBottom:"1px solid #F3F4F6",fontSize:"0.9rem"}}>
                    <span style={{color:"var(--muted)"}}>{k}</span>
                    <span style={{fontWeight:600}}>{v}</span>
                  </div>
                ))}
                <div style={{marginTop:"1.3rem",marginBottom:"0.8rem",fontSize:"0.75rem",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".08em"}}>Business Information</div>
                {[
                  ["Company",        user.company  || "Not set"],
                  ["Permit Type",    user.idType   || "Not set"],
                  ["Permit No.",     user.idNumber || "Not set"],
                  ["Approval",       user.approvalStatus || "pending"],
                ].map(([k,v]) => (
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"0.6rem 0",borderBottom:"1px solid #F3F4F6",fontSize:"0.9rem"}}>
                    <span style={{color:"var(--muted)"}}>{k}</span>
                    <span style={{fontWeight:600,color: k==="Approval" && v==="approved" ? "var(--success)" : k==="Approval" && v==="pending" ? "var(--warning)" : "var(--ink)"}}>{v}</span>
                  </div>
                ))}
                {user.bio && (
                  <>
                    <div style={{marginTop:"1.3rem",marginBottom:"0.5rem",fontSize:"0.75rem",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".08em"}}>Business Bio</div>
                    <div style={{background:"#F0F9FF",borderRadius:10,padding:"0.9rem",fontSize:"0.88rem",color:"var(--ink)",lineHeight:1.7,borderLeft:"3px solid var(--teal)"}}>
                      {user.bio}
                    </div>
                  </>
                )}
                <button onClick={() => setShowEditProfile(true)}
                  style={{marginTop:"1.5rem",background:"var(--ocean)",color:"#fff",border:"none",padding:"0.85rem",borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:"0.95rem",width:"100%"}}>
                  <i className="fa-solid fa-pen"/> Edit My Profile
                </button>

              </div>
            </div>

            {/* â"€â"€ GCash Details â"€â"€ */}
            <div style={{background:"#fff",borderRadius:16,border:"1px solid #E5E7EB",padding:"1.5rem 1.8rem",marginBottom:"1rem",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.2rem"}}>
                <h3 style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:"1rem",color:"#059669",margin:0}}>
                  <i className="fa-solid fa-wallet"/> GCash Details
                </h3>
                <button onClick={() => setShowEditGcash(true)}
                  style={{background:"transparent",color:"var(--muted)",border:"1.5px solid #D1D5DB",borderRadius:8,padding:"0.35rem 0.85rem",cursor:"pointer",fontWeight:600,fontSize:"0.82rem",display:"flex",alignItems:"center",gap:"0.4rem"}}>
                  <i className="fa-solid fa-pen" style={{fontSize:"0.72rem"}}/> Edit
                </button>
              </div>
              {user.gcashNumber ? (
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
                  {[["GCash Number", user.gcashNumber], ["Account Name", user.gcashName || "—"]].map(([k,v]) => (
                    <div key={k}>
                      <div style={{fontSize:"0.72rem",color:"#9CA3AF",fontWeight:600,marginBottom:"0.25rem"}}>{k}</div>
                      <div style={{fontSize:"0.92rem",fontWeight:700,color:"#111827"}}>{v}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{background:"#F0FFF4",border:"1px dashed #A7F3D0",borderRadius:10,padding:"0.9rem 1rem",fontSize:"0.85rem",color:"#065F46"}}>
                  No GCash details set yet. Click <strong>Edit</strong> to add your GCash number.
                </div>
              )}
            </div>

            {/* â"€â"€ Bank Account Details â"€â"€ */}
            <div style={{background:"#fff",borderRadius:16,border:"1px solid #E5E7EB",padding:"1.5rem 1.8rem",marginBottom:"1rem",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.2rem"}}>
                <h3 style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:"1rem",color:"#1D4ED8",margin:0}}>
                  <i className="fa-solid fa-building-columns"/> Bank Account Details
                </h3>
                <button onClick={() => setShowEditBank(true)}
                  style={{background:"transparent",color:"var(--muted)",border:"1.5px solid #D1D5DB",borderRadius:8,padding:"0.35rem 0.85rem",cursor:"pointer",fontWeight:600,fontSize:"0.82rem",display:"flex",alignItems:"center",gap:"0.4rem"}}>
                  <i className="fa-solid fa-pen" style={{fontSize:"0.72rem"}}/> Edit
                </button>
              </div>
              {user.bankNumber ? (
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
                  {[
                    ["Account Number", user.bankNumber],
                    ["Account Name",   user.bankName || "—"],
                    ["Bank / Provider",user.bankProvider || "—"],
                  ].map(([k,v]) => (
                    <div key={k}>
                      <div style={{fontSize:"0.72rem",color:"#9CA3AF",fontWeight:600,marginBottom:"0.25rem"}}>{k}</div>
                      <div style={{fontSize:"0.92rem",fontWeight:700,color:"#111827"}}>{v}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{background:"#EFF6FF",border:"1px dashed #BFDBFE",borderRadius:10,padding:"0.9rem 1rem",fontSize:"0.85rem",color:"#1E40AF"}}>
                  No bank details set yet. Click <strong>Edit</strong> to add your bank account.
                </div>
              )}
            </div>

            {/* â"€â"€ Change Password â"€â"€ */}
            <div style={{background:"#fff",borderRadius:16,border:"1px solid #E5E7EB",padding:"1.5rem 1.8rem",marginBottom:"1rem",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
              <h3 style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:"1rem",color:"var(--ocean)",margin:"0 0 1.2rem"}}>
                <i className="fa-solid fa-lock" style={{marginRight:"0.5rem",fontSize:"0.9rem"}}/> Password &amp; Security
              </h3>
              {pwSuccess && (
                <div style={{background:"#ECFDF5",border:"1px solid #A7F3D0",borderRadius:10,padding:"0.7rem 1rem",marginBottom:"1rem",color:"#065F46",fontSize:"0.85rem",fontWeight:600,display:"flex",alignItems:"center",gap:"0.5rem"}}>
                  <i className="fa-solid fa-circle-check"/> Password updated successfully!
                </div>
              )}
              {pwError && (
                <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"0.7rem 1rem",marginBottom:"1rem",color:"#991B1B",fontSize:"0.85rem",fontWeight:600,display:"flex",alignItems:"center",gap:"0.5rem"}}>
                  <i className="fa-solid fa-circle-xmark"/> {pwError}
                </div>
              )}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",marginBottom:"1.2rem"}}>
                {[["Create New Password","newPw","Min. 8 characters"],["Confirm Password","confirm","Repeat new password"]].map(([label,key,ph]) => (
                  <div key={key}>
                    <div style={{fontSize:"0.72rem",color:"#9CA3AF",fontWeight:600,marginBottom:"0.4rem"}}>{label}</div>
                    <input type="password" placeholder={ph} value={pwForm[key]}
                      onChange={e => { setPwForm(f=>({...f,[key]:e.target.value})); setPwError(""); setPwSuccess(false); }}
                      style={{width:"100%",border:"1.5px solid #E5E7EB",borderRadius:9,padding:"0.55rem 0.85rem",fontSize:"0.88rem",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}
                      onFocus={e=>e.target.style.borderColor="var(--teal)"} onBlur={e=>e.target.style.borderColor="#E5E7EB"} />
                  </div>
                ))}
              </div>
              <button onClick={async () => {
                if (pwForm.newPw.length < 8) { setPwError("Password must be at least 8 characters."); return; }
                if (pwForm.newPw !== pwForm.confirm) { setPwError("Passwords do not match."); return; }
                try {
                  await api.users.setPassword(user.id, pwForm.newPw);
                  setPwForm({ newPw:"", confirm:"" });
                  setPwSuccess(true); setTimeout(() => setPwSuccess(false), 4000);
                } catch (err) { setPwError(err.message || "Failed to update password."); }
              }}
                style={{background:"var(--ocean)",color:"#fff",border:"none",padding:"0.6rem 1.8rem",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:"0.88rem",display:"flex",alignItems:"center",gap:"0.5rem"}}>
                <i className="fa-solid fa-key"/> Set Password
              </button>

              {/* â"€â"€ Request Account Deletion â"€â"€ */}
              <div style={{borderTop:"1px solid #F3F4F6",marginTop:"1.5rem",paddingTop:"1.5rem"}}>
                {user.deletionRequested ? (
                  <div className="deletion-pending">
                    <h4>â³ Deletion Request Pending</h4>
                    <p>Submitted on <strong>{user.deletionRequestedAt}</strong>. An admin will review within 1â€"2 business days.</p>
                    <div style={{background:"#FEF3C7",borderRadius:8,padding:"0.6rem 0.8rem",fontSize:"0.82rem",color:"#92400E",marginBottom:"0.8rem"}}>
                      <strong>Reason:</strong> {user.deletionReason}
                    </div>
                    <button
                      onClick={() => requestDeletion && requestDeletion(user.id, "__cancel__")}
                      style={{background:"#fff",border:"2px solid #FCD34D",color:"#92400E",padding:"0.6rem 1.2rem",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:"0.85rem"}}>
                      â†©ï¸ Cancel Deletion Request
                    </button>
                  </div>
                ) : (
                  <div className="deletion-zone">
                    <h4><i className="fa-solid fa-trash"/> Delete My Account</h4>
                    <p>Request permanent account deletion. Your listings will be removed once an admin approves.</p>
                    <button onClick={() => setShowDeleteModal(true)}
                      style={{background:"var(--danger)",color:"#fff",border:"none",padding:"0.7rem 1.4rem",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:"0.88rem"}}>
                      Request Account Deletion
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Delete Account Modal */}
            {showDeleteModal && (
              <div className="overlay" onClick={() => { setShowDeleteModal(false); setDeleteReason(""); setDeleteConfirmText(""); }} style={{zIndex:500}}>
                <div onClick={e => e.stopPropagation()} style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:480,padding:"2rem",boxShadow:"0 25px 80px rgba(0,0,0,0.25)"}}>
                  <div style={{textAlign:"center",marginBottom:"1.5rem"}}>
                    <div style={{fontSize:"3rem",marginBottom:"0.8rem"}}><i className="fa-solid fa-trash"/></div>
                    <h3 style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:"1.2rem",marginBottom:"0.4rem"}}>Request Account Deletion</h3>
                    <p style={{color:"var(--muted)",fontSize:"0.88rem",lineHeight:1.7}}>
                      Your account stays active until an admin approves the deletion. All your listings and bookings will be permanently removed.
                    </p>
                  </div>
                  <div style={{marginBottom:"1rem"}}>
                    <label style={{display:"block",fontSize:"0.78rem",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:"0.5rem"}}>Reason (optional)</label>
                    <textarea value={deleteReason} onChange={e => setDeleteReason(e.target.value)}
                      placeholder="Tell us why you're leaving..."
                      style={{width:"100%",border:"2px solid var(--border)",borderRadius:10,padding:"0.75rem",fontFamily:"inherit",fontSize:"0.9rem",resize:"vertical",minHeight:70,outline:"none"}} />
                  </div>
                  <div style={{marginBottom:"1.5rem"}}>
                    <label style={{display:"block",fontSize:"0.78rem",fontWeight:700,color:"var(--danger)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:"0.5rem"}}>Type "DELETE" to confirm *</label>
                    <input value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)}
                      placeholder="Type DELETE here"
                      style={{width:"100%",border:`2px solid ${deleteConfirmText==="DELETE"?"var(--danger)":"var(--border)"}`,borderRadius:10,padding:"0.75rem",fontFamily:"inherit",fontSize:"0.95rem",outline:"none",fontWeight:700}} />
                  </div>
                  <div style={{display:"flex",gap:"0.8rem"}}>
                    <button disabled={deleteConfirmText !== "DELETE"}
                      onClick={() => {
                        requestDeletion(user.id, deleteReason || "No reason provided.");
                        setShowDeleteModal(false); setDeleteReason(""); setDeleteConfirmText("");
                      }}
                      style={{flex:2,background:deleteConfirmText==="DELETE"?"var(--danger)":"#D1D5DB",color:"#fff",border:"none",padding:"0.9rem",borderRadius:12,cursor:deleteConfirmText==="DELETE"?"pointer":"not-allowed",fontWeight:700,fontSize:"0.95rem"}}>
                      Submit Deletion Request
                    </button>
                    <button onClick={() => { setShowDeleteModal(false); setDeleteReason(""); setDeleteConfirmText(""); }}
                      style={{flex:1,background:"#F3F4F6",color:"var(--ink)",border:"none",padding:"0.9rem",borderRadius:12,cursor:"pointer",fontWeight:700}}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        </>)}
      </div>
    </div>
    </>
  );
}

// â"€â"€â"€ ABOUT PAGE â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

