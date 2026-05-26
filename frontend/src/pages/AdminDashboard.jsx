import { useState } from "react";
import { fmtMoney, fmtPeso } from "../utils/helpers.js";
import { StatusBadge } from "../components/SharedUI.jsx";
import { BarChart, DonutChart, AreaSparkline } from "../components/Charts.jsx";
import { EditProfileModal, ImageUploader } from "./CustomerProfile.jsx";
import { api } from "../api.js";

export default function AdminDashboard({ user, bookings, users, cars, tours, serviceFee, updateServiceFee, onLogout, goTo, updateBookingStatus, approveVendor, rejectVendor, disableUser, deleteUser, deleteBooking, deleteListing, setPdfModal, updateUser, approveDeletion, declineDeletion, destinations = [], setDestinations, showToast = () => {}, onRefresh = () => {} }) {
  const [section, setSection]                 = useState("overview");
  const [viewVendor, setViewVendor]           = useState(null);
  const [rejectReason, setRejectReason]       = useState("");
  const [deleteConfirm, setDeleteConfirm]     = useState(null);
  const [deleteBookingId, setDeleteBookingId] = useState(null);
  const [editDest, setEditDest]               = useState(null);
  const [destDeleteConfirm, setDestDeleteConfirm] = useState(null);
  const [feeInput, setFeeInput]               = useState(String(serviceFee));
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [delTab, setDelTab]                   = useState("all");
  const [userTab, setUserTab]                 = useState("all");
  const [suspendModal, setSuspendModal]       = useState(null);
  const [suspendReason, setSuspendReason]     = useState("");
  const [chartTooltip, setChartTooltip]       = useState(null);
  const [avSearch, setAvSearch]               = useState("");
  const [rvSearch, setRvSearch]               = useState("");
  const [suspSearch, setSuspSearch]           = useState("");
  const [bkSearch, setBkSearch]               = useState("");
  const [bkTypeFilter, setBkTypeFilter]       = useState("all");
  const [userSearch, setUserSearch]           = useState("");
  const [appSearch, setAppSearch]             = useState("");
  const [appTab, setAppTab]                   = useState("vendors");
  const [suspTab, setSuspTab]                 = useState("all");
  const [listTab, setListTab]                 = useState("all");
  const [listSearch, setListSearch]           = useState("");
  const [showSearch, setShowSearch]           = useState(false);
  const [showNotifs, setShowNotifs]           = useState(false);
  const [globalQ, setGlobalQ]                 = useState("");

  const [setPasswordLink, setSetPasswordLink] = useState(null);
  const [pwForm, setPwForm]     = useState({ newPw:"", confirm:"" });
  const [pwError, setPwError]   = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwShow, setPwShow]     = useState({ newPw: false, confirm: false });
  const handleApprove = (uid) => approveVendor(uid).then(url => { if (url) setSetPasswordLink(url); });
  const handleResendInvite = (uid) => api.users.resendInvite(uid).then(d => { if (d?.setUrl) setSetPasswordLink(d.setUrl); showToast("Invite resent!"); }).catch(() => showToast("Failed to resend invite."));

  const DEFAULT_SLIDES = [
    { img:"https://images.unsplash.com/photo-1604537466158-719b1972feb8?w=1600&q=80", label:"Kawasan Falls, Badian — Cebu" },
    { img:"https://images.unsplash.com/photo-1559628233-100c798642d4?w=1600&q=80", label:"Whale Shark Watching, Oslob — Cebu" },
    { img:"https://images.unsplash.com/photo-1551632811-561732d1e306?w=1600&q=80", label:"Osmena Peak, Dalaguete — Cebu" },
    { img:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80", label:"Malapascua Island — Cebu" },
    { img:"https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=1600&q=80", label:"Moalboal Sardine Run — Cebu" },
  ];
  const [heroSlides, setHeroSlides] = useState(DEFAULT_SLIDES);
  const [heroSaving, setHeroSaving] = useState(false);
  const [heroUploading, setHeroUploading] = useState(Array(5).fill(false));

  const handleHeroUpload = async (idx, file) => {
    if (!file) return;
    setHeroUploading(u => u.map((v, i) => i === idx ? true : v));
    try {
      const data = await api.upload(file);
      setHeroSlides(prev => prev.map((s, i) => i === idx ? { ...s, img: data.url } : s));
      showToast("Image uploaded!");
    } catch (e) {
      showToast(e.message || "Upload failed");
    } finally {
      setHeroUploading(u => u.map((v, i) => i === idx ? false : v));
    }
  };

  const handleHeroLabelChange = (idx, val) =>
    setHeroSlides(prev => prev.map((s, i) => i === idx ? { ...s, label: val } : s));

  const handleHeroSave = async () => {
    setHeroSaving(true);
    try {
      await api.settings.updateHeroSlides(heroSlides);
      showToast("Hero slides saved!");
    } catch {
      showToast("Failed to save slides.");
    } finally {
      setHeroSaving(false);
    }
  };

  // Load saved hero slides on settings tab open
  const [heroLoaded, setHeroLoaded] = useState(false);
  const loadHeroSlides = async () => {
    if (heroLoaded) return;
    try {
      const data = await api.settings.getHeroSlides();
      if (data?.slides?.length === 5) setHeroSlides(data.slides);
    } catch {}
    setHeroLoaded(true);
  };

  const totalRevenue       = bookings.filter(b => b.status === "approved").reduce((s, b) => s + (+b.total), 0);
  // Commission = service fee portion of each approved booking
  const commissionFromBooking = (b) => Math.round((b.total || 0) - (b.total || 0) / (1 + serviceFee / 100));
  const totalCommission        = bookings.filter(b=>b.status==="approved").reduce((s,b)=>s+commissionFromBooking(b),0);
  const pendingCommission      = bookings.filter(b=>b.status==="pending").reduce((s,b)=>s+commissionFromBooking(b),0);
  const now = new Date();
  const thisMonth  = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const lastMonthD = new Date(now.getFullYear(), now.getMonth()-1, 1);
  const lastMonth  = `${lastMonthD.getFullYear()}-${String(lastMonthD.getMonth()+1).padStart(2,"0")}`;
  const thisYear   = String(now.getFullYear());
  const monthlyCommission = (ym) => bookings.filter(b=>b.status==="approved"&&(b.date||"").startsWith(ym)).reduce((s,b)=>s+commissionFromBooking(b),0);
  const yearlyCommission  = (yr) => bookings.filter(b=>b.status==="approved"&&(b.date||"").startsWith(yr)).reduce((s,b)=>s+commissionFromBooking(b),0);
  const commissionThisMonth = monthlyCommission(thisMonth);
  const commissionLastMonth = monthlyCommission(lastMonth);
  const commissionThisYear  = yearlyCommission(thisYear);
  const avgCommission = bookings.filter(b=>b.status==="approved").length > 0
    ? Math.round(totalCommission / bookings.filter(b=>b.status==="approved").length) : 0;
  // Build last 6 months for bar chart
  const last6Months = Array.from({length:6},(_,i)=>{
    const d = new Date(now.getFullYear(), now.getMonth()-5+i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    const label = d.toLocaleString("default",{month:"short"});
    return { ym, label, commission: monthlyCommission(ym), revenue: bookings.filter(b=>b.status==="approved"&&(b.date||"").startsWith(ym)).reduce((s,b)=>s+(+(b.total)||0),0) };
  });
  const maxBarVal = Math.max(...last6Months.map(m=>m.revenue), 1);
  const pendingVendors     = users.filter(u => u.role === "vendor" && u.approvalStatus === "pending").length;
  const pendingCustomers   = users.filter(u => u.role === "customer" && u.approvalStatus === "pending");
  const totalPendingApps   = pendingVendors + pendingCustomers.length;
  const approvedVendors    = users.filter(u => u.role === "vendor" && u.approvalStatus === "approved");
  const rejectedVendors    = users.filter(u => u.role === "vendor" && u.approvalStatus === "rejected");
  const suspendedVendors   = users.filter(u => u.role === "vendor" && u.approvalStatus === "suspended");
  const suspendedCustomers = users.filter(u => u.role === "customer" && u.approvalStatus === "suspended");
  const vendors            = users.filter(u => u.role === "vendor");
  const customers          = users.filter(u => u.role === "customer");
  const deletionRequests   = users.filter(u => u.deletionRequested);
  const suspendedUsers     = users.filter(u => u.approvalStatus === "suspended" && u.role !== "admin");
  const deletionVendors    = deletionRequests.filter(u => u.role === "vendor");
  const deletionCustomers  = deletionRequests.filter(u => u.role === "customer");

  const PAGE_TITLES = {
    overview:           "Overview",
    applications:       "Vendor Applications",
    approved_vendors:   "Approved Vendors",
    rejected_vendors:   "Rejected Vendors",
    suspended:          "Suspended Users",
    deletion_requests:  "Deletion Requests",
    analytics:          "Analytics",
    commission_revenue: "Commission Revenue",
    bookings:           "Bookings",
    users:              "All Users",
    listings:           "Listings",
    destinations:       "Destinations",
    settings:           "Platform Settings",
    profile:            "My Profile",
  };

  const sidebarItems = [
    ["overview",          <i className="fa-solid fa-gauge-high"/>,         "Overview",            null],
    ["applications",      <i className="fa-solid fa-building"/>,           "Applications",        totalPendingApps > 0 ? totalPendingApps : null],
    ["approved_vendors",  <i className="fa-solid fa-circle-check"/>,       "Approved Vendors",    approvedVendors.length],
    ["rejected_vendors",  <i className="fa-solid fa-circle-xmark"/>,       "Rejected Vendors",    rejectedVendors.length],
    ["suspended",         <i className="fa-solid fa-ban"/>,                "Suspended",           suspendedUsers.length > 0 ? suspendedUsers.length : null],
    ["deletion_requests", <i className="fa-solid fa-trash"/>,              "Deletion Requests",   deletionRequests.length > 0 ? deletionRequests.length : null],
    ["analytics",         <i className="fa-solid fa-chart-line"/>,         "Analytics",           null],
    ["commission_revenue",<i className="fa-solid fa-gem"/>,                "Commission Revenue",  null],
    ["bookings",          <i className="fa-solid fa-calendar-days"/>,      "Bookings",            null],
    ["users",             <i className="fa-solid fa-users"/>,              "All Users",           null],
    ["listings",          <i className="fa-solid fa-tags"/>,               "Listings",            null],
    ["destinations",      <i className="fa-solid fa-map-location-dot"/>,   "Destinations",        destinations.length],
    ["settings",          <i className="fa-solid fa-gear"/>,               "Settings",            null],
    ["profile",           <i className="fa-solid fa-user"/>,               "My Profile",          null],
  ];

  // â"€â"€ Delete confirm modal â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const DeleteConfirmModal = () => {
    const target = users.find(u => u.id === deleteConfirm);
    if (!target) return null;
    return (
      <div className="overlay" onClick={() => setDeleteConfirm(null)} style={{zIndex:400}}>
        <div onClick={e => e.stopPropagation()} style={{
          background:"#fff", borderRadius:20, width:"100%", maxWidth:420,
          padding:"2rem", textAlign:"center", boxShadow:"0 20px 60px rgba(0,0,0,0.2)"
        }}>
          <div style={{fontSize:"3rem", marginBottom:"1rem"}}><i className="fa-solid fa-trash"/></div>
          <h3 style={{fontFamily:"'DM Sans',sans-serif", fontWeight:700, marginBottom:"0.5rem"}}>Delete User?</h3>
          <p style={{color:"var(--muted)", fontSize:"0.9rem", lineHeight:1.7, marginBottom:"1.5rem"}}>
            You are about to permanently delete <strong>{target.name}</strong>
            {target.company ? ` (${target.company})` : ""}. This action cannot be undone.
          </p>
          <div style={{display:"flex", gap:"0.8rem"}}>
            <button
              onClick={() => { deleteUser(deleteConfirm); setDeleteConfirm(null); }}
              style={{flex:1, background:"var(--danger)", color:"#fff", border:"none",
                padding:"0.85rem", borderRadius:12, cursor:"pointer", fontWeight:700, fontSize:"0.95rem"}}
            >
              Yes, Delete
            </button>
            <button
              onClick={() => setDeleteConfirm(null)}
              style={{flex:1, background:"#F3F4F6", color:"var(--ink)", border:"none",
                padding:"0.85rem", borderRadius:12, cursor:"pointer", fontWeight:700, fontSize:"0.95rem"}}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // â"€â"€ Booking delete confirm modal â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const DeleteBookingModal = () => {
    const b = bookings.find(bk => bk.id === deleteBookingId);
    if (!b) return null;
    return (
      <div className="overlay" onClick={() => setDeleteBookingId(null)} style={{zIndex:400}}>
        <div onClick={e => e.stopPropagation()} style={{
          background:"#fff", borderRadius:20, width:"100%", maxWidth:420,
          padding:"2rem", textAlign:"center", boxShadow:"0 20px 60px rgba(0,0,0,0.2)"
        }}>
          <div style={{fontSize:"3rem", marginBottom:"1rem"}}><i className="fa-solid fa-trash"/></div>
          <h3 style={{fontFamily:"'DM Sans',sans-serif", fontWeight:700, marginBottom:"0.5rem"}}>Delete Booking?</h3>
          <p style={{color:"var(--muted)", fontSize:"0.9rem", lineHeight:1.7, marginBottom:"0.5rem"}}>
            You are about to permanently delete booking <strong>{b.id}</strong> for <strong>{b.name}</strong>.
          </p>
          <p style={{color:"var(--danger)", fontSize:"0.82rem", marginBottom:"1.5rem"}}>
            This action cannot be undone.
          </p>
          <div style={{display:"flex", gap:"0.8rem"}}>
            <button
              onClick={() => { deleteBooking(deleteBookingId); setDeleteBookingId(null); }}
              style={{flex:1, background:"var(--danger)", color:"#fff", border:"none",
                padding:"0.85rem", borderRadius:12, cursor:"pointer", fontWeight:700, fontSize:"0.95rem"}}
            >
              Yes, Delete
            </button>
            <button
              onClick={() => setDeleteBookingId(null)}
              style={{flex:1, background:"#F3F4F6", color:"var(--ink)", border:"none",
                padding:"0.85rem", borderRadius:12, cursor:"pointer", fontWeight:700, fontSize:"0.95rem"}}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // â"€â"€ Reusable vendor card (used in approved / rejected sections) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const VendorCard = ({ v }) => (
    <div className="app-card">
      <div style={{display:"flex", gap:"1rem", alignItems:"flex-start", flex:1}}>
        <div className="app-avatar"><i className="fa-solid fa-building"/></div>
        <div className="app-info" style={{flex:1}}>
          <h4>{v.company || v.name}</h4>
          <p>{v.name} · {v.email} · {v.phone || "No phone"}</p>
          <p style={{marginBottom:"0.4rem"}}><i className="fa-solid fa-location-dot"/> {v.address || "No address"} · Joined: {v.joined}</p>
          <div className="app-tags">
            {(v.services||[]).map(s => <span key={s} className="app-tag">{s}</span>)}
            {v.idType && <span className="app-tag" style={{background:"#F3F0FF",color:"#6D28D9"}}><i className="fa-solid fa-id-card"/> {v.idType}</span>}
          </div>
          {v.approvalStatus === "rejected" && v.rejectionReason && (
            <div style={{marginTop:"0.5rem", fontSize:"0.8rem", color:"#991B1B",
              background:"#FEF2F2", padding:"0.4rem 0.7rem", borderRadius:6}}>
              Rejection reason: {v.rejectionReason}
            </div>
          )}
        </div>
      </div>
      <div className="app-actions">
        <button
          onClick={() => { setViewVendor(v); setRejectReason(""); }}
          style={{background:"var(--ocean)", color:"#fff", border:"none", padding:"0.5rem 1rem",
            borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:"0.82rem", whiteSpace:"nowrap"}}
        >
          <i className="fa-solid fa-eye"/> View Profile
        </button>
        {v.approvalStatus === "approved" && (
          <button
            onClick={() => { rejectVendor(v.id, "Suspended by admin."); }}
            style={{background:"#FEF3C7", color:"#92400E", border:"none", padding:"0.45rem 0.9rem",
              borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:"0.82rem"}}
          >
            <i className="fa-solid fa-ban"/> Suspend
          </button>
        )}
        {v.approvalStatus === "rejected" && (
          <button
            onClick={() => handleApprove(v.id)}
            style={{background:"#D1FAE5", color:"var(--success)", border:"none", padding:"0.45rem 0.9rem",
              borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:"0.82rem"}}
          >
            <i className="fa-solid fa-circle-check"/> Re-approve
          </button>
        )}
        <button
          onClick={() => setDeleteConfirm(v.id)}
          style={{background:"#FEE2E2", color:"var(--danger)", border:"none", padding:"0.45rem 0.9rem",
            borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:"0.82rem"}}
        >
          <i className="fa-solid fa-trash"/> Delete
        </button>
      </div>
    </div>
  );

  // â"€â"€ Vendor profile review modal â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const VendorProfileModal = ({ v }) => (
    <div className="overlay" onClick={() => { setViewVendor(null); setRejectReason(""); }} style={{zIndex:300}}>
      <div className="vp-modal" onClick={e => e.stopPropagation()}>
        <div className="vp-header">
          <div className="vp-avatar"><i className="fa-solid fa-building"/></div>
          <div>
            <h2>{v.company || v.name}</h2>
            <p>{v.name} · Registered {v.joined}</p>
            <div style={{marginTop:"0.5rem"}}>
              <span style={{
                background: v.approvalStatus==="approved" ? "#D1FAE5" : v.approvalStatus==="rejected" ? "#FEE2E2" : "#FEF3C7",
                color:      v.approvalStatus==="approved" ? "#065F46" : v.approvalStatus==="rejected" ? "#991B1B" : "#92400E",
                padding:"0.2rem 0.7rem", borderRadius:50, fontSize:"0.72rem", fontWeight:700, textTransform:"uppercase"
              }}>
                {v.approvalStatus || "pending"}
              </span>
            </div>
          </div>
        </div>
        <div className="vp-body">
          <div className="vp-section">
            <div className="vp-section-title"><i className="fa-solid fa-clipboard-list"/> Business Details</div>
            <div className="vp-row"><span className="vp-label">Company</span><span className="vp-value">{v.company||"—"}</span></div>
            <div className="vp-row"><span className="vp-label">Owner / Contact</span><span className="vp-value">{v.name}</span></div>
            <div className="vp-row"><span className="vp-label">Email</span><span className="vp-value">{v.email}</span></div>
            <div className="vp-row"><span className="vp-label">Phone</span><span className="vp-value">{v.phone||"—"}</span></div>
            <div className="vp-row"><span className="vp-label">Address</span><span className="vp-value">{v.address||"—"}</span></div>
          </div>
          <div className="vp-section">
            <div className="vp-section-title"><i className="fa-solid fa-id-card"/> Permit / Registration</div>
            <div className="vp-row"><span className="vp-label">ID Type</span><span className="vp-value">{v.idType||"—"}</span></div>
            <div className="vp-row"><span className="vp-label">ID / Permit No.</span><span className="vp-value">{v.idNumber||"—"}</span></div>
          </div>
          {v.services && v.services.length > 0 && (
            <div className="vp-section">
              <div className="vp-section-title"><i className="fa-solid fa-list-check"/> Services Offered</div>
              <div className="vp-services">{v.services.map(s => <span key={s} className="vp-service">{s}</span>)}</div>
            </div>
          )}
          {v.bio && (
            <div className="vp-section">
              <div className="vp-section-title"><i className="fa-solid fa-file-lines"/> Business Bio</div>
              <div className="vp-bio">{v.bio}</div>
            </div>
          )}
          {v.approvalStatus === "rejected" && v.rejectionReason && (
            <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"1rem",marginTop:"0.5rem"}}>
              <div style={{fontSize:"0.75rem",fontWeight:700,color:"#991B1B",textTransform:"uppercase",letterSpacing:".06em",marginBottom:"0.5rem"}}>Rejection Reason</div>
              <p style={{fontSize:"0.88rem",color:"#1A1A2E"}}>{v.rejectionReason}</p>
            </div>
          )}
          {v.approvalStatus === "pending" && (
            <div className="vp-reject-box">
              <label>Rejection Reason (if rejecting)</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="Optional: explain why the application was rejected..." />
            </div>
          )}
        </div>
        <div className="vp-footer">
          {v.approvalStatus === "pending" && (
            <>
              <button onClick={() => { handleApprove(v.id); setViewVendor(null); }}
                style={{flex:1,background:"var(--success)",color:"#fff",border:"none",padding:"0.85rem",borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:"0.95rem"}}>
                 <i className="fa-solid fa-circle-check"/> Approve
              </button>
              <button onClick={() => { rejectVendor(v.id, rejectReason); setViewVendor(null); setRejectReason(""); }}
                style={{flex:1,background:"var(--danger)",color:"#fff",border:"none",padding:"0.85rem",borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:"0.95rem"}}>
                 <i className="fa-solid fa-circle-xmark"/> Reject
              </button>
            </>
          )}
          {v.approvalStatus === "approved" && (
            <button onClick={() => { rejectVendor(v.id,"Suspended by admin."); setViewVendor(null); }}
              style={{flex:1,background:"#FEF3C7",color:"#92400E",border:"none",padding:"0.85rem",borderRadius:12,cursor:"pointer",fontWeight:700}}>
              <i className="fa-solid fa-ban"/> Suspend Vendor
            </button>
          )}
          {v.approvalStatus === "rejected" && (
            <button onClick={() => { handleApprove(v.id); setViewVendor(null); }}
              style={{flex:1,background:"var(--success)",color:"#fff",border:"none",padding:"0.85rem",borderRadius:12,cursor:"pointer",fontWeight:700}}>
              <i className="fa-solid fa-circle-check"/> Re-approve
            </button>
          )}
          <button onClick={() => { setDeleteConfirm(v.id); setViewVendor(null); }}
            style={{flex:1,background:"#FEE2E2",color:"var(--danger)",border:"none",padding:"0.85rem",borderRadius:12,cursor:"pointer",fontWeight:700}}>
            <i className="fa-solid fa-trash"/> Delete
          </button>
          <button onClick={() => { setViewVendor(null); setRejectReason(""); }}
            style={{flex:1,background:"#F3F4F6",color:"var(--ink)",border:"none",padding:"0.85rem",borderRadius:12,cursor:"pointer",fontWeight:700}}>
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dash-layout">
      {viewVendor && <VendorProfileModal v={viewVendor} />}
      {setPasswordLink && (
        <div className="overlay" onClick={() => setSetPasswordLink(null)} style={{zIndex:500}}>
          <div onClick={e => e.stopPropagation()} style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:520,padding:"2rem",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
            <div style={{display:"flex",alignItems:"center",gap:"0.7rem",marginBottom:"1.2rem"}}>
              <div style={{width:40,height:40,borderRadius:12,background:"#D1FAE5",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <i className="fa-solid fa-circle-check" style={{color:"var(--success)",fontSize:"1.1rem"}}/>
              </div>
              <div>
                <div style={{fontWeight:700,fontSize:"1rem",color:"var(--ink)"}}>Set-Password Link</div>
                <div style={{fontSize:"0.82rem",color:"var(--muted)"}}>A set-password email was sent. If it doesn't arrive, share this link directly:</div>
              </div>
            </div>
            <div style={{background:"#F8FAFC",border:"1.5px solid var(--border)",borderRadius:10,padding:"0.75rem 1rem",fontFamily:"monospace",fontSize:"0.78rem",color:"#1e293b",wordBreak:"break-all",marginBottom:"1rem"}}>
              {setPasswordLink}
            </div>
            <div style={{display:"flex",gap:"0.7rem"}}>
              <button
                onClick={() => { navigator.clipboard.writeText(setPasswordLink); showToast("Link copied!"); }}
                style={{flex:1,background:"var(--ocean)",color:"#fff",border:"none",padding:"0.75rem",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:"0.9rem"}}>
                <i className="fa-solid fa-copy"/> Copy Link
              </button>
              <button onClick={() => setSetPasswordLink(null)}
                style={{flex:1,background:"#F3F4F6",color:"var(--ink)",border:"none",padding:"0.75rem",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:"0.9rem"}}>
                Close
              </button>
            </div>
            <p style={{margin:"0.8rem 0 0",fontSize:"0.75rem",color:"var(--muted)",textAlign:"center"}}>
              This link expires in 24 hours. In production, set <code>FRONTEND_URL</code> to your public domain.
            </p>
          </div>
        </div>
      )}
      {deleteConfirm && <DeleteConfirmModal />}
      {deleteBookingId && <DeleteBookingModal />}
      {showEditProfile && <EditProfileModal user={user} onSave={updateUser} onClose={() => setShowEditProfile(false)} />}
      {suspendModal && (
        <div className="overlay" onClick={()=>{setSuspendModal(null);setSuspendReason("");}} style={{zIndex:400}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:460,padding:"2rem",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
            <div style={{textAlign:"center",marginBottom:"1.5rem"}}>
              <div style={{fontSize:"3rem",marginBottom:"0.8rem"}}><i className="fa-solid fa-ban"/></div>
              <h3 style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,marginBottom:"0.4rem"}}>
                {suspendModal.currentStatus==="inactive" ? "Reinstate Account?" : "Suspend Account?"}
              </h3>
              <p style={{color:"var(--muted)",fontSize:"0.88rem",lineHeight:1.7}}>
                {suspendModal.currentStatus==="inactive"
                  ? `Reinstate <strong>${suspendModal.name}</strong>? They will regain full access to the platform.`
                  : `Suspend <strong>${suspendModal.name}</strong>? They won't be able to log in or use the platform.`
                }
              </p>
            </div>
            {suspendModal.currentStatus !== "inactive" && (
              <div style={{marginBottom:"1.2rem"}}>
                <label style={{display:"block",fontSize:"0.78rem",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:"0.5rem"}}>
                  Reason for suspension *
                </label>
                <textarea value={suspendReason} onChange={e=>setSuspendReason(e.target.value)}
                  placeholder="e.g. Violating terms of service, fraudulent activity, spam..."
                  style={{width:"100%",border:`2px solid ${suspendReason?"var(--teal)":"var(--border)"}`,borderRadius:10,padding:"0.75rem",fontFamily:"inherit",fontSize:"0.9rem",resize:"vertical",minHeight:80,outline:"none"}} />
              </div>
            )}
            <div style={{display:"flex",gap:"0.8rem"}}>
              <button
                disabled={suspendModal.currentStatus!=="inactive" && !suspendReason.trim()}
                onClick={()=>{
                  disableUser(suspendModal.uid);
                  setSuspendModal(null);
                  setSuspendReason("");
                  showToast(suspendModal.currentStatus==="inactive" ? `${suspendModal.name} reinstated.` : `${suspendModal.name} suspended.`);
                }}
                style={{flex:2,
                  background:suspendModal.currentStatus==="inactive"?"var(--success)":suspendReason.trim()?"#F97316":"#D1D5DB",
                  color:"#fff",border:"none",padding:"0.9rem",borderRadius:12,
                  cursor:suspendModal.currentStatus==="inactive"||suspendReason.trim()?"pointer":"not-allowed",
                  fontWeight:700,fontSize:"0.95rem"}}>
                 {suspendModal.currentStatus==="inactive" ? <><i className="fa-solid fa-circle-check"/> Reinstate Account</> : <><i className="fa-solid fa-ban"/> Confirm Suspension</>}
              </button>
              <button onClick={()=>{setSuspendModal(null);setSuspendReason("");}}
                style={{flex:1,background:"#F3F4F6",color:"var(--ink)",border:"none",padding:"0.9rem",borderRadius:12,cursor:"pointer",fontWeight:700}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="sidebar">
        <div className="sidebar-logo">
          <i className="fa-solid fa-shield-halved" style={{fontSize:"1.3rem"}}/>
          <div>
            CebuCarTour
            <span>Admin Panel</span>
          </div>
        </div>
        <div className="sidebar-section">Main Menu</div>
        {sidebarItems.slice(0,6).map(([id, icon, label, badge]) => (
          <div key={id} className={`sidebar-item ${section===id?"active":""}`} onClick={() => setSection(id)}>
            <span className="sidebar-icon" data-tip={label}>{icon}</span>
            <span style={{flex:1}}>{label}</span>
            {badge !== null && badge !== undefined && (
              <span style={{
                background: section===id ? "rgba(255,255,255,0.25)" : id==="applications" ? "#EF4444" : "#374151",
                color:"#fff",
                borderRadius:50, fontSize:"0.65rem", fontWeight:700,
                padding:"0.1rem 0.5rem", minWidth:18, textAlign:"center"
              }}>
                {badge}
              </span>
            )}
          </div>
        ))}
        <div className="sidebar-section">Finance & Content</div>
        {sidebarItems.slice(6).map(([id, icon, label, badge]) => (
          <div key={id} className={`sidebar-item ${section===id?"active":""}`} onClick={() => setSection(id)}>
            <span className="sidebar-icon" data-tip={label}>{icon}</span>
            <span style={{flex:1}}>{label}</span>
            {badge !== null && badge !== undefined && (
              <span style={{
                background: section===id ? "rgba(255,255,255,0.25)" : "#374151",
                color:"#fff",
                borderRadius:50, fontSize:"0.65rem", fontWeight:700,
                padding:"0.1rem 0.5rem", minWidth:18, textAlign:"center"
              }}>
                {badge}
              </span>
            )}
          </div>
        ))}
        <div style={{borderTop:"1px solid rgba(255,255,255,0.08)",margin:"0.75rem",paddingTop:"0.75rem"}}>
          <div className="sidebar-item" onClick={() => goTo("home")}><span className="sidebar-icon" data-tip="Go to Main Site"><i className="fa-solid fa-globe"/></span>View Site</div>
          <div className="sidebar-item" onClick={onLogout}><span className="sidebar-icon" data-tip="Sign Out"><i className="fa-solid fa-right-from-bracket"/></span>Logout</div>
        </div>
      </div>

      <div className="dash-content fade-in">
        {/* â"€â"€ Global Search Overlay â"€â"€ */}
        {showSearch && (() => {
          const q = globalQ.trim().toLowerCase();
          const matchUsers   = q ? users.filter(u => u.role!=="admin" && ((u.name||"").toLowerCase().includes(q)||(u.email||"").toLowerCase().includes(q)||(u.company||"").toLowerCase().includes(q))).slice(0,6) : [];
          const matchBk      = q ? bookings.filter(b => b.id.toLowerCase().includes(q)||(b.name||"").toLowerCase().includes(q)||(b.email||"").toLowerCase().includes(q)).slice(0,6) : [];
          const matchCars    = q ? cars.filter(c => (c.name||"").toLowerCase().includes(q)||(c.location||"").toLowerCase().includes(q)).slice(0,4) : [];
          const matchTours   = q ? tours.filter(t => (t.name||"").toLowerCase().includes(q)||(t.category||"").toLowerCase().includes(q)).slice(0,4) : [];
          const hasResults   = matchUsers.length||matchBk.length||matchCars.length||matchTours.length;
          return (
            <div className="gsearch-overlay" onClick={() => { setShowSearch(false); setGlobalQ(""); }}>
              <div className="gsearch-box" onClick={e => e.stopPropagation()}>
                <div className="gsearch-input-row">
                  <i className="fa-solid fa-magnifying-glass" style={{fontSize:"1rem",color:"var(--muted)"}}/>
                  <input autoFocus placeholder="Search users, bookings, listingsâ€¦"
                    value={globalQ} onChange={e => setGlobalQ(e.target.value)}
                    onKeyDown={e => e.key === "Escape" && (setShowSearch(false), setGlobalQ(""))} />
                  <button className="gsearch-close" onClick={() => { setShowSearch(false); setGlobalQ(""); }}>ESC</button>
                </div>
                <div className="gsearch-results">
                  {!q && <div className="gsearch-empty">Start typing to search across users, bookings and listings.</div>}
                  {q && !hasResults && <div className="gsearch-empty">No results for "<strong>{globalQ}</strong>"</div>}
                  {matchUsers.length > 0 && (
                    <>
                      <div className="gsearch-group-label"><i className="fa-solid fa-users"/> Users</div>
                      {matchUsers.map(u => (
                        <div key={u.id} className="gsearch-item" onClick={() => { setSection("users"); setShowSearch(false); setGlobalQ(""); }}>
                          <div className="gsearch-item-icon" style={{background:u.role==="vendor"?"#EFF6FF":"#F0FDF4",fontSize:"1rem"}}><i className={u.role==="vendor"?"fa-solid fa-building":"fa-solid fa-user"}/></div>
                          <div>
                            <div className="gsearch-item-main">{u.company||u.name}</div>
                            <div className="gsearch-item-sub">{u.email} · <span style={{textTransform:"capitalize"}}>{u.role}</span></div>
                          </div>
                          <span style={{marginLeft:"auto",fontSize:"0.72rem",color:"var(--muted)"}}><i className="fa-solid fa-arrow-right"/> Users</span>
                        </div>
                      ))}
                    </>
                  )}
                  {matchBk.length > 0 && (
                    <>
                      <div className="gsearch-group-label"><i className="fa-solid fa-calendar"/> Bookings</div>
                      {matchBk.map(b => (
                        <div key={b.id} className="gsearch-item" onClick={() => { setSection("bookings"); setShowSearch(false); setGlobalQ(""); }}>
                          <div className="gsearch-item-icon" style={{background:"#FFF7ED"}}>{b.type==="car"?<i className="fa-solid fa-car"/>:<i className="fa-solid fa-map"/>}</div>
                          <div>
                            <div className="gsearch-item-main">{b.id} — {b.name}</div>
                            <div className="gsearch-item-sub">{b.email} · {fmtPeso(b.total)} · <span style={{textTransform:"capitalize"}}>{b.status}</span></div>
                          </div>
                          <span style={{marginLeft:"auto",fontSize:"0.72rem",color:"var(--muted)"}}><i className="fa-solid fa-arrow-right"/> Bookings</span>
                        </div>
                      ))}
                    </>
                  )}
                  {(matchCars.length > 0 || matchTours.length > 0) && (
                    <>
                      <div className="gsearch-group-label"><i className="fa-solid fa-clipboard-list"/> Listings</div>
                      {matchCars.map(c => (
                        <div key={"c"+c.id} className="gsearch-item" onClick={() => { setSection("listings"); setListTab("car"); setShowSearch(false); setGlobalQ(""); }}>
                          <div className="gsearch-item-icon" style={{background:"#EFF6FF"}}><i className="fa-solid fa-car"/></div>
                          <div>
                            <div className="gsearch-item-main">{c.name}</div>
                            <div className="gsearch-item-sub">{c.location} · {fmtPeso(c.price)}/day</div>
                          </div>
                          <span style={{marginLeft:"auto",fontSize:"0.72rem",color:"var(--muted)"}}><i className="fa-solid fa-arrow-right"/> Listings</span>
                        </div>
                      ))}
                      {matchTours.map(t => (
                        <div key={"t"+t.id} className="gsearch-item" onClick={() => { setSection("listings"); setListTab("tour"); setShowSearch(false); setGlobalQ(""); }}>
                          <div className="gsearch-item-icon" style={{background:"#F0FDF4"}}><i className="fa-solid fa-map"/></div>
                          <div>
                            <div className="gsearch-item-main">{t.name}</div>
                            <div className="gsearch-item-sub">{t.category} · {fmtPeso(t.price)}</div>
                          </div>
                          <span style={{marginLeft:"auto",fontSize:"0.72rem",color:"var(--muted)"}}><i className="fa-solid fa-arrow-right"/> Listings</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Top bar */}
        <div className="dash-topbar">
          <div className="dash-topbar-title">
            <h1>{PAGE_TITLES[section] || section}</h1>
            <p>Welcome back, <strong>{user.name}</strong></p>
          </div>
          <div className="dash-topbar-right">
            {/* Refresh */}
            <div className="dash-topbar-btn" data-tip="Refresh data" onClick={onRefresh} style={{fontSize:"0.85rem"}}>
              <i className="fa-solid fa-rotate-right"/>
            </div>
            {/* Search */}
            <div className={`dash-topbar-btn${showSearch?" active":""}`} data-tip="Search"
              onClick={() => { setShowSearch(true); setShowNotifs(false); }}>
              <i className="fa-solid fa-magnifying-glass"/>
            </div>

            {/* Notifications */}
            <div className={`dash-topbar-btn${showNotifs?" active":""}`} data-tip="Notifications"
              onClick={() => { setShowNotifs(o => !o); setShowSearch(false); }}>
              <i className="fa-solid fa-bell"/>
              {(totalPendingApps + bookings.filter(b=>b.status==="pending").length + deletionRequests.length) > 0 && !showNotifs && (
                <span style={{position:"absolute",top:4,right:4,width:8,height:8,borderRadius:"50%",background:"#EF4444",border:"2px solid #fff"}} />
              )}
              {showNotifs && (() => {
                const pendBk = bookings.filter(b=>b.status==="pending").length;
                const notifItems = [
                  { icon:"fa-solid fa-building", bg:"#EFF6FF", title:"Applications", desc: totalPendingApps>0?`${totalPendingApps} awaiting approval`:"All reviewed", count:totalPendingApps, cls:"", dest:"applications" },
                  { icon:"fa-solid fa-calendar", bg:"#FFF7ED", title:"Pending Bookings",    desc: pendBk>0?`${pendBk} need action`:"None pending",            count:pendBk,         cls:"warn", dest:"bookings" },
                  { icon:"fa-solid fa-trash", bg:"#FEF2F2", title:"Deletion Requests",  desc: deletionRequests.length>0?`${deletionRequests.length} pending`:"No requests",    count:deletionRequests.length, cls:"", dest:"deletion_requests" },
                  { icon:"fa-solid fa-ban", bg:"#FFF7ED", title:"Suspended Users",     desc: suspendedUsers.length>0?`${suspendedUsers.length} restricted`:"None suspended", count:suspendedUsers.length,  cls:"info", dest:"suspended" },
                ];
                return (
                  <>
                    <div style={{position:"fixed",inset:0,zIndex:399}} onClick={e => { e.stopPropagation(); setShowNotifs(false); }} />
                    <div className="notif-dropdown" onClick={e => e.stopPropagation()}>
                      <div className="notif-header">Notifications</div>
                      {notifItems.every(n=>n.count===0) && <div className="notif-empty"><i className="fa-solid fa-circle-check"/> All clear — nothing needs your attention.</div>}
                      {notifItems.map(n => (
                        <div key={n.title} className="notif-item" onClick={() => { setSection(n.dest); setShowNotifs(false); }}>
                          <div className="notif-icon" style={{background:n.bg}}>{n.icon.startsWith("fa-") ? <i className={n.icon}/> : n.icon}</div>
                          <div>
                            <div className="notif-title">{n.title}</div>
                            <div className="notif-desc">{n.desc}</div>
                          </div>
                          {n.count > 0 && <span className={`notif-badge ${n.cls}`}>{n.count}</span>}
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Profile */}
            <div data-tip="My Profile" onClick={() => setSection("profile")} style={{display:"flex",alignItems:"center",gap:"0.6rem",cursor:"pointer",
              background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:10,padding:"0.35rem 0.75rem 0.35rem 0.4rem"}}>
              <div style={{width:30,height:30,borderRadius:"50%",overflow:"hidden",flexShrink:0,background:"linear-gradient(135deg,#2563EB,#06B6D4)"}}>
                {user.profilePhoto
                  ? <img src={user.profilePhoto} alt={user.name} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                  : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.9rem"}}>{user.avatar||<i className="fa-solid fa-user"/>}</div>
                }
              </div>
              <span style={{fontSize:"0.82rem",fontWeight:600,color:"#374151"}}>{user.name}</span>
            </div>
          </div>
        </div>
        <div className="dash-main">

        {/* â"€â"€ OVERVIEW â"€â"€ */}
        {section === "overview" && (
          <>
            {/* â"€â"€ ROW 1: Bookings â"€â"€ */}
            <div style={{fontSize:"0.72rem",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:"0.75rem",display:"flex",alignItems:"center",gap:"0.6rem"}}>
              <i className="fa-solid fa-calendar"/> Bookings
              <div style={{flex:1,height:1,background:"var(--border)"}} />
            </div>
            <div className="stats-grid" style={{marginBottom:"1.5rem"}}>
              {[
                ["fa-solid fa-box","Total Bookings",   bookings.length,                                   "All time",           "bookings",  null],
                ["fa-solid fa-circle-check","Approved",          bookings.filter(b=>b.status==="approved").length,  "Confirmed",          "bookings",  "success"],
                ["fa-solid fa-hourglass-half","Pending",           bookings.filter(b=>b.status==="pending").length,   "Awaiting review",    "bookings",  bookings.filter(b=>b.status==="pending").length>0?"warning":null],
                ["fa-solid fa-circle-xmark","Cancelled",         bookings.filter(b=>b.status==="cancelled").length, "Not proceeding",     "bookings",  null],
                ["fa-solid fa-money-bill-wave","Revenue",           fmtMoney(totalRevenue),                           "From approved",      "bookings",  "success"],
              ].map(([icon,label,val,sub,dest,accent]) => (
                <div key={label} className="stat-card"
                  onClick={() => setSection(dest)}
                  style={{cursor:"pointer",transition:"all .2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 12px 28px rgba(0,0,0,0.10)";e.currentTarget.style.borderColor="var(--teal)";}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="";e.currentTarget.style.borderColor="var(--border)";}}>
                  <div className="stat-icon" data-tip={label}>{icon.startsWith("fa-") ? <i className={icon}/> : icon}</div>
                  <h3>{label}</h3>
                  <div className="stat-val">{val}</div>
                  <div className="stat-trend" style={{color:accent==="warning"?"var(--warning)":accent==="success"?"var(--success)":"var(--muted)"}}>{sub}</div>
                  <div style={{fontSize:"0.72rem",color:"var(--teal)",fontWeight:700,marginTop:"0.4rem"}}>View <i className="fa-solid fa-arrow-right"/></div>
                </div>
              ))}
            </div>

            {/* â"€â"€ ROW 1b: Commission Revenue Summary â"€â"€ */}
            <div style={{fontSize:"0.72rem",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:"0.75rem",display:"flex",alignItems:"center",gap:"0.6rem"}}>
              <i className="fa-solid fa-gem"/> Commission Revenue
              <div style={{flex:1,height:1,background:"var(--border)"}} />
              <button onClick={()=>setSection("commission_revenue")}
                style={{background:"var(--ocean)",color:"#fff",border:"none",padding:"0.25rem 0.8rem",borderRadius:6,cursor:"pointer",fontWeight:700,fontSize:"0.72rem",letterSpacing:".04em",whiteSpace:"nowrap"}}>
                Full Report <i className="fa-solid fa-arrow-right"/>
              </button>
            </div>
            <div className="stats-grid" style={{marginBottom:"1.5rem"}}>
              {[
                {icon:"fa-solid fa-gem", label:"Total Commission",       val:fmtMoney(totalCommission),      sub:`${serviceFee}% of all approved revenue`,      accent:"success"},
                {icon:"fa-solid fa-calendar-days", label:"This Month",             val:fmtMoney(commissionThisMonth),  sub: commissionThisMonth>=commissionLastMonth ? `▲ vs last month` : `▼ vs last month`, accent: commissionThisMonth>=commissionLastMonth?"success":"warning"},
                {icon:"fa-solid fa-calendar-check", label:"Last Month",             val:fmtMoney(commissionLastMonth),  sub:"Previous month",                              accent:null},
                {icon:"fa-solid fa-calendar", label:`This Year (${thisYear})`,val:fmtMoney(commissionThisYear),   sub:"Year to date",                                accent:"success"},
                {icon:"fa-solid fa-hourglass-half", label:"Pending Commission",     val:fmtMoney(pendingCommission),    sub:"From pending bookings",                       accent:pendingCommission>0?"warning":null},
                {icon:"fa-solid fa-chart-bar", label:"Avg per Booking",        val:fmtMoney(avgCommission),        sub:`Based on approved bookings`,                  accent:null},
              ].map(({icon,label,val,sub,accent}) => (
                <div key={label} className="stat-card"
                  onClick={()=>setSection("commission_revenue")}
                  style={{cursor:"pointer",transition:"all .2s",
                    background: accent==="success"?"#F0FDF4":accent==="warning"?"#FFFBEB":"#fff",
                    borderColor: accent==="success"?"#A7F3D0":accent==="warning"?"#FCD34D":"var(--border)",
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 12px 28px rgba(0,0,0,0.10)";}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="";}}>
                  <div className="stat-icon" data-tip={label}>{icon.startsWith("fa-") ? <i className={icon}/> : icon}</div>
                  <h3>{label}</h3>
                  <div className="stat-val" style={{color: accent==="success"?"var(--success)":accent==="warning"?"var(--warning)":"var(--ink)",fontSize:"1.5rem"}}>{val}</div>
                  <div className="stat-trend" style={{color:accent==="warning"?"var(--warning)":accent==="success"?"var(--success)":"var(--muted)",fontSize:"0.78rem"}}>{sub}</div>
                  <div style={{fontSize:"0.72rem",color:"var(--teal)",fontWeight:700,marginTop:"0.4rem"}}>Details <i className="fa-solid fa-arrow-right"/></div>
                </div>
              ))}
            </div>

            {/* â"€â"€ ROW 2: Users â"€â"€ */}
            <div style={{fontSize:"0.72rem",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:"0.75rem",display:"flex",alignItems:"center",gap:"0.6rem"}}>
              <i className="fa-solid fa-users"/> Users
              <div style={{flex:1,height:1,background:"var(--border)"}} />
            </div>
            <div className="stats-grid" style={{marginBottom:"1.5rem"}}>
              {[
                {icon:"fa-solid fa-users", label:"All Users",          val:users.length,                                              sub:`${users.filter(u=>u.role==="vendor").length} vendors · ${users.filter(u=>u.role==="customer").length} customers`, dest:"users",             accent:null},
                {icon:"fa-solid fa-user", label:"Total Customers",    val:users.filter(u=>u.role==="customer").length,               sub:"Registered travelers",   dest:"users",             accent:"success"},
                {icon:"fa-solid fa-building", label:"Total Vendors",      val:users.filter(u=>u.role==="vendor").length,                 sub:`${approvedVendors.length} approved · ${pendingVendors} pending`, dest:"approved_vendors",  accent:null},
                {icon:"fa-solid fa-circle-check", label:"Approved Vendors",   val:approvedVendors.length,                                    sub:"Active & posting",       dest:"approved_vendors",  accent:"success"},
                {icon:"fa-solid fa-hourglass-half", label:"Pending Vendors",    val:pendingVendors,                                            sub:pendingVendors>0?"Needs review":"All reviewed", dest:"applications", accent:pendingVendors>0?"warning":null},
                {icon:"fa-solid fa-circle-xmark", label:"Rejected Vendors",   val:rejectedVendors.length,                                    sub:"Not approved",           dest:"rejected_vendors",  accent:null},
                {icon:"fa-solid fa-ban", label:"Suspended Users",    val:suspendedUsers.length,                                     sub:suspendedUsers.length>0?"Restricted":"None suspended", dest:"suspended",    accent:suspendedUsers.length>0?"danger":null},
                {icon:"fa-solid fa-trash",label:"Deletion Requests",  val:deletionRequests.length,                                   sub:deletionRequests.length>0?"⚠️ Awaiting review":"No requests", dest:"deletion_requests", accent:deletionRequests.length>0?"danger":null},
              ].map(({icon,label,val,sub,dest,accent}) => (
                <div key={label} className="stat-card"
                  onClick={() => setSection(dest)}
                  style={{cursor:"pointer",transition:"all .2s",
                    borderColor: accent==="danger" ? "#FECACA" : "var(--border)",
                    background:  accent==="danger" ? "#FFF5F5" : "#fff",
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 12px 28px rgba(0,0,0,0.10)";}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="";}}>
                  <div className="stat-icon" data-tip={label}>{icon.startsWith("fa-") ? <i className={icon}/> : icon}</div>
                  <h3>{label}</h3>
                  <div className="stat-val" style={{color:accent==="danger"?"var(--danger)":"var(--ink)"}}>{val}</div>
                  <div className="stat-trend" style={{
                    color: accent==="warning"?"var(--warning)":accent==="danger"?"var(--danger)":accent==="success"?"var(--success)":"var(--muted)",
                    fontSize:"0.78rem"
                  }}>{sub}</div>
                  <div style={{fontSize:"0.72rem",color:"var(--teal)",fontWeight:700,marginTop:"0.4rem"}}>View <i className="fa-solid fa-arrow-right"/></div>
                </div>
              ))}
            </div>

            {/* â"€â"€ ROW 3: Listings â"€â"€ */}
            <div style={{fontSize:"0.72rem",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:"0.75rem",display:"flex",alignItems:"center",gap:"0.6rem"}}>
              <i className="fa-solid fa-tag"/> Listings
              <div style={{flex:1,height:1,background:"var(--border)"}} />
            </div>
            <div className="stats-grid" style={{marginBottom:"1.5rem"}}>
              {[
                ["fa-solid fa-car","Cars Listed",   cars.length,                                 `${cars.filter(c=>c.available).length} available · ${cars.filter(c=>!c.available).length} unavailable`, "listings", null],
                ["fa-solid fa-map","Tours Listed", tours.length,                                `${tours.filter(t=>t.available).length} available · ${tours.filter(t=>!t.available).length} unavailable`, "listings", null],
                ["fa-solid fa-tag","Total Listings",cars.length + tours.length,                  "Cars & tours combined", "listings", "success"],
              ].map(([icon,label,val,sub,dest,accent]) => (
                <div key={label} className="stat-card"
                  onClick={() => setSection(dest)}
                  style={{cursor:"pointer",transition:"all .2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 12px 28px rgba(0,0,0,0.10)";e.currentTarget.style.borderColor="var(--teal)";}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="";e.currentTarget.style.borderColor="var(--border)";}}>
                  <div className="stat-icon" data-tip={label}>{icon.startsWith("fa-") ? <i className={icon}/> : icon}</div>
                  <h3>{label}</h3>
                  <div className="stat-val">{val}</div>
                  <div className="stat-trend" style={{color:accent==="success"?"var(--success)":"var(--muted)",fontSize:"0.78rem"}}>{sub}</div>
                  <div style={{fontSize:"0.72rem",color:"var(--teal)",fontWeight:700,marginTop:"0.4rem"}}>View <i className="fa-solid fa-arrow-right"/></div>
                </div>
              ))}
            </div>

            {/* Alert banners */}
            {totalPendingApps > 0 && (
              <div style={{background:"#FEF3C7",border:"1px solid #FCD34D",borderRadius:12,padding:"1rem 1.3rem",marginBottom:"0.8rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                 <span><i className="fa-solid fa-triangle-exclamation"/> <strong>{totalPendingApps} registration{totalPendingApps>1?"s":""}</strong> waiting for your review.</span>
                <button onClick={() => setSection("applications")}
                  style={{background:"var(--ocean)",color:"#fff",border:"none",padding:"0.5rem 1.1rem",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:"0.85rem"}}>
                  Review Now <i className="fa-solid fa-arrow-right"/>
                </button>
              </div>
            )}
            {suspendedUsers.length > 0 && (
              <div style={{background:"#FFF7ED",border:"1px solid #FED7AA",borderRadius:12,padding:"1rem 1.3rem",marginBottom:"0.8rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                 <span><i className="fa-solid fa-ban"/> <strong>{suspendedUsers.length} user{suspendedUsers.length>1?"s":""} currently suspended</strong> — review if they should be reinstated or deleted.</span>
                <button onClick={() => setSection("suspended")}
                  style={{background:"#F97316",color:"#fff",border:"none",padding:"0.5rem 1.1rem",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:"0.85rem"}}>
                  View Suspended <i className="fa-solid fa-arrow-right"/>
                </button>
              </div>
            )}
            {deletionRequests.length > 0 && (
              <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:12,padding:"1rem 1.3rem",marginBottom:"1rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span><i className="fa-solid fa-trash"/> <strong>{deletionRequests.length} account deletion request{deletionRequests.length>1?"s":""}</strong> pending your review.</span>
                <button onClick={() => setSection("deletion_requests")}
                  style={{background:"var(--danger)",color:"#fff",border:"none",padding:"0.5rem 1.1rem",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:"0.85rem"}}>
                  Review Now <i className="fa-solid fa-arrow-right"/>
                </button>
              </div>
            )}

            {/* â"€â"€ Recent Bookings â"€â"€ */}
            <div style={{fontSize:"0.72rem",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".1em",margin:"0.5rem 0 0.75rem",display:"flex",alignItems:"center",gap:"0.6rem"}}>
              <i className="fa-solid fa-calendar"/> Recent Bookings
              <div style={{flex:1,height:1,background:"var(--border)"}} />
            </div>
            <div className="table-wrap">
              <div className="table-header" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
                  <h3>Recent Bookings</h3>
                  {/* Booking totals pills */}
                  <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap"}}>
                    {[
                      [bookings.length,       "Total",     "#E0E7FF","#3730A3"],
                      [bookings.filter(b=>b.status==="approved").length,  "Approved",  "#D1FAE5","#065F46"],
                      [bookings.filter(b=>b.status==="pending").length,   "Pending",   "#FEF3C7","#92400E"],
                      [bookings.filter(b=>b.status==="cancelled").length, "Cancelled", "#FEE2E2","#991B1B"],
                    ].map(([count,label,bg,color]) => (
                      <span key={label} style={{background:bg,color,fontSize:"0.72rem",fontWeight:700,padding:"0.2rem 0.6rem",borderRadius:50,whiteSpace:"nowrap"}}>
                        {count} {label}
                      </span>
                    ))}
                  </div>
                </div>
                <button onClick={() => setSection("bookings")}
                  style={{background:"var(--ocean)",color:"#fff",border:"none",padding:"0.4rem 1rem",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:"0.8rem",whiteSpace:"nowrap"}}>
                  View All {bookings.length} <i className="fa-solid fa-arrow-right"/>
                </button>
              </div>
              <div style={{padding:"0.5rem 1.2rem",background:"#FAFAFA",borderBottom:"1px solid var(--border)",fontSize:"0.8rem",color:"var(--muted)"}}>
                Showing <strong>{Math.min(5, bookings.length)}</strong> of <strong>{bookings.length}</strong> total booking{bookings.length!==1?"s":""}
                {bookings.length > 5 && <span> — <span style={{color:"var(--teal)",cursor:"pointer",fontWeight:600}} onClick={()=>setSection("bookings")}>see all {bookings.length} <i className="fa-solid fa-arrow-right"/></span></span>}
              </div>
              <table>
                <thead><tr><th>#</th><th>ID</th><th>Customer</th><th>Item</th><th>Date</th><th>Total</th><th>Proof</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {bookings.slice(-5).reverse().map((b, i) => (
                    <tr key={b.id}>
                      <td style={{color:"var(--muted)",fontSize:"0.8rem",fontWeight:600}}>{bookings.length - i}</td>
                      <td><strong>{b.id}</strong></td>
                      <td>{b.name}</td>
                      <td>{b.type==="car"?<><i className="fa-solid fa-car"/> Car</>:<><i className="fa-solid fa-map"/> Tour</>} #{b.itemId}</td>
                      <td>{b.date}</td>
                      <td>{fmtPeso(b.total)}</td>
                      <td style={{textAlign:"center"}}>
                        {b.paymentProof
                          ? <button className="action-btn view" data-tip="View Payment Screenshot" onClick={()=>setViewProof(b)} style={{fontSize:"1rem",padding:"0.3rem 0.55rem"}}><i className="fa-solid fa-camera"/></button>
                          : <span style={{color:"var(--muted)",fontSize:"0.78rem"}}>{b.payment==="cash"?"Cash":"—"}</span>}
                      </td>
                      <td><StatusBadge status={b.status} /></td>
                      <td style={{display:"flex",gap:"0.4rem",flexWrap:"wrap"}}>
                        {b.status==="pending" && <button className="action-btn approve" onClick={()=>updateBookingStatus(b.id,"approved")} data-tip="Approve Booking"><i className="fa-solid fa-check"/> Approve</button>}
                        {b.status!=="cancelled" && <button className="action-btn reject" data-tip="Cancel Booking" onClick={()=>updateBookingStatus(b.id,"cancelled")}><i className="fa-solid fa-xmark"/> Cancel</button>}
                        <button className="action-btn view" data-tip="Download PDF" onClick={()=>{const itm=b.type==="car"?cars.find(c=>c.id===b.itemId):tours.find(t=>t.id===b.itemId);setPdfModal({booking:b,itemName:itm?.name||"—",item:itm||null});}}><i className="fa-solid fa-file-pdf"/></button>
                        <button className="action-btn delete" data-tip="Delete" onClick={()=>setDeleteBookingId(b.id)}><i className="fa-solid fa-trash"/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{padding:"1rem 1.2rem",background:"#FAFAFA",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:"0.85rem",color:"var(--muted)"}}>
                <span>Showing last <strong>5</strong> of <strong>{bookings.length}</strong> bookings</span>
                <button onClick={() => setSection("bookings")}
                  style={{background:"transparent",border:"1px solid var(--border)",color:"var(--ocean)",padding:"0.4rem 1rem",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:"0.82rem"}}>
                  View All Bookings <i className="fa-solid fa-arrow-right"/>
                </button>
              </div>
            </div>
          </>
        )}

        {/* â"€â"€ ANALYTICS â"€â"€ */}
        {section === "analytics" && (() => {
          const CARD = {background:"#fff",borderRadius:16,border:"1px solid #E9ECF0",padding:"1.4rem 1.5rem",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"};
          const CTITLE = {fontSize:"0.7rem",fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:".09em",marginBottom:"0.5rem"};
          const BIG = {fontSize:"1.7rem",fontWeight:800,color:"#111827",lineHeight:1.1,marginTop:"0.15rem"};

          const carRev  = bookings.filter(b=>b.status==="approved"&&b.type==="car").reduce((s,b)=>s+(+b.total),0);
          const tourRev = bookings.filter(b=>b.status==="approved"&&b.type==="tour").reduce((s,b)=>s+(+b.total),0);
          const totalTypRev = carRev + tourRev || 1;

          const listingMap = {};
          bookings.filter(b=>b.status==="approved").forEach(b=>{
            const k=`${b.type}_${b.itemId}`;
            if(!listingMap[k]) listingMap[k]={type:b.type,itemId:b.itemId,revenue:0,count:0};
            listingMap[k].revenue += b.total||0;
            listingMap[k].count++;
          });
          const topListings = Object.values(listingMap)
            .sort((a,b)=>b.revenue-a.revenue).slice(0,8)
            .map(x=>({...x, name:(x.type==="car"?cars:tours).find(i=>i.id===x.itemId)?.name||"Deleted Listing"}));
          const maxLRev = topListings[0]?.revenue || 1;

          const monthRevData  = last6Months.map(m=>({label:m.label, value:m.revenue}));
          const last6Rev      = last6Months.reduce((s,m)=>s+m.revenue, 0);
          const monthBkData   = last6Months.map(m=>({label:m.label, value:bookings.filter(b=>(b.date||"").startsWith(m.ym)).length}));
          const monthUsrData  = last6Months.map(m=>({label:m.label, value:users.filter(u=>(u.joined||"").startsWith(m.ym)).length}));

          const approvedBk = bookings.filter(b=>b.status==="approved").length;
          const pendingBk  = bookings.filter(b=>b.status==="pending").length;
          const cancelBk   = bookings.filter(b=>b.status==="cancelled").length;
          const avgBkVal   = approvedBk > 0 ? Math.round(totalRevenue/approvedBk) : 0;
          const convRate   = bookings.length > 0 ? Math.round(approvedBk/bookings.length*100) : 0;
          const cancelRate = bookings.length > 0 ? Math.round(cancelBk/bookings.length*100) : 0;

          return (
            <>
              {/* KPI Strip */}
              <div className="stats-grid" style={{marginBottom:"1.5rem"}}>
                {[
                  {icon:"fa-solid fa-money-bill-wave",label:"Total Revenue",    val:fmtMoney(totalRevenue),                    sub:"From approved bookings",  accent:"#059669"},
                  {icon:"fa-solid fa-box",label:"Total Bookings",    val:bookings.length,                        sub:`${approvedBk} approved`,  accent:"#2563EB"},
                  {icon:"fa-solid fa-circle-xmark",label:"Cancelled",         val:cancelBk,                               sub:bookings.length>0?`${cancelRate}% cancellation rate`:"No cancellations", accent:cancelBk>0?"#DC2626":"#6B7280"},
                  {icon:"fa-solid fa-users",label:"Total Users",       val:users.length,                           sub:`${customers.length} customers · ${vendors.length} vendors`, accent:"#7C3AED"},
                  {icon:"fa-solid fa-gem",label:"Commission Earned", val:fmtMoney(totalCommission),             sub:`${serviceFee}% platform fee`, accent:"#D97706"},
                  {icon:"fa-solid fa-tag",label:"Active Listings",  val:cars.filter(c=>c.available).length+tours.filter(t=>t.available).length, sub:`of ${cars.length+tours.length} total`, accent:"#0891B2"},
                ].map(({icon,label,val,sub,accent})=>(
                  <div key={label} style={{...CARD, borderTop:`3px solid ${accent}`}}>
                    <div style={{fontSize:"1.4rem",marginBottom:"0.3rem"}}>{icon.startsWith("fa-") ? <i className={icon}/> : icon}</div>
                    <div style={{fontSize:"0.68rem",fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:".07em"}}>{label}</div>
                    <div style={{fontSize:"1.65rem",fontWeight:800,color:accent,lineHeight:1.1,marginTop:"0.15rem"}}>{val}</div>
                    <div style={{fontSize:"0.72rem",color:"var(--muted)",marginTop:"0.2rem"}}>{sub}</div>
                  </div>
                ))}
              </div>

              {/* Row 1 â€" Revenue trend + Status donut + Type split */}
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:"1rem",marginBottom:"1rem"}}>
                <div style={CARD}>
                  <div style={CTITLE}>Monthly Revenue (Last 6 Months)</div>
                  <div style={BIG}>{fmtMoney(last6Rev)}</div>
                  <div style={{fontSize:"0.72rem",color:"var(--success)",marginBottom:"0.75rem"}}>â†— Total revenue over last 6 months</div>
                  <BarChart data={monthRevData} color="#2563EB" valuePrefix="₱" />
                </div>

                <div style={CARD}>
                  <div style={CTITLE}>Booking Status</div>
                  <div style={{display:"flex",justifyContent:"center",margin:"0.5rem 0 0.8rem"}}>
                    <DonutChart segments={[
                      {label:"Approved", value:approvedBk, color:"#059669"},
                      {label:"Pending",  value:pendingBk,  color:"#D97706"},
                      {label:"Cancelled",value:cancelBk,   color:"#DC2626"},
                    ]} />
                  </div>
                  {[["Approved","#059669",approvedBk],["Pending","#D97706",pendingBk],["Cancelled","#DC2626",cancelBk]].map(([l,c,v])=>(
                    <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:"0.78rem",padding:"0.22rem 0"}}>
                      <span style={{display:"flex",alignItems:"center",gap:"0.4rem"}}>
                        <span style={{width:8,height:8,borderRadius:"50%",background:c,display:"inline-block"}}/>
                        <span style={{color:"var(--muted)"}}>{l}</span>
                      </span>
                      <span style={{fontWeight:700,color:"#111827"}}>{v}</span>
                    </div>
                  ))}
                </div>

                <div style={CARD}>
                  <div style={CTITLE}>Revenue by Type</div>
                  {[["Car Rentals",carRev,"#2563EB"],["Tours",tourRev,"#7C3AED"]].map(([l,v,c])=>(
                    <div key={l} style={{marginBottom:"1rem"}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.8rem",marginBottom:"0.3rem"}}>
                        <span style={{fontWeight:600,color:"#374151"}}>{l}</span>
                        <span style={{fontWeight:700,color:c}}>{Math.round(v/totalTypRev*100)}%</span>
                      </div>
                      <div style={{height:10,background:"#F3F4F6",borderRadius:50,overflow:"hidden"}}>
                        <div style={{width:`${Math.round(v/totalTypRev*100)}%`,height:"100%",background:c,borderRadius:50}}/>
                      </div>
                      <div style={{fontSize:"0.72rem",color:"var(--muted)",marginTop:"0.2rem"}}>{fmtPeso(v)}</div>
                    </div>
                  ))}
                  <div style={{borderTop:"1px solid #F3F4F6",paddingTop:"0.75rem"}}>
                    <div style={{...CTITLE,marginBottom:"0.4rem"}}>Availability</div>
                    {[["Cars",cars.filter(c=>c.available).length,cars.length,"#2563EB"],["Tours",tours.filter(t=>t.available).length,tours.length,"#7C3AED"]].map(([l,a,t,c])=>(
                      <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:"0.78rem",padding:"0.18rem 0"}}>
                        <span style={{color:"var(--muted)"}}>{l} Available</span>
                        <span style={{fontWeight:700,color:c}}>{a}/{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 2 â€" Monthly bookings + User distribution + Top listings */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"1rem",marginBottom:"1rem"}}>
                <div style={CARD}>
                  <div style={CTITLE}>Monthly Bookings</div>
                  <BarChart data={monthBkData} color="#7C3AED" />
                  <div style={{borderTop:"1px solid #F3F4F6",marginTop:"0.75rem",paddingTop:"0.75rem"}}>
                    <div style={{...CTITLE,marginBottom:"0.4rem"}}>New User Registrations</div>
                    <BarChart data={monthUsrData} color="#059669" />
                  </div>
                </div>

                <div style={CARD}>
                  <div style={CTITLE}>User Distribution</div>
                  <div style={{display:"flex",justifyContent:"center",margin:"0.5rem 0 0.8rem"}}>
                    <DonutChart segments={[
                      {label:"Customers",      value:customers.length,       color:"#2563EB"},
                      {label:"Appr. Vendors",  value:approvedVendors.length, color:"#059669"},
                      {label:"Pend. Vendors",  value:pendingVendors,         color:"#D97706"},
                      {label:"Suspended",      value:suspendedUsers.length,  color:"#DC2626"},
                    ]} />
                  </div>
                  {[["Customers",customers.length,"#2563EB"],["Approved Vendors",approvedVendors.length,"#059669"],["Pending Vendors",pendingVendors,"#D97706"],["Suspended",suspendedUsers.length,"#DC2626"]].map(([l,v,c])=>(
                    <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:"0.78rem",padding:"0.22rem 0"}}>
                      <span style={{display:"flex",alignItems:"center",gap:"0.4rem"}}>
                        <span style={{width:8,height:8,borderRadius:"50%",background:c,display:"inline-block"}}/>
                        <span style={{color:"var(--muted)"}}>{l}</span>
                      </span>
                      <span style={{fontWeight:700,color:"#111827"}}>{v}</span>
                    </div>
                  ))}
                </div>

                <div style={CARD}>
                  <div style={CTITLE}>Top Listings by Revenue</div>
                  {topListings.length === 0
                    ? <div style={{textAlign:"center",padding:"1.5rem 0",color:"var(--muted)",fontSize:"0.85rem"}}>No approved bookings yet</div>
                    : topListings.map((l,idx)=>(
                      <div key={idx} style={{display:"flex",alignItems:"center",gap:"0.6rem",marginBottom:"0.55rem"}}>
                        <div style={{width:22,height:22,borderRadius:6,background:idx===0?"#FEF3C7":idx===1?"#F1F5F9":idx===2?"#FFF7ED":"#F9FAFB",color:idx===0?"#92400E":"#9CA3AF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.63rem",fontWeight:800,flexShrink:0}}>
                          {idx+1}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:"0.78rem",fontWeight:600,color:"#111827",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                            {l.type==="car"?<i className="fa-solid fa-car"/>:<i className="fa-solid fa-map"/>} {l.name}
                          </div>
                          <div style={{height:4,background:"#F3F4F6",borderRadius:50,marginTop:3}}>
                            <div style={{width:`${(l.revenue/maxLRev)*100}%`,height:"100%",background:l.type==="car"?"#2563EB":"#7C3AED",borderRadius:50}}/>
                          </div>
                        </div>
                        <div style={{flexShrink:0,textAlign:"right"}}>
                           <div style={{fontSize:"0.78rem",fontWeight:800,color:"#059669"}}>{fmtMoney(l.revenue)}</div>
                          <div style={{fontSize:"0.63rem",color:"var(--muted)"}}>{l.count} bkgs</div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* Row 3 â€" Commission trend (full width) */}
              <div style={{...CARD,marginBottom:"1rem"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.75rem"}}>
                  <div>
                    <div style={CTITLE}>Commission Revenue Trend (Last 6 Months)</div>
                    <div style={{fontSize:"1.5rem",fontWeight:800,color:"#111827",lineHeight:1.1}}>{fmtMoney(totalCommission)}</div>
                    <div style={{fontSize:"0.72rem",color:"var(--success)",marginTop:"0.15rem"}}>Total platform commission earned</div>
                  </div>
                  <div style={{display:"flex",gap:"0.5rem"}}>
                    {[["This Month",fmtMoney(commissionThisMonth),"#059669"],["Last Month",fmtMoney(commissionLastMonth),"#6B7280"],["This Year",fmtMoney(commissionThisYear),"#2563EB"]].map(([l,v,c])=>(
                      <div key={l} style={{background:"#F9FAFB",borderRadius:10,padding:"0.45rem 0.8rem",textAlign:"center",border:"1px solid #E9ECF0"}}>
                        <div style={{fontSize:"0.6rem",color:"var(--muted)",fontWeight:600,textTransform:"uppercase",letterSpacing:".06em"}}>{l}</div>
                        <div style={{fontSize:"0.9rem",fontWeight:800,color:c,marginTop:"0.1rem"}}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <AreaSparkline data={last6Months.map(m=>({label:m.label,value:m.commission}))} color="#7C3AED" />
              </div>

              {/* Row 4 â€" Listing health + Booking conversion */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",marginBottom:"1rem"}}>
                <div style={CARD}>
                  <div style={CTITLE}>Listing Health</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.65rem",marginTop:"0.25rem"}}>
                    {[["Total Cars",cars.length,"#2563EB"],["Avail. Cars",cars.filter(c=>c.available).length,"#059669"],["Total Tours",tours.length,"#7C3AED"],["Avail. Tours",tours.filter(t=>t.available).length,"#059669"]].map(([l,v,c])=>(
                      <div key={l} style={{background:"#F8FAFC",borderRadius:12,padding:"0.75rem",border:"1px solid #E9ECF0",textAlign:"center"}}>
                        <div style={{fontSize:"1.5rem",fontWeight:800,color:c}}>{v}</div>
                        <div style={{fontSize:"0.68rem",color:"var(--muted)",fontWeight:600,marginTop:"0.1rem"}}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={CARD}>
                  <div style={CTITLE}>Booking Performance</div>
                  {[["Conversion Rate",`${convRate}%`,"#059669"],["Cancellation Rate",`${cancelRate}%`,"#DC2626"],["Avg Booking Value",avgBkVal>0?fmtPeso(avgBkVal):"—","#2563EB"],["Pending Rate",bookings.length>0?`${Math.round(pendingBk/bookings.length*100)}%`:"0%","#D97706"]].map(([l,v,c])=>(
                    <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.55rem 0",borderBottom:"1px solid #F3F4F6",fontSize:"0.85rem"}}>
                      <span style={{color:"var(--muted)"}}>{l}</span>
                      <span style={{fontWeight:800,color:c}}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          );
        })()}

        {/* -- APPLICATIONS (pending vendors + customers) -- */}
        {section === "applications" && (() => {
          const pendingVendorList   = vendors.filter(v => (v.approvalStatus||"pending") === "pending");
          const pendingCustomerList = pendingCustomers;
          const activeList = appTab === "vendors" ? pendingVendorList : pendingCustomerList;
          const appFiltered = activeList.filter(v => {
            const q = appSearch.toLowerCase();
            return !q || (v.company||v.name||"").toLowerCase().includes(q)
              || (v.email||"").toLowerCase().includes(q)
              || (v.address||"").toLowerCase().includes(q)
              || (v.services||[]).some(s => s.toLowerCase().includes(q));
          });
          return (
          <div>
            {/* Tabs */}
            <div style={{display:"flex",gap:"0.5rem",marginBottom:"1.2rem",borderBottom:"2px solid var(--border)",paddingBottom:"0"}}>
              {[["vendors","fa-solid fa-building","Vendors",pendingVendorList.length],["customers","fa-solid fa-user","Customers",pendingCustomerList.length]].map(([id,icon,label,count])=>(
                <button key={id} onClick={()=>{setAppTab(id);setAppSearch("");}}
                  style={{background:"none",border:"none",borderBottom:appTab===id?"2.5px solid var(--ocean)":"2px solid transparent",marginBottom:"-2px",padding:"0.5rem 1.1rem",fontWeight:appTab===id?700:500,color:appTab===id?"var(--ocean)":"var(--muted)",cursor:"pointer",fontSize:"0.88rem",display:"flex",alignItems:"center",gap:"0.4rem"}}>
                  <i className={icon}/> {label}
                  {count>0 && <span style={{background:"#EF4444",color:"#fff",borderRadius:50,fontSize:"0.65rem",fontWeight:700,padding:"0.1rem 0.45rem",minWidth:18,textAlign:"center"}}>{count}</span>}
                </button>
              ))}
            </div>

            {/* Header bar */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"0.8rem",marginBottom:"1.2rem"}}>
              <div style={{display:"flex",alignItems:"center",gap:"0.7rem"}}>
                <span style={{background:"#FEF3C7",color:"#92400E",borderRadius:8,padding:"0.35rem 0.8rem",fontWeight:700,fontSize:"0.85rem"}}>
                   <i className="fa-solid fa-hourglass-half"/> {activeList.length} Pending
                </span>
                <span style={{color:"var(--muted)",fontSize:"0.82rem"}}>
                  {appTab==="vendors" ? "Vendor applications awaiting your review." : "Customer registrations awaiting approval."}
                </span>
              </div>
              <input
                value={appSearch} onChange={e => setAppSearch(e.target.value)}
                placeholder="Search by name, email, address…"
                style={{border:"1.5px solid var(--border)",borderRadius:8,padding:"0.45rem 0.9rem",fontSize:"0.85rem",width:260,outline:"none"}}
              />
            </div>

            {activeList.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><i className="fa-solid fa-face-smile"/></div>
                <h3>All caught up!</h3>
                <p>No pending {appTab === "vendors" ? "vendor applications" : "customer registrations"} to review.</p>
              </div>
            ) : appFiltered.length === 0 ? (
              <div className="empty-state"><div className="empty-icon"><i className="fa-solid fa-magnifying-glass"/></div><p>No applications match your search.</p></div>
            ) : (
              <div className="table-wrap" style={{overflowX:"auto"}}>
                <table style={{minWidth: appTab==="vendors" ? 820 : 620}}>
                  <thead>
                    <tr>
                      <th style={{width:36}}>#</th>
                      <th>{appTab==="vendors" ? "Company / Owner" : "Name"}</th>
                      <th>Contact</th>
                      {appTab==="vendors" && <><th>Address</th><th>ID Verification</th><th>Services</th></>}
                      <th>Registered</th>
                      <th style={{textAlign:"center"}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appFiltered.map((v, i) => (
                      <tr key={v.id} style={{verticalAlign:"middle"}}>
                        <td style={{color:"var(--muted)",fontSize:"0.8rem",textAlign:"center"}}>{i + 1}</td>
                        <td>
                          <div style={{display:"flex",alignItems:"center",gap:"0.6rem"}}>
                            <div style={{width:34,height:34,borderRadius:10,background:appTab==="vendors"?"linear-gradient(135deg,#D97706,#F59E0B)":"linear-gradient(135deg,#2563EB,#06B6D4)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.95rem",flexShrink:0}}>
                              <i className={appTab==="vendors"?"fa-solid fa-building":"fa-solid fa-user"}/>
                            </div>
                            <div>
                              <div style={{fontWeight:700,fontSize:"0.88rem",color:"var(--ink)"}}>{appTab==="vendors" ? (v.company||v.name) : v.name}</div>
                              {appTab==="vendors" && <div style={{fontSize:"0.76rem",color:"var(--muted)"}}>{v.name}</div>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{fontSize:"0.82rem"}}>{v.email}</div>
                          <div style={{fontSize:"0.76rem",color:"var(--muted)"}}>{v.phone || "—"}</div>
                        </td>
                        {appTab==="vendors" && <>
                          <td style={{fontSize:"0.82rem",color:"var(--muted)",maxWidth:150,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v.address || "—"}</td>
                          <td>
                            {v.idType ? (
                              <div>
                                <div style={{fontSize:"0.78rem",fontWeight:600,color:"#6D28D9",background:"#F3F0FF",padding:"0.15rem 0.5rem",borderRadius:6,display:"inline-block",marginBottom:"0.2rem"}}><i className="fa-solid fa-id-card"/> {v.idType}</div>
                                {v.idNumber && <div style={{fontSize:"0.74rem",color:"var(--muted)"}}>{v.idNumber}</div>}
                              </div>
                            ) : (
                              <span style={{fontSize:"0.78rem",color:"var(--muted)"}}>—</span>
                            )}
                          </td>
                          <td>
                            <div style={{display:"flex",gap:"0.3rem",flexWrap:"wrap"}}>
                              {(v.services||[]).map(s => (
                                <span key={s} style={{background:"#F0F9FF",color:"var(--ocean)",fontSize:"0.7rem",fontWeight:600,padding:"0.15rem 0.5rem",borderRadius:50}}>{s}</span>
                              ))}
                            </div>
                          </td>
                        </>}
                        <td style={{fontSize:"0.82rem",color:"var(--muted)",whiteSpace:"nowrap"}}>{v.joined}</td>
                        <td style={{textAlign:"center"}}>
                          <div style={{display:"flex",gap:"0.35rem",justifyContent:"center"}}>
                            {appTab==="vendors" && (
                              <button data-tip="Review Profile"
                                onClick={() => { setViewVendor(v); setRejectReason(""); }}
                                style={{background:"var(--ocean)",color:"#fff",border:"none",padding:"0.35rem 0.7rem",borderRadius:7,cursor:"pointer",fontWeight:700,fontSize:"0.78rem"}}>
                                 <i className="fa-solid fa-eye"/>
                              </button>
                            )}
                            <button data-tip="Approve"
                              onClick={() => handleApprove(v.id)}
                              style={{background:"#D1FAE5",color:"var(--success)",border:"none",padding:"0.35rem 0.7rem",borderRadius:7,cursor:"pointer",fontWeight:700,fontSize:"0.78rem"}}>
                               <i className="fa-solid fa-circle-check"/>
                            </button>
                            <button data-tip="Reject"
                              onClick={() => { appTab === 'vendors' ? (setViewVendor(v) || setRejectReason('')) : rejectVendor(v.id, ''); }}
                              style={{background:"#FEE2E2",color:"var(--danger)",border:"none",padding:"0.35rem 0.7rem",borderRadius:7,cursor:"pointer",fontWeight:700,fontSize:"0.78rem"}}>
                               <i className="fa-solid fa-circle-xmark"/>
                            </button>
                            <button data-tip="Delete"
                              onClick={() => setDeleteConfirm(v.id)}
                              style={{background:"#F3F4F6",color:"var(--muted)",border:"none",padding:"0.35rem 0.7rem",borderRadius:7,cursor:"pointer",fontWeight:700,fontSize:"0.78rem"}}>
                              <i className="fa-solid fa-trash"/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          );
        })()}

        {/* â"€â"€ APPROVED VENDORS â"€â"€ */}
        {section === "approved_vendors" && (() => {
          const avFiltered = approvedVendors.filter(v => {
            const q = avSearch.toLowerCase();
            return !q || (v.company||v.name||"").toLowerCase().includes(q)
              || (v.email||"").toLowerCase().includes(q)
              || (v.address||"").toLowerCase().includes(q)
              || (v.services||[]).some(s => s.toLowerCase().includes(q));
          });
          return (
          <div>
            {/* Header bar */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"0.8rem",marginBottom:"1.2rem"}}>
              <div style={{display:"flex",alignItems:"center",gap:"0.7rem"}}>
                <span style={{background:"#DCFCE7",color:"#166534",borderRadius:8,padding:"0.35rem 0.8rem",fontWeight:700,fontSize:"0.85rem"}}>
                   <i className="fa-solid fa-circle-check"/> {approvedVendors.length} Approved
                </span>
                <span style={{color:"var(--muted)",fontSize:"0.82rem"}}>Active vendors who can post listings and receive bookings.</span>
              </div>
              <input
                value={avSearch} onChange={e => setAvSearch(e.target.value)}
                placeholder="Search by name, email, address, serviceâ€¦"
                style={{border:"1.5px solid var(--border)",borderRadius:8,padding:"0.45rem 0.9rem",fontSize:"0.85rem",width:260,outline:"none"}}
              />
            </div>

            {avFiltered.length === 0 ? (
              <div className="empty-state"><div className="empty-icon"><i className="fa-solid fa-magnifying-glass"/></div><p>No vendors match your search.</p></div>
            ) : (
              <div className="table-wrap" style={{overflowX:"auto"}}>
                <table style={{minWidth:700}}>
                  <thead>
                    <tr>
                      <th style={{width:36}}>#</th>
                      <th>Company / Owner</th>
                      <th>Contact</th>
                      <th>Address</th>
                      <th>Services</th>
                      <th>Joined</th>
                      <th style={{textAlign:"center"}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {avFiltered.map((v, i) => (
                      <tr key={v.id} style={{verticalAlign:"middle"}}>
                        <td style={{color:"var(--muted)",fontSize:"0.8rem",textAlign:"center"}}>{i + 1}</td>
                        <td>
                          <div style={{display:"flex",alignItems:"center",gap:"0.6rem"}}>
                             <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,var(--ocean),var(--teal))",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.95rem",flexShrink:0}}><i className="fa-solid fa-building"/></div>
                            <div>
                              <div style={{fontWeight:700,fontSize:"0.88rem",color:"var(--ink)"}}>{v.company || v.name}</div>
                              <div style={{fontSize:"0.76rem",color:"var(--muted)"}}>{v.name}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{fontSize:"0.82rem"}}>{v.email}</div>
                          <div style={{fontSize:"0.76rem",color:"var(--muted)"}}>{v.phone || "—"}</div>
                        </td>
                        <td style={{fontSize:"0.82rem",color:"var(--muted)",maxWidth:160,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v.address || "—"}</td>
                        <td>
                          <div style={{display:"flex",gap:"0.3rem",flexWrap:"wrap"}}>
                            {(v.services||[]).map(s => (
                              <span key={s} style={{background:"#F0F9FF",color:"var(--ocean)",fontSize:"0.7rem",fontWeight:600,padding:"0.15rem 0.5rem",borderRadius:50}}>{s}</span>
                            ))}
                          </div>
                        </td>
                        <td style={{fontSize:"0.82rem",color:"var(--muted)",whiteSpace:"nowrap"}}>{v.joined}</td>
                        <td style={{textAlign:"center"}}>
                          <div style={{display:"flex",gap:"0.35rem",justifyContent:"center"}}>
                            <button data-tip="View Profile"
                              onClick={() => { setViewVendor(v); setRejectReason(""); }}
                              style={{background:"var(--ocean)",color:"#fff",border:"none",padding:"0.35rem 0.7rem",borderRadius:7,cursor:"pointer",fontWeight:700,fontSize:"0.78rem"}}>
                               <i className="fa-solid fa-eye"/>
                            </button>
                            <button data-tip="Resend Invite"
                              onClick={() => handleResendInvite(v.id)}
                              style={{background:"#EDE9FE",color:"#7C3AED",border:"none",padding:"0.35rem 0.7rem",borderRadius:7,cursor:"pointer",fontWeight:700,fontSize:"0.78rem"}}>
                               <i className="fa-solid fa-envelope"/>
                            </button>
                            <button data-tip="Suspend"
                              onClick={() => rejectVendor(v.id, "Suspended by admin.")}
                              style={{background:"#FEF3C7",color:"#92400E",border:"none",padding:"0.35rem 0.7rem",borderRadius:7,cursor:"pointer",fontWeight:700,fontSize:"0.78rem"}}>
                               <i className="fa-solid fa-ban"/>
                            </button>
                            <button data-tip="Delete"
                              onClick={() => setDeleteConfirm(v.id)}
                              style={{background:"#FEE2E2",color:"var(--danger)",border:"none",padding:"0.35rem 0.7rem",borderRadius:7,cursor:"pointer",fontWeight:700,fontSize:"0.78rem"}}>
                              <i className="fa-solid fa-trash"/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          );
        })()}

        {/* â"€â"€ REJECTED VENDORS â"€â"€ */}
        {section === "rejected_vendors" && (() => {
          const rvFiltered = rejectedVendors.filter(v => {
            const q = rvSearch.toLowerCase();
            return !q || (v.company||v.name||"").toLowerCase().includes(q)
              || (v.email||"").toLowerCase().includes(q)
              || (v.address||"").toLowerCase().includes(q);
          });
          return (
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"0.8rem",marginBottom:"1.2rem"}}>
              <div style={{display:"flex",alignItems:"center",gap:"0.7rem"}}>
                <span style={{background:"#FEE2E2",color:"#991B1B",borderRadius:8,padding:"0.35rem 0.8rem",fontWeight:700,fontSize:"0.85rem"}}>
                   <i className="fa-solid fa-circle-xmark"/> {rejectedVendors.length} Rejected
                </span>
                <span style={{color:"var(--muted)",fontSize:"0.82rem"}}>Not approved. You can re-approve or permanently delete.</span>
              </div>
              <input value={rvSearch} onChange={e=>setRvSearch(e.target.value)}
                placeholder="Search by name, email, addressâ€¦"
                style={{border:"1.5px solid var(--border)",borderRadius:8,padding:"0.45rem 0.9rem",fontSize:"0.85rem",width:260,outline:"none"}}/>
            </div>
            {rejectedVendors.length === 0 ? (
              <div className="empty-state"><div className="empty-icon"><i className="fa-solid fa-face-smile"/></div><h3>No rejected vendors</h3><p>All vendor applications have been approved or are still pending.</p></div>
            ) : rvFiltered.length === 0 ? (
              <div className="empty-state"><div className="empty-icon"><i className="fa-solid fa-magnifying-glass"/></div><p>No vendors match your search.</p></div>
            ) : (
              <div className="table-wrap" style={{overflowX:"auto"}}>
                <table style={{minWidth:720}}>
                  <thead>
                    <tr>
                      <th style={{width:36}}>#</th>
                      <th>Company / Owner</th>
                      <th>Contact</th>
                      <th>Address</th>
                      <th>Rejection Reason</th>
                      <th>Joined</th>
                      <th style={{textAlign:"center"}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rvFiltered.map((v,i) => (
                      <tr key={v.id}>
                        <td style={{color:"var(--muted)",fontSize:"0.8rem",textAlign:"center"}}>{i+1}</td>
                        <td>
                          <div style={{display:"flex",alignItems:"center",gap:"0.6rem"}}>
                             <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#EF4444,#F97316)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.95rem",flexShrink:0}}><i className="fa-solid fa-building"/></div>
                            <div>
                              <div style={{fontWeight:700,fontSize:"0.88rem"}}>{v.company||v.name}</div>
                              <div style={{fontSize:"0.76rem",color:"var(--muted)"}}>{v.name}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{fontSize:"0.82rem"}}>{v.email}</div>
                          <div style={{fontSize:"0.76rem",color:"var(--muted)"}}>{v.phone||"—"}</div>
                        </td>
                        <td style={{fontSize:"0.82rem",color:"var(--muted)",maxWidth:140,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v.address||"—"}</td>
                        <td style={{maxWidth:180}}>
                          {v.rejectionReason
                            ? <span style={{fontSize:"0.78rem",color:"#991B1B",background:"#FEF2F2",padding:"0.2rem 0.5rem",borderRadius:6,display:"inline-block"}}>{v.rejectionReason}</span>
                            : <span style={{fontSize:"0.78rem",color:"var(--muted)"}}>—</span>}
                        </td>
                        <td style={{fontSize:"0.82rem",color:"var(--muted)",whiteSpace:"nowrap"}}>{v.joined}</td>
                        <td style={{textAlign:"center"}}>
                          <div style={{display:"flex",gap:"0.35rem",justifyContent:"center"}}>
                            <button data-tip="View Profile" onClick={()=>{setViewVendor(v);setRejectReason("");}}
                               style={{background:"var(--ocean)",color:"#fff",border:"none",padding:"0.35rem 0.7rem",borderRadius:7,cursor:"pointer",fontWeight:700,fontSize:"0.78rem"}}><i className="fa-solid fa-eye"/></button>
                            <button data-tip="Re-approve" onClick={()=>handleApprove(v.id)}
                               style={{background:"#D1FAE5",color:"var(--success)",border:"none",padding:"0.35rem 0.7rem",borderRadius:7,cursor:"pointer",fontWeight:700,fontSize:"0.78rem"}}><i className="fa-solid fa-circle-check"/></button>
                            <button data-tip="Delete" onClick={()=>setDeleteConfirm(v.id)}
                              style={{background:"#FEE2E2",color:"var(--danger)",border:"none",padding:"0.35rem 0.7rem",borderRadius:7,cursor:"pointer",fontWeight:700,fontSize:"0.78rem"}}><i className="fa-solid fa-trash"/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          );
        })()}

        {/* â"€â"€ BOOKINGS â"€â"€ */}
        {section === "bookings" && (() => {
          const bkFiltered = bookings.filter(b => {
            const q = bkSearch.toLowerCase();
            const matchQ = !q || (b.name||"").toLowerCase().includes(q)
              || (b.id||"").toLowerCase().includes(q)
              || (b.email||"").toLowerCase().includes(q)
              || (b.type||"").toLowerCase().includes(q);
            const matchType = bkTypeFilter === "all" || b.type === bkTypeFilter;
            return matchQ && matchType;
          });
          const fmtTs = (ts) => {
            if (!ts) return "—";
            const d = new Date(ts);
            return d.toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})
              + " " + d.toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit"});
          };
          return (
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"0.8rem",marginBottom:"1.2rem"}}>
              <div style={{display:"flex",alignItems:"center",gap:"0.7rem",flexWrap:"wrap"}}>
                <span style={{background:"#EFF6FF",color:"#1D4ED8",borderRadius:8,padding:"0.35rem 0.8rem",fontWeight:700,fontSize:"0.85rem"}}>
                   <i className="fa-solid fa-calendar"/> {bkFiltered.length} Booking{bkFiltered.length!==1?"s":""}
                </span>
                <div style={{display:"flex",gap:"0.35rem"}}>
                  {[["all","All"],["car","Car"],["tour","Tour"]].map(([val,label]) => (
                    <button key={val} onClick={() => setBkTypeFilter(val)}
                      style={{border:"none",borderRadius:7,padding:"0.35rem 0.85rem",cursor:"pointer",fontWeight:700,fontSize:"0.8rem",
                        background: bkTypeFilter === val ? "var(--ocean)" : "#F3F4F6",
                        color: bkTypeFilter === val ? "#fff" : "#6B7280"}}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <input
                value={bkSearch} onChange={e=>setBkSearch(e.target.value)}
                placeholder="Search by name, ID, email, typeâ€¦"
                style={{border:"1.5px solid var(--border)",borderRadius:8,padding:"0.45rem 0.9rem",fontSize:"0.85rem",width:260,outline:"none"}}
              />
            </div>
            {bkFiltered.length === 0 ? (
              <div className="empty-state"><div className="empty-icon"><i className="fa-solid fa-magnifying-glass"/></div><p>No bookings match your search.</p></div>
            ) : (
              <div className="table-wrap" style={{overflowX:"auto"}}>
                <table style={{minWidth:780}}>
                  <thead>
                    <tr>
                      <th style={{width:36}}>#</th>
                      <th>Booking</th>
                      <th>Customer</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th style={{textAlign:"center"}}>Guests</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Booked On</th>
                      <th style={{textAlign:"center"}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bkFiltered.map((b, i) => (
                      <tr key={b.id} style={{verticalAlign:"middle"}}>
                        <td style={{color:"var(--muted)",fontSize:"0.8rem",textAlign:"center"}}>{i+1}</td>
                        <td>
                          <div style={{display:"flex",alignItems:"center",gap:"0.6rem"}}>
                            <div style={{width:34,height:34,borderRadius:10,background:b.type==="car"?"linear-gradient(135deg,#2563EB,#60A5FA)":"linear-gradient(135deg,#059669,#34D399)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.95rem",flexShrink:0}}>
                              {b.type==="car"?<i className="fa-solid fa-car"/>:<i className="fa-solid fa-map"/>}
                            </div>
                            <div>
                              <div style={{fontWeight:700,fontSize:"0.88rem",color:"var(--ink)"}}>{b.id}</div>
                              <div style={{fontSize:"0.76rem",color:"var(--muted)"}}>{b.type==="car"?"Car Rental":"Tour Package"}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{fontSize:"0.82rem",fontWeight:600}}>{b.name}</div>
                          <div style={{fontSize:"0.76rem",color:"var(--muted)"}}>{b.phone||b.email||"—"}</div>
                        </td>
                        <td>
                          <span style={{background:b.type==="car"?"#EFF6FF":"#F0FDF4",color:b.type==="car"?"#1D4ED8":"#166534",fontSize:"0.75rem",fontWeight:700,padding:"0.2rem 0.55rem",borderRadius:50}}>
                             {b.type==="car"?"Car":"Tour"}
                          </span>
                        </td>
                        <td style={{fontSize:"0.82rem",color:"var(--muted)",whiteSpace:"nowrap"}}>
                          <div>{b.date}</div>
                           {b.pickTime && <div style={{fontSize:"0.76rem"}}><i className="fa-solid fa-clock"/> {b.pickTime}</div>}
                        </td>
                        <td style={{fontSize:"0.82rem",textAlign:"center"}}>{b.guests}</td>
                        <td style={{fontWeight:700,fontSize:"0.88rem"}}>{fmtPeso(b.total)}</td>
                        <td><StatusBadge status={b.status}/></td>
                        <td style={{fontSize:"0.76rem",color:"var(--muted)",whiteSpace:"nowrap"}}>{fmtTs(b.createdAt)}</td>
                        <td style={{textAlign:"center"}}>
                          <div style={{display:"flex",gap:"0.35rem",justifyContent:"center"}}>
                            {b.status==="pending"&&<button className="action-btn approve" onClick={()=>updateBookingStatus(b.id,"approved")} data-tip="Approve Booking"><i className="fa-solid fa-check"/></button>}
                            {b.status!=="cancelled"&&<button className="action-btn reject" data-tip="Cancel Booking" onClick={()=>updateBookingStatus(b.id,"cancelled")}><i className="fa-solid fa-xmark"/></button>}
                            <button className="action-btn view" data-tip="Download PDF" onClick={()=>{const itm=b.type==="car"?cars.find(c=>c.id===b.itemId):tours.find(t=>t.id===b.itemId);setPdfModal({booking:b,itemName:itm?.name||"—",item:itm||null});}}><i className="fa-solid fa-file-pdf"/></button>
                            <button className="action-btn delete" data-tip="Delete" onClick={()=>setDeleteBookingId(b.id)}><i className="fa-solid fa-trash"/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          );
        })()}

        {/* â"€â"€ ALL USERS â"€â"€ */}
        {section === "users" && (() => {
          const usersBase = userTab==="vendor" ? vendors : userTab==="customer" ? customers : users.filter(u=>u.role!=="admin");
          const userFiltered = usersBase.filter(u => {
            const q = userSearch.toLowerCase();
            return !q || (u.name||"").toLowerCase().includes(q)
              || (u.email||"").toLowerCase().includes(q)
              || (u.company||"").toLowerCase().includes(q);
          });
          return (
          <div>
            {/* Header with tab-buttons + search */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"0.8rem",marginBottom:"1.2rem"}}>
              <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
                {[
                  ["all",      "All Users",   users.filter(u=>u.role!=="admin").length],
                  ["vendor",   "Vendors",      vendors.length],
                  ["customer", "Customers",    customers.length],
                ].map(([id,label,count]) => (
                  <button key={id} onClick={()=>{setUserTab(id);setUserSearch("");}}
                    style={{background:userTab===id?"var(--ocean)":"#F3F4F6",color:userTab===id?"#fff":"var(--muted)",
                      border:"none",borderRadius:8,padding:"0.4rem 0.9rem",cursor:"pointer",fontWeight:700,fontSize:"0.82rem",display:"flex",alignItems:"center",gap:"0.4rem"}}>
                    {label}
                    <span style={{background:userTab===id?"rgba(255,255,255,0.25)":"var(--border)",color:userTab===id?"#fff":"var(--muted)",borderRadius:50,padding:"0.05rem 0.45rem",fontSize:"0.72rem"}}>{count}</span>
                  </button>
                ))}
              </div>
              <input value={userSearch} onChange={e=>setUserSearch(e.target.value)}
                placeholder="Search by name, email, companyâ€¦"
                style={{border:"1.5px solid var(--border)",borderRadius:8,padding:"0.45rem 0.9rem",fontSize:"0.85rem",width:260,outline:"none"}}/>
            </div>

            {userFiltered.length === 0 ? (
              <div className="empty-state"><div className="empty-icon"><i className="fa-solid fa-magnifying-glass"/></div><p>No users match your search.</p></div>
            ) : (
              <div className="table-wrap" style={{overflowX:"auto"}}>
                <table style={{minWidth:740}}>
                  <thead>
                    <tr>
                      <th style={{width:36}}>#</th>
                      <th>Name</th>
                      <th>Contact</th>
                      <th>Role</th>
                      <th>Company</th>
                      <th>Joined</th>
                      <th>Status</th>
                      <th style={{textAlign:"center"}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userFiltered.map((u, i) => {
                      const isSuspended = u.status === "inactive";
                      const hasDeletionReq = !!u.deletionRequested;
                      const displayStatus = isSuspended ? "inactive"
                        : u.approvalStatus === "pending" ? "pending"
                        : u.approvalStatus === "rejected" ? "cancelled"
                        : hasDeletionReq ? "pending"
                        : "active";
                      const statusLabel = isSuspended ? "Suspended"
                        : u.approvalStatus === "pending" ? "Pending"
                        : u.approvalStatus === "rejected" ? "Rejected"
                        : hasDeletionReq ? "Del. Req."
                        : "Active";
                      const avatarBg = isSuspended
                        ? "linear-gradient(135deg,#F97316,#EF4444)"
                        : u.role==="vendor"
                          ? "linear-gradient(135deg,var(--ocean),var(--teal))"
                          : "linear-gradient(135deg,#6366F1,#8B5CF6)";
                      return (
                        <tr key={u.id} style={{verticalAlign:"middle",background:hasDeletionReq?"#FFF5F5":isSuspended?"#FFFBEB":""}}>
                          <td style={{color:"var(--muted)",fontSize:"0.8rem",textAlign:"center"}}>{i+1}</td>
                          <td>
                            <div style={{display:"flex",alignItems:"center",gap:"0.6rem"}}>
                              <div style={{width:34,height:34,borderRadius:10,background:avatarBg,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.95rem",flexShrink:0}}>
                                 {u.role==="vendor"?<i className="fa-solid fa-building"/>:<i className="fa-solid fa-user"/>}
                              </div>
                              <div>
                                <div style={{fontWeight:700,fontSize:"0.88rem",color:"var(--ink)"}}>{u.name}</div>
                                <div style={{fontSize:"0.76rem",color:"var(--muted)"}}>{u.role==="vendor"?(u.company||"Vendor"):"Customer"}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{fontSize:"0.82rem"}}>{u.email}</div>
                            <div style={{fontSize:"0.76rem",color:"var(--muted)"}}>{u.phone||"—"}</div>
                          </td>
                          <td>
                            <span style={{background:u.role==="vendor"?"#DBEAFE":"#EDE9FE",color:u.role==="vendor"?"#1D4ED8":"#5B21B6",
                              fontSize:"0.75rem",fontWeight:700,padding:"0.2rem 0.55rem",borderRadius:50}}>
                               {u.role==="vendor"?"Vendor":"Customer"}
                            </span>
                          </td>
                          <td style={{fontSize:"0.82rem",color:"var(--muted)"}}>{u.company||"—"}</td>
                          <td style={{fontSize:"0.82rem",color:"var(--muted)",whiteSpace:"nowrap"}}>{u.joined}</td>
                          <td>
                            <span style={{display:"inline-block",padding:"0.22rem 0.7rem",borderRadius:50,fontSize:"0.72rem",fontWeight:700,
                              background:isSuspended?"#FEF3C7":hasDeletionReq?"#FEE2E2":displayStatus==="pending"?"#FEF3C7":displayStatus==="cancelled"?"#FEE2E2":"#D1FAE5",
                              color:isSuspended?"#92400E":hasDeletionReq?"#991B1B":displayStatus==="pending"?"#92400E":displayStatus==="cancelled"?"#991B1B":"#065F46"}}>
                              {statusLabel}
                            </span>
                          </td>
                          <td style={{textAlign:"center"}}>
                            <div style={{display:"flex",gap:"0.35rem",justifyContent:"center",flexWrap:"wrap"}}>
                              {u.role==="vendor" && (
                                <button className="action-btn view" data-tip="View Vendor Profile" onClick={()=>{setViewVendor(u);setRejectReason("");}}>
                                  <i className="fa-solid fa-eye"/>
                                </button>
                              )}
                              {u.role==="vendor" && u.approvalStatus==="pending" && (
                                <button className="action-btn approve" onClick={()=>handleApprove(u.id)} data-tip="Approve Vendor"><i className="fa-solid fa-check"/></button>
                              )}
                              {u.role==="vendor" && u.approvalStatus==="rejected" && (
                                <button className="action-btn approve" style={{background:"#D1FAE5",color:"var(--success)"}} onClick={()=>handleApprove(u.id)} data-tip="Re-approve Vendor"><i className="fa-solid fa-rotate-left"/></button>
                              )}
                              <button className="action-btn edit"
                                title={isSuspended?"Reinstate account":"Suspend account"}
                                onClick={()=>setSuspendModal({uid:u.id,name:u.name,role:u.role,currentStatus:u.status})}>
                                {isSuspended ? <><i className="fa-solid fa-check"/> Reinstate</> : <><i className="fa-solid fa-ban"/> Suspend</>}
                              </button>
                              {hasDeletionReq && (
                                <button className="action-btn view" data-tip="Review Deletion Request"
                                  style={{background:"#FEE2E2",color:"var(--danger)"}}
                                  onClick={()=>setSection("deletion_requests")}>
                                  <i className="fa-solid fa-trash"/> Review
                                </button>
                              )}
                              <button className="action-btn delete" data-tip="Delete"
                                style={{background:"#FEE2E2",color:"var(--danger)",fontWeight:700}}
                                onClick={()=>setDeleteConfirm(u.id)}>
                                <i className="fa-solid fa-trash"/>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          );
        })()}

        {/* â"€â"€ COMMISSION REVENUE â"€â"€ */}
        {section === "commission_revenue" && (
          <div>
            {/* Header summary banner */}
            <div style={{background:"linear-gradient(135deg,var(--ocean),var(--teal))",borderRadius:16,padding:"1.8rem 2rem",color:"#fff",marginBottom:"1.5rem",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"1rem"}}>
              <div>
                <div style={{fontSize:"0.78rem",fontWeight:700,opacity:.75,textTransform:"uppercase",letterSpacing:".1em",marginBottom:"0.4rem"}}>Platform Commission ({serviceFee}% service fee)</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"2.2rem",fontWeight:700,marginBottom:"0.3rem"}}>{fmtMoney(totalCommission)}</div>
                <div style={{opacity:.8,fontSize:"0.88rem"}}>All-time commission from {bookings.filter(b=>b.status==="approved").length} approved booking{bookings.filter(b=>b.status==="approved").length!==1?"s":""}</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
                {[
                  ["This Month",  fmtMoney(commissionThisMonth)],
                  ["Last Month",  fmtMoney(commissionLastMonth)],
                  [`${thisYear}`, fmtMoney(commissionThisYear)],
                  ["Pending",     fmtMoney(pendingCommission)],
                ].map(([l,v]) => (
                  <div key={l} style={{background:"rgba(255,255,255,0.15)",borderRadius:10,padding:"0.7rem 1rem",textAlign:"center",backdropFilter:"blur(4px)"}}>
                    <div style={{fontSize:"0.7rem",fontWeight:700,opacity:.8,textTransform:"uppercase",letterSpacing:".06em"}}>{l}</div>
                    <div style={{fontSize:"1.1rem",fontWeight:700,marginTop:"0.2rem"}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly chart */}
            <div style={{background:"#fff",borderRadius:16,border:"1px solid var(--border)",padding:"1.5rem 1.5rem 1rem",marginBottom:"1.5rem"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.4rem",flexWrap:"wrap",gap:"0.5rem"}}>
                <h3 style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:"1rem",margin:0}}><i className="fa-solid fa-chart-line"/> Monthly Revenue & Commission (Last 6 Months)</h3>
                <div style={{display:"flex",gap:"1.2rem",fontSize:"0.78rem",alignItems:"center"}}>
                  <span style={{display:"flex",alignItems:"center",gap:"0.45rem"}}>
                    <svg width="12" height="12" viewBox="0 0 12 12" style={{flexShrink:0}}><rect width="12" height="12" rx="3" fill="#2563EB"/></svg>
                    Total Revenue
                  </span>
                  <span style={{display:"flex",alignItems:"center",gap:"0.45rem"}}>
                    <svg width="12" height="12" viewBox="0 0 12 12" style={{flexShrink:0}}><rect width="12" height="12" rx="3" fill="#0D9488"/></svg>
                    Commission
                  </span>
                  <span style={{display:"flex",alignItems:"center",gap:"0.45rem"}}>
                    <svg width="22" height="10" viewBox="0 0 22 10" style={{flexShrink:0}}>
                      <line x1="0" y1="5" x2="22" y2="5" stroke="#0D9488" strokeWidth="2" strokeDasharray="4 2"/>
                      <circle cx="11" cy="5" r="3" fill="#0D9488" stroke="#fff" strokeWidth="1.5"/>
                    </svg>
                    Trend
                  </span>
                </div>
              </div>

              <svg width="100%" viewBox="0 0 680 230" style={{display:"block",overflow:"visible"}}>
                <defs>
                  <linearGradient id="revGradA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB"/>
                    <stop offset="100%" stopColor="#93C5FD"/>
                  </linearGradient>
                  <linearGradient id="comGradA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0D9488"/>
                    <stop offset="100%" stopColor="#99F6E4"/>
                  </linearGradient>
                </defs>

                {/* Y-axis grid lines */}
                {[0,1,2,3,4].map(tick => {
                  const frac = tick / 4;
                  const y = 185 - frac * 158;
                  const val = Math.round(maxBarVal * frac);
                  return (
                    <g key={tick}>
                      <line x1={60} y1={y} x2={660} y2={y}
                        stroke={tick===0 ? "#CBD5E1" : "#F1F5F9"}
                        strokeWidth={tick===0 ? 1.5 : 1}/>
                      <text x={54} y={y+4} textAnchor="end" fontSize={10} fill="#94A3B8">
                        {val >= 1000 ? `₱${(val/1000).toFixed(0)}k` : `₱${val}`}
                      </text>
                    </g>
                  );
                })}

                {/* Bars + labels per month */}
                {last6Months.map((m, i) => {
                  const cx     = 114 + i * 99.3;
                  const maxH   = 158;
                  const revH   = maxBarVal > 0 ? Math.max((m.revenue   / maxBarVal) * maxH, 3) : 3;
                  const comH   = maxBarVal > 0 ? Math.max((m.commission / maxBarVal) * maxH, 3) : 3;
                  const revY   = 185 - revH;
                  const comY   = 185 - comH;
                  const isCur  = m.ym === thisMonth;
                  const comPct = m.revenue > 0 ? Math.round((m.commission / m.revenue) * 100) : 0;
                  const hov    = chartTooltip === i;
                  const tipW   = 150;
                  const tipX   = i <= 1 ? cx - 18 : i >= 4 ? cx - tipW + 18 : cx - tipW / 2;
                  const tipY   = Math.min(revY, comY) - 72;

                  return (
                    <g key={i}
                      onMouseEnter={() => setChartTooltip(i)}
                      onMouseLeave={() => setChartTooltip(null)}
                      style={{cursor:"pointer"}}>

                      {/* Column hover bg */}
                      {hov && (
                        <rect x={cx-46} y={16} width={92} height={172} rx={8}
                          fill="#EFF6FF" opacity={0.7}/>
                      )}

                      {/* Revenue bar */}
                      <rect x={cx-34} y={revY} width={30} height={revH} rx={4}
                        fill={isCur ? "url(#revGradA)" : "#BFDBFE"}
                        opacity={hov || chartTooltip === null ? 1 : 0.55}/>

                      {/* Commission bar */}
                      <rect x={cx+4} y={comY} width={24} height={comH} rx={4}
                        fill={isCur ? "url(#comGradA)" : "#5EEAD4"}
                        opacity={hov || chartTooltip === null ? 1 : 0.55}/>

                      {/* Commission % pill */}
                      {m.commission > 0 && (
                        <g>
                          <rect x={cx+1} y={comY - 19} width={32} height={15} rx={7}
                            fill={isCur ? "#0D9488" : "#CCFBF1"}/>
                          <text x={cx+17} y={comY - 8} textAnchor="middle" fontSize={9} fontWeight="700"
                            fill={isCur ? "#fff" : "#0F766E"}>
                            {comPct}%
                          </text>
                        </g>
                      )}

                      {/* Month label */}
                      <text x={cx - 9} y={202} textAnchor="middle" fontSize={11}
                        fontWeight={isCur ? 700 : 500}
                        fill={isCur ? "#1E3A5F" : "#64748B"}>
                        {m.label}
                      </text>

                      {/* Current month marker */}
                      {isCur && <circle cx={cx - 9} cy={211} r={3} fill="#F97316"/>}

                      {/* Hover tooltip */}
                      {hov && (
                        <g>
                          <rect x={tipX} y={tipY} width={tipW} height={66} rx={9}
                            fill="#0F172A" opacity={0.92}/>
                          <text x={tipX + tipW/2} y={tipY + 16} textAnchor="middle"
                            fontSize={9.5} fill="rgba(255,255,255,0.55)" fontWeight={700} letterSpacing="0.08em">
                            {m.label.toUpperCase()} {m.ym.slice(0, 4)}
                          </text>
                          <rect x={tipX + 10} y={tipY + 23} width={8} height={8} rx={2} fill="#93C5FD"/>
                          <text x={tipX + 24} y={tipY + 31} fontSize={10} fill="#CBD5EB">Revenue</text>
                          <text x={tipX + tipW - 10} y={tipY + 31} textAnchor="end"
                            fontSize={10} fill="#93C5FD" fontWeight={700}>
                            ₱{m.revenue.toLocaleString()}
                          </text>
                          <rect x={tipX + 10} y={tipY + 38} width={8} height={8} rx={2} fill="#5EEAD4"/>
                          <text x={tipX + 24} y={tipY + 46} fontSize={10} fill="#CBD5EB">Commission</text>
                          <text x={tipX + tipW - 10} y={tipY + 46} textAnchor="end"
                            fontSize={10} fill="#5EEAD4" fontWeight={700}>
                            ₱{m.commission.toLocaleString()}
                          </text>
                          <text x={tipX + tipW - 10} y={tipY + 60} textAnchor="end"
                            fontSize={9} fill="#F97316" fontWeight={700}>
                            {comPct}% margin
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* Commission trend line */}
                {last6Months.some(m => m.commission > 0) && (
                  <polyline
                    points={last6Months.map((m, i) => {
                      const cx   = 114 + i * 99.3;
                      const comY = maxBarVal > 0 ? 185 - Math.max((m.commission / maxBarVal) * 158, 3) : 185;
                      return `${cx + 16},${comY}`;
                    }).join(" ")}
                    fill="none" stroke="#0D9488" strokeWidth={2.5}
                    strokeDasharray="6 3" strokeLinecap="round" opacity={0.85}/>
                )}

                {/* Trend dots */}
                {last6Months.map((m, i) => {
                  const cx   = 114 + i * 99.3;
                  const comY = maxBarVal > 0 ? 185 - Math.max((m.commission / maxBarVal) * 158, 3) : 185;
                  return m.commission > 0 ? (
                    <circle key={i} cx={cx + 16} cy={comY} r={4.5}
                      fill="#0D9488" stroke="#fff" strokeWidth={2}/>
                  ) : null;
                })}
              </svg>

              {/* Per-month commission summary strip */}
              <div style={{display:"flex",gap:"0",marginTop:"0.8rem",paddingTop:"0.9rem",borderTop:"1px solid #F1F5F9"}}>
                {last6Months.map((m, i) => (
                  <div key={i} style={{flex:1,textAlign:"center",padding:"0.4rem 0",
                    borderRight: i < 5 ? "1px solid #F1F5F9" : "none",
                    background: m.ym === thisMonth ? "#F0F9FF" : "transparent",
                    borderRadius: m.ym === thisMonth ? 8 : 0}}>
                    <div style={{fontSize:"0.68rem",fontWeight:700,color:m.ym===thisMonth?"#2563EB":"#94A3B8",
                      textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:"0.25rem"}}>
                      {m.label}
                    </div>
                    <div style={{fontSize:"0.85rem",fontWeight:700,
                      color: m.commission > 0 ? "#0D9488" : "#CBD5E1"}}>
                      {m.commission > 0 ? `₱${m.commission.toLocaleString()}` : "—"}
                    </div>
                    {m.revenue > 0 && (
                      <div style={{fontSize:"0.65rem",color:"#94A3B8",marginTop:"0.15rem"}}>
                        of ₱{m.revenue.toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Per-booking commission breakdown */}
            <div className="table-wrap">
              <div className="table-header" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <h3>Commission Per Booking</h3>
                <div style={{display:"flex",gap:"0.5rem"}}>
                  <span style={{background:"#D1FAE5",color:"#065F46",padding:"0.25rem 0.7rem",borderRadius:50,fontSize:"0.75rem",fontWeight:700}}>
                    {serviceFee}% rate
                  </span>
                  <button onClick={()=>setSection("settings")}
                    style={{background:"var(--ocean)",color:"#fff",border:"none",padding:"0.3rem 0.8rem",borderRadius:6,cursor:"pointer",fontWeight:700,fontSize:"0.78rem"}}>
                     <i className="fa-solid fa-gear"/> Edit Rate
                  </button>
                </div>
              </div>
              <table>
                <thead>
                  <tr><th>#</th><th>Booking</th><th>Customer</th><th>Type</th><th>Date</th><th>Booking Total</th><th>Commission ({serviceFee}%)</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {bookings.filter(b=>b.status==="approved").length === 0 ? (
                    <tr><td colSpan={8} style={{textAlign:"center",padding:"2rem",color:"var(--muted)"}}>No approved bookings yet. Commission will appear here once bookings are confirmed.</td></tr>
                  ) : (
                    bookings.filter(b=>b.status==="approved").slice().reverse().map((b,i) => {
                      const comm = commissionFromBooking(b);
                      return (
                        <tr key={b.id}>
                          <td style={{color:"var(--muted)",fontSize:"0.8rem",fontWeight:600}}>{i+1}</td>
                          <td><strong>{b.id}</strong></td>
                          <td>{b.name}</td>
                           <td>{b.type==="car"?"Car":"Tour"}</td>
                          <td style={{fontSize:"0.85rem"}}>{b.date}</td>
                          <td>{fmtPeso(b.total)}</td>
                          <td>
                             <strong style={{color:"var(--success)"}}>{fmtPeso(comm)}</strong>
                          </td>
                          <td><StatusBadge status={b.status} /></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              {bookings.filter(b=>b.status==="approved").length > 0 && (
                <div style={{padding:"1rem 1.2rem",background:"linear-gradient(135deg,var(--ocean),var(--teal))",display:"flex",justifyContent:"space-between",alignItems:"center",borderRadius:"0 0 16px 16px"}}>
                  <span style={{color:"rgba(255,255,255,0.85)",fontSize:"0.88rem"}}>
                    Total from {bookings.filter(b=>b.status==="approved").length} approved booking{bookings.filter(b=>b.status==="approved").length!==1?"s":""}
                  </span>
                   <strong style={{color:"#F4E4C1",fontSize:"1.2rem"}}>{fmtMoney(totalCommission)}</strong>
                </div>
              )}
            </div>

            {/* Pending commission note */}
            {pendingCommission > 0 && (
              <div style={{background:"#FEF3C7",border:"1px solid #FCD34D",borderRadius:12,padding:"1rem 1.3rem",marginTop:"1rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                 <span><i className="fa-solid fa-hourglass-half"/> <strong>{fmtMoney(pendingCommission)}</strong> in pending commission — approve bookings to confirm this revenue.</span>
                <button onClick={()=>setSection("bookings")}
                  style={{background:"var(--ocean)",color:"#fff",border:"none",padding:"0.45rem 1rem",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:"0.82rem"}}>
                  Review Bookings <i className="fa-solid fa-arrow-right"/>
                </button>
              </div>
            )}
          </div>
        )}

        {/* â"€â"€ LISTINGS â"€â"€ */}
        {section === "listings" && (() => {
          const allListings = [
            ...cars.map(c => ({ ...c, _type:"car" })),
            ...tours.map(t => ({ ...t, _type:"tour" })),
          ];
          const listFiltered = allListings.filter(item => {
            if (listTab === "car" && item._type !== "car") return false;
            if (listTab === "tour" && item._type !== "tour") return false;
            const q = listSearch.toLowerCase();
            return !q || item.name.toLowerCase().includes(q)
              || (item.location||"").toLowerCase().includes(q)
              || (item.category||"").toLowerCase().includes(q);
          });
          const vendorName = (id) => (users.find(u=>u.id===id)?.company || users.find(u=>u.id===id)?.name || "—");
          return (
          <div>
            {/* Header */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"0.8rem",marginBottom:"1rem"}}>
              <div style={{display:"flex",gap:"0.5rem"}}>
                {[["all","All",allListings.length],["car","Cars",cars.length],["tour","Tours",tours.length]].map(([id,lbl,cnt])=>(
                  <button key={id} onClick={()=>setListTab(id)}
                    style={{background:listTab===id?"var(--ocean)":"#F3F4F6",color:listTab===id?"#fff":"var(--muted)",
                      border:"none",borderRadius:8,padding:"0.4rem 0.9rem",cursor:"pointer",fontWeight:700,fontSize:"0.82rem",display:"flex",alignItems:"center",gap:"0.4rem"}}>
                    {lbl} <span style={{background:listTab===id?"rgba(255,255,255,0.25)":"var(--border)",color:listTab===id?"#fff":"var(--muted)",borderRadius:50,padding:"0.05rem 0.45rem",fontSize:"0.72rem"}}>{cnt}</span>
                  </button>
                ))}
              </div>
              <input value={listSearch} onChange={e=>setListSearch(e.target.value)}
                placeholder="Search by name, location, categoryâ€¦"
                style={{border:"1.5px solid var(--border)",borderRadius:8,padding:"0.45rem 0.9rem",fontSize:"0.85rem",width:260,outline:"none"}}/>
            </div>
            {listFiltered.length === 0 ? (
              <div className="empty-state"><div className="empty-icon"><i className="fa-solid fa-magnifying-glass"/></div><p>No listings match your search.</p></div>
            ) : (
              <div className="table-wrap" style={{overflowX:"auto"}}>
                <table style={{minWidth:760}}>
                  <thead>
                    <tr>
                      <th style={{width:36}}>#</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Vendor</th>
                      <th>Location / Category</th>
                      <th>Price</th>
                      <th>Rating</th>
                      <th>Status</th>
                      <th style={{textAlign:"center"}}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listFiltered.map((item,i)=>(
                      <tr key={item._type+item.id}>
                        <td style={{color:"var(--muted)",fontSize:"0.8rem",textAlign:"center"}}>{i+1}</td>
                        <td>
                          <div style={{fontWeight:700,fontSize:"0.88rem"}}>{item.name}</div>
                          {item._type==="car" && <div style={{fontSize:"0.74rem",color:"var(--muted)"}}>{item.type} · {item.seats} seats · {item.fuel}</div>}
                          {item._type==="tour" && <div style={{fontSize:"0.74rem",color:"var(--muted)"}}>{item.duration} · {item.groupSize} pax max</div>}
                        </td>
                        <td>
                          <span style={{background:item._type==="car"?"#EFF6FF":"#F0FDF4",color:item._type==="car"?"#1D4ED8":"#166534",
                            fontSize:"0.75rem",fontWeight:700,padding:"0.2rem 0.55rem",borderRadius:50}}>
                             {item._type==="car"?"Car":"Tour"}
                          </span>
                        </td>
                        <td style={{fontSize:"0.82rem",color:"var(--muted)"}}>{vendorName(item.vendorId)}</td>
                        <td style={{fontSize:"0.82rem",color:"var(--muted)"}}>{item.location || item.category || "—"}</td>
                        <td style={{fontWeight:700,fontSize:"0.88rem"}}>{fmtPeso(item.price)}</td>
                         <td style={{fontSize:"0.82rem"}}><i className="fa-solid fa-star" style={{color:"#F59E0B"}}/> {item.rating} <span style={{color:"var(--muted)",fontSize:"0.75rem"}}>({item.reviews})</span></td>
                        <td><StatusBadge status={item.available?"active":"inactive"}/></td>
                        <td style={{textAlign:"center"}}>
                          <button className="action-btn delete" data-tip="Remove Listing"
                            onClick={()=>deleteListing(item._type,item.id)}
                            style={{fontSize:"0.78rem"}}><i className="fa-solid fa-trash"/> Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          );
        })()}

        {/* â"€â"€ DESTINATIONS â"€â"€ */}
        {section === "destinations" && (
          <div>
            {/* Delete Destination Confirm */}
            {destDeleteConfirm && (
              <div className="overlay" onClick={() => setDestDeleteConfirm(null)} style={{zIndex:500}}>
                <div onClick={e => e.stopPropagation()} style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:420,padding:"2rem",textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
                  <div style={{fontSize:"3rem",marginBottom:"1rem"}}><i className="fa-solid fa-trash"/></div>
                  <h3 style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,marginBottom:"0.5rem"}}>Delete Destination?</h3>
                  <p style={{color:"var(--muted)",fontSize:"0.9rem",lineHeight:1.7,marginBottom:"1.5rem"}}>
                    Permanently remove <strong>{destDeleteConfirm.name}</strong>? This cannot be undone.
                  </p>
                  <div style={{display:"flex",gap:"0.8rem"}}>
                    <button onClick={async () => {
                      if (destDeleteConfirm.id) { try { await api.destinations.delete(destDeleteConfirm.id); } catch(e) { console.error(e); } }
                      setDestinations(prev => prev.filter(d => d.name !== destDeleteConfirm.name)); setDestDeleteConfirm(null); showToast("Destination deleted.");
                    }}
                      style={{flex:1,background:"var(--danger)",color:"#fff",border:"none",padding:"0.85rem",borderRadius:12,cursor:"pointer",fontWeight:700}}>
                      Yes, Delete
                    </button>
                    <button onClick={() => setDestDeleteConfirm(null)}
                      style={{flex:1,background:"#F3F4F6",color:"var(--ink)",border:"none",padding:"0.85rem",borderRadius:12,cursor:"pointer",fontWeight:700}}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit / Add Destination Modal */}
            {editDest && (
              <div className="overlay" onClick={() => setEditDest(null)} style={{zIndex:500}}>
                <div onClick={e => e.stopPropagation()} style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:640,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
                  <div style={{background:"linear-gradient(135deg,var(--ocean),var(--teal))",padding:"1.3rem 1.8rem",borderRadius:"20px 20px 0 0",color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:2}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:"1rem"}}>{editDest._isNew ? <><i className="fa-solid fa-plus"/> Add Destination</> : <><i className="fa-solid fa-pen"/> Edit Destination</>}</div>
                      <div style={{fontSize:"0.82rem",opacity:.8}}>{editDest._isNew ? "New Cebu tourist spot" : editDest.name}</div>
                    </div>
                    <button onClick={() => setEditDest(null)} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:8,padding:"0.4rem 0.8rem",cursor:"pointer",color:"#fff",fontWeight:700}}><i className="fa-solid fa-xmark"/></button>
                  </div>
                  <div style={{padding:"1.8rem"}}>
                    <div className="form-grid">
                      {[["name","Destination Name *"],["location","Location / Barangay"],["tag","Tag (e.g. Island Hopping)"]].map(([k,lbl]) => (
                        <div key={k} className="form-group">
                          <label>{lbl}</label>
                          <input value={editDest[k]||""} onChange={e => setEditDest(d=>({...d,[k]:e.target.value}))} />
                        </div>
                      ))}
                      <div className="form-group full">
                        <ImageUploader
                          images={editDest.img ? [editDest.img] : []}
                          onChange={imgs => setEditDest(d => ({...d, img: imgs[0] || ""}))}
                          maxImages={1}
                        />
                      </div>
                      <div className="form-group">
                        <label>Tag Color</label>
                        <select value={editDest.tagColor||"var(--ocean)"} onChange={e => setEditDest(d=>({...d,tagColor:e.target.value}))}>
                          {[["var(--ocean)","Ocean Blue"],["var(--teal)","Teal"],["#e67e22","Orange"],["#8e44ad","Purple"],["#27ae60","Green"],["#c0392b","Red"]].map(([v,l])=>(
                            <option key={v} value={v}>{l}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Best Time to Visit</label>
                        <input value={editDest.bestTime||""} onChange={e => setEditDest(d=>({...d,bestTime:e.target.value}))} placeholder="Nov-May" />
                      </div>
                      <div className="form-group">
                        <label>Duration</label>
                        <input value={editDest.duration||""} onChange={e => setEditDest(d=>({...d,duration:e.target.value}))} placeholder="Full Day" />
                      </div>
                      <div className="form-group">
                        <label>Difficulty</label>
                        <select value={editDest.difficulty||"Easy"} onChange={e => setEditDest(d=>({...d,difficulty:e.target.value}))}>
                          {["Easy","Moderate","Challenging"].map(v=><option key={v}>{v}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Distance from Cebu City</label>
                        <input value={editDest.distance||""} onChange={e => setEditDest(d=>({...d,distance:e.target.value}))} placeholder="45 km south" />
                      </div>
                      <div className="form-group full">
                        <label>Description</label>
                        <textarea rows={4} value={editDest.description||""} onChange={e => setEditDest(d=>({...d,description:e.target.value}))} style={{width:"100%",padding:"0.75rem",borderRadius:10,border:"1.5px solid var(--border)",fontFamily:"inherit",fontSize:"0.9rem",resize:"vertical"}} />
                      </div>
                      <div className="form-group full">
                        <label style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          Highlights
                          <button type="button" onClick={() => setEditDest(d=>({...d,highlights:[...(d.highlights||[]),""]}))}
                            style={{background:"var(--ocean)",color:"#fff",border:"none",borderRadius:8,padding:"0.3rem 0.8rem",cursor:"pointer",fontSize:"0.8rem",fontWeight:700}}>
                            + Add
                          </button>
                        </label>
                        {(editDest.highlights||[]).map((h,i) => (
                          <div key={i} style={{display:"flex",gap:"0.5rem",marginBottom:"0.5rem"}}>
                            <input value={h} onChange={e => setEditDest(d=>{ const hl=[...(d.highlights||[])]; hl[i]=e.target.value; return {...d,highlights:hl}; })}
                              style={{flex:1,padding:"0.5rem 0.75rem",borderRadius:8,border:"1.5px solid var(--border)",fontFamily:"inherit",fontSize:"0.88rem"}} />
                            <button type="button" onClick={() => setEditDest(d=>({...d,highlights:(d.highlights||[]).filter((_,j)=>j!==i)}))}
                              style={{background:"#FEE2E2",color:"#DC2626",border:"none",borderRadius:8,padding:"0 0.7rem",cursor:"pointer",fontWeight:700,fontSize:"1rem"}}>
                              Ã—
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:"0.8rem",marginTop:"1rem"}}>
                      <button onClick={async () => {
                        if (!editDest.name) { showToast("Destination name is required."); return; }
                        const { _isNew, _origName, ...clean } = editDest;
                        if (_isNew) {
                          try {
                            const created = await api.destinations.create(clean);
                            setDestinations(prev => [...prev, created]);
                          } catch(e) { console.error(e); setDestinations(prev => [...prev, clean]); }
                          showToast("Destination added.");
                        } else {
                          const existing = destinations.find(d => d.name === _origName);
                          if (existing?.id) { try { await api.destinations.update(existing.id, clean); } catch(e) { console.error(e); } }
                          setDestinations(prev => prev.map(d => d.name === _origName ? { ...clean, id: existing?.id } : d));
                          showToast("Destination updated.");
                        }
                        setEditDest(null);
                      }} style={{flex:1,background:"linear-gradient(135deg,var(--ocean),var(--teal))",color:"#fff",border:"none",padding:"0.9rem",borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:"0.95rem"}}>
                        {editDest._isNew ? "Add Destination" : "Save Changes"}
                      </button>
                      <button onClick={() => setEditDest(null)} style={{flex:1,background:"#F3F4F6",color:"var(--ink)",border:"none",padding:"0.9rem",borderRadius:12,cursor:"pointer",fontWeight:700}}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Header + Add button */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem",flexWrap:"wrap",gap:"0.8rem"}}>
              <div>
                <h2 style={{fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:"1.3rem",margin:0}}>{destinations.length} Destinations</h2>
                <p style={{color:"var(--muted)",fontSize:"0.85rem",margin:"0.25rem 0 0"}}>Manage tourist spots shown on the home page</p>
              </div>
              <button onClick={() => setEditDest({ name:"",tag:"",tagColor:"var(--ocean)",img:"",location:"",bestTime:"",duration:"",difficulty:"Easy",distance:"",description:"",highlights:[],_isNew:true })}
                style={{background:"linear-gradient(135deg,var(--ocean),var(--teal))",color:"#fff",border:"none",borderRadius:12,padding:"0.75rem 1.4rem",cursor:"pointer",fontWeight:700,fontSize:"0.9rem",display:"flex",alignItems:"center",gap:"0.5rem"}}>
                <i className="fa-solid fa-plus"/> Add Destination
              </button>
            </div>

            {/* Destinations grid */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:"1.2rem"}}>
              {destinations.map((dest, idx) => (
                <div key={idx} style={{background:"#fff",borderRadius:16,overflow:"hidden",border:"1px solid var(--border)",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",transition:"transform .2s,box-shadow .2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.12)";}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.06)";}}>
                  <div style={{position:"relative",height:160,overflow:"hidden"}}>
                    <img src={dest.img} alt={dest.name} onError={e=>{e.target.src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400";}}
                      style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} />
                    <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.55) 0%,transparent 60%)"}} />
                    <span style={{position:"absolute",top:10,left:10,background:dest.tagColor||"var(--ocean)",color:"#fff",borderRadius:20,padding:"0.2rem 0.65rem",fontSize:"0.72rem",fontWeight:700}}>
                      {dest.tag}
                    </span>
                    <span style={{position:"absolute",bottom:10,left:12,color:"#fff",fontWeight:700,fontSize:"0.95rem",textShadow:"0 1px 4px rgba(0,0,0,0.5)"}}>
                      {dest.name}
                    </span>
                  </div>
                  <div style={{padding:"1rem"}}>
                    <div style={{display:"flex",gap:"0.5rem",fontSize:"0.78rem",color:"var(--muted)",marginBottom:"0.6rem",flexWrap:"wrap"}}>
                      {dest.location && <span><i className="fa-solid fa-location-dot"/> {dest.location}</span>}
                      {dest.duration && <span><i className="fa-solid fa-clock"/> {dest.duration}</span>}
                      {dest.difficulty && <span><i className="fa-solid fa-person-hiking"/> {dest.difficulty}</span>}
                    </div>
                    <p style={{fontSize:"0.82rem",color:"var(--muted)",lineHeight:1.5,margin:0,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
                      {dest.description}
                    </p>
                    <div style={{display:"flex",gap:"0.5rem",marginTop:"0.9rem"}}>
                      <button onClick={() => setEditDest({...dest, _origName: dest.name})}
                        style={{flex:1,background:"#EFF6FF",color:"var(--ocean)",border:"1.5px solid #BFDBFE",borderRadius:10,padding:"0.5rem",cursor:"pointer",fontWeight:700,fontSize:"0.82rem"}}>
                        <i className="fa-solid fa-pen"/> Edit
                      </button>
                      <button onClick={() => setDestDeleteConfirm(dest)}
                        style={{flex:1,background:"#FEF2F2",color:"#DC2626",border:"1.5px solid #FECACA",borderRadius:10,padding:"0.5rem",cursor:"pointer",fontWeight:700,fontSize:"0.82rem"}}>
                        <i className="fa-solid fa-trash"/> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {destinations.length === 0 && (
              <div className="empty-state" style={{marginTop:"2rem"}}>
                <div className="empty-icon"><i className="fa-solid fa-umbrella-beach"/></div>
                <p>No destinations yet. Click "Add Destination" to get started.</p>
              </div>
            )}
          </div>
        )}

        {/* â"€â"€ SETTINGS â"€â"€ */}
        {section === "settings" && (loadHeroSlides(), true) && (
          <div style={{maxWidth:680}}>

            {/* Hero Slides Card */}
            <div style={{background:"#fff",borderRadius:16,border:"1px solid var(--border)",overflow:"hidden",marginBottom:"1.5rem"}}>
              <div style={{background:"linear-gradient(135deg,#0A4D68,#0D9488)",padding:"1.2rem 1.5rem",color:"#fff"}}>
                <div style={{fontWeight:700,fontSize:"1rem",marginBottom:"0.2rem"}}><i className="fa-solid fa-images"/> Hero Slider Photos</div>
                <div style={{fontSize:"0.82rem",opacity:.85}}>Upload 5 photos shown in the homepage hero carousel. Landscape images (1600×900) work best.</div>
              </div>
              <div style={{padding:"1.5rem"}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"1rem",marginBottom:"1.2rem"}}>
                  {heroSlides.map((slide, idx) => (
                    <div key={idx} style={{border:"2px solid var(--border)",borderRadius:12,overflow:"hidden",background:"#F9FAFB"}}>
                      {/* Preview */}
                      <div style={{position:"relative",height:110,background:"#e5e7eb",overflow:"hidden"}}>
                        {slide.img && (
                          <img src={slide.img} alt={`Slide ${idx+1}`}
                            style={{width:"100%",height:"100%",objectFit:"cover"}} />
                        )}
                        <div style={{position:"absolute",top:6,left:8,background:"rgba(0,0,0,0.55)",
                          color:"#fff",fontSize:"0.7rem",fontWeight:700,padding:"2px 8px",borderRadius:20}}>
                          Slide {idx + 1}
                        </div>
                        {heroUploading[idx] && (
                          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)",
                            display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:"0.85rem",fontWeight:700}}>
                            Uploading…
                          </div>
                        )}
                      </div>
                      {/* Controls */}
                      <div style={{padding:"0.7rem"}}>
                        <input
                          type="text"
                          value={slide.label}
                          onChange={e => handleHeroLabelChange(idx, e.target.value)}
                          placeholder="Caption label…"
                          style={{width:"100%",border:"1px solid var(--border)",borderRadius:8,padding:"0.4rem 0.6rem",
                            fontSize:"0.78rem",marginBottom:"0.5rem",boxSizing:"border-box",fontFamily:"inherit"}}
                        />
                        <label style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"0.4rem",
                          background:"var(--ocean)",color:"#fff",borderRadius:8,padding:"0.45rem",
                          cursor:"pointer",fontSize:"0.78rem",fontWeight:700}}>
                          <i className="fa-solid fa-upload"/>
                          {heroUploading[idx] ? "Uploading…" : "Upload Photo"}
                          <input type="file" accept="image/*" style={{display:"none"}}
                            onChange={e => handleHeroUpload(idx, e.target.files[0])}
                            disabled={heroUploading[idx]} />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleHeroSave}
                  disabled={heroSaving}
                  style={{background:"var(--ocean)",color:"#fff",border:"none",padding:"0.85rem 2rem",
                    borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:"0.95rem",opacity:heroSaving?.7:1}}>
                  <i className="fa-solid fa-floppy-disk"/> {heroSaving ? "Saving…" : "Save Slides"}
                </button>
                <div style={{fontSize:"0.8rem",color:"var(--muted)",marginTop:"0.8rem"}}>
                  Changes go live on the homepage immediately after saving.
                </div>
              </div>
            </div>

            {/* Service Fee Card */}
            <div style={{background:"#fff",borderRadius:16,border:"1px solid var(--border)",overflow:"hidden",marginBottom:"1.5rem"}}>
              <div style={{background:"linear-gradient(135deg,var(--ocean),var(--teal))",padding:"1.2rem 1.5rem",color:"#fff"}}>
                <div style={{fontWeight:700,fontSize:"1rem",marginBottom:"0.2rem"}}><i className="fa-solid fa-money-bill-wave"/> Service Fee / Commission</div>
                <div style={{fontSize:"0.82rem",opacity:.85}}>Applied to every booking as a platform fee on top of the listing price.</div>
              </div>
              <div style={{padding:"1.5rem"}}>
                <div style={{display:"flex",gap:"1rem",alignItems:"flex-end",marginBottom:"1.2rem",flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:200}}>
                    <label style={{display:"block",fontSize:"0.78rem",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:"0.5rem"}}>
                      Fee Percentage (%)
                    </label>
                    <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
                      <input
                        type="number" min="0" max="100" step="0.5"
                        value={feeInput}
                        onChange={e => setFeeInput(e.target.value)}
                        style={{border:"2px solid var(--border)",borderRadius:10,padding:"0.75rem 1rem",
                          fontSize:"1.1rem",fontWeight:700,width:120,fontFamily:"inherit",outline:"none",
                          textAlign:"center",transition:"border-color .2s"}}
                        onFocus={e => e.target.style.borderColor="var(--teal)"}
                        onBlur={e => e.target.style.borderColor="var(--border)"}
                      />
                      <span style={{fontSize:"1.4rem",fontWeight:700,color:"var(--muted)"}}>%</span>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:"0.8rem"}}>
                    {[0, 3, 5, 8, 10].map(pct => (
                      <button key={pct} onClick={() => setFeeInput(String(pct))}
                        style={{background: Number(feeInput)===pct ? "var(--ocean)":"#F3F4F6",
                          color: Number(feeInput)===pct ? "#fff":"var(--ink)",
                          border:"none",borderRadius:8,padding:"0.5rem 0.8rem",cursor:"pointer",
                          fontWeight:700,fontSize:"0.85rem",transition:"all .15s"}}>
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live preview */}
                <div style={{background:"#F0F9FF",borderRadius:12,padding:"1.1rem 1.3rem",marginBottom:"1.2rem",display:"flex",gap:"2rem",flexWrap:"wrap"}}>
                  {[["Example Booking", 3500], ["Tour Package", 1800], ["Car Rental (3 days)", 9000]].map(([label, base]) => {
                    const fee = Math.round(base * (Number(feeInput)/100));
                    return (
                      <div key={label}>
                        <div style={{fontSize:"0.75rem",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:"0.3rem"}}>{label}</div>
                        <div style={{fontSize:"0.88rem"}}>Base: <strong>₱{base.toLocaleString()}</strong></div>
                        <div style={{fontSize:"0.88rem"}}>Fee: <strong style={{color:"var(--coral)"}}>+₱{fee.toLocaleString()}</strong></div>
                        <div style={{fontSize:"0.9rem",fontWeight:700,color:"var(--ocean)"}}>Total: ₱{(base+fee).toLocaleString()}</div>
                      </div>
                    );
                  })}
                </div>

                <div style={{display:"flex",gap:"0.8rem",alignItems:"center"}}>
                  <button
                    onClick={() => updateServiceFee(feeInput)}
                    style={{background:"var(--ocean)",color:"#fff",border:"none",padding:"0.85rem 2rem",
                      borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:"0.95rem",transition:"all .2s"}}
                    onMouseEnter={e=>e.target.style.background="var(--teal)"}
                    onMouseLeave={e=>e.target.style.background="var(--ocean)"}
                  >
                    <i className="fa-solid fa-floppy-disk"/> Save Fee
                  </button>
                  <button onClick={() => setFeeInput(String(serviceFee))}
                    style={{background:"#F3F4F6",color:"var(--ink)",border:"none",padding:"0.85rem 1.5rem",
                      borderRadius:12,cursor:"pointer",fontWeight:600,fontSize:"0.9rem"}}>
                    Reset
                  </button>
                  <div style={{fontSize:"0.85rem",color:"var(--muted)"}}>
                    Current live rate: <strong style={{color:"var(--ocean)"}}>{serviceFee}%</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Info card */}
            <div style={{background:"#fff",borderRadius:16,border:"1px solid var(--border)",padding:"1.5rem"}}>
              <div style={{fontWeight:700,fontSize:"1rem",marginBottom:"1rem",fontFamily:"'DM Sans',sans-serif"}}><i className="fa-solid fa-circle-info"/> How Fees Work</div>
              {[
                ["fa-solid fa-chart-bar","Fee is applied to all new bookings","The service fee % is added on top of the vendor's listing price when customers book."],
                ["fa-solid fa-lock","Existing bookings are not affected","Changing the fee only applies to future bookings — already submitted bookings retain their original total."],
                ["fa-solid fa-handshake","Vendors set their own prices","Vendors decide the base price for their cars and tours. The platform fee is added transparently at checkout."],
                ["fa-solid fa-credit-card","Shown clearly at checkout","Customers see the base price, service fee, and total broken down on the booking confirmation page."],
              ].map(([icon,title,desc]) => (
                <div key={title} style={{display:"flex",gap:"1rem",marginBottom:"1.1rem",alignItems:"flex-start"}}>
                  <span style={{fontSize:"1.3rem",flexShrink:0}}>{icon.startsWith("fa-") ? <i className={icon}/> : icon}</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:"0.9rem",marginBottom:"0.2rem"}}>{title}</div>
                    <div style={{fontSize:"0.83rem",color:"var(--muted)",lineHeight:1.6}}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* â"€â"€ SUSPENDED USERS â"€â"€ */}
        {section === "suspended" && (() => {
          const suspVendors = suspendedUsers.filter(u=>u.role==="vendor");
          const suspCustomers = suspendedUsers.filter(u=>u.role==="customer");
          const suspBase = suspTab==="vendor" ? suspVendors : suspTab==="customer" ? suspCustomers : suspendedUsers;
          const suspFiltered = suspBase.filter(u => {
            const q = suspSearch.toLowerCase();
            return !q || (u.company||u.name||"").toLowerCase().includes(q)
              || (u.email||"").toLowerCase().includes(q);
          });
          return (
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"0.8rem",marginBottom:"1rem"}}>
              <div style={{display:"flex",gap:"0.5rem"}}>
                {[["all","All",suspendedUsers.length],["vendor","Vendors",suspVendors.length],["customer","Customers",suspCustomers.length]].map(([id,lbl,cnt])=>(
                  <button key={id} onClick={()=>setSuspTab(id)}
                    style={{background:suspTab===id?"#F97316":"#F3F4F6",color:suspTab===id?"#fff":"var(--muted)",
                      border:"none",borderRadius:8,padding:"0.4rem 0.9rem",cursor:"pointer",fontWeight:700,fontSize:"0.82rem",display:"flex",alignItems:"center",gap:"0.4rem"}}>
                    {lbl} <span style={{background:suspTab===id?"rgba(255,255,255,0.25)":"var(--border)",color:suspTab===id?"#fff":"var(--muted)",borderRadius:50,padding:"0.05rem 0.45rem",fontSize:"0.72rem"}}>{cnt}</span>
                  </button>
                ))}
              </div>
              <input value={suspSearch} onChange={e=>setSuspSearch(e.target.value)}
                placeholder="Search by name or emailâ€¦"
                style={{border:"1.5px solid var(--border)",borderRadius:8,padding:"0.45rem 0.9rem",fontSize:"0.85rem",width:240,outline:"none"}}/>
            </div>
            {suspendedUsers.length === 0 ? (
              <div className="empty-state"><div className="empty-icon"><i className="fa-solid fa-circle-check"/></div><h3>No Suspended Users</h3><p>All accounts are currently active.</p></div>
            ) : suspFiltered.length === 0 ? (
              <div className="empty-state"><div className="empty-icon"><i className="fa-solid fa-magnifying-glass"/></div><p>No suspended users match your search.</p></div>
            ) : (
              <div className="table-wrap" style={{overflowX:"auto"}}>
                <table style={{minWidth:680}}>
                  <thead>
                    <tr>
                      <th style={{width:36}}>#</th>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Contact</th>
                      <th>Info</th>
                      <th>Joined</th>
                      <th style={{textAlign:"center"}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suspFiltered.map((u,i)=>(
                      <tr key={u.id}>
                        <td style={{color:"var(--muted)",fontSize:"0.8rem",textAlign:"center"}}>{i+1}</td>
                        <td>
                          <div style={{display:"flex",alignItems:"center",gap:"0.6rem"}}>
                            <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#F97316,#EF4444)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",flexShrink:0}}>
                              <i className={u.role==="vendor"?"fa-solid fa-building":"fa-solid fa-user"}/>
                            </div>
                            <div>
                              <div style={{fontWeight:700,fontSize:"0.88rem"}}>{u.company||u.name}</div>
                              {u.role==="vendor" && <div style={{fontSize:"0.76rem",color:"var(--muted)"}}>{u.name}</div>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{background:u.role==="vendor"?"#EFF6FF":"#FFF7ED",color:u.role==="vendor"?"#1D4ED8":"#C2410C",
                            fontSize:"0.75rem",fontWeight:700,padding:"0.2rem 0.55rem",borderRadius:50}}>
                            {u.role==="vendor" ? <><i className="fa-solid fa-building"/> Vendor</> : <><i className="fa-solid fa-user"/> Customer</>}
                          </span>
                        </td>
                        <td>
                          <div style={{fontSize:"0.82rem"}}>{u.email}</div>
                          <div style={{fontSize:"0.76rem",color:"var(--muted)"}}>{u.phone||"—"}</div>
                        </td>
                        <td style={{fontSize:"0.78rem",color:"var(--muted)"}}>
                          {u.role==="vendor"
                            ? <>{cars.filter(c=>c.vendorId===u.id).length} cars · {tours.filter(t=>t.vendorId===u.id).length} tours</>
                            : <>{bookings.filter(b=>b.userId===u.id).length} bookings</>}
                        </td>
                        <td style={{fontSize:"0.82rem",color:"var(--muted)",whiteSpace:"nowrap"}}>{u.joined}</td>
                        <td style={{textAlign:"center"}}>
                          <div style={{display:"flex",gap:"0.35rem",justifyContent:"center"}}>
                            {u.role==="vendor" && (
                              <button data-tip="View Profile" onClick={()=>{setViewVendor(u);setRejectReason("");}}
                                style={{background:"var(--ocean)",color:"#fff",border:"none",padding:"0.35rem 0.7rem",borderRadius:7,cursor:"pointer",fontWeight:700,fontSize:"0.78rem"}}><i className="fa-solid fa-eye"/></button>
                            )}
                            <button data-tip="Reinstate" onClick={()=>disableUser(u.id)}
                              style={{background:"#D1FAE5",color:"var(--success)",border:"none",padding:"0.35rem 0.7rem",borderRadius:7,cursor:"pointer",fontWeight:700,fontSize:"0.78rem"}}><i className="fa-solid fa-circle-check"/></button>
                            <button data-tip="Delete" onClick={()=>setDeleteConfirm(u.id)}
                              style={{background:"#FEE2E2",color:"var(--danger)",border:"none",padding:"0.35rem 0.7rem",borderRadius:7,cursor:"pointer",fontWeight:700,fontSize:"0.78rem"}}><i className="fa-solid fa-trash"/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          );
        })()}

        {/* â"€â"€ DELETION REQUESTS â"€â"€ */}
        {section === "deletion_requests" && (
          <div>
            {/* Summary banner */}
            <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:12,padding:"1rem 1.3rem",marginBottom:"1.5rem",display:"flex",alignItems:"center",gap:"1rem",flexWrap:"wrap"}}>
              <span style={{fontSize:"1.3rem"}}><i className="fa-solid fa-trash"/></span>
              <div style={{flex:1}}>
                <strong>{deletionRequests.length} pending deletion request{deletionRequests.length!==1?"s":""}</strong>
                <span style={{color:"var(--muted)",fontSize:"0.85rem"}}> — {deletionVendors.length} vendor{deletionVendors.length!==1?"s":""}, {deletionCustomers.length} customer{deletionCustomers.length!==1?"s":""}. Approved deletions are permanent.</span>
              </div>
            </div>

            {/* Tabs: All / Vendors / Customers */}
            <div style={{display:"flex",gap:0,borderBottom:"2px solid var(--border)",marginBottom:"1.5rem"}}>
              {[
                ["all",      "All Requests",    deletionRequests.length],
                ["vendor",   "Vendors",   deletionVendors.length],
                ["customer", "Customers", deletionCustomers.length],
              ].map(([id, label, count]) => (
                <div key={id} onClick={()=>setDelTab(id)}
                  style={{padding:"0.7rem 1.3rem",cursor:"pointer",fontWeight:600,fontSize:"0.9rem",
                    borderBottom:`2px solid ${delTab===id?"var(--ocean)":"transparent"}`,
                    marginBottom:-2,color:delTab===id?"var(--ocean)":"var(--muted)",
                    display:"flex",alignItems:"center",gap:"0.5rem",transition:"color .2s"}}>
                  {label}
                  {count > 0 && (
                    <span style={{background:delTab===id?"var(--ocean)":"#E5E7EB",color:delTab===id?"#fff":"var(--muted)",
                      borderRadius:50,padding:"0.05rem 0.5rem",fontSize:"0.72rem",fontWeight:700}}>
                      {count}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Content per tab */}
            {(() => {
              const visible = delTab==="vendor" ? deletionVendors
                            : delTab==="customer" ? deletionCustomers
                            : deletionRequests;
              if (visible.length === 0) return (
                <div className="empty-state">
                  <div className="empty-icon"><i className="fa-solid fa-circle-check"/></div>
                  <h3>No {delTab==="vendor"?"vendor":delTab==="customer"?"customer":""} deletion requests</h3>
                  <p>No {delTab==="all"?"":"matching "}accounts have requested deletion.</p>
                </div>
              );
              return visible.map(u => (
                <div key={u.id} className="del-req-card">
                  <div className="del-req-header">
                    <div style={{display:"flex",gap:"0.8rem",alignItems:"flex-start",flex:1}}>
                      <div style={{width:44,height:44,borderRadius:12,flexShrink:0,
                        background:u.role==="vendor"?"linear-gradient(135deg,var(--ocean),var(--teal))":"linear-gradient(135deg,#6366F1,#8B5CF6)",
                        display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.3rem",color:"#fff"}}>
                        {u.avatar || <i className={u.role==="vendor"?"fa-solid fa-building":"fa-solid fa-user"}/>}
                      </div>
                      <div style={{flex:1}}>
                        <div className="del-req-name">
                          {u.name}
                          <span style={{marginLeft:"0.5rem"}}>
                            <span className="tag" style={{fontSize:"0.7rem",
                              background:u.role==="vendor"?"#DBEAFE":"#EDE9FE",
                              color:u.role==="vendor"?"#1D4ED8":"#5B21B6"}}>
                              {u.role}
                            </span>
                          </span>
                        </div>
                        <div className="del-req-meta">{u.email} {u.phone&&`· ${u.phone}`} {u.company&&`· ${u.company}`}</div>
                        <div className="del-req-meta">
                          <i className="fa-solid fa-calendar"/> Requested: <strong>{u.deletionRequestedAt}</strong>
                          {u.role==="vendor" && <span> · <i className="fa-solid fa-car"/> {cars.filter(c=>c.vendorId===u.id).length} cars · <i className="fa-solid fa-map"/> {tours.filter(t=>t.vendorId===u.id).length} tours will be removed</span>}
                          {u.role==="customer" && <span> · <i className="fa-solid fa-calendar"/> {bookings.filter(b=>b.userId===u.id).length} booking(s)</span>}
                        </div>
                      </div>
                    </div>
                    <span style={{background:"#FEE2E2",color:"var(--danger)",padding:"0.25rem 0.8rem",
                      borderRadius:50,fontSize:"0.72rem",fontWeight:700,textTransform:"uppercase",whiteSpace:"nowrap",flexShrink:0}}>
                      Deletion Pending
                    </span>
                  </div>

                  <div className="del-req-reason">
                    <strong>Reason:</strong> {u.deletionReason || "No reason provided."}
                  </div>

                  {u.role==="vendor" && bookings.filter(b=>b.vendorId===u.id&&b.status!=="cancelled").length > 0 && (
                    <div style={{background:"#FEF3C7",border:"1px solid #FCD34D",borderRadius:8,padding:"0.6rem 0.8rem",marginBottom:"0.8rem",fontSize:"0.82rem",color:"#92400E"}}>
                      <i className="fa-solid fa-triangle-exclamation"/> This vendor has <strong>{bookings.filter(b=>b.vendorId===u.id&&b.status!=="cancelled").length} active booking(s)</strong> that will also be affected if deleted.
                    </div>
                  )}

                  <div className="del-req-actions">
                    <button onClick={()=>approveDeletion(u.id)}
                      style={{background:"var(--danger)",color:"#fff",border:"none",padding:"0.6rem 1.2rem",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:"0.85rem"}}>
                      <i className="fa-solid fa-circle-check"/> Approve & Delete
                    </button>
                    <button onClick={()=>declineDeletion(u.id)}
                      style={{background:"#D1FAE5",color:"var(--success)",border:"none",padding:"0.6rem 1.2rem",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:"0.85rem"}}>
                      <i className="fa-solid fa-rotate-left"/> Decline — Keep Account
                    </button>
                    {u.role==="vendor" && (
                      <button onClick={()=>{setViewVendor(u);setRejectReason("");}}
                        style={{background:"#EFF6FF",color:"#1D4ED8",border:"none",padding:"0.6rem 1.2rem",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:"0.85rem"}}>
                        <i className="fa-solid fa-eye"/> View Profile
                      </button>
                    )}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}

        {/* â"€â"€ MY PROFILE â"€â"€ */}
        {section === "profile" && (() => {
          const fieldCard = (title, editColor, fields) => (
            <div style={{background:"#fff",borderRadius:16,border:"1px solid #E5E7EB",padding:"1.5rem 1.8rem",marginBottom:"1rem",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.4rem"}}>
                <h3 style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:"1rem",color:"var(--ocean)",margin:0}}>{title}</h3>
                <button onClick={() => setShowEditProfile(true)}
                  style={{background:editColor==="filled"?"var(--coral)":"transparent",color:editColor==="filled"?"#fff":"var(--muted)",
                    border:editColor==="filled"?"none":"1.5px solid #D1D5DB",
                    borderRadius:8,padding:"0.38rem 0.9rem",cursor:"pointer",fontWeight:600,fontSize:"0.82rem",
                    display:"flex",alignItems:"center",gap:"0.4rem"}}>
                  <i className="fa-solid fa-pen" style={{fontSize:"0.72rem"}}/> Edit
                </button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"1.2rem 1rem"}}>
                {fields.map(([label, value]) => (
                  <div key={label}>
                    <div style={{fontSize:"0.72rem",color:"#9CA3AF",fontWeight:600,marginBottom:"0.25rem",letterSpacing:".02em"}}>{label}</div>
                    <div style={{fontSize:"0.92rem",fontWeight:700,color:"#111827"}}>{value || "—"}</div>
                  </div>
                ))}
              </div>
            </div>
          );
          return (
          <div style={{maxWidth:860}}>

            {/* â"€â"€ Avatar card â"€â"€ */}
            <div style={{background:"#fff",borderRadius:16,border:"1px solid #E5E7EB",padding:"1.3rem 1.8rem",marginBottom:"1rem",display:"flex",alignItems:"center",gap:"1.2rem",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
              <div style={{position:"relative",flexShrink:0}}>
                <div style={{width:70,height:70,borderRadius:"50%",overflow:"hidden",border:"2px solid #E5E7EB",background:"linear-gradient(135deg,var(--ocean),var(--teal))"}}>
                  {user.profilePhoto
                    ? <img src={user.profilePhoto} alt={user.name} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                    : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.8rem"}}>{user.avatar || <i className="fa-solid fa-user"/>}</div>
                  }
                </div>
                <button onClick={() => setShowEditProfile(true)}
                  style={{position:"absolute",bottom:2,right:2,width:22,height:22,borderRadius:"50%",background:"var(--ocean)",border:"2px solid #fff",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0}}>
                  <i className="fa-solid fa-camera" style={{fontSize:"0.6rem"}}/>
                </button>
              </div>
              <div>
                <div style={{fontWeight:800,fontSize:"1.1rem",color:"#111827",fontFamily:"'DM Sans',sans-serif"}}>{user.name}</div>
                <div style={{fontSize:"0.85rem",color:"var(--teal)",fontWeight:600,marginTop:"0.15rem"}}>Admin</div>
                {(user.city || user.address) && (
                  <div style={{fontSize:"0.82rem",color:"#6B7280",marginTop:"0.1rem"}}>
                    <i className="fa-solid fa-location-dot" style={{marginRight:"0.3rem",fontSize:"0.75rem"}}/>{user.city || user.address}
                  </div>
                )}
              </div>
            </div>

            {/* â"€â"€ Personal Information â"€â"€ */}
            {fieldCard("Personal Information", "filled", [
              ["Full Name",     user.name || "—"],
              ["Date of Birth", user.dob || "—"],
              ["Email Address", user.email],
              ["Phone Number",  user.phone || "—"],
              ["User Role",     "Admin"],
            ])}

            {/* â"€â"€ Address â"€â"€ */}
            {fieldCard("Address", "outline", [
              ["Country",     user.country || "—"],
              ["City",        user.city    || "—"],
              ["Postal Code", user.postalCode || "—"],
            ])}

            {/* ── Password & Security ── */}
            <div style={{background:"#fff",borderRadius:16,border:"1px solid #E5E7EB",padding:"1.5rem 1.8rem",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
              <div style={{marginBottom:"1.4rem"}}>
                <h3 style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:"1rem",color:"var(--ocean)",margin:0}}>
                  <i className="fa-solid fa-lock" style={{marginRight:"0.5rem",fontSize:"0.9rem"}}/> Password &amp; Security
                </h3>
              </div>
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
                {[
                  ["Create New Password", "newPw",   "Min. 8 characters"],
                  ["Confirm Password",    "confirm", "Repeat new password"],
                ].map(([label, key, ph]) => (
                  <div key={key}>
                    <div style={{fontSize:"0.72rem",color:"#9CA3AF",fontWeight:600,marginBottom:"0.4rem",letterSpacing:".02em"}}>{label}</div>
                    <div style={{position:"relative"}}>
                      <input type={pwShow[key] ? "text" : "password"} placeholder={ph} value={pwForm[key]}
                        onChange={e => { setPwForm(f=>({...f,[key]:e.target.value})); setPwError(""); setPwSuccess(false); }}
                        style={{width:"100%",border:"1.5px solid #E5E7EB",borderRadius:9,padding:"0.55rem 2.4rem 0.55rem 0.85rem",fontSize:"0.88rem",fontFamily:"inherit",outline:"none",boxSizing:"border-box",background:"#fff",color:"#111"}}
                        onFocus={e=>e.target.style.borderColor="var(--teal)"}
                        onBlur={e=>e.target.style.borderColor="#E5E7EB"}
                      />
                      <button type="button" onClick={() => setPwShow(s=>({...s,[key]:!s[key]}))}
                        style={{position:"absolute",right:"0.6rem",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",padding:"0.2rem",fontSize:"0.95rem"}}>
                        <i className={pwShow[key] ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={async () => {
                if (pwForm.newPw.length < 8) { setPwError("Password must be at least 8 characters."); return; }
                if (pwForm.newPw !== pwForm.confirm) { setPwError("Passwords do not match."); return; }
                try {
                  await api.users.setPassword(user.id, pwForm.newPw);
                  setPwForm({ newPw:"", confirm:"" });
                  setPwSuccess(true);
                  setTimeout(() => setPwSuccess(false), 4000);
                } catch (err) {
                  setPwError(err.message || "Failed to update password.");
                }
              }}
                style={{background:"var(--ocean)",color:"#fff",border:"none",padding:"0.6rem 1.8rem",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:"0.88rem",display:"flex",alignItems:"center",gap:"0.5rem"}}>
                <i className="fa-solid fa-key"/> Set Password
              </button>
            </div>

          </div>
          );
        })()}

        </div>
      </div>
    </div>
  );
}

