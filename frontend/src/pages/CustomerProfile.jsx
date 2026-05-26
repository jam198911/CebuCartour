import { useState, useRef } from "react";
import { fmtPeso } from "../utils/helpers.js";
import { StatusBadge } from "../components/SharedUI.jsx";
import { DonutChart } from "../components/Charts.jsx";
import BookingSummaryModal from "../components/BookingSummaryModal.jsx";
import { api } from "../api.js";

export function ImageUploader({ images = [], onChange, maxImages = 3 }) {
  const inputRef  = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (e) => {
    const files     = Array.from(e.target.files || []);
    const remaining = maxImages - images.length;
    const toProcess = files.slice(0, remaining);
    if (!toProcess.length) return;
    e.target.value = "";
    setUploading(true);
    try {
      const urls = await Promise.all(toProcess.map(f => api.upload(f).then(r => r.url)));
      onChange([...images, ...urls]);
    } catch (err) {
      alert('Image upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => onChange(images.filter((_, i) => i !== idx));

  return (
    <div>
      <div style={{display:"flex",gap:"0.5rem",alignItems:"center",marginBottom:"0.5rem"}}>
        <span style={{fontSize:"0.78rem",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em"}}>
          Photos ({images.length}/{maxImages})
        </span>
        {images.length < maxImages && (
          <span style={{fontSize:"0.72rem",color:"var(--teal)"}}>Up to {maxImages} images</span>
        )}
      </div>
      <div className="img-uploader">
        {/* Filled slots */}
        {images.map((src, i) => (
          <div key={i} className="img-slot filled">
            <img src={src} alt={`Photo ${i+1}`} />
            <button className="img-slot-remove" onClick={() => removeImage(i)}><i className="fa-solid fa-xmark"/></button>
            <span className="img-slot-num">Photo {i+1}</span>
          </div>
        ))}
        {/* Add slot */}
        {images.length < maxImages && (
          <div className="img-slot" onClick={() => !uploading && inputRef.current?.click()} style={uploading ? {opacity:.5,cursor:"wait"} : {}}>
            <div className="img-slot-add">
              {uploading ? <i className="fa-solid fa-spinner fa-spin"/> : <i className="fa-solid fa-camera"/>}
            </div>
            <div className="img-slot-label">
              {uploading ? "Uploading…" : images.length === 0 ? "Add photo" : "Add more"}
            </div>
          </div>
        )}
        {/* Empty placeholder slots */}
        {Array.from({length: Math.max(0, maxImages - images.length - 1)}).map((_, i) => (
          <div key={`empty-${i}`} className="img-slot" style={{opacity:.35,cursor:"default"}}>
            <div className="img-slot-add"><i className="fa-solid fa-image"/></div>
            <div className="img-slot-label">Photo {images.length + i + 2}</div>
          </div>
        ))}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={handleFiles} />
      {images.length >= maxImages && (
        <div style={{fontSize:"0.78rem",color:"var(--success)",marginTop:"0.4rem",fontWeight:600}}>
          ✓ Maximum {maxImages} photos uploaded. Remove one to replace it.
        </div>
      )}
    </div>
  );
}

// â"€â"€â"€ EDIT PROFILE MODAL â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
export function EditProfileModal({ user, onSave, onClose }) {
  const [form, setForm] = useState({
    name:           user.name           || "",
    email:          user.email          || "",
    phone:          user.phone          || "",
    address:        user.address        || "",
    company:        user.company        || "",
    bio:            user.bio            || "",
    idType:         user.idType         || "Business Permit",
    idNumber:       user.idNumber       || "",
    avatar:         user.avatar         || "",
    profilePhoto:   user.profilePhoto   || "",
    socialFacebook: user.socialFacebook || "",
    socialInstagram:user.socialInstagram|| "",
    socialTiktok:   user.socialTiktok   || "",
    dob:            user.dob            || "",
    country:        user.country        || "",
    city:           user.city           || "",
    postalCode:     user.postalCode     || "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const photoInputRef = useRef(null);

  const AVATARS = ["🧑","👩","🧔","👨‍💼","👩‍💼","🧑‍💻","👨‍🍳","🤵","👩‍🚀","🧑‍🎨"];

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const { url } = await api.upload(file);
      set("profilePhoto", url);
    } catch (err) {
      alert('Photo upload failed: ' + err.message);
    }
  };

  const handleSave = () => {
    if (!form.name || !form.email) { alert("Name and email are required."); return; }
    onSave(form);
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose} style={{ zIndex: 500 }}>
      <div className="profile-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="profile-modal-header">
          <div style={{ display:"flex", gap:"1rem", alignItems:"center" }}>
            {/* Clickable photo/avatar */}
            <div className="profile-photo-wrap" style={{width:64,height:64,flexShrink:0}} onClick={() => photoInputRef.current?.click()}>
              {form.profilePhoto
                ? <img src={form.profilePhoto} alt="Profile" />
                : <div className="profile-photo-emoji">{form.avatar || <i className="fa-solid fa-user"/>}</div>
              }
              <div className="profile-photo-overlay"><span><i className="fa-solid fa-camera"/><br/>Change</span></div>
            </div>
            <input ref={photoInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhotoUpload} />
            <div>
              <h2>Edit Profile</h2>
              <p style={{opacity:.8,fontSize:"0.82rem"}}>Tap photo to change · Update your information below</p>
            </div>
          </div>
          <button onClick={onClose}
            style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:8,
              padding:"0.4rem 0.8rem", cursor:"pointer", color:"#fff", fontWeight:700 }}>
            <i className="fa-solid fa-xmark"/>
          </button>
        </div>

        <div className="profile-modal-body">

          {/* Profile photo upload area */}
          <div className="profile-section-label">Profile Photo</div>
          <div style={{display:"flex",gap:"1rem",alignItems:"center",marginBottom:"1rem"}}>
            <div style={{width:72,height:72,borderRadius:"50%",overflow:"hidden",flexShrink:0,border:"2px solid var(--border)"}}>
              {form.profilePhoto
                ? <img src={form.profilePhoto} alt="Preview" style={{width:"100%",height:"100%",objectFit:"cover"}} />
                : <div style={{width:"100%",height:"100%",background:"linear-gradient(135deg,var(--ocean),var(--teal))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2rem"}}>{form.avatar||<i className="fa-solid fa-user" style={{color:"#fff"}}/>}</div>
              }
            </div>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:"0.6rem",flexWrap:"wrap"}}>
                <button type="button" onClick={() => photoInputRef.current?.click()}
                  style={{background:"var(--ocean)",color:"#fff",border:"none",padding:"0.5rem 1rem",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:"0.85rem"}}>
                  <i className="fa-solid fa-camera"/> Upload Photo
                </button>
                {form.profilePhoto && (
                  <button type="button" onClick={() => set("profilePhoto","")}
                    style={{background:"#FEE2E2",color:"var(--danger)",border:"none",padding:"0.5rem 0.8rem",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:"0.85rem"}}>
                    <i className="fa-solid fa-xmark"/> Remove
                  </button>
                )}
              </div>
              <div style={{fontSize:"0.75rem",color:"var(--muted)",marginTop:"0.4rem"}}>JPG, PNG or WEBP · Max 5MB · Square recommended</div>
            </div>
          </div>

          {/* Emoji fallback picker (shown only when no photo) */}
          {!form.profilePhoto && (
            <>
              <div style={{fontSize:"0.75rem",color:"var(--muted)",marginBottom:"0.5rem"}}>Or choose an emoji avatar:</div>
              <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap", marginBottom:"1rem" }}>
                {AVATARS.map(a => (
                  <div key={a} onClick={() => set("avatar", a)}
                    style={{ width:40, height:40, borderRadius:10, display:"flex",
                      alignItems:"center", justifyContent:"center", fontSize:"1.4rem", cursor:"pointer",
                      border:"2px solid", transition:"all .15s",
                      borderColor: form.avatar === a ? "var(--ocean)" : "var(--border)",
                      background: form.avatar === a ? "rgba(10,77,104,0.1)" : "#F9FAFB" }}>
                    {a}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Basic info */}
          <div className="profile-section-label">Basic Information</div>
          <div className="profile-field-grid">
            <div className="profile-field">
              <label>Full Name *</label>
              <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Your full name" />
            </div>
            <div className="profile-field">
              <label>Phone / WhatsApp</label>
              <input value={form.phone} onChange={e => set("phone", e.target.value.replace(/\D/g,'').slice(0,11))} placeholder="09XXXXXXXXX" inputMode="numeric" maxLength={11} />
            </div>
          </div>
          <div className="profile-field">
            <label>Email Address *</label>
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@email.com" />
          </div>
          <div className="profile-field-grid">
            <div className="profile-field">
              <label>Date of Birth</label>
              <input type="date" value={form.dob} onChange={e => set("dob", e.target.value)} />
            </div>
            <div className="profile-field">
              <label>Address</label>
              <input value={form.address} onChange={e => set("address", e.target.value)} placeholder="City, Province" />
            </div>
          </div>
          <div className="profile-field-grid">
            <div className="profile-field">
              <label>Country</label>
              <input value={form.country} onChange={e => set("country", e.target.value)} placeholder="Philippines" />
            </div>
            <div className="profile-field">
              <label>City</label>
              <input value={form.city} onChange={e => set("city", e.target.value)} placeholder="Cebu City" />
            </div>
            <div className="profile-field">
              <label>Postal Code</label>
              <input value={form.postalCode} onChange={e => set("postalCode", e.target.value)} placeholder="6000" />
            </div>
          </div>

          {/* Vendor-specific fields */}
          {(user.role === "vendor" || user.role === "admin") && (
            <>
              <div className="profile-section-label">
                {user.role === "vendor" ? "Business Information" : "Admin Information"}
              </div>
              {user.role === "vendor" && (
                <div className="profile-field">
                  <label>Company / Business Name</label>
                  <input value={form.company} onChange={e => set("company", e.target.value)} placeholder="Your business name" />
                </div>
              )}
              <div className="profile-field">
                <label>Bio / Description</label>
                <textarea value={form.bio} onChange={e => set("bio", e.target.value)}
                  placeholder={user.role === "vendor" ? "Describe your business..." : "Short admin bio..."} />
              </div>
              {user.role === "vendor" && (
                <div className="profile-field-grid">
                  <div className="profile-field">
                    <label>Permit / ID Type</label>
                    <select value={form.idType} onChange={e => set("idType", e.target.value)}>
                      {["Business Permit","DTI Registration","SEC Registration","BIR Registration","Mayor's Permit"].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="profile-field">
                    <label>Permit / ID Number</label>
                    <input value={form.idNumber} onChange={e => set("idNumber", e.target.value)} placeholder="e.g. BP-2025-001" />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Social Links */}
          <div className="profile-section-label">Social Media Links</div>
          {[
            ["socialFacebook",  "🟦", "Facebook URL",  "https://facebook.com/yourpage"],
            ["socialInstagram", "🟣", "Instagram URL", "https://instagram.com/yourhandle"],
            ["socialTiktok",    "⬛", "TikTok URL",    "https://tiktok.com/@yourhandle"],
          ].map(([key, icon, label, ph]) => (
            <div key={key} className="profile-field">
              <label>{icon} {label}</label>
              <input value={form[key]} onChange={e => set(key, e.target.value)} placeholder={ph} />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="profile-modal-footer">
          <button onClick={handleSave}
            style={{ flex:2, background:"var(--ocean)", color:"#fff", border:"none",
              padding:"0.9rem", borderRadius:12, cursor:"pointer", fontWeight:700, fontSize:"0.95rem" }}>
            <i className="fa-solid fa-floppy-disk"/> Save Changes
          </button>
          <button onClick={onClose}
            style={{ flex:1, background:"#F3F4F6", color:"var(--ink)", border:"none",
              padding:"0.9rem", borderRadius:12, cursor:"pointer", fontWeight:700 }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// â"€â"€â"€ EDIT GCASH MODAL â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
export function EditGcashModal({ user, onSave, onClose }) {
  const [form, setForm] = useState({
    gcashNumber: user.gcashNumber || "",
    gcashName:   user.gcashName   || "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSave = () => { onSave(form); onClose(); };

  return (
    <div className="overlay" onClick={onClose} style={{ zIndex: 500 }}>
      <div className="profile-modal" onClick={e => e.stopPropagation()} style={{maxWidth:480}}>
        <div className="profile-modal-header" style={{background:"linear-gradient(135deg,#059669,#10B981)"}}>
          <div>
            <h2><i className="fa-solid fa-credit-card"/> GCash Details</h2>
            <p style={{opacity:.8,fontSize:"0.82rem"}}>Update your GCash payment information</p>
          </div>
          <button onClick={onClose}
            style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:8,padding:"0.4rem 0.8rem",cursor:"pointer",color:"#fff",fontWeight:700}}>
            <i className="fa-solid fa-xmark"/>
          </button>
        </div>
        <div className="profile-modal-body">
          <div style={{background:"#F0FFF4",border:"1px solid #A7F3D0",borderRadius:12,padding:"0.9rem 1.1rem",marginBottom:"1.2rem",fontSize:"0.82rem",color:"#065F46"}}>
            â„¹ï¸ Your GCash number and name will appear on the customer's payment page.
          </div>
          <div className="profile-field-grid">
            <div className="profile-field">
              <label>GCash Number</label>
              <input value={form.gcashNumber} onChange={e => set("gcashNumber", e.target.value.replace(/D/g,"").slice(0,11))} placeholder="09XXXXXXXXX" inputMode="numeric" maxLength={11} />
            </div>
            <div className="profile-field">
              <label>GCash Account Name</label>
              <input value={form.gcashName} onChange={e => set("gcashName", e.target.value)} placeholder="e.g. Juan D." />
            </div>
          </div>
        </div>
        <div className="profile-modal-footer">
          <button onClick={handleSave}
            style={{flex:2,background:"#059669",color:"#fff",border:"none",padding:"0.9rem",borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:"0.95rem"}}>
            <i className="fa-solid fa-floppy-disk"/> Save GCash Details
          </button>
          <button onClick={onClose}
            style={{flex:1,background:"#F3F4F6",color:"var(--ink)",border:"none",padding:"0.9rem",borderRadius:12,cursor:"pointer",fontWeight:700}}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// â"€â"€â"€ EDIT BANK MODAL â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
export function EditBankModal({ user, onSave, onClose }) {
  const [form, setForm] = useState({
    bankNumber:   user.bankNumber   || "",
    bankName:     user.bankName     || "",
    bankProvider: user.bankProvider || "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSave = () => { onSave(form); onClose(); };

  return (
    <div className="overlay" onClick={onClose} style={{ zIndex: 500 }}>
      <div className="profile-modal" onClick={e => e.stopPropagation()} style={{maxWidth:480}}>
        <div className="profile-modal-header" style={{background:"linear-gradient(135deg,#1D4ED8,#3B82F6)"}}>
          <div>
            <h2><i className="fa-solid fa-building-columns"/> Bank Account Details</h2>
            <p style={{opacity:.8,fontSize:"0.82rem"}}>Update your bank transfer information</p>
          </div>
          <button onClick={onClose}
            style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:8,padding:"0.4rem 0.8rem",cursor:"pointer",color:"#fff",fontWeight:700}}>
            <i className="fa-solid fa-xmark"/>
          </button>
        </div>
        <div className="profile-modal-body">
          <div style={{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:12,padding:"0.9rem 1.1rem",marginBottom:"1.2rem",fontSize:"0.82rem",color:"#1E40AF"}}>
            â„¹ï¸ Your bank account details appear on the customer's payment page for bank transfer bookings.
          </div>
          <div className="profile-field-grid">
            <div className="profile-field">
              <label>Account Number</label>
              <input value={form.bankNumber} onChange={e => set("bankNumber", e.target.value)} placeholder="e.g. 1234-5678-9012" />
            </div>
            <div className="profile-field">
              <label>Account Name</label>
              <input value={form.bankName} onChange={e => set("bankName", e.target.value)} placeholder="e.g. Juan dela Cruz" />
            </div>
          </div>
          <div className="profile-field">
            <label>Bank / Provider</label>
            <select value={form.bankProvider} onChange={e => set("bankProvider", e.target.value)}>
              <option value="">— Select bank —</option>
              {["BDO","BPI","UnionBank","Metrobank","PNB","Land Bank","RCBC","Security Bank","Maya","GCash Padala","Palawan Express"].map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
        </div>
        <div className="profile-modal-footer">
          <button onClick={handleSave}
            style={{flex:2,background:"#1D4ED8",color:"#fff",border:"none",padding:"0.9rem",borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:"0.95rem"}}>
            <i className="fa-solid fa-floppy-disk"/> Save Bank Details
          </button>
          <button onClick={onClose}
            style={{flex:1,background:"#F3F4F6",color:"var(--ink)",border:"none",padding:"0.9rem",borderRadius:12,cursor:"pointer",fontWeight:700}}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// â"€â"€â"€ CUSTOMER PROFILE PAGE â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
export default function CustomerProfile({ user, bookings, goTo, onLogout, updateUser, cars, tours, requestDeletion, users = [], deleteBooking, serviceFee = 5, submitRating }) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [pdfBooking, setPdfBooking] = useState(null);
  const [bookingTab, setBookingTab] = useState("current");
  const [cpTypeFilter, setCpTypeFilter] = useState("all");
  const [viewBooking, setViewBooking] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [cpwForm, setCpwForm]     = useState({ newPw:"", confirm:"" });
  const [cpwError, setCpwError]   = useState("");
  const [cpwSuccess, setCpwSuccess] = useState(false);
  const [cpwShow, setCpwShow]     = useState({ newPw: false, confirm: false });

  const [ratingModal, setRatingModal] = useState(null); // { booking, item, hovered, stars, note }
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  // â"€â"€ Cancellation notifications â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const cancelSeenKey = `cebuCartour_cancelSeen_${user.id}`;
  const [seenCancelIds, setSeenCancelIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(cancelSeenKey) || "[]")); } catch { return new Set(); }
  });
  const markCancelsSeen = (ids) => {
    const updated = new Set([...seenCancelIds, ...ids]);
    setSeenCancelIds(updated);
    localStorage.setItem(cancelSeenKey, JSON.stringify([...updated]));
  };

  const initials = user.name?.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase() || "?";
  const totalSpent = bookings.filter(b => b.status === "approved").reduce((s, b) => s + +(b.total || 0), 0);

  const currentBookings  = bookings.filter(b => b.status === "pending" || b.status === "approved");
  const previousBookings = bookings.filter(b => b.status === "cancelled" || b.status === "completed");
  const cancelledBookings   = bookings.filter(b => b.status === "cancelled");
  const newCancellations    = cancelledBookings.filter(b => !seenCancelIds.has(b.id));
  const tabBookings = (bookingTab === "current" ? currentBookings : previousBookings)
    .filter(b => cpTypeFilter === "all" || b.type === cpTypeFilter);
  const fmtCpTs = (ts) => {
    if (!ts) return "—";
    const d = new Date(ts);
    return d.toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})
      + " " + d.toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit"});
  };

  return (
    <div className="customer-profile">
      {showEdit && (
        <EditProfileModal user={user} onSave={updateUser} onClose={() => setShowEdit(false)} />
      )}
      {pdfBooking && (
        <BookingSummaryModal
          booking={pdfBooking}
          itemName={(pdfBooking.type === "car" ? cars : tours).find(i => i.id === pdfBooking.itemId)?.name || "—"}
          item={(pdfBooking.type === "car" ? cars : tours).find(i => i.id === pdfBooking.itemId) || null}
          vendor={users.find(u => u.id === pdfBooking.vendorId)}
          onClose={() => setPdfBooking(null)}
          serviceFee={serviceFee}
        />
      )}

      {/* â"€â"€ Booking Detail Modal â"€â"€ */}
      {viewBooking && (() => {
        const b = viewBooking;
        const listingItem = (b.type === "car" ? cars : tours).find(i => i.id === b.itemId);
        const vendorUser  = users.find(u => u.id === b.vendorId);
        const statusColor = { approved:"#059669", pending:"#D97706", cancelled:"#DC2626", completed:"#2563EB" }[b.status] || "#6B7280";
        const statusBg    = { approved:"#D1FAE5", pending:"#FEF3C7", cancelled:"#FEE2E2", completed:"#DBEAFE" }[b.status] || "#F3F4F6";
        return (
          <div className="overlay" onClick={() => setViewBooking(null)} style={{zIndex:600,background:"rgba(0,0,0,0.55)"}}>
            <div onClick={e => e.stopPropagation()} style={{
              background:"#fff", borderRadius:24, width:"100%", maxWidth:500,
              boxShadow:"0 28px 80px rgba(0,0,0,0.22)", overflow:"hidden", maxHeight:"92vh", display:"flex", flexDirection:"column"
            }}>
              {/* Header */}
              <div style={{background:"linear-gradient(135deg,#0A4D68,#088395)",padding:"1.3rem 1.6rem",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
                <div>
                  <div style={{color:"#fff",fontWeight:800,fontSize:"1rem"}}>Booking Details</div>
                  <div style={{color:"rgba(255,255,255,0.72)",fontSize:"0.78rem",marginTop:"0.15rem"}}>{b.id}</div>
                </div>
                <div style={{display:"flex",gap:"0.6rem",alignItems:"center"}}>
                  <span style={{background:statusBg,color:statusColor,fontSize:"0.72rem",fontWeight:800,padding:"0.25rem 0.75rem",borderRadius:20,textTransform:"uppercase"}}>
                    {b.status}
                  </span>
                  <button onClick={() => setViewBooking(null)}
                    style={{background:"rgba(255,255,255,0.18)",border:"none",borderRadius:8,padding:"0.4rem 0.7rem",cursor:"pointer",color:"#fff",fontWeight:700,fontSize:"1rem",lineHeight:1}}>
                    <i className="fa-solid fa-xmark"/>
                  </button>
                </div>
              </div>

              {/* Body */}
              <div style={{overflowY:"auto",padding:"1.4rem 1.6rem",flex:1}}>
                {/* Listing card */}
                {listingItem && (
                  <div style={{display:"flex",gap:"1rem",alignItems:"center",padding:"1rem",background:"#F8FAFC",borderRadius:14,border:"1px solid #E9ECF0",marginBottom:"1.25rem"}}>
                    {listingItem.image
                      ? <img src={listingItem.image} alt={listingItem.name} style={{width:60,height:60,objectFit:"cover",borderRadius:10,flexShrink:0}} onError={e=>{e.currentTarget.style.display="none";}} />
                : <div style={{width:60,height:60,borderRadius:10,background:"#F1F5F9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.4rem",color:"#D1D5DB",flexShrink:0}}><i className={listingItem.type==="car"?"fa-solid fa-car":"fa-solid fa-umbrella-beach"}/></div>
                    }
                    <div>
                      <div style={{fontWeight:700,fontSize:"0.92rem",color:"#111827"}}>{listingItem.name}</div>
                      <div style={{fontSize:"0.76rem",color:"var(--muted)",marginTop:"0.15rem"}}><i className="fa-solid fa-location-dot"/> {listingItem.location}</div>
                      {vendorUser && <div style={{fontSize:"0.73rem",color:"var(--muted)",marginTop:"0.1rem"}}><i className="fa-solid fa-store"/> {vendorUser.company || vendorUser.name}</div>}
                    </div>
                  </div>
                )}

                {/* Detail rows */}
                {[
                  ["fa-solid fa-calendar", "Date",         b.date],
                  b.returnDate && b.returnDate !== b.date ? [null, "Return", b.returnDate] : null,
                  b.pickTime  ? ["fa-solid fa-clock", "Pickup Time",  b.pickTime]  : null,
                  b.dropTime  ? ["fa-solid fa-clock", "Drop-off",     b.dropTime]  : null,
                  ["fa-solid fa-location-dot", "Meetup",       b.pickup || "—"],
                  b.type === "tour" ? ["fa-solid fa-users", "Guests", `${b.guests} pax`] : null,
                  [null, "Name",         b.name],
                  ["fa-solid fa-envelope", "Email",        b.email],
                  ["fa-solid fa-mobile-screen", "Phone",        b.phone || "—"],
                  b.notes ? ["fa-solid fa-note-sticky", "Notes", b.notes] : null,
                  ["fa-solid fa-credit-card", "Payment",      b.paymentMethod === "gcash" ? "GCash" : b.paymentMethod === "bank" ? "Bank Transfer" : "Cash on Day"],
                  b.paymentProof ? ["fa-solid fa-camera", "Proof", "Proof attached"] : null,
                ].filter(Boolean).map(([icon, label, value]) => (
                  <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"0.52rem 0",borderBottom:"1px solid #F3F4F6",fontSize:"0.87rem",gap:"1rem"}}>
                    <span style={{color:"#6B7280",flexShrink:0,display:"flex",alignItems:"center",gap:"0.3rem"}}>{icon && <i className={icon}/>}{label}</span>
                    <span style={{fontWeight:600,color:"#111827",textAlign:"right"}}>{value}</span>
                  </div>
                ))}

                {/* Total */}
                <div style={{marginTop:"1rem",background:"linear-gradient(135deg,#F0F9FF,#E0F2FE)",borderRadius:12,padding:"0.9rem 1.1rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontWeight:700,color:"#0A4D68",fontSize:"0.88rem"}}>Total Amount</span>
                  <span style={{fontWeight:800,fontSize:"1.35rem",color:"#E85D04"}}>{fmtPeso(b.total)}</span>
                </div>
              </div>

              {/* Footer */}
              <div style={{padding:"1rem 1.6rem",borderTop:"1px solid #F3F4F6",display:"flex",gap:"0.6rem",flexShrink:0}}>
                <button onClick={() => { setViewBooking(null); setPdfBooking(b); }}
                  style={{flex:1,background:"#E0F2FE",color:"#0369A1",border:"none",padding:"0.75rem",borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:"0.88rem"}}>
                  <i className="fa-solid fa-download"/> Download PDF
                </button>
                <button onClick={() => { setViewBooking(null); setConfirmDeleteId(b.id); }}
                  style={{flex:1,background:"#FEE2E2",color:"#DC2626",border:"none",padding:"0.75rem",borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:"0.88rem"}}>
                  <i className="fa-solid fa-trash"/> Delete
                </button>
                <button onClick={() => setViewBooking(null)}
                  style={{flex:1,background:"#F3F4F6",color:"#374151",border:"none",padding:"0.75rem",borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:"0.88rem"}}>
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* â"€â"€ Delete Booking Confirm â"€â"€ */}
      {confirmDeleteId && (() => {
        const b = bookings.find(bk => bk.id === confirmDeleteId);
        return (
          <div className="overlay" onClick={() => setConfirmDeleteId(null)} style={{zIndex:700,background:"rgba(0,0,0,0.55)"}}>
            <div onClick={e => e.stopPropagation()} style={{
              background:"#fff",borderRadius:20,width:"100%",maxWidth:420,
              padding:"2rem",textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"
            }}>
              <div style={{fontSize:"3rem",marginBottom:"1rem"}}><i className="fa-solid fa-trash" style={{color:"var(--danger)"}}/></div>
              <h3 style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,marginBottom:"0.5rem"}}>Delete Booking?</h3>
              <p style={{color:"var(--muted)",fontSize:"0.9rem",lineHeight:1.7,marginBottom:"0.4rem"}}>
                Remove booking <strong>{b?.id}</strong> for <strong>{b?.name}</strong>?
              </p>
              <p style={{color:"var(--danger)",fontSize:"0.82rem",marginBottom:"1.5rem"}}>This cannot be undone.</p>
              <div style={{display:"flex",gap:"0.8rem"}}>
                <button onClick={() => { deleteBooking(confirmDeleteId); setConfirmDeleteId(null); }}
                  style={{flex:1,background:"var(--danger)",color:"#fff",border:"none",padding:"0.85rem",borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:"0.95rem"}}>
                  Yes, Delete
                </button>
                <button onClick={() => setConfirmDeleteId(null)}
                  style={{flex:1,background:"#F3F4F6",color:"var(--ink)",border:"none",padding:"0.85rem",borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:"0.95rem"}}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* â"€â"€ Rating Modal â"€â"€ */}
      {ratingModal && (
        <div className="overlay" onClick={() => setRatingModal(null)} style={{ zIndex:700, background:"rgba(0,0,0,0.55)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:460, padding:"2rem", boxShadow:"0 24px 64px rgba(0,0,0,0.22)" }}>
            {/* Header */}
            <div style={{ textAlign:"center", marginBottom:"1.5rem" }}>
              <div style={{ fontSize:"2.8rem", marginBottom:"0.5rem", color:"#F59E0B" }}><i className="fa-solid fa-star"/></div>
              <h3 style={{ margin:"0 0 0.3rem", fontSize:"1.15rem" }}>Rate Your Experience</h3>
              <p style={{ margin:0, fontSize:"0.85rem", color:"var(--muted)" }}>
                {ratingModal.item?.name || (ratingModal.booking.type === "car" ? "Car Rental" : "Tour Package")}
              </p>
              <p style={{ margin:"0.15rem 0 0", fontSize:"0.78rem", color:"#9CA3AF" }}>Booking {ratingModal.booking.id} · {ratingModal.booking.date}</p>
            </div>

            {/* Star selector */}
            <div style={{ display:"flex", justifyContent:"center", gap:"0.5rem", marginBottom:"1rem" }}>
              {[1,2,3,4,5].map(i => (
                <span key={i}
                  onMouseEnter={() => setRatingModal(m => ({ ...m, hovered: i }))}
                  onMouseLeave={() => setRatingModal(m => ({ ...m, hovered: 0 }))}
                  onClick={() => setRatingModal(m => ({ ...m, stars: i }))}
                  style={{ fontSize:"2.8rem", cursor:"pointer", transition:"transform .1s",
                    transform: i <= (ratingModal.hovered || ratingModal.stars) ? "scale(1.2)" : "scale(1)",
                    color: i <= (ratingModal.hovered || ratingModal.stars) ? "#F59E0B" : "#D1D5DB" }}>
                  <i className="fa-solid fa-star"/>
                </span>
              ))}
            </div>

            {/* Label */}
            {ratingModal.stars > 0 && (
              <div style={{ textAlign:"center", marginBottom:"1rem" }}>
                <span style={{ background:"#FEF9C3", color:"#D97706", borderRadius:8, padding:"0.25rem 0.8rem", fontSize:"0.82rem", fontWeight:700 }}>
                  {["","Poor","Fair","Good","Great","Excellent!"][ratingModal.stars]}
                </span>
              </div>
            )}

            {/* Note */}
            <div style={{ marginBottom:"1.25rem" }}>
              <label style={{ display:"block", fontSize:"0.75rem", fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".06em", marginBottom:"0.4rem" }}>
                Tell us more (optional)
              </label>
              <textarea
                value={ratingModal.note || ""}
                onChange={e => setRatingModal(m => ({ ...m, note: e.target.value }))}
                placeholder="What did you enjoy? Any suggestions for improvement?"
                rows={3}
                style={{ width:"100%", border:"2px solid var(--border)", borderRadius:10, padding:"0.7rem", fontFamily:"inherit", fontSize:"0.88rem", resize:"vertical", outline:"none" }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display:"flex", gap:"0.75rem" }}>
              <button onClick={() => setRatingModal(null)}
                style={{ flex:1, border:"none", borderRadius:10, padding:"0.7rem", background:"#6B7280", color:"#fff", fontWeight:700, cursor:"pointer", fontSize:"0.9rem" }}>
                Cancel
              </button>
              <button
                disabled={!ratingModal.stars || ratingSubmitting}
                onClick={async () => {
                  if (!ratingModal.stars) return;
                  setRatingSubmitting(true);
                  await submitRating(ratingModal.booking.id, ratingModal.booking.type, ratingModal.booking.itemId, ratingModal.stars, ratingModal.note || "");
                  setRatingSubmitting(false);
                  setRatingModal(null);
                }}
                style={{ flex:2, background: ratingModal.stars ? "#F59E0B" : "#E5E7EB", color: ratingModal.stars ? "#fff" : "#9CA3AF",
                  border:"none", borderRadius:10, padding:"0.7rem", fontWeight:700, cursor: ratingModal.stars ? "pointer" : "default", fontSize:"0.9rem", transition:"all .15s" }}>
                {ratingSubmitting ? "Submittingâ€¦" : `Submit ${ratingModal.stars ? `${ratingModal.stars}-Star ` : ""}Rating`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero banner */}
      <div className="cp-hero">
        <div className="cp-hero-inner">
          <div className="cp-avatar" style={{overflow:"hidden",flexShrink:0}}>
            {user.profilePhoto
              ? <img src={user.profilePhoto} alt={user.name} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}} />
              : (user.avatar || initials)
            }
          </div>
          <div className="cp-hero-info" style={{ flex:1 }}>
            <h1>{user.name}</h1>
            <p>{user.email} {user.phone && `· ${user.phone}`}</p>
            <p style={{ marginTop:"0.3rem", opacity:.7, fontSize:"0.82rem" }}>
              Member since {user.joined || "2025"} · Customer Account
            </p>
          </div>
          <div style={{ display:"flex", gap:"0.8rem", flexWrap:"wrap" }}>
            <button onClick={() => setShowEdit(true)}
              style={{ background:"rgba(255,255,255,0.15)", border:"2px solid rgba(255,255,255,0.5)",
                color:"#fff", padding:"0.7rem 1.4rem", borderRadius:50, cursor:"pointer",
                fontWeight:700, fontSize:"0.9rem", backdropFilter:"blur(4px)", transition:"all .2s" }}>
              <i className="fa-solid fa-pencil"/> Edit Profile
            </button>
            <button onClick={onLogout}
              style={{ background:"transparent", border:"2px solid rgba(255,255,255,0.4)",
                color:"rgba(255,255,255,0.85)", padding:"0.7rem 1.4rem", borderRadius:50,
                cursor:"pointer", fontWeight:600, fontSize:"0.9rem" }}>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="cp-body">
        <div className="cp-grid">

          {/* Profile info */}
          <div className="cp-card">
            <h3><i className="fa-solid fa-user"/> My Information</h3>
            {/* Profile photo preview */}
            <div style={{display:"flex",alignItems:"center",gap:"1rem",marginBottom:"1rem",padding:"0.8rem",background:"#F0F9FF",borderRadius:12}}>
              <div style={{width:56,height:56,borderRadius:"50%",overflow:"hidden",flexShrink:0,border:"2px solid var(--border)"}}>
                {user.profilePhoto
                  ? <img src={user.profilePhoto} alt={user.name} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                  : <div style={{width:"100%",height:"100%",background:"linear-gradient(135deg,var(--ocean),var(--teal))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.5rem"}}>
                      {user.avatar || initials}
                    </div>
                }
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:"0.95rem"}}>{user.name}</div>
                <div style={{fontSize:"0.8rem",color:"var(--muted)"}}>Customer Account</div>
              </div>
            </div>
            {[
              ["Full Name", user.name],
              ["Email", user.email],
              ["Phone", user.phone || "Not set"],
              ["Address", user.address || "Not set"],
              ["Member Since", user.joined || "2025"],
            ].map(([k, v]) => (
              <div key={k} className="cp-row">
                <span>{k}</span><span>{v}</span>
              </div>
            ))}
            <button onClick={() => setShowEdit(true)}
              style={{ width:"100%", marginTop:"1rem", background:"var(--ocean)", color:"#fff",
                border:"none", padding:"0.75rem", borderRadius:10, cursor:"pointer",
                fontWeight:700, fontSize:"0.9rem" }}>
              <i className="fa-solid fa-pencil"/> Edit Profile
            </button>
          </div>

          {/* Booking stats */}
          <div className="cp-card">
            <h3><i className="fa-solid fa-chart-bar"/> Booking Summary</h3>
            {[
              ["Total Bookings", bookings.length],
              ["Approved", bookings.filter(b => b.status === "approved").length],
              ["Pending", bookings.filter(b => b.status === "pending").length],
              ["Cancelled", bookings.filter(b => b.status === "cancelled").length],
              ["Total Spent", fmtPeso(totalSpent)],
            ].map(([k, v]) => (
              <div key={k} className="cp-row">
                <span>{k}</span>
                <span style={{ color: k === "Total Spent" ? "var(--coral)" : "var(--ink)" }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Spending Analytics */}
          <div className="cp-card" style={{ gridColumn:"1/-1" }}>
            <h3><i className="fa-solid fa-chart-line"/> Spending Analytics</h3>
            {bookings.length === 0 ? (
              <div style={{ textAlign:"center", padding:"1rem 0", color:"var(--muted)", fontSize:"0.85rem" }}>No bookings yet — analytics will appear here once you make your first booking.</div>
            ) : (
              <>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"0.7rem", marginBottom:"1rem" }}>
                  {[
                    ["Total Spent",    fmtPeso(totalSpent), "var(--coral)"],
                    ["Bookings",       bookings.length,                   "var(--ocean)"],
                    ["Approval Rate",  `${bookings.length > 0 ? Math.round(bookings.filter(b=>b.status==="approved").length/bookings.length*100) : 0}%`, "var(--success)"],
                  ].map(([label,val,color]) => (
                    <div key={label} style={{ background:"#F8FAFC", borderRadius:12, padding:"0.75rem", textAlign:"center", border:"1px solid #E9ECF0" }}>
                      <div style={{ fontSize:"1.35rem", fontWeight:800, color }}>{val}</div>
                      <div style={{ fontSize:"0.7rem", color:"var(--muted)", fontWeight:600, marginTop:"0.1rem" }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", gap:"1.2rem", alignItems:"flex-start", flexWrap:"wrap" }}>
                  <DonutChart segments={[
                    { label:"Approved",  value:bookings.filter(b=>b.status==="approved").length,  color:"#059669" },
                    { label:"Pending",   value:bookings.filter(b=>b.status==="pending").length,   color:"#D97706" },
                    { label:"Cancelled", value:bookings.filter(b=>b.status==="cancelled").length, color:"#DC2626" },
                  ]} size={108} />
                  <div style={{ flex:1, minWidth:180 }}>
                    {[
                      ["Approved", bookings.filter(b=>b.status==="approved").length,  "#059669", `${fmtPeso(bookings.filter(b=>b.status==="approved").reduce((s,b)=>s+(+(b.total)||0),0))} spent`],
                      ["Pending",  bookings.filter(b=>b.status==="pending").length,   "#D97706", "Awaiting confirmation"],
                      ["Cancelled",bookings.filter(b=>b.status==="cancelled").length, "#DC2626", "Not proceeding"],
                    ].map(([label,count,color,sub]) => (
                      <div key={label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.4rem 0", borderBottom:"1px solid #F3F4F6", fontSize:"0.82rem" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                          <span style={{ width:10, height:10, borderRadius:"50%", background:color, display:"inline-block", flexShrink:0 }}/>
                          <div>
                            <div style={{ fontWeight:600, color:"#111827" }}>{label}</div>
                            <div style={{ fontSize:"0.7rem", color:"var(--muted)" }}>{sub}</div>
                          </div>
                        </div>
                        <span style={{ fontWeight:800, color, fontSize:"1rem" }}>{count}</span>
                      </div>
                    ))}
                    <div style={{ display:"flex", gap:"0.5rem", marginTop:"0.75rem" }}>
                      {[["Car Rentals", bookings.filter(b=>b.type==="car").length, "#2563EB"],
                        ["Tours",      bookings.filter(b=>b.type==="tour").length, "#7C3AED"]].map(([label,count,color]) => (
                        <div key={label} style={{ flex:1, background:"#F8FAFC", borderRadius:10, padding:"0.5rem 0.7rem", border:"1px solid #E9ECF0" }}>
                          <div style={{ fontSize:"0.75rem", fontWeight:600, color:"#374151" }}>{label}</div>
                          <div style={{ fontSize:"1.1rem", fontWeight:800, color, marginTop:"0.1rem" }}>{count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* My Bookings — tabbed */}
          <div className="cp-card" style={{ gridColumn:"1/-1" }}>

            {/* â"€â"€ Cancellation notification banner â"€â"€ */}
            {newCancellations.length > 0 && (
              <div style={{ background:"#FEF2F2", border:"1.5px solid #FECACA", borderRadius:12, padding:"1rem 1.2rem",
                marginBottom:"1.2rem", display:"flex", alignItems:"flex-start", gap:"0.85rem" }}>
                <span style={{ fontSize:"1.4rem", flexShrink:0 }}><i className="fa-solid fa-ban" style={{color:"#EF4444"}}/></span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, color:"#991B1B", fontSize:"0.92rem", marginBottom:"0.3rem" }}>
                    {newCancellations.length === 1
                      ? "Your booking has been cancelled"
                      : `${newCancellations.length} of your bookings have been cancelled`}
                  </div>
                  <div style={{ fontSize:"0.82rem", color:"#B91C1C", lineHeight:1.6 }}>
                    {newCancellations.map(b => {
                      const itm = b.type === "car" ? cars.find(c => c.id === b.itemId) : tours.find(t => t.id === b.itemId);
                      const vendorNote = b.notes?.match(/^\[Cancelled by vendor:\s*(.*?)\]$/);
                      return (
                        <div key={b.id} style={{ marginBottom:"0.5rem", paddingBottom:"0.5rem", borderBottom:"1px solid #FECACA" }}>
                          <div>â€¢ <strong>{b.id}</strong> — {itm?.name || (b.type === "car" ? "Car Rental" : "Tour Package")}
                            {b.date ? ` · ${b.date}` : ""}
                            <span style={{ marginLeft:"0.5rem", background:"#FEE2E2", border:"1px solid #FECACA", borderRadius:6, padding:"0.1rem 0.45rem", fontSize:"0.72rem", fontWeight:700, color:"#991B1B" }}>Cancelled by Vendor</span>
                          </div>
                          {vendorNote && (
                            <div style={{ marginTop:"0.2rem", marginLeft:"1rem", fontSize:"0.78rem", color:"#7F1D1D", fontStyle:"italic" }}>
                              Reason: {vendorNote[1]}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={() => { markCancelsSeen(newCancellations.map(b => b.id)); setBookingTab("previous"); }}
                    style={{ marginTop:"0.6rem", background:"#DC2626", color:"#fff", border:"none", borderRadius:8,
                      padding:"0.35rem 0.9rem", fontSize:"0.8rem", fontWeight:700, cursor:"pointer" }}>
                    View Cancelled Bookings <i className="fa-solid fa-arrow-right"/>
                  </button>
                </div>
                <button onClick={() => markCancelsSeen(newCancellations.map(b => b.id))}
                  style={{ background:"none", border:"none", fontSize:"1.1rem", cursor:"pointer", color:"#991B1B", flexShrink:0, lineHeight:1 }}><i className="fa-solid fa-xmark"/></button>
              </div>
            )}

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"0.75rem", marginBottom:"1.1rem" }}>
              <h3 style={{ margin:0 }}><i className="fa-solid fa-calendar-days"/> My Bookings</h3>
              {/* Tab pills */}
              <div style={{ display:"flex", gap:"0.4rem" }}>
              {[["current","Current", currentBookings.length],["previous","Previous", previousBookings.length]].map(([id, label, count]) => (
                  <button key={id}
                    onClick={() => {
                      setBookingTab(id);
                      if (id === "previous") markCancelsSeen(newCancellations.map(b => b.id));
                    }}
                    style={{ background: bookingTab === id ? "var(--ocean)" : "#F3F4F6",
                      color: bookingTab === id ? "#fff" : "var(--ink)",
                      border:"none", borderRadius:20, padding:"0.35rem 0.9rem",
                      fontSize:"0.8rem", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:"0.4rem",
                      position:"relative" }}>
                    {label}
                    {id === "previous" && newCancellations.length > 0 && (
                      <span style={{ position:"absolute", top:-5, right:-5, background:"#DC2626", color:"#fff",
                        borderRadius:50, fontSize:"0.6rem", fontWeight:800, minWidth:16, height:16,
                        display:"flex", alignItems:"center", justifyContent:"center", padding:"0 3px" }}>
                        {newCancellations.length}
                      </span>
                    )}
                    <span style={{ background: bookingTab === id ? "rgba(255,255,255,0.25)" : "#E5E7EB",
                      color: bookingTab === id ? "#fff" : "#6B7280",
                      borderRadius:50, fontSize:"0.65rem", fontWeight:800,
                      padding:"0.1rem 0.45rem", minWidth:18, textAlign:"center" }}>
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Type filter */}
            <div style={{display:"flex",gap:"0.35rem",marginBottom:"1rem"}}>
              {[["all","All"],["car","Car"],["tour","Tour"]].map(([val,label]) => (
                <button key={val} onClick={() => setCpTypeFilter(val)}
                  style={{border:"none",borderRadius:7,padding:"0.3rem 0.8rem",cursor:"pointer",fontWeight:700,fontSize:"0.78rem",
                    background: cpTypeFilter === val ? "var(--ocean)" : "#F3F4F6",
                    color: cpTypeFilter === val ? "#fff" : "#6B7280"}}>
                  {label}
                </button>
              ))}
            </div>

            {tabBookings.length === 0 ? (
              <div style={{ textAlign:"center", padding:"2.5rem 1rem", color:"var(--muted)" }}>
                <div style={{ fontSize:"2.5rem", marginBottom:"0.8rem" }}>
                  {bookingTab === "current" ? <i className="fa-solid fa-calendar-xmark"/> : <i className="fa-solid fa-clock-rotate-left"/>}
                </div>
                <p style={{ fontWeight:600, marginBottom:"0.4rem" }}>
                  {bookingTab === "current" ? "No active bookings" : "No past bookings yet"}
                </p>
                {bookingTab === "current" && (
                  <span style={{ color:"var(--teal)", cursor:"pointer", fontWeight:600, fontSize:"0.88rem" }}
                    onClick={() => goTo("tours")}>Browse tours <i className="fa-solid fa-arrow-right"/></span>
                )}
              </div>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.88rem" }}>
                  <thead>
                    <tr>
                      {["Ref","Item","Date","Pickup","Guests","Total","Status","Booked On","PDF",""].map(h => (
                        <th key={h} style={{ padding:"0.6rem 0.8rem", textAlign:"left",
                          fontSize:"0.72rem", fontWeight:700, color:"var(--muted)",
                          textTransform:"uppercase", letterSpacing:".07em",
                          borderBottom:"1px solid var(--border)", background:"#FAFAFA" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tabBookings.slice().reverse().map(b => {
                      const listingItem = b.type === "car"
                        ? cars.find(c => c.id === b.itemId)
                        : tours.find(t => t.id === b.itemId);
                      const isNewCancel = b.status === "cancelled" && !seenCancelIds.has(b.id);
                      return (
                        <tr key={b.id}
                          onClick={() => { setViewBooking(b); if (isNewCancel) markCancelsSeen([b.id]); }}
                          style={{ borderBottom:"1px solid #F3F4F6", cursor:"pointer", transition:"background .15s",
                            background: isNewCancel ? "#FFF5F5" : "" }}
                          onMouseEnter={e => e.currentTarget.style.background = isNewCancel ? "#FEE2E2" : "#F0F9FF"}
                          onMouseLeave={e => e.currentTarget.style.background = isNewCancel ? "#FFF5F5" : ""}>
                          <td style={{ padding:"0.8rem", fontWeight:700 }}>
                            {isNewCancel && <span style={{ display:"inline-block", width:7, height:7, borderRadius:"50%", background:"#DC2626", marginRight:5, verticalAlign:"middle" }} />}
                            {b.id}
                          </td>
                          <td style={{ padding:"0.8rem" }}>
                              <i className={b.type === "car" ? "fa-solid fa-car" : "fa-solid fa-map"}/> {listingItem?.name || `#${b.itemId}`}
                          </td>
                          <td style={{ padding:"0.8rem", whiteSpace:"nowrap" }}>
                            <div>{b.date}</div>
                            {b.pickTime && <div style={{fontSize:"0.76rem",color:"var(--muted)"}}><i className="fa-solid fa-clock"/> {b.pickTime}</div>}
                          </td>
                          <td style={{ padding:"0.8rem", fontSize:"0.82rem", color:"var(--muted)", maxWidth:"130px" }}>{b.pickup || "—"}</td>
                          <td style={{ padding:"0.8rem" }}>{b.guests}</td>
                          <td style={{ padding:"0.8rem", fontWeight:700, whiteSpace:"nowrap" }}>{fmtPeso(b.total)}</td>
                          <td style={{ padding:"0.8rem" }}><StatusBadge status={b.status} /></td>
                          <td style={{ padding:"0.8rem", fontSize:"0.76rem", color:"var(--muted)", whiteSpace:"nowrap" }}>{fmtCpTs(b.createdAt)}</td>
                          <td style={{ padding:"0.8rem" }} onClick={e => e.stopPropagation()}>
                            <div style={{ display:"flex", flexDirection:"column", gap:"0.35rem", alignItems:"flex-start" }}>
                              <button
                                data-tip="Download PDF"
                                onClick={() => setPdfBooking(b)}
                                style={{ background:"#E0F2FE", color:"#0369A1", border:"none",
                                  borderRadius:8, padding:"0.35rem 0.7rem", cursor:"pointer",
                                  fontSize:"0.8rem", fontWeight:700, display:"flex",
                                  alignItems:"center", gap:"0.3rem", whiteSpace:"nowrap" }}>
                                <i className="fa-solid fa-file-pdf"/> PDF
                              </button>
                              {b.status === "approved" && !b.rating && submitRating && (
                                <button
                                  onClick={() => {
                                    const item = b.type === "car" ? cars.find(c => c.id === b.itemId) : tours.find(t => t.id === b.itemId);
                                    setRatingModal({ booking: b, item, hovered: 0, stars: 0, note: "" });
                                  }}
                                  style={{ background:"#F59E0B", color:"#fff", border:"none",
                                    borderRadius:8, padding:"0.35rem 0.8rem", cursor:"pointer",
                                    fontSize:"0.78rem", fontWeight:700, whiteSpace:"nowrap",
                                    boxShadow:"0 1px 4px rgba(245,158,11,0.35)" }}>
                                  <i className="fa-solid fa-star"/> Rate
                                </button>
                              )}
                              {b.rating > 0 && (
                                <div style={{ display:"flex", alignItems:"center", gap:"0.2rem" }}>
                                  {[1,2,3,4,5].map(i => (
                                    <span key={i} style={{ fontSize:"0.78rem", color: i <= b.rating ? "#F59E0B" : "#D1D5DB" }}><i className="fa-solid fa-star"/></span>
                                  ))}
                                  <span style={{ fontSize:"0.72rem", color:"#6B7280", marginLeft:"0.2rem" }}>{b.rating}/5</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ padding:"0.8rem" }} onClick={e => e.stopPropagation()}>
                            <button
                              data-tip="Delete Booking"
                              onClick={() => setConfirmDeleteId(b.id)}
                              style={{ background:"#FEE2E2", color:"#DC2626", border:"none",
                                borderRadius:8, padding:"0.35rem 0.7rem", cursor:"pointer",
                                fontSize:"0.8rem", fontWeight:700, display:"flex",
                                alignItems:"center", gap:"0.3rem", whiteSpace:"nowrap" }}>
                              <i className="fa-solid fa-trash"/>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="cp-card" style={{ gridColumn:"1/-1" }}>
            <h3><i className="fa-solid fa-rocket"/> Quick Actions</h3>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:"0.8rem" }}>
              {[
                ["fa-solid fa-car","Browse Cars",         "cars"],
                ["fa-solid fa-map","Browse Tours",        "tours"],
                ["fa-solid fa-magnifying-glass","About Us",            "about"],
                ["fa-solid fa-phone","Contact Support",     "contact"],
              ].map(([icon, label, dest]) => (
                <div key={label} onClick={() => goTo(dest)}
                  style={{ background:"#F0F9FF", borderRadius:12, padding:"1rem",
                    textAlign:"center", cursor:"pointer", transition:"all .2s",
                    border:"1px solid var(--border)" }}
                  onMouseEnter={e => { e.currentTarget.style.background="var(--ocean)"; e.currentTarget.style.color="#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background="#F0F9FF"; e.currentTarget.style.color="var(--ink)"; }}>
                  <div style={{ fontSize:"1.6rem", marginBottom:"0.4rem" }}><i className={icon}/></div>
                  <div style={{ fontWeight:600, fontSize:"0.9rem" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* â"€â"€ Change Password â"€â"€ */}
          <div className="cp-card" style={{ gridColumn:"1/-1" }}>
            <h3><i className="fa-solid fa-lock"/> Password &amp; Security</h3>
            {cpwSuccess && (
              <div style={{background:"#ECFDF5",border:"1px solid #A7F3D0",borderRadius:10,padding:"0.7rem 1rem",marginBottom:"1rem",color:"#065F46",fontSize:"0.85rem",fontWeight:600,display:"flex",alignItems:"center",gap:"0.5rem"}}>
                <i className="fa-solid fa-circle-check"/> Password updated successfully!
              </div>
            )}
            {cpwError && (
              <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"0.7rem 1rem",marginBottom:"1rem",color:"#991B1B",fontSize:"0.85rem",fontWeight:600,display:"flex",alignItems:"center",gap:"0.5rem"}}>
                <i className="fa-solid fa-circle-xmark"/> {cpwError}
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"1rem",marginBottom:"1.2rem"}}>
              {[["Create New Password","newPw","Min. 8 characters"],["Confirm Password","confirm","Repeat new password"]].map(([label,key,ph]) => (
                <div key={key}>
                  <div style={{fontSize:"0.72rem",color:"#9CA3AF",fontWeight:600,marginBottom:"0.4rem"}}>{label}</div>
                  <div style={{position:"relative"}}>
                    <input type={cpwShow[key] ? "text" : "password"} placeholder={ph} value={cpwForm[key]}
                      onChange={e => { setCpwForm(f=>({...f,[key]:e.target.value})); setCpwError(""); setCpwSuccess(false); }}
                      style={{width:"100%",border:"1.5px solid #E5E7EB",borderRadius:9,padding:"0.6rem 2.4rem 0.6rem 0.9rem",fontSize:"0.88rem",fontFamily:"inherit",outline:"none",boxSizing:"border-box",background:"#fff",color:"#111"}}
                      onFocus={e=>e.target.style.borderColor="var(--teal)"} onBlur={e=>e.target.style.borderColor="#E5E7EB"} />
                    <button type="button" onClick={() => setCpwShow(s=>({...s,[key]:!s[key]}))}
                      style={{position:"absolute",right:"0.6rem",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",padding:"0.2rem",fontSize:"0.95rem"}}>
                      <i className={cpwShow[key] ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={async () => {
              if (cpwForm.newPw.length < 8) { setCpwError("Password must be at least 8 characters."); return; }
              if (cpwForm.newPw !== cpwForm.confirm) { setCpwError("Passwords do not match."); return; }
              try {
                await api.users.setPassword(user.id, cpwForm.newPw);
                setCpwForm({ newPw:"", confirm:"" });
                setCpwSuccess(true); setTimeout(() => setCpwSuccess(false), 4000);
              } catch (err) { setCpwError(err.message || "Failed to update password."); }
            }}
              style={{background:"var(--ocean)",color:"#fff",border:"none",padding:"0.65rem 1.8rem",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:"0.88rem",display:"flex",alignItems:"center",gap:"0.5rem"}}>
              <i className="fa-solid fa-key"/> Set Password
            </button>

            {/* â"€â"€ Request Account Deletion â"€â"€ */}
            <div style={{borderTop:"1px solid #F3F4F6",marginTop:"1.5rem",paddingTop:"1.5rem"}}>
              {user.deletionRequested ? (
                <div className="deletion-pending">
                  <h4>â³ Deletion Request Pending</h4>
                  <p>Your account deletion request has been submitted on <strong>{user.deletionRequestedAt}</strong>. An admin will review and respond within 1â€"2 business days.</p>
                  <div style={{ background:"#FEF3C7", borderRadius:8, padding:"0.7rem 0.9rem", fontSize:"0.83rem", color:"#92400E", marginBottom:"0.8rem" }}>
                    <strong>Your reason:</strong> {user.deletionReason}
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm("Cancel your deletion request? Your account will remain active.")) {
                        requestDeletion(user.id, "__cancel__");
                      }
                    }}
                    style={{ background:"#fff", border:"2px solid #FCD34D", color:"#92400E", padding:"0.65rem 1.4rem", borderRadius:10, cursor:"pointer", fontWeight:700, fontSize:"0.88rem" }}
                  >
                    â†©ï¸ Cancel Deletion Request
                  </button>
                </div>
              ) : (
                <div className="deletion-zone">
                  <h4><i className="fa-solid fa-trash"/> Delete My Account</h4>
                  <p>Once your deletion request is approved by an admin, your account and all associated data will be permanently removed. This action cannot be undone.</p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    style={{ background:"var(--danger)", color:"#fff", border:"none", padding:"0.75rem 1.6rem", borderRadius:10, cursor:"pointer", fontWeight:700, fontSize:"0.9rem" }}
                  >
                    Request Account Deletion
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Delete Account Confirm Modal */}
      {showDeleteModal && (
        <div className="overlay" onClick={() => { setShowDeleteModal(false); setDeleteReason(""); setDeleteConfirmText(""); }} style={{ zIndex:500 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:480, padding:"2rem", boxShadow:"0 25px 80px rgba(0,0,0,0.25)" }}>
            <div style={{ textAlign:"center", marginBottom:"1.5rem" }}>
              <div style={{ fontSize:"3rem", marginBottom:"0.8rem" }}><i className="fa-solid fa-trash" style={{color:"var(--danger)"}}/></div>
              <h3 style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:"1.2rem", marginBottom:"0.4rem" }}>Request Account Deletion</h3>
              <p style={{ color:"var(--muted)", fontSize:"0.88rem", lineHeight:1.7 }}>
                Your request will be sent to an admin for review. Your account stays active until the admin approves the deletion.
              </p>
            </div>

            <div style={{ marginBottom:"1rem" }}>
              <label style={{ display:"block", fontSize:"0.78rem", fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".06em", marginBottom:"0.5rem" }}>
                Reason for leaving (optional)
              </label>
              <textarea
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                placeholder="Tell us why you want to delete your account..."
                style={{ width:"100%", border:"2px solid var(--border)", borderRadius:10, padding:"0.75rem", fontFamily:"inherit", fontSize:"0.9rem", resize:"vertical", minHeight:80, outline:"none" }}
              />
            </div>

            <div style={{ marginBottom:"1.5rem" }}>
              <label style={{ display:"block", fontSize:"0.78rem", fontWeight:700, color:"var(--danger)", textTransform:"uppercase", letterSpacing:".06em", marginBottom:"0.5rem" }}>
                Type "DELETE" to confirm *
              </label>
              <input
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE here"
                style={{ width:"100%", border:`2px solid ${deleteConfirmText === "DELETE" ? "var(--danger)" : "var(--border)"}`, borderRadius:10, padding:"0.75rem", fontFamily:"inherit", fontSize:"0.95rem", outline:"none", fontWeight:700, letterSpacing:".05em" }}
              />
            </div>

            <div style={{ display:"flex", gap:"0.8rem" }}>
              <button
                disabled={deleteConfirmText !== "DELETE"}
                onClick={() => {
                  requestDeletion(user.id, deleteReason || "No reason provided.");
                  setShowDeleteModal(false);
                  setDeleteReason("");
                  setDeleteConfirmText("");
                }}
                style={{ flex:2, background: deleteConfirmText === "DELETE" ? "var(--danger)" : "#D1D5DB", color:"#fff", border:"none", padding:"0.9rem", borderRadius:12, cursor: deleteConfirmText === "DELETE" ? "pointer" : "not-allowed", fontWeight:700, fontSize:"0.95rem" }}
              >
                Submit Deletion Request
              </button>
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteReason(""); setDeleteConfirmText(""); }}
                style={{ flex:1, background:"#F3F4F6", color:"var(--ink)", border:"none", padding:"0.9rem", borderRadius:12, cursor:"pointer", fontWeight:700 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

