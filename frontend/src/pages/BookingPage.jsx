import { useState } from "react";
import { fmtPeso } from "../utils/helpers.js";
import BookingSummaryModal from "../components/BookingSummaryModal.jsx";
import { api } from "../api.js";

const STEPS = ["Schedule", "Your Details", "Payment", "Confirmation"];

const TIME_SLOTS = ["06:00 AM","07:00 AM","08:00 AM","09:00 AM","10:00 AM","11:00 AM",
  "12:00 PM","01:00 PM","02:00 PM","03:00 PM","04:00 PM","05:00 PM","06:00 PM","07:00 PM"];

// Simple inline calendar hook
function useCalendar(initYear, initMonth) {
  const [year, setYear] = useState(initYear);
  const [month, setMonth] = useState(initMonth);
  const today = new Date(); today.setHours(0,0,0,0);
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = new Date(year, month).toLocaleString("default", { month: "long", year: "numeric" });
  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); };
  return { year, month, today, firstDay, daysInMonth, monthName, prev, next };
}

function MiniCalendar({ selectedStart, selectedEnd, onSelect, rangeMode }) {
  const now = new Date();
  const cal = useCalendar(now.getFullYear(), now.getMonth());
  const blanks = Array(cal.firstDay).fill(null);
  const days = Array.from({ length: cal.daysInMonth }, (_, i) => i + 1);

  const toDate = (d) => new Date(cal.year, cal.month, d);
  const isPast = (d) => toDate(d) < cal.today;
  const isStart = (d) => selectedStart && toDate(d).toDateString() === new Date(selectedStart).toDateString();
  const isEnd = (d) => selectedEnd && toDate(d).toDateString() === new Date(selectedEnd).toDateString();
  const inRange = (d) => {
    if (!rangeMode || !selectedStart || !selectedEnd) return false;
    const dt = toDate(d); const s = new Date(selectedStart); const e = new Date(selectedEnd);
    return dt > s && dt < e;
  };

  const handleDay = (d) => { if (isPast(d)) return; onSelect(toDate(d)); };

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-PH",{month:"short",day:"numeric"}) : "";

  return (
    <div>
      <div className="cal-nav">
        <button onClick={cal.prev}>‹</button>
        <h3>{cal.monthName}</h3>
        <button onClick={cal.next}>›</button>
      </div>
      <div className="cal-grid">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => <div key={d} className="cal-day-name">{d}</div>)}
        {blanks.map((_, i) => <div key={`b${i}`} className="cal-day cal-day-empty" />)}
        {days.map(d => (
          <div key={d}
            className={[
              "cal-day",
              isPast(d) ? "cal-day-past" : "",
              isStart(d) ? "selected" : "",
              isEnd(d) ? "range-end" : "",
              inRange(d) ? "in-range" : "",
              toDate(d).toDateString() === cal.today.toDateString() && !isStart(d) ? "today" : "",
            ].join(" ")}
            onClick={() => handleDay(d)}
          >{d}</div>
        ))}
      </div>
      {selectedStart && (
        <div style={{marginTop:"0.8rem",fontSize:"0.82rem",color:"var(--muted)",textAlign:"center"}}>
          {rangeMode
            ? selectedEnd
              ? `${fmt(selectedStart)} → ${fmt(selectedEnd)} (${Math.max(1,Math.round((new Date(selectedEnd)-new Date(selectedStart))/86400000))} day(s))`
              : `Start: ${fmt(selectedStart)} – pick return date (or same date = 1 day)`
            : `Selected: ${fmt(selectedStart)}`
          }
        </div>
      )}
    </div>
  );
}

export default function BookingPage({ item, user, onBook, goTo, serviceFee = 5, users = [] }) {
  const [step, setStep] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);

  // Schedule state
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [pickTime, setPickTime] = useState("");
  const [dropTime, setDropTime] = useState("");
  const [calPhase, setCalPhase] = useState("start"); // "start" | "end"

  // Guest details
  const [form, setForm] = useState({
    name: user?.name || "", email: user?.email || "",
    phone: "", pickup: "", guests: 1, notes: ""
  });

  // Payment
  const [payMethod, setPayMethod] = useState("gcash");
  const [proofFile, setProofFile] = useState(null);
  const [bookingId] = useState("BK" + Math.floor(1000 + Math.random() * 9000));
  const [showPdf, setShowPdf] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  if (!item) return (
    <div style={{textAlign:"center",padding:"8rem 2rem",paddingTop:"8rem"}}>
      <h2>No item selected</h2>
      <button className="btn-primary" style={{marginTop:"1rem"}} onClick={() => goTo("tours")}>Browse Tours</button>
    </div>
  );

  const isCar    = item.itemType === "car";
  const isPerVan = !isCar && item.pricingType === "per_van";
  const days = startDate && endDate ? Math.max(1, Math.round((endDate - startDate) / 86400000)) : startDate ? 1 : 0;
  const subtotal = isCar
    ? item.price * Math.max(days, 1)
    : isPerVan
      ? item.price                        // flat group/package rate
      : item.price * form.guests;         // per-person × guests
  const serviceF = Math.round(subtotal * (serviceFee / 100));
  const total = subtotal + serviceF;
  const fmtDate = (d) => d ? d.toLocaleDateString("en-PH",{weekday:"short",month:"short",day:"numeric",year:"numeric"}) : "—";

  // Calendar selection handler
  const handleCalSelect = (date) => {
    if (!isCar) { setStartDate(date); return; }
    if (calPhase === "start") { setStartDate(date); setEndDate(null); setCalPhase("end"); }
    else { if (date < startDate) { setStartDate(date); setCalPhase("end"); } else { setEndDate(date); setCalPhase("done"); } }
  };

  const resetCal = () => { setStartDate(null); setEndDate(null); setCalPhase("start"); };

  const canNextSchedule = startDate && pickTime;
  const maxGuests = item.groupSize || 20;
  const guestsOverLimit = !isCar && form.guests > maxGuests;
  const phoneValid = /^09\d{9}$/.test(form.phone);
  const canNextDetails = form.name && form.email && phoneValid && form.pickup && !guestsOverLimit;
  const canNextPayment = proofFile || payMethod === "cash";

  const handleFinalSubmit = async () => {
    const matchedUser = users.find(u => u.email?.toLowerCase() === form.email?.toLowerCase());
    const resolvedUserId = matchedUser?.id || user?.id || 0;
    const bookingData = {
      userId: resolvedUserId,
      type: item.itemType,
      itemId: item.id,
      vendorId: item.vendorId,
      name: form.name, email: form.email, phone: form.phone,
      date: startDate?.toISOString().split("T")[0] || "",
      returnDate: endDate?.toISOString().split("T")[0] || startDate?.toISOString().split("T")[0] || "",
      pickup: form.pickup, guests: form.guests, notes: form.notes,
      pickTime, dropTime, total, payment: payMethod,
    };
    if (proofFile) {
      try {
        const { url } = await api.upload(proofFile);
        onBook({ ...bookingData, paymentProof: url });
        setStep(3);
      } catch (err) {
        alert('Proof upload failed: ' + err.message);
      }
    } else {
      onBook(bookingData);
      setStep(3);
    }
  };

  // -- All steps rendered as plain JSX (NOT inline components) --
  // Defining steps as `const X = () => (...)` inside a parent component causes
  // React to treat them as brand-new component types on every render, which
  // unmounts/remounts the DOM -- killing input focus on every keystroke.
  // Using plain JSX variables fixes this entirely.

  const vendor = users.find(u => u.id === item?.vendorId);
  const hasGcash = !!(vendor?.gcashNumber);
  const hasBank  = !!(vendor?.bankNumber);

  const PAY_METHODS = [
    ...(hasGcash || !vendor ? [{ id:"gcash", icon:"fa-solid fa-mobile-screen", name:"GCash", sub:"Instant transfer" }] : []),
    ...(hasBank  || !vendor ? [{ id:"bank",  icon:"fa-solid fa-building-columns", name:"Bank Transfer", sub: vendor?.bankProvider || "BDO / BPI / UnionBank" }] : []),
    { id:"cash", icon:"fa-solid fa-money-bill-wave", name:"Cash on Day", sub:"Pay at pickup" },
  ];
  const PAY_DETAILS = {
    gcash: hasGcash
      ? { label:"GCash Number", value: vendor.gcashNumber, name: vendor.gcashName || vendor.name }
      : { label:"GCash Number", value:"—", name:"Contact vendor for details" },
    bank: hasBank
      ? { label:"Account Number", value: vendor.bankNumber, name: `${vendor.bankName || vendor.name}${vendor.bankProvider ? " / " + vendor.bankProvider : ""}` }
      : { label:"Account Number", value:"—", name:"Contact vendor for details" },
    cash:  null,
  };

  const orderSidebarJSX = (
    <div className="order-sidebar">
      <button className="sidebar-mobile-toggle" onClick={() => setShowSidebar(s => !s)}>
        <span><i className="fa-solid fa-receipt"/> Order Summary — {fmtPeso(total)}</span>
        <i className={`fa-solid fa-chevron-${showSidebar ? "up" : "down"}`}/>
      </button>
      <div className={`order-sidebar-collapsible${showSidebar ? " open" : ""}`}>
      {item.image
        ? <img src={item.image} alt={item.name} className="order-sidebar-img" onError={e=>{e.currentTarget.style.display="none";}} />
        : <div className="order-sidebar-img" style={{background:"#F1F5F9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.8rem",color:"#D1D5DB"}}><i className={`fa-solid ${item.type==="car"?"fa-car":"fa-umbrella-beach"}`}/></div>
      }
      <div className="order-sidebar-body">
        <div className="order-badge">{item.type || item.category}</div>
        <div className="order-item-name">{item.name}</div>
        <div className="order-item-loc"><i className="fa-solid fa-location-dot"/> {item.location}</div>
        <hr className="order-divider" />
        {startDate && <div className="order-row"><span><i className="fa-solid fa-calendar"/> Start</span><span>{fmtDate(startDate)}</span></div>}
        {isCar && endDate && <div className="order-row"><span><i className="fa-solid fa-rotate"/> Return</span><span>{fmtDate(endDate)}</span></div>}
        {pickTime && <div className="order-row"><span><i className="fa-solid fa-clock"/> Pickup time</span><span>{pickTime}</span></div>}
        {isCar && dropTime && <div className="order-row"><span><i className="fa-solid fa-clock"/> Drop-off</span><span>{dropTime}</span></div>}
        {form.pickup && <div className="order-row"><span><i className="fa-solid fa-location-dot"/> Meetup</span><span style={{textAlign:"right",maxWidth:"160px"}}>{form.pickup}</span></div>}
        {!isCar && form.guests > 0 && <div className="order-row"><span><i className="fa-solid fa-users"/> Guests</span><span>{form.guests} pax</span></div>}
        <hr className="order-divider" />
        <div className="order-row"><span>Base price</span><span>{fmtPeso(subtotal)}</span></div>
        {isCar && days >= 1 && <div className="order-row" style={{fontSize:"0.78rem",color:"var(--muted)"}}><span>{fmtPeso(item.price)} × {days} {days === 1 ? "day" : "days"}</span></div>}
        {!isCar && !isPerVan && form.guests > 1 && <div className="order-row" style={{fontSize:"0.78rem",color:"var(--muted)"}}><span>{fmtPeso(item.price)} × {form.guests} pax</span></div>}
        {!isCar && isPerVan && <div className="order-row" style={{fontSize:"0.78rem",color:"var(--muted)"}}><span><i className="fa-solid fa-van-shuttle"/> Package / group rate</span></div>}
        <div className="order-row"><span>Service fee ({serviceFee}%)</span><span>{fmtPeso(serviceF)}</span></div>
        <div className="order-row total"><span>Total</span><span style={{color:"var(--coral)"}}>{fmtPeso(total)}</span></div>
        {item.includes && item.includes.length > 0 && (
          <>
            <hr className="order-divider" />
            <div style={{fontSize:"0.78rem",fontWeight:"700",color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:"0.5rem"}}>Includes</div>
            {item.includes.map(inc => <div key={inc} style={{fontSize:"0.82rem",color:"var(--success)",marginBottom:"0.25rem"}}><i className="fa-solid fa-check"/> {inc}</div>)}
          </>
        )}
      </div>
      </div>
    </div>
  );

  const stepScheduleJSX = (
    <div className="wizard-panel fade-in">
      <h2>Pick Your Schedule</h2>
      <p className="sub">{isCar ? "Select pickup date and preferred times. Pick a return date or the same date for a 1-day rental." : "Select your tour date and preferred time slot."}</p>
      <div style={{marginBottom:"1.5rem"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
          <strong style={{fontSize:"0.9rem"}}>
            {isCar
              ? calPhase === "start" ? "1. Select pickup date" : calPhase === "end" ? "2. Select return date (tap same date for 1-day)" : "Dates selected"
              : "Select tour date"}
          </strong>
          {startDate && <button onClick={resetCal} style={{background:"none",border:"none",color:"var(--coral)",cursor:"pointer",fontSize:"0.82rem",fontWeight:"600"}}>Reset</button>}
        </div>
        <MiniCalendar selectedStart={startDate} selectedEnd={endDate} onSelect={handleCalSelect} rangeMode={isCar} />
      </div>
      <hr style={{border:"none",borderTop:"1px solid var(--border)",margin:"1.5rem 0"}} />
      <div className={`time-sections-grid${isCar ? "" : " single"}`}>
        <div>
          <label style={{display:"block",fontSize:"0.78rem",fontWeight:"700",color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:"0.5rem"}}>
            {isCar ? "Pickup Time *" : "Start Time *"}
          </label>
          <div className="timeslot-grid" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
            {TIME_SLOTS.slice(0,9).map(t => (
              <div key={t} className={`timeslot ${pickTime===t?"selected":""}`} onClick={() => setPickTime(t)}>{t}</div>
            ))}
          </div>
        </div>
        {isCar && (
          <div>
            <label style={{display:"block",fontSize:"0.78rem",fontWeight:"700",color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:"0.5rem"}}>
              Drop-off Time (optional)
            </label>
            <div className="timeslot-grid" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
              {TIME_SLOTS.slice(5).map(t => (
                <div key={t} className={`timeslot ${dropTime===t?"selected":""}`} onClick={() => setDropTime(t)}>{t}</div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="wiz-btns">
        <button className="wiz-btn-back" onClick={() => goTo(isCar ? "cars" : "tours")}>← Back</button>
        <button className="wiz-btn-next" disabled={!canNextSchedule} onClick={() => setStep(1)}>
          Continue to Details →
        </button>
      </div>
    </div>
  );

  const stepDetailsJSX = (
    <div className="wizard-panel">
      <h2>Your Details</h2>
      <p className="sub">Tell us who's coming. This is how the vendor will contact you.</p>
      <div className="guest-grid">
        <div className="form-group">
          <label>Full Name *</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({...f, name: e.target.value}))}
            placeholder="Juan dela Cruz"
            autoComplete="name"
          />
        </div>
        <div className="form-group">
          <label>Phone / WhatsApp *</label>
          <input
            value={form.phone}
            onChange={e => setForm(f => ({...f, phone: e.target.value.replace(/\D/g,'').slice(0,11)}))}
            placeholder="09XXXXXXXXX"
            inputMode="numeric"
            maxLength={11}
            autoComplete="tel"
            style={form.phone && !phoneValid ? {borderColor:"#EF4444"} : {}}
          />
        </div>
        <div className="form-group full">
          <label>Email Address *</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({...f, email: e.target.value}))}
            placeholder="you@email.com"
            autoComplete="email"
          />
        </div>
        <div className="form-group full">
          <label>Pickup / Meeting Point *</label>
          <input
            value={form.pickup}
            onChange={e => setForm(f => ({...f, pickup: e.target.value}))}
            placeholder="e.g. SM City Cebu, Fuente Osmeña Circle, Mactan Airport..."
            autoComplete="off"
          />
        </div>
        {!isCar && (
          <div className="form-group">
            <label style={{display:"flex",alignItems:"center",gap:"0.4rem",flexWrap:"nowrap",whiteSpace:"nowrap",overflow:"hidden"}}>
              <span style={{flexShrink:0}}>No. of Guests</span>
              <span style={{fontWeight:400,color:"#94A3B8",fontSize:"0.72rem",flexShrink:0}}>(max {maxGuests}{isPerVan ? " · flat rate" : ""})</span>
            </label>
            <input
              type="number"
              min={1}
              max={maxGuests}
              value={form.guests}
              style={guestsOverLimit ? {border:"2px solid #EF4444",background:"#FFF5F5"} : {}}
              onChange={e => {
                const val = Math.max(1, +e.target.value);
                setForm(f => ({...f, guests: val}));
              }}
            />
            {guestsOverLimit && (
              <div style={{marginTop:"0.4rem",fontSize:"0.8rem",color:"#DC2626",display:"flex",alignItems:"center",gap:"0.35rem"}}>
                <i className="fa-solid fa-triangle-exclamation"/> Maximum group size for this tour is <strong>{maxGuests}</strong> people. Please reduce the number of guests.
              </div>
            )}
          </div>
        )}
        <div className="form-group full">
          <label>Special Requests (optional)</label>
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({...f, notes: e.target.value}))}
            placeholder="Dietary needs, accessibility requirements, early pickup, etc."
          />
        </div>
      </div>

      {/* Live validation hints */}
      {(!form.name || !form.email || !form.pickup || !form.phone || (form.phone && !phoneValid)) && (
        <div style={{background:"#FEF3C7",border:"1px solid #FCD34D",borderRadius:"10px",padding:"0.8rem 1rem",marginTop:"1rem",fontSize:"0.83rem",color:"#92400E"}}>
          <i className="fa-solid fa-triangle-exclamation"/>
          {form.phone && !phoneValid
            ? " Phone number must be 11 digits and start with 09 (e.g. 09XXXXXXXXX)."
            : " Please fill in all required fields marked with * to continue."}
        </div>
      )}

      <div className="wiz-btns">
        <button className="wiz-btn-back" onClick={() => setStep(0)}>← Back</button>
        <button className="wiz-btn-next" disabled={!canNextDetails} onClick={() => setStep(2)}>
          Continue to Payment →
        </button>
      </div>
    </div>
  );

  const stepPaymentJSX = (
    <div className="wizard-panel fade-in">
      <h2>Payment</h2>
      <p className="sub">Choose how you'd like to pay for your booking.</p>
      <div style={{marginBottom:"1.5rem"}}>
        <div style={{fontSize:"0.8rem",fontWeight:"700",color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:"0.8rem"}}>Payment Method</div>
        <div className="pay-methods">
          {PAY_METHODS.map(m => (
            <div key={m.id} className={`pay-method ${payMethod===m.id?"selected":""}`} onClick={() => setPayMethod(m.id)}>
              <span className="pay-method-icon"><i className={m.icon}/></span>
              <div className="pay-method-name">{m.name}</div>
              <div className="pay-method-sub">{m.sub}</div>
              {payMethod===m.id && <div style={{marginTop:"0.5rem",fontSize:"0.7rem",color:"var(--success)",fontWeight:"700"}}><i className="fa-solid fa-check"/> Selected</div>}
            </div>
          ))}
        </div>
      </div>
      {PAY_DETAILS[payMethod] && (
        <div className="pay-instructions">
          <h4><i className="fa-solid fa-credit-card"/> {payMethod === "gcash" ? "GCash" : "Bank Transfer"} Instructions</h4>
          <div className="pay-detail-row"><span>Amount to send:</span><strong style={{color:"var(--coral)",fontSize:"1.1rem"}}>{fmtPeso(total)}</strong></div>
          <div className="pay-detail-row"><span>{PAY_DETAILS[payMethod].label}:</span><strong>{PAY_DETAILS[payMethod].value}</strong></div>
          <div className="pay-detail-row"><span>Account Name:</span><strong>{PAY_DETAILS[payMethod].name}</strong></div>
          <div className="pay-detail-row"><span>Reference:</span><strong>{bookingId} – {form.name}</strong></div>
          <div style={{marginTop:"0.8rem",padding:"0.6rem",background:"rgba(10,77,104,0.08)",borderRadius:"8px",fontSize:"0.82rem",color:"var(--ocean)"}}>
            <i className="fa-solid fa-circle-info"/> Use <strong>{bookingId}</strong> as your payment reference so we can match your payment quickly.
          </div>
        </div>
      )}
      {payMethod === "cash" && (
        <div className="pay-instructions">
          <h4><i className="fa-solid fa-money-bill-wave"/> Cash Payment</h4>
          <div className="pay-detail-row"><span>Amount to prepare:</span><strong style={{color:"var(--coral)",fontSize:"1.1rem"}}>{fmtPeso(total)}</strong></div>
          <div style={{marginTop:"0.8rem",fontSize:"0.82rem",color:"var(--ocean)",padding:"0.6rem",background:"rgba(10,77,104,0.08)",borderRadius:"8px"}}>
            <i className="fa-solid fa-circle-info"/> Prepare exact amount in cash. Pay the driver/guide directly on the day of your booking at the pickup point.
          </div>
        </div>
      )}
      {payMethod !== "cash" && (
        <div>
          <div style={{fontSize:"0.8rem",fontWeight:"700",color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:"0.6rem"}}>
            Upload Payment Screenshot *
          </div>
          <label htmlFor="proof-upload">
            <div className={`pay-upload ${proofFile ? "has-file" : ""}`}>
              <span className="pay-upload-icon"><i className={proofFile ? "fa-solid fa-circle-check" : "fa-solid fa-camera"} style={proofFile ? {color:"var(--success)"} : {}}/></span>
              <strong style={{fontSize:"0.9rem"}}>{proofFile ? proofFile.name : "Click to upload screenshot"}</strong>
              <p>{proofFile ? "File uploaded! You can change it by clicking again." : "JPG, PNG or PDF accepted (max 5MB)"}</p>
            </div>
          </label>
          <input id="proof-upload" type="file" accept="image/*,.pdf" style={{display:"none"}}
            onChange={e => setProofFile(e.target.files[0] || null)} />
        </div>
      )}
      <div className="wiz-btns">
        <button className="wiz-btn-back" onClick={() => setStep(1)}>← Back</button>
        <button className="wiz-btn-next" disabled={!canNextPayment} onClick={() => setShowConfirmModal(true)}>
          <i className="fa-solid fa-calendar-check"/> Review &amp; Confirm
        </button>
      </div>
    </div>
  );

  const stepConfirmationJSX = (
    <div className="wizard-panel fade-in" style={{maxWidth:"640px",margin:"0 auto"}}>
      <div className="confirm-hero">
        <div className="confirm-check"><i className="fa-solid fa-circle-check"/></div>
        <div className="confirm-id">{bookingId}</div>
        <h2 style={{marginBottom:"0.5rem"}}>Booking Confirmed!</h2>
        <p style={{color:"var(--muted)",lineHeight:"1.7"}}>
          Your booking for <strong>{item.name}</strong> has been submitted. A confirmation will be sent to <strong>{form.email}</strong>.
        </p>
      </div>
      <div style={{background:"#F0F9FF",borderRadius:"16px",padding:"1.5rem",margin:"1.5rem 0"}}>
        <div style={{fontSize:"0.78rem",fontWeight:"700",color:"var(--muted)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:"1rem"}}>Booking Summary</div>
        {[
          ["Reference", bookingId],
          ["Item", item.name],
          ["Date", fmtDate(startDate)],
          isCar && endDate ? ["Return", fmtDate(endDate)] : null,
          ["Time", pickTime],
          ["Meetup", form.pickup],
          ["Name", form.name],
          ["Phone", form.phone],
          ["Total", fmtPeso(total)],
          ["Payment", payMethod === "gcash" ? "GCash" : payMethod === "bank" ? "Bank Transfer" : "Cash on Day"],
        ].filter(Boolean).map(([k,v]) => (
          <div key={k} className="order-row" style={{borderBottom:"1px solid var(--border)",paddingBottom:"0.5rem",marginBottom:"0.5rem"}}>
            <span style={{color:"var(--muted)"}}>{k}</span><strong>{v}</strong>
          </div>
        ))}
      </div>
      <div className="confirm-timeline">
        <div style={{fontSize:"0.78rem",fontWeight:"700",color:"var(--muted)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:"1rem"}}>What Happens Next</div>
        {[
          ["1","Booking Received","Your request is now in our system and visible to the vendor."],
          ["2","Payment Verified", payMethod==="cash" ? "Prepare exact cash for pickup day." : "We'll verify your payment screenshot within 1–2 hours."],
          ["3","Vendor Confirms","The vendor will approve and send you a confirmation message via WhatsApp/email."],
          ["4","Enjoy Your Trip","Show your booking ID on the day. Have a wonderful adventure!"],
        ].map(([dot,title,desc],i,arr) => (
          <div key={title}>
            <div className="timeline-item">
              <div className="tl-dot">{dot}</div>
              <div className="tl-content"><h4>{title}</h4><p>{desc}</p></div>
            </div>
            {i < arr.length - 1 && <div className="tl-connector" />}
          </div>
        ))}
      </div>
      <div className="confirm-actions">
        <button className="wiz-btn-back" style={{flex:"unset"}} onClick={() => goTo(isCar ? "cars" : "tours")}>
          Browse More
        </button>
        <button
          style={{background:"#E85D04",color:"#fff",border:"none",borderRadius:"12px",padding:"0.9rem",cursor:"pointer",fontWeight:"700",fontSize:"0.95rem",transition:"all .2s"}}
          onClick={() => setShowPdf({
            booking: {
              id: bookingId, type: item.itemType, itemId: item.id, vendorId: item.vendorId, status:"pending",
              name: form.name, email: form.email, phone: form.phone,
              date: startDate?.toISOString().split("T")[0] || "",
              returnDate: endDate?.toISOString().split("T")[0] || startDate?.toISOString().split("T")[0] || "",
              pickup: form.pickup, guests: form.guests, notes: form.notes,
              pickTime, dropTime, total, payment: payMethod,
            },
            itemName: item.name,
            item: item,
          })}
        >
          <i className="fa-solid fa-file-pdf"/> View Summary
        </button>
        <button className="wiz-btn-next" style={{flex:"unset"}} onClick={() => goTo("home")}>
          <i className="fa-solid fa-house"/> Back to Home
        </button>
      </div>
    </div>
  );

  const stepJSX = [stepScheduleJSX, stepDetailsJSX, stepPaymentJSX, stepConfirmationJSX];

  return (
    <>
      {showPdf && <BookingSummaryModal booking={showPdf.booking} itemName={showPdf.itemName} item={showPdf.item} onClose={() => setShowPdf(null)} vendor={vendor} serviceFee={serviceFee} />}

      {/* -- Booking Confirmation Modal -- */}
      {showConfirmModal && (
        <div className="overlay" onClick={() => setShowConfirmModal(false)} style={{zIndex:600,background:"rgba(0,0,0,0.55)"}}>
          <div onClick={e => e.stopPropagation()} style={{
            background:"#fff", borderRadius:24, width:"100%", maxWidth:520,
            boxShadow:"0 28px 80px rgba(0,0,0,0.22)", overflow:"hidden", maxHeight:"90vh", display:"flex", flexDirection:"column"
          }}>
            {/* Header */}
            <div style={{background:"linear-gradient(135deg,#0A4D68,#088395)",padding:"1.4rem 1.8rem",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
              <div>
                <div style={{color:"#fff",fontWeight:800,fontSize:"1.05rem"}}><i className="fa-solid fa-calendar-check"/> Confirm Your Booking</div>
                <div style={{color:"rgba(255,255,255,0.72)",fontSize:"0.78rem",marginTop:"0.2rem"}}>Please review the details before submitting</div>
              </div>
              <button onClick={() => setShowConfirmModal(false)}
                style={{background:"rgba(255,255,255,0.18)",border:"none",borderRadius:8,padding:"0.4rem 0.75rem",cursor:"pointer",color:"#fff",fontWeight:700,fontSize:"1rem",lineHeight:1}}>
                <i className="fa-solid fa-xmark"/>
              </button>
            </div>

            {/* Body – scrollable */}
            <div style={{overflowY:"auto",padding:"1.5rem 1.8rem",flex:1}}>

              {/* Listing thumbnail + name */}
              <div style={{display:"flex",gap:"1rem",alignItems:"center",marginBottom:"1.25rem",padding:"1rem",background:"#F8FAFC",borderRadius:14,border:"1px solid #E9ECF0"}}>
                {item.image
                  ? <img src={item.image} alt={item.name} style={{width:64,height:64,objectFit:"cover",borderRadius:10,flexShrink:0}} onError={e=>{e.currentTarget.style.display="none";}} />
                  : <div style={{width:64,height:64,borderRadius:10,background:"#F1F5F9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.5rem",color:"#D1D5DB",flexShrink:0}}><i className={`fa-solid ${item.type==="car"?"fa-car":"fa-umbrella-beach"}`}/></div>
                }
                <div>
                  <div style={{fontWeight:700,fontSize:"0.95rem",color:"#111827"}}>{item.name}</div>
                  <div style={{fontSize:"0.78rem",color:"var(--muted)",marginTop:"0.2rem"}}><i className="fa-solid fa-location-dot"/> {item.location}</div>
                  <div style={{display:"inline-block",marginTop:"0.3rem",background:"#E0F2FE",color:"#0369A1",fontSize:"0.7rem",fontWeight:700,padding:"0.15rem 0.6rem",borderRadius:20}}>
                    <i className={`fa-solid ${isCar?"fa-car":"fa-map"}`}/> {isCar ? "Car Rental" : "Tour Package"}
                  </div>
                </div>
              </div>

              {/* Details rows */}
              {[
                ["Date",        fmtDate(startDate)],
                isCar && endDate && endDate !== startDate ? ["Return", fmtDate(endDate)] : null,
                isCar && days >= 1 ? ["Duration", days === 1 ? "1 day" : `${days} days`] : null,
                ["Pickup Time", pickTime],
                dropTime ? ["Drop-off", dropTime] : null,
                ["Meetup Point", form.pickup],
                !isCar ? ["Guests", `${form.guests} pax`] : null,
                ["Name",        form.name],
                ["Email",       form.email],
                ["Phone",       form.phone],
                form.notes ? ["Notes", form.notes] : null,
              ].filter(Boolean).map(([label, value]) => (
                <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"0.55rem 0",borderBottom:"1px solid #F3F4F6",fontSize:"0.88rem",gap:"1rem"}}>
                  <span style={{color:"#6B7280",flexShrink:0}}>{label}</span>
                  <span style={{fontWeight:600,color:"#111827",textAlign:"right"}}>{value}</span>
                </div>
              ))}

              {/* Payment */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.55rem 0",borderBottom:"1px solid #F3F4F6",fontSize:"0.88rem",gap:"1rem"}}>
                <span style={{color:"#6B7280",flexShrink:0}}><i className="fa-solid fa-credit-card"/> Payment</span>
                <span style={{fontWeight:600,color:"#111827"}}>
                  {payMethod === "gcash" ? "GCash" : payMethod === "bank" ? "Bank Transfer" : "Cash on Day"}
                  {proofFile ? <span style={{marginLeft:"0.5rem",fontSize:"0.75rem",color:"#059669",fontWeight:700}}><i className="fa-solid fa-check"/> Screenshot attached</span> : null}
                </span>
              </div>

              {/* Total */}
              <div style={{marginTop:"1rem",background:"linear-gradient(135deg,#F0F9FF,#E0F2FE)",borderRadius:12,padding:"1rem 1.2rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontWeight:700,color:"#0A4D68",fontSize:"0.9rem"}}>Total Amount</span>
                <span style={{fontWeight:800,fontSize:"1.4rem",color:"#E85D04"}}>{fmtPeso(total)}</span>
              </div>

              <div style={{marginTop:"1rem",background:"#FEF3C7",border:"1px solid #FCD34D",borderRadius:10,padding:"0.75rem 1rem",fontSize:"0.8rem",color:"#92400E"}}>
                <i className="fa-solid fa-triangle-exclamation"/> By confirming, you agree to our booking policy. Cancellations must be made 24 hours before the scheduled date.
              </div>
            </div>

            {/* Footer buttons */}
            <div style={{padding:"1.2rem 1.8rem",borderTop:"1px solid #F3F4F6",display:"flex",gap:"0.75rem",flexShrink:0}}>
              <button onClick={() => setShowConfirmModal(false)}
                style={{flex:1,background:"#F3F4F6",color:"#374151",border:"none",padding:"0.9rem",borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:"0.92rem"}}>
                ← Go Back
              </button>
              <button onClick={() => { setShowConfirmModal(false); handleFinalSubmit(); }}
                style={{flex:2,background:"linear-gradient(135deg,#0A4D68,#088395)",color:"#fff",border:"none",padding:"0.9rem",borderRadius:12,cursor:"pointer",fontWeight:800,fontSize:"0.95rem",boxShadow:"0 4px 14px rgba(10,77,104,0.3)"}}>
                <i className="fa-solid fa-circle-check"/> Yes, Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="wizard-wrap">
      <div className="wizard-inner">
        {/* Stepper */}
        <div className="stepper">
          {STEPS.map((label, i) => (
            <div key={label} className="step-item">
              <div className="step-col">
                <div className={`step-circle ${i < step ? "done" : i === step ? "active" : ""}`}>
                  {i < step ? <i className="fa-solid fa-check"/> : i + 1}
                </div>
                <div className={`step-label ${i < step ? "done" : i === step ? "active" : ""}`}>{label}</div>
              </div>
              {i < STEPS.length - 1 && <div className={`step-connector ${i < step ? "done" : ""}`} />}
            </div>
          ))}
        </div>

        {/* Content */}
        {step < 3 ? (
          <div className="wizard-grid">
            <div>{stepJSX[step]}</div>
            {orderSidebarJSX}
          </div>
        ) : (
          stepConfirmationJSX
        )}
      </div>
    </div>
    </>
  );
}
