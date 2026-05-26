import { useState } from "react";
import { fmtPeso } from "../utils/helpers.js";

export default function BookingSummaryModal({ booking, itemName, item = null, onClose, vendor, serviceFee: feePct = 5 }) {
  const [downloading, setDownloading] = useState(false);

  if (!booking) return null;

  const payLabel   = booking.payment === "gcash" ? "GCash" : booking.payment === "bank" ? "Bank Transfer" : "Cash on Day";
  const typeLabel  = booking.type === "car" ? "Car Rental" : "Tour Package";
  const subtotal   = booking.total ? Math.round(booking.total / (1 + feePct / 100)) : 0;
  const serviceFee = booking.total ? booking.total - subtotal : 0;
  const issued     = new Date().toLocaleDateString("en-PH", { year:"numeric", month:"long", day:"numeric" });
  const statusColors = {
    pending:   { bg:"#FEF3C7", color:"#92400E" },
    approved:  { bg:"#D1FAE5", color:"#065F46" },
    cancelled: { bg:"#FEE2E2", color:"#991B1B" },
  };
  const sc = statusColors[booking.status] || { bg:"#F3F4F6", color:"#374151" };

  // ── Download as PDF — pure jsPDF vector drawing (no html2canvas) ────────────
  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      await new Promise((res, rej) => {
        if (window.jspdf) return res();
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const W = 210, M = 14, CW = W - M * 2;
      let y = 0;

      // Helpers
      const hex2rgb = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
      const fill  = h => { const [r,g,b] = hex2rgb(h); pdf.setFillColor(r,g,b); };
      const ink   = h => { const [r,g,b] = hex2rgb(h); pdf.setTextColor(r,g,b); };
      const draw  = h => { const [r,g,b] = hex2rgb(h); pdf.setDrawColor(r,g,b); };
      const bold  = ()  => pdf.setFont("helvetica","bold");
      const reg   = ()  => pdf.setFont("helvetica","normal");
      const sz    = n   => pdf.setFontSize(n);

      // ── 1. HEADER ──────────────────────────────────────────────────────────────
      fill("#0A4D68"); pdf.rect(0, 0, W, 36, "F");
      fill("#088395"); pdf.rect(0, 33, W, 4, "F");

      bold(); sz(20); ink("#FFFFFF");
      pdf.text("CebuCarTour", M, 14);
      reg(); sz(8.5); ink("#A8D8E8");
      pdf.text("Central Visayas  |  Tour & Car Rental Platform", M, 21);

      bold(); sz(11); ink("#FFFFFF");
      pdf.text("BOOKING RECEIPT", W - M, 13, { align:"right" });
      reg(); sz(8); ink("#A8D8E8");
      pdf.text(`Issued: ${issued}`, W - M, 20, { align:"right" });
      pdf.text(`Ref No: ${booking.id}`, W - M, 27, { align:"right" });

      y = 42;

      // ── 2. STATUS RIBBON ───────────────────────────────────────────────────────
      fill("#EFF6FF"); pdf.rect(0, y - 4, W, 13, "F");
      draw("#BFDBFE"); pdf.setLineWidth(0.25); pdf.line(0, y + 9, W, y + 9);

      bold(); sz(9); ink("#1E3A5F");
      pdf.text(`Booking Reference:  ${booking.id}`, M, y + 4);

      const stText  = (booking.status||"pending").toUpperCase();
      const stFill  = booking.status==="approved" ? "#D1FAE5" : booking.status==="cancelled" ? "#FEE2E2" : "#FEF3C7";
      const stInk   = booking.status==="approved" ? "#065F46" : booking.status==="cancelled" ? "#991B1B" : "#92400E";
      fill(stFill);
      pdf.roundedRect(W - M - 30, y - 1.5, 30, 9, 2, 2, "F");
      bold(); sz(7.5); ink(stInk);
      pdf.text(stText, W - M - 15, y + 4.8, { align:"center" });

      y = 60;

      // ── SECTION HEADER HELPER ─────────────────────────────────────────────────
      const secHead = (title) => {
        bold(); sz(7.5); ink("#9CA3AF");
        pdf.text(title.toUpperCase(), M, y);
        draw("#E5E7EB"); pdf.setLineWidth(0.25);
        const tw = pdf.getTextWidth(title.toUpperCase());
        pdf.line(M + tw + 2, y - 0.8, W - M, y - 0.8);
        y += 6;
      };

      // ── ROW HELPER ────────────────────────────────────────────────────────────
      const row = (label, value) => {
        if (!value && value !== 0) return;
        reg(); sz(8.5); ink("#6B7280");
        pdf.text(String(label), M, y);
        bold(); ink("#111827");
        const lines = pdf.splitTextToSize(String(value), CW - 56);
        pdf.text(lines, M + 54, y);
        draw("#F3F4F6"); pdf.setLineWidth(0.2);
        pdf.line(M, y + 2.5, W - M, y + 2.5);
        y += lines.length > 1 ? lines.length * 5 + 1 : 7.5;
      };

      // ── 3. BOOKING DETAILS ────────────────────────────────────────────────────
      secHead("Booking Details");
      row("Type",            typeLabel);
      row("Item / Listing",  itemName || "—");
      row("Start Date",      booking.date || "—");
      if (booking.returnDate && booking.returnDate !== booking.date)
        row("Return Date",   booking.returnDate);
      if (booking.pickTime)  row("Pickup Time",  booking.pickTime);
      if (booking.dropTime)  row("Drop-off Time", booking.dropTime);
      row("Pickup / Meetup", booking.pickup || "—");
      if (booking.type === "tour")
        row("Guests",        `${booking.guests} pax`);
      y += 3;

      // ── 3b. LISTING DETAILS ───────────────────────────────────────────────────
      if (item) {
        secHead(booking.type === "car" ? "Vehicle Details" : "Tour Details");
        row("Vehicle / Tour Name", item.name || "—");
        if (booking.type === "car") {
          if (item.type)          row("Vehicle Type",   item.type);
          if (item.seats)         row("Seats / Capacity", `${item.seats} seats`);
          if (item.fuel)          row("Fuel Type",      item.fuel);
          if (item.transmission)  row("Transmission",   item.transmission);
          if (item.mileage)       row("Mileage",        `${Number(item.mileage).toLocaleString()} km`);
          if (item.price)         row("Price / Day",    `PHP ${Number(item.price).toLocaleString()}`);
          if (item.rating > 0)    row("Rating",         `${item.rating} stars (${item.reviews || 0} reviews)`);
          if (item.description)   row("Description",    item.description);
        } else {
          if (item.category)      row("Category",       item.category);
          if (item.duration)      row("Duration",       item.duration);
          if (item.groupSize)     row("Group Size",     `Up to ${item.groupSize} pax`);
          if (item.price)         row("Price / Person", `PHP ${Number(item.price).toLocaleString()}`);
          if (item.rating > 0)    row("Rating",         `${item.rating} stars (${item.reviews || 0} reviews)`);
          if (Array.isArray(item.includes) && item.includes.length > 0)
                                  row("Inclusions",     item.includes.join(", "));
          if (item.description)   row("Description",    item.description);
        }
        y += 3;
      }

      // ── 4. GUEST INFORMATION ──────────────────────────────────────────────────
      secHead("Guest Information");
      row("Full Name",       booking.name);
      row("Email Address",   booking.email);
      row("Phone",           booking.phone || "—");
      if (booking.notes) row("Special Requests", booking.notes);
      y += 3;

      // ── 5. PAYMENT SUMMARY BOX ────────────────────────────────────────────────
      secHead("Payment Summary");
      fill("#0C3547"); pdf.roundedRect(M, y, CW, 30, 3, 3, "F");

      reg(); sz(8.5); ink("#94C8D8");
      pdf.text("Subtotal",        M + 6, y + 9);
      pdf.text(`Service Fee (${feePct}%)`, M + 6, y + 17);

      bold(); sz(8.5); ink("#FFFFFF");
      pdf.text(`PHP ${Math.round(+(subtotal||0)).toLocaleString("en-PH")}`,   W - M - 6, y + 9,  { align:"right" });
      pdf.text(`PHP ${Math.round(+(serviceFee||0)).toLocaleString("en-PH")}`, W - M - 6, y + 17, { align:"right" });

      draw("#1D6A85"); pdf.setLineWidth(0.35);
      pdf.line(M + 6, y + 20, W - M - 6, y + 20);

      bold(); sz(10); ink("#F4E4C1");
      pdf.text("TOTAL AMOUNT",         M + 6, y + 27);
      sz(12); ink("#FCD34D");
      pdf.text(`PHP ${Math.round(+(booking.total||0)).toLocaleString("en-PH")}`, W - M - 6, y + 27, { align:"right" });

      y += 38;

      // ── 6. PAYMENT METHOD ─────────────────────────────────────────────────────
      secHead("Payment Method");
      fill("#F0F9FF"); draw("#BAE6FD"); pdf.setLineWidth(0.25);
      pdf.roundedRect(M, y, CW, 24, 3, 3, "FD");
      fill("#0A4D68"); pdf.rect(M, y, 3.5, 24, "F");

      bold(); sz(9.5); ink("#0A4D68");
      pdf.text(payLabel, M + 8, y + 8);
      reg(); sz(8.5); ink("#374151");
      if (booking.payment === "gcash") {
        pdf.text(`Send to: ${vendor?.gcashNumber || "—"}  (${vendor?.gcashName || vendor?.name || "Vendor"})`, M + 8, y + 15);
        pdf.text(`Reference: ${booking.id} - ${booking.name}`, M + 8, y + 21);
      } else if (booking.payment === "bank") {
        const bankLine = `${vendor?.bankNumber || "—"}  (${vendor?.bankName || vendor?.name || "Vendor"}${vendor?.bankProvider ? " / "+vendor.bankProvider : ""})`;
        pdf.text(`Account: ${bankLine}`, M + 8, y + 15);
        pdf.text(`Reference: ${booking.id} - ${booking.name}`, M + 8, y + 21);
      } else {
        pdf.text(`Prepare PHP ${Math.round(+(booking.total||0)).toLocaleString("en-PH")} in cash.`, M + 8, y + 15);
        pdf.text("Pay the driver / guide directly at the pickup point.", M + 8, y + 21);
      }
      y += 32;

      // ── 7. NEXT STEPS ─────────────────────────────────────────────────────────
      secHead("What Happens Next");
      const steps = [
        "Booking is now pending vendor review.",
        booking.payment === "cash"
          ? "Prepare exact cash amount for the day of booking."
          : "Your payment screenshot will be verified within 1-2 hours.",
        "The vendor will confirm and contact you via WhatsApp or email.",
        `Show reference ${booking.id} on your trip day. Have a wonderful trip!`,
      ];
      steps.forEach((text, i) => {
        fill("#0A4D68"); pdf.circle(M + 3.8, y - 1.2, 3.8, "F");
        bold(); sz(7.5); ink("#FFFFFF");
        pdf.text(String(i + 1), M + 3.8, y + 0.5, { align:"center" });
        reg(); sz(8.5); ink("#374151");
        const lines = pdf.splitTextToSize(text, CW - 14);
        pdf.text(lines, M + 11, y);
        y += lines.length * 5.2 + 3;
      });

      y += 4;

      // ── 8. FOOTER ─────────────────────────────────────────────────────────────
      draw("#E5E7EB"); pdf.setLineWidth(0.4);
      pdf.line(M, y, W - M, y);
      y += 5;

      reg(); sz(7.5); ink("#9CA3AF");
      pdf.text("CebuCarTour  |  Cebu City, Cebu, Philippines", W/2, y, { align:"center" });
      y += 4.5;
      pdf.text("hello@cebuCartour.com  |  +63 917 XXX XXXX  |  cebuCartour.com", W/2, y, { align:"center" });
      y += 5;
      bold(); sz(7); ink("#6B7280");
      pdf.text("This document is your official booking summary. Please keep it for your records.", W/2, y, { align:"center" });

      pdf.save(`CebuCarTour-Booking-${booking.id}.pdf`);
    } catch (err) {
      console.error("PDF error:", err);
      alert("Could not generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  // ── Reusable sub-components (defined outside render so they're stable) ───────
  const Row = ({ label, value }) => !value ? null : (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
      padding:"0.5rem 0", borderBottom:"1px solid #F3F4F6", fontSize:"0.88rem" }}>
      <span style={{ color:"#6B7280", flex:"0 0 44%" }}>{label}</span>
      <span style={{ fontWeight:600, textAlign:"right", flex:"0 0 54%", color:"#1A1A2E" }}>{value}</span>
    </div>
  );

  const Sec = ({ icon, title }) => (
    <div style={{ display:"flex", alignItems:"center", gap:"0.5rem",
      fontSize:"0.68rem", fontWeight:700, color:"#6B7280", textTransform:"uppercase",
      letterSpacing:".1em", margin:"1.2rem 0 0.5rem" }}>
      {icon} {title}
      <div style={{ flex:1, height:1, background:"#E5E7EB" }} />
    </div>
  );

  return (
    <div className="overlay" onClick={onClose} style={{ zIndex:300 }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:"#fff", borderRadius:20, width:"100%", maxWidth:700,
        maxHeight:"92vh", display:"flex", flexDirection:"column",
        boxShadow:"0 25px 80px rgba(0,0,0,0.3)",
      }}>

        {/* ── Top bar with close ── */}
        <div style={{ padding:"1rem 1.5rem", borderBottom:"1px solid #E5E7EB",
          display:"flex", justifyContent:"space-between", alignItems:"center",
          background:"#fff", borderRadius:"20px 20px 0 0", flexShrink:0 }}>
          <div style={{ fontWeight:700, fontSize:"1rem", color:"#1A1A2E" }}>
            <i className="fa-solid fa-file-lines"/> Booking Summary — <span style={{ color:"#0A4D68" }}>{booking.id}</span>
          </div>
          <button onClick={onClose} style={{ background:"#F3F4F6", border:"none",
            borderRadius:8, padding:"0.4rem 0.8rem", cursor:"pointer",
            fontSize:"0.85rem", fontWeight:700, color:"#374151" }}><i className="fa-solid fa-xmark"/> Close</button>
        </div>

        {/* ── Scrollable printable content ── */}
        <div style={{ overflowY:"auto", flex:1 }}>
          <div style={{ background:"#fff", padding:"0" }}>

            {/* Header gradient */}
            <div style={{ background:"linear-gradient(135deg,#0A4D68,#088395)", color:"#fff",
              padding:"1.8rem 2rem", display:"flex",
              justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontFamily:"Georgia,serif", fontSize:"1.5rem", fontWeight:700 }}>
                  <i className="fa-solid fa-car"/> CebuCarTour
                </div>
                <div style={{ fontSize:"0.78rem", opacity:.75, marginTop:"0.25rem" }}>
                  Central Visayas Tour &amp; Car Rental
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontWeight:700, fontSize:"0.95rem" }}>Booking Summary</div>
                <div style={{ fontSize:"0.78rem", opacity:.8, marginTop:"0.2rem" }}>Issued: {issued}</div>
              </div>
            </div>

            {/* Status bar */}
            <div style={{ background:"#F0F9FF", borderLeft:"4px solid #0A4D68",
              padding:"0.8rem 2rem", display:"flex",
              justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:"0.83rem", color:"#6B7280" }}>
                Reference: <strong style={{ color:"#1A1A2E", fontSize:"0.95rem" }}>{booking.id}</strong>
              </span>
              <span style={{ background:sc.bg, color:sc.color,
                padding:"0.22rem 0.85rem", borderRadius:50,
                fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em" }}>
                {booking.status?.toUpperCase()}
              </span>
            </div>

            {/* Content body */}
            <div style={{ padding:"0.5rem 2rem 2rem" }}>

              <Sec icon={<i className="fa-solid fa-clipboard-list"/>} title="Booking Details" />
              <Row label="Type"           value={typeLabel} />
              <Row label="Item"           value={itemName || "—"} />
              <Row label="Start Date"     value={booking.date || "—"} />
              {booking.returnDate && booking.returnDate !== booking.date &&
                <Row label="Return Date"  value={booking.returnDate} />}
              {booking.pickTime &&
                <Row label="Pickup Time"  value={booking.pickTime} />}
              {booking.dropTime &&
                <Row label="Drop-off"     value={booking.dropTime} />}
              <Row label="Pickup / Meetup" value={booking.pickup || "—"} />
              {booking.type === "tour" &&
                <Row label="Guests"       value={`${booking.guests} pax`} />}

              {item && (<>
                <Sec icon={booking.type === "car" ? <i className="fa-solid fa-car"/> : <i className="fa-solid fa-map"/>} title={booking.type === "car" ? "Vehicle Details" : "Tour Details"} />
                <Row label="Vehicle / Tour Name" value={item.name} />
                {booking.type === "car" ? (<>
                  <Row label="Vehicle Type"   value={item.type} />
                  <Row label="Seats / Capacity" value={item.seats ? `${item.seats} seats` : undefined} />
                  <Row label="Fuel Type"      value={item.fuel} />
                  <Row label="Transmission"   value={item.transmission} />
                  <Row label="Mileage"        value={item.mileage ? `${Number(item.mileage).toLocaleString()} km` : undefined} />
                  <Row label="Price / Day"    value={item.price ? fmtPeso(item.price) : undefined} />
                  {item.rating > 0 && <Row label="Rating"        value={`${item.rating} ★ (${item.reviews || 0} reviews)`} />}
                  {item.description && <Row label="Description"  value={item.description} />}
                </>) : (<>
                  <Row label="Category"       value={item.category} />
                  <Row label="Duration"       value={item.duration} />
                  <Row label="Group Size"     value={item.groupSize ? `Up to ${item.groupSize} pax` : undefined} />
                  <Row label="Price / Person" value={item.price ? fmtPeso(item.price) : undefined} />
                  {item.rating > 0 && <Row label="Rating"        value={`${item.rating} ★ (${item.reviews || 0} reviews)`} />}
                  {Array.isArray(item.includes) && item.includes.length > 0 &&
                    <Row label="Inclusions"   value={item.includes.join(", ")} />}
                  {item.description && <Row label="Description"  value={item.description} />}
                </>)}
              </>)}

              <Sec icon={<i className="fa-solid fa-user"/>} title="Guest Information" />
              <Row label="Full Name"      value={booking.name} />
              <Row label="Email"          value={booking.email} />
              <Row label="Phone"          value={booking.phone || "—"} />
              {booking.notes &&
                <Row label="Special Requests" value={booking.notes} />}

              <Sec icon={<i className="fa-solid fa-money-bill-wave"/>} title="Payment Summary" />
              <div style={{ background:"#0A4D68", borderRadius:12,
                padding:"1.1rem 1.4rem", marginTop:"0.4rem" }}>
                {[["Subtotal", fmtPeso(subtotal)],
                  [`Service Fee (${feePct}%)`, fmtPeso(serviceFee)]].map(([l,v]) => (
                  <div key={l} style={{ display:"flex", justifyContent:"space-between",
                    fontSize:"0.85rem", marginBottom:"0.45rem" }}>
                    <span style={{ color:"rgba(255,255,255,0.7)" }}>{l}</span>
                    <span style={{ color:"#fff", fontWeight:600 }}>{v}</span>
                  </div>
                ))}
                <div style={{ borderTop:"1px solid rgba(255,255,255,0.25)", paddingTop:"0.65rem",
                  marginTop:"0.45rem", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ color:"#fff", fontWeight:700 }}>Total Amount</span>
                  <span style={{ color:"#F4E4C1", fontWeight:700, fontSize:"1.3rem" }}>
                    {fmtPeso(booking.total)}
                  </span>
                </div>
              </div>

              <Sec icon={<i className="fa-solid fa-credit-card"/>} title="Payment Method" />
              <div style={{ background:"#F0F9FF", borderRadius:10,
                padding:"1rem 1.2rem", borderLeft:"4px solid #088395" }}>
                <div style={{ fontWeight:700, color:"#0A4D68", marginBottom:"0.4rem" }}>{payLabel}</div>
                {booking.payment === "gcash" &&
                  <div style={{ fontSize:"0.84rem", color:"#1A1A2E", lineHeight:1.7 }}>
                    Send to: <strong>{vendor?.gcashNumber || "—"}</strong> ({vendor?.gcashName || vendor?.name || "Vendor"})<br/>
                    Reference: <strong>{booking.id} – {booking.name}</strong>
                  </div>}
                {booking.payment === "bank" &&
                  <div style={{ fontSize:"0.84rem", color:"#1A1A2E", lineHeight:1.7 }}>
                    Account: <strong>{vendor?.bankNumber || "—"}</strong> ({vendor?.bankName || vendor?.name || "Vendor"}{vendor?.bankProvider ? " / " + vendor.bankProvider : ""})<br/>
                    Reference: <strong>{booking.id} – {booking.name}</strong>
                  </div>}
                {booking.payment === "cash" &&
                  <div style={{ fontSize:"0.84rem", color:"#1A1A2E", lineHeight:1.7 }}>
                    Prepare <strong>{fmtPeso(booking.total)}</strong> in cash.<br/>
                    Pay directly at the pickup point on the booking date.
                  </div>}
              </div>

              <Sec icon={<i className="fa-solid fa-list-check"/>} title="What Happens Next" />
              <div style={{ background:"#FAFAF7", borderRadius:10, padding:"0.9rem 1.1rem" }}>
                {[
                  [1, "Booking is now pending vendor review."],
                  [2, booking.payment === "cash"
                    ? "Prepare exact cash for the day of booking."
                    : "Payment screenshot will be verified within 1–2 hours."],
                  [3, "Vendor will confirm via WhatsApp / email."],
                  [4, `Show reference ${booking.id} on your trip day.`],
                ].map(([num, text]) => (
                  <div key={num} style={{ display:"flex", gap:"0.6rem",
                    marginBottom:"0.45rem", fontSize:"0.84rem", color:"#374151", lineHeight:1.6 }}>
                    <span style={{ flexShrink:0, fontWeight:700, color:"#0A4D68" }}>{num}.</span><span>{text}</span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{ marginTop:"1.4rem", textAlign:"center", fontSize:"0.73rem",
                color:"#9CA3AF", lineHeight:1.8, padding:"0.9rem 1rem",
                background:"#F9FAFB", borderRadius:10, border:"1px solid #E5E7EB" }}>
                <strong style={{ color:"#6B7280" }}>CebuCarTour</strong> · Cebu City, Cebu, Philippines<br/>
                <i className="fa-solid fa-envelope"/> hello@cebuCartour.com · <i className="fa-solid fa-mobile-screen"/> +63 917 XXX XXXX · <i className="fa-solid fa-globe"/> cebuCartour.com<br/>
                This document serves as your official booking summary. Keep it for your records.
              </div>
            </div>
          </div>
        </div>

        {/* ── Download / Close buttons ── */}
        <div style={{ padding:"1rem 1.5rem", borderTop:"1px solid #E5E7EB",
          background:"#fff", borderRadius:"0 0 20px 20px",
          display:"flex", gap:"0.8rem", flexShrink:0 }}>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            style={{ flex:2, background: downloading ? "#9CA3AF" : "#E85D04", color:"#fff",
              border:"none", padding:"0.9rem", borderRadius:12, cursor: downloading ? "not-allowed" : "pointer",
              fontWeight:700, fontSize:"0.95rem", display:"flex",
              alignItems:"center", justifyContent:"center", gap:"0.5rem",
              transition:"all .2s" }}
          >
            {downloading ? <><i className="fa-solid fa-spinner fa-spin"/> Generating PDF…</> : <><i className="fa-solid fa-download"/> Download PDF</>}
          </button>
          <button
            onClick={onClose}
            style={{ flex:1, background:"#F3F4F6", color:"#374151",
              border:"none", padding:"0.9rem", borderRadius:12,
              cursor:"pointer", fontWeight:700, fontSize:"0.95rem" }}
          >
            <i className="fa-solid fa-xmark"/> Close
          </button>
        </div>
      </div>
    </div>
  );
}
