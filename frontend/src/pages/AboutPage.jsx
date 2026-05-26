import { useState } from "react";

export default function AboutPage() {
  return (
    <div style={{paddingTop:"64px"}}>
      <div className="about-hero">
        <h1>About CebuCarTour</h1>
        <p>We connect travelers with the best local car rental vendors and tour operators across Central Visayas – making every journey unforgettable.</p>
      </div>
      <div className="section">
        <div className="section-header">
          <div className="section-tag">Our Mission</div>
          <h2>Travel Made Simple</h2>
          <p>We believe everyone deserves to experience the natural wonders of Leyte, Samar, and Central Visayas. We bridge travelers with verified local vendors for authentic, hassle-free adventures.</p>
        </div>
        <div className="section-header" style={{marginTop:"3rem"}}>
          <div className="section-tag">Meet the Team</div>
          <h2>The People Behind CebuCarTour</h2>
        </div>
        <div className="team-grid">
          {[["fa-solid fa-crown","Carlos Dela Cruz","Founder & CEO","Former tour guide turned tech entrepreneur."],
            ["fa-solid fa-gears","Maria Ramos","Head of Operations","Ensuring every booking goes smoothly."],
            ["fa-solid fa-handshake","Joel Fernandez","Vendor Relations","Working with local operators and vendors."],
            ["fa-solid fa-code","Ana Santos","Tech Lead","Building the platform you're using right now."]].map(([icon,name,role,desc]) => (
            <div key={name} className="team-card">
              <div className="team-avatar"><i className={icon}/></div>
              <h3 style={{fontFamily:"'DM Sans',sans-serif",fontWeight:"700",marginBottom:"0.2rem"}}>{name}</h3>
              <div style={{color:"var(--teal)",fontSize:"0.85rem",fontWeight:"600",marginBottom:"0.8rem"}}>{role}</div>
              <p style={{color:"var(--muted)",fontSize:"0.88rem",lineHeight:"1.6"}}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- CONTACT PAGE ---
export function ContactPage({ user }) {
  const [form, setForm] = useState({name:"",email:"",phone:"",subject:"",message:""});
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState(null);

  const contactEmail   = user?.email   || "marketing@cebucartour.com";
  const contactPhone   = user?.phone   || "+63 935 9891 1171";
  const contactAddress = user?.address || "Cebu City, Philippines";

  const inputStyle = (field) => ({
    width:"100%", padding:"0.85rem 1rem", borderRadius:12, fontFamily:"inherit",
    fontSize:"0.92rem", outline:"none", transition:"all .2s", boxSizing:"border-box",
    border: focused === field ? "2px solid var(--teal)" : "2px solid #E5E7EB",
    background: focused === field ? "#F0FDFA" : "#F9FAFB",
  });

  return (
    <div style={{paddingTop:"64px", background:"#F8FAFC", minHeight:"100vh"}}>
      <style>{`
        .contact-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 2rem;
          align-items: start;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 2rem 5rem;
        }
        .contact-info-panel { position: sticky; top: 5rem; }
        .contact-chips {
          max-width: 1100px;
          margin: 0 auto;
          padding: 2.5rem 2rem 0;
          margin-bottom: 3rem;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }
        @media (max-width: 860px) {
          .contact-grid { grid-template-columns: 1fr; }
          .contact-info-panel { position: static; }
          .contact-chips { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .contact-form-row { grid-template-columns: 1fr !important; }
          .contact-chips { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 420px) {
          .contact-chips { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Hero banner */}
      <div style={{
        background:"linear-gradient(135deg, var(--ocean) 0%, var(--teal) 100%)",
        padding:"4rem 2rem 5rem", textAlign:"center", position:"relative", overflow:"hidden",
      }}>
        <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle at 20% 50%, rgba(255,255,255,0.06) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%)"}} />
        <div style={{position:"relative",zIndex:1}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:"0.5rem",background:"rgba(255,255,255,0.15)",
            border:"1px solid rgba(255,255,255,0.25)",borderRadius:50,padding:"0.35rem 1rem",
            fontSize:"0.8rem",fontWeight:700,color:"rgba(255,255,255,0.9)",marginBottom:"1.2rem",
            backdropFilter:"blur(6px)"}}>
            <i className="fa-solid fa-comments"/> We'd love to hear from you
          </div>
          <h1 style={{color:"#fff",fontFamily:"'Playfair Display',serif",fontSize:"clamp(2rem,4vw,3rem)",
            fontWeight:800,margin:"0 0 0.8rem",lineHeight:1.2}}>
            Get in Touch
          </h1>
          <p style={{color:"rgba(255,255,255,0.82)",fontSize:"1.05rem",maxWidth:480,margin:"0 auto",lineHeight:1.7}}>
            Have a question, need help with a booking, or want to partner with us? We're just a message away.
          </p>
        </div>
        {/* Wave */}
        <div style={{position:"absolute",bottom:-2,left:0,right:0,height:48,
          background:"#F8FAFC",clipPath:"ellipse(55% 100% at 50% 100%)"}} />
      </div>

      {/* Quick contact cards */}
      <div className="contact-chips">
        {[
          {icon:<i className="fa-solid fa-envelope"/>, label:"Email Us",  val:contactEmail,        color:"#EFF6FF", border:"#BFDBFE", text:"#1D4ED8", iconBg:"#DBEAFE"},
          {icon:<i className="fa-brands fa-whatsapp"/>, label:"WhatsApp",  val:contactPhone,        color:"#F0FDF4", border:"#BBF7D0", text:"#15803D", iconBg:"#DCFCE7"},
          {icon:<i className="fa-solid fa-clock"/>,     label:"Hours",     val:"Mon–Sat, 8AM–6PM",  color:"#FFF7ED", border:"#FED7AA", text:"#C2410C", iconBg:"#FFEDD5"},
          {icon:<i className="fa-solid fa-location-dot"/>, label:"Location", val:contactAddress,   color:"#FDF4FF", border:"#E9D5FF", text:"#7E22CE", iconBg:"#F3E8FF"},
        ].map(c => (
          <div key={c.label} style={{background:c.color,border:`1.5px solid ${c.border}`,
            borderRadius:16,padding:"1.2rem 1rem",display:"flex",flexDirection:"column",
            alignItems:"center",textAlign:"center",gap:"0.6rem",
            boxShadow:"0 2px 10px rgba(0,0,0,0.06)"}}>
            <div style={{width:44,height:44,borderRadius:12,background:c.iconBg,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:"1.4rem",flexShrink:0}}>
              {c.icon}
            </div>
            <div style={{width:"100%"}}>
              <div style={{fontSize:"0.68rem",fontWeight:700,color:"#94A3B8",textTransform:"uppercase",
                letterSpacing:".08em",marginBottom:"0.25rem"}}>{c.label}</div>
              <div style={{fontSize:"0.82rem",fontWeight:600,color:c.text,
                wordBreak:"break-word",lineHeight:1.4}}>{c.val}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main layout – 2-column grid: left info panel + right form */}
      <div className="contact-grid">

        {/* Left – info panel */}
        <div className="contact-info-panel">
          <div style={{background:"linear-gradient(160deg,var(--ocean),var(--teal))",
            borderRadius:24,padding:"2.2rem",color:"#fff",marginBottom:"1.5rem"}}>
            <div style={{fontSize:"1.4rem",fontWeight:800,fontFamily:"'Playfair Display',serif",marginBottom:"0.5rem"}}><i className="fa-solid fa-car"/> CebuCarTour</div>
            <p style={{color:"rgba(255,255,255,0.78)",fontSize:"0.88rem",margin:"0 0 1.8rem",lineHeight:1.6}}>
              Your trusted partner for car rentals and tours across Cebu and Central Visayas.
            </p>
            <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
              {[[<i className="fa-solid fa-location-dot"/>,contactAddress],[<i className="fa-solid fa-envelope"/>,contactEmail],[<i className="fa-solid fa-mobile-screen"/>,contactPhone],[<i className="fa-solid fa-globe"/>,"www.cebucartour.com"]].map(([icon,val])=>(
                <div key={val} style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
                  <span style={{width:36,height:36,borderRadius:10,background:"rgba(255,255,255,0.15)",
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",flexShrink:0}}>
                    {icon}
                  </span>
                  <span style={{fontSize:"0.85rem",color:"rgba(255,255,255,0.9)",lineHeight:1.4}}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Social icons */}
          <div style={{background:"#fff",borderRadius:16,padding:"1.4rem",
            boxShadow:"0 2px 12px rgba(0,0,0,0.07)",border:"1px solid #E5E7EB"}}>
            <div style={{fontSize:"0.72rem",fontWeight:700,color:"#94A3B8",textTransform:"uppercase",
              letterSpacing:".08em",marginBottom:"1rem"}}>Follow Us</div>
            <div style={{display:"flex",gap:"0.7rem"}}>
              {[
                { label:"Facebook",  url:user?.socialFacebook,  bg:"#1877F2",
                  icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg> },
                { label:"Instagram", url:user?.socialInstagram, bg:"radial-gradient(circle at 30% 107%,#fdf497 0%,#fd5949 45%,#d6249f 60%,#285AEB 90%)",
                  icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> },
                { label:"TikTok",    url:user?.socialTiktok,    bg:"#010101",
                  icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/></svg> },
              ].map(({label,url,bg,icon}) => (
                <a key={label} href={url||"#"} target="_blank" rel="noopener noreferrer"
                  title={url ? label : `${label} (not set)`}
                  style={{width:40,height:40,borderRadius:10,display:"flex",alignItems:"center",
                    justifyContent:"center",background:bg,
                    border:"none",
                    cursor:url?"pointer":"default",opacity:url?1:0.35,
                    transition:"transform .2s",flexShrink:0,textDecoration:"none"}}
                  onMouseEnter={e=>{if(url)e.currentTarget.style.transform="translateY(-2px)";}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";}}>
                  {icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Right – form */}
        <div style={{background:"#fff",borderRadius:24,padding:"2.2rem",
          boxShadow:"0 4px 24px rgba(0,0,0,0.07)",border:"1px solid #E5E7EB"}}>

          {sent ? (
            <div style={{textAlign:"center",padding:"2rem 1rem"}}>
              <div style={{width:72,height:72,borderRadius:"50%",background:"#D1FAE5",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:"2rem",margin:"0 auto 1.2rem"}}><i className="fa-solid fa-envelope-circle-check"/></div>
              <h3 style={{fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:"1.4rem",
                margin:"0 0 0.6rem",color:"var(--ink)"}}>Message Sent!</h3>
              <p style={{color:"var(--muted)",lineHeight:1.7,marginBottom:"1.5rem"}}>
                Thanks for reaching out. We'll get back to you within 24 hours.
              </p>
              <button onClick={() => { setSent(false); setForm({name:"",email:"",phone:"",subject:"",message:""}); }}
                style={{background:"linear-gradient(135deg,var(--ocean),var(--teal))",color:"#fff",
                  border:"none",borderRadius:50,padding:"0.75rem 2rem",cursor:"pointer",
                  fontWeight:700,fontSize:"0.95rem"}}>
                Send Another
              </button>
            </div>
          ) : (
            <>
              <h2 style={{fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:"1.3rem",
                margin:"0 0 0.3rem",color:"var(--ink)"}}>Send Us a Message</h2>
              <p style={{color:"var(--muted)",fontSize:"0.88rem",margin:"0 0 1.8rem",lineHeight:1.6}}>
                Fill out the form and our team will respond as soon as possible.
              </p>

              <div className="contact-form-row" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",marginBottom:"1rem"}}>
                <div>
                  <label style={{display:"flex",alignItems:"center",fontSize:"0.75rem",fontWeight:700,color:"#64748B",
                    textTransform:"uppercase",letterSpacing:".06em",marginBottom:"0.4rem"}}>Full Name *</label>
                  <input value={form.name} placeholder="Juan dela Cruz"
                    onChange={e => setForm(f=>({...f,name:e.target.value}))}
                    onFocus={() => setFocused("name")} onBlur={() => setFocused(null)}
                    style={inputStyle("name")} />
                </div>
                <div>
                  <label style={{display:"flex",alignItems:"center",fontSize:"0.75rem",fontWeight:700,color:"#64748B",
                    textTransform:"uppercase",letterSpacing:".06em",marginBottom:"0.4rem"}}>Email *</label>
                  <input type="email" value={form.email} placeholder="you@email.com"
                    onChange={e => setForm(f=>({...f,email:e.target.value}))}
                    onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                    style={inputStyle("email")} />
                </div>
              </div>

              <div className="contact-form-row" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",marginBottom:"1rem"}}>
                <div>
                  <label style={{display:"flex",alignItems:"center",fontSize:"0.75rem",fontWeight:700,color:"#64748B",
                    textTransform:"uppercase",letterSpacing:".06em",marginBottom:"0.4rem"}}>Contact Number</label>
                  <input type="tel" value={form.phone} placeholder="09XXXXXXXXX"
                    onChange={e => setForm(f=>({...f,phone:e.target.value.replace(/\D/g,'').slice(0,11)}))}
                    inputMode="numeric" maxLength={11}
                    onFocus={() => setFocused("phone")} onBlur={() => setFocused(null)}
                    style={inputStyle("phone")} />
                </div>
                <div>
                  <label style={{display:"flex",alignItems:"center",fontSize:"0.75rem",fontWeight:700,color:"#64748B",
                    textTransform:"uppercase",letterSpacing:".06em",marginBottom:"0.4rem"}}>Subject</label>
                  <div style={{position:"relative"}}>
                    <select value={form.subject} onChange={e => setForm(f=>({...f,subject:e.target.value}))}
                      onFocus={() => setFocused("subject")} onBlur={() => setFocused(null)}
                      style={{...inputStyle("subject"),cursor:"pointer",appearance:"none",WebkitAppearance:"none",
                        MozAppearance:"none",color:form.subject?"#1E293B":"#94A3B8",paddingRight:"2.5rem"}}>
                      <option value="" disabled style={{color:"#94A3B8"}}>Select a topic…</option>
                      {["Booking Inquiry","Car Rental Question","Tour Package Info","Become a Vendor","Technical Issue","Other"].map(o=>(
                        <option key={o} style={{color:"#1E293B"}}>{o}</option>
                      ))}
                    </select>
                    <svg style={{position:"absolute",right:"0.85rem",top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}
                      width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={focused==="subject"?"var(--teal)":"#64748B"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div style={{marginBottom:"1.5rem"}}>
                <label style={{display:"flex",alignItems:"center",fontSize:"0.75rem",fontWeight:700,color:"#64748B",
                  textTransform:"uppercase",letterSpacing:".06em",marginBottom:"0.4rem"}}>Message *</label>
                <textarea value={form.message} placeholder="How can we help you?"
                  onChange={e => setForm(f=>({...f,message:e.target.value}))}
                  onFocus={() => setFocused("message")} onBlur={() => setFocused(null)}
                  style={{...inputStyle("message"),minHeight:140,resize:"vertical"}} />
              </div>

              <button
                onClick={() => { if(form.name && form.email && form.message) setSent(true); else alert("Please fill all required fields."); }}
                style={{width:"100%",background:"linear-gradient(135deg,var(--ocean),var(--teal))",
                  color:"#fff",border:"none",borderRadius:12,padding:"1rem",cursor:"pointer",
                  fontWeight:700,fontSize:"1rem",letterSpacing:".02em",transition:"all .2s",
                  boxShadow:"0 4px 16px rgba(10,77,104,0.35)"}}
                onMouseEnter={e => e.currentTarget.style.transform="translateY(-2px)"}
                onMouseLeave={e => e.currentTarget.style.transform="translateY(0)"}>
                Send Message →
              </button>
              <p style={{textAlign:"center",fontSize:"0.78rem",color:"#94A3B8",marginTop:"1rem"}}>
                We typically respond within 24 hours on business days.
              </p>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

// --- FOOTER ---
export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <div className="footer-brand"><i className="fa-solid fa-car"/> CebuCarTour</div>
          <p style={{fontSize:"0.9rem",lineHeight:"1.7",maxWidth:"300px"}}>Your gateway to the best car rentals and tour packages in Central Visayas, Philippines.</p>
        </div>
        <div>
          <h4>Services</h4>
          <a>Car Rentals</a>
          <a>Tour Packages</a>
          <a>Group Tours</a>
          <a>Airport Transfers</a>
        </div>
        <div>
          <h4>Company</h4>
          <a>About Us</a>
          <a>Contact</a>
          <a>Become a Vendor</a>
          <a>Careers</a>
        </div>
        <div>
          <h4>Support</h4>
          <a>FAQs</a>
          <a>Booking Policy</a>
          <a>Privacy Policy</a>
          <a>Terms of Service</a>
        </div>
      </div>
      <div className="footer-bottom">
        © 2026 CebuCarTour. All rights reserved DecodeTech. Made with <i className="fa-solid fa-heart" style={{color:"#E85D04"}}/> in Cebu, Philippines.
      </div>
    </footer>
  );
}
