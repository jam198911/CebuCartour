import { useState } from "react";
import { api } from "../api.js";

export default function AuthPage({ onLogin, goTo, users = [], onRegister, resetToken = null, onResetDone, startTab = "login" }) {
  const [tab, setTab] = useState(resetToken ? "reset" : startTab);
  const [role, setRole] = useState("customer");
  const [registered, setRegistered] = useState(false);
  const [showPass, setShowPass]           = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [showNewPass, setShowNewPass]     = useState(false);
  const [showNewConfirm, setShowNewConfirm] = useState(false);
  const [form, setForm] = useState({
    name:"", email:"", password:"", confirm:"", company:"",
    phone:"", address:"", idType:"Business Permit", idNumber:"", services:[], bio:""
  });
  const [forgotEmail, setForgotEmail]   = useState("");
  const [forgotSent, setForgotSent]     = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [devResetUrl, setDevResetUrl]   = useState(null);
  const [newPass, setNewPass]           = useState("");
  const [newConfirm, setNewConfirm]     = useState("");
  const [resetDone, setResetDone]       = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError]     = useState("");

  const DEMO = [
    { id: 99, name: "Admin User",        email: "admin@islatravel.ph",    password: "admin123",  role: "admin" },
    { id: 2,  name: "TravelEastern PH",  email: "vendor1@example.com",    password: "vendor123", role: "vendor", approved: true,  approvalStatus:"approved", company:"TravelEastern PH",  phone:"09171234567", address:"Tacloban City, Leyte" },
    { id: 1,  name: "Maria Santos",      email: "maria@example.com",      password: "pass123",   role: "customer" },
  ];

  const SERVICE_OPTIONS = ["Car Rental","Tour Packages","Island Tours","Adventure Tours","Cultural Tours","Trekking","Airport Transfer"];

  const toggleService = (s) => setForm(f => ({
    ...f, services: f.services.includes(s) ? f.services.filter(x=>x!==s) : [...f.services, s]
  }));

  const handleLogin = async () => {
    try {
      const { token, user } = await api.auth.login(form.email, form.password);
      localStorage.setItem("cebuCartour_token", token);
      onLogin(user);
    } catch (err) {
      alert(err.message || "Invalid credentials. Try:\nadmin@islatravel.ph / admin123\nvendor1@example.com / vendor123\nmaria@example.com / pass123");
    }
  };

  const handleRegister = async () => {
    if (!form.name || !form.email) { alert("Please fill in your name and email."); return; }
    if (role === "vendor" && (!form.company || !form.phone)) {
      alert("Please fill in your business name and contact number."); return;
    }
    const userData = {
      name: form.name, email: form.email, role,
      company: form.company || "", phone: form.phone || "", address: form.address || "",
      idType: form.idType || "", idNumber: form.idNumber || "",
      services: form.services || [], bio: form.bio || "",
    };
    try {
      await api.auth.register(userData);
      setRegistered(true);
    } catch (err) {
      alert(err.message || "Registration failed. Please try again.");
    }
  };

  const handleForgot = async () => {
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      const res = await api.auth.forgotPassword(forgotEmail);
      if (res.devResetUrl) setDevResetUrl(res.devResetUrl);
      setForgotSent(true);
    } catch (err) {
      alert(err.message || "Something went wrong. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleReset = async () => {
    if (!newPass) return;
    if (newPass !== newConfirm) { setResetError("Passwords do not match."); return; }
    if (newPass.length < 8)     { setResetError("Password must be at least 8 characters."); return; }
    setResetError("");
    setResetLoading(true);
    try {
      await api.auth.resetPassword(resetToken, newPass);
      setResetDone(true);
      if (onResetDone) onResetDone();
    } catch (err) {
      setResetError(err.message || "Reset failed. The link may have expired.");
    } finally {
      setResetLoading(false);
    }
  };

  const inp = (field, label, placeholder, type="text") => (
    <div className="form-group" style={{marginBottom:"1rem"}}>
      <label style={{fontSize:"0.78rem",display:"flex",fontWeight:"700",color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em"}}>{label}</label>
      <input type={type} value={form[field]} onChange={e => setForm(f=>({...f,[field]:e.target.value}))}
        placeholder={placeholder}
        style={{border:"2px solid var(--border)",borderRadius:"10px",padding:"0.75rem",width:"100%",fontFamily:"inherit",fontSize:"0.95rem",outline:"none"}} />
    </div>
  );

  const pwInp = (field, label, placeholder, show, setShow) => (
    <div className="form-group" style={{marginBottom:"1rem"}}>
      <label style={{fontSize:"0.78rem",fontWeight:"700",color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:"0.35rem"}}>{label}</label>
      <div style={{position:"relative"}}>
        <input
          type={show ? "text" : "password"}
          value={form[field]}
          onChange={e => setForm(f => ({...f, [field]: e.target.value}))}
          placeholder={placeholder}
          style={{border:"2px solid var(--border)",borderRadius:"10px",padding:"0.75rem",paddingRight:"3rem",width:"100%",fontFamily:"inherit",fontSize:"0.95rem",outline:"none"}}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{position:"absolute",right:"0.85rem",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--muted)",padding:"0.2rem",display:"flex",alignItems:"center",lineHeight:1}}
          tabIndex={-1}
        >
          <i className={`fa-solid ${show ? "fa-eye-slash" : "fa-eye"}`} style={{fontSize:"1rem"}}/>
        </button>
      </div>
    </div>
  );

  // -- Post-registration pending screen for vendors --
  if (registered) return (
    <div className="auth-wrap">
      <div className="auth-card fade-in" style={{maxWidth:500}}>
        <div style={{textAlign:"center",marginBottom:"1.5rem"}}>
          <div style={{fontSize:"3.5rem",marginBottom:"0.8rem"}}><i className="fa-solid fa-hourglass-half" style={{color:"var(--ocean)"}}/></div>
          <h2 style={{marginBottom:"0.5rem"}}>Registration Submitted!</h2>
          <p style={{color:"var(--muted)",lineHeight:1.7}}>
            Thank you, <strong>{form.name}</strong>! Your registration is now under review.
          </p>
        </div>
        <div style={{background:"#F0F9FF",borderRadius:12,padding:"1.2rem",marginBottom:"1.5rem"}}>
          <div style={{fontSize:"0.75rem",fontWeight:700,color:"var(--ocean)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:"0.8rem"}}>What happens next</div>
          {[
            ["fa-solid fa-magnifying-glass","Admin Review","Our team will review your registration within 24–48 hours."],
            ["fa-solid fa-envelope","Set Your Password","Once approved, you'll receive an email with a link to set your password."],
            ["fa-solid fa-rocket","Start Exploring","After setting your password, log in and you're ready to go!"],
          ].map(([icon,title,desc]) => (
            <div key={title} style={{display:"flex",gap:"0.8rem",marginBottom:"0.8rem",alignItems:"flex-start"}}>
              <span style={{fontSize:"1.2rem",flexShrink:0,color:"var(--ocean)"}}><i className={icon}/></span>
              <div>
                <div style={{fontWeight:700,fontSize:"0.88rem",marginBottom:"0.15rem"}}>{title}</div>
                <div style={{fontSize:"0.82rem",color:"var(--muted)",lineHeight:1.5}}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{background:"var(--sand)",borderRadius:10,padding:"0.9rem",fontSize:"0.82rem",marginBottom:"1.2rem",textAlign:"center"}}>
          Questions? Contact us at <strong>hello@islatravelph.com</strong> or WhatsApp <strong>+63 917 XXX XXXX</strong>
        </div>
        <button className="submit-btn" style={{marginTop:0}} onClick={() => goTo("home")}>
          <i className="fa-solid fa-house"/> Back to Home
        </button>
      </div>
    </div>
  );

  // ── Forgot-password view ──────────────────────────────────────────────────
  if (tab === "forgot") return (
    <div className="auth-wrap">
      <div className="auth-card fade-in" style={{maxWidth:480}}>
        <div style={{textAlign:"center",marginBottom:"1.5rem"}}>
          <div style={{fontSize:"2.8rem",marginBottom:"0.75rem",color:"var(--ocean)"}}><i className="fa-solid fa-lock-open"/></div>
          <h2 style={{margin:"0 0 0.4rem"}}>Forgot Password?</h2>
          <p style={{color:"var(--muted)",margin:0,lineHeight:1.6}}>
            Enter the email address on your account and we'll send you a reset link.
          </p>
        </div>

        {forgotSent ? (
          <div style={{textAlign:"center"}}>
            <div style={{background:"#ECFDF5",border:"1px solid #6EE7B7",borderRadius:12,padding:"1.25rem",marginBottom:"1.25rem"}}>
              <i className="fa-solid fa-circle-check" style={{color:"#059669",fontSize:"1.6rem",marginBottom:"0.5rem",display:"block"}}/>
              <div style={{fontWeight:700,color:"#065F46",marginBottom:"0.3rem"}}>Check your inbox</div>
              <div style={{fontSize:"0.85rem",color:"#047857"}}>
                A reset link was sent to <strong>{forgotEmail}</strong>. It expires in 1 hour.
              </div>
            </div>
            {devResetUrl && (
              <div style={{background:"#FEF3C7",border:"1px solid #FCD34D",borderRadius:10,padding:"0.9rem",marginBottom:"1rem",textAlign:"left",fontSize:"0.8rem"}}>
                <div style={{fontWeight:700,color:"#92400E",marginBottom:"0.35rem"}}>
                  <i className="fa-solid fa-triangle-exclamation"/> Dev mode — email not configured
                </div>
                <div style={{color:"#78350F",marginBottom:"0.5rem"}}>Use this link to test the reset flow:</div>
                <a href={devResetUrl} style={{color:"#0A4D68",wordBreak:"break-all",fontWeight:600}}>{devResetUrl}</a>
              </div>
            )}
            <button className="submit-btn" style={{marginTop:0}} onClick={() => { setTab("login"); setForgotSent(false); setDevResetUrl(null); }}>
              <i className="fa-solid fa-arrow-left"/> Back to Login
            </button>
          </div>
        ) : (
          <>
            <div className="form-group" style={{marginBottom:"1rem"}}>
              <label style={{fontSize:"0.78rem",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:"0.35rem"}}>
                Email Address
              </label>
              <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleForgot()}
                placeholder="you@email.com"
                style={{border:"2px solid var(--border)",borderRadius:10,padding:"0.75rem",width:"100%",fontFamily:"inherit",fontSize:"0.95rem",outline:"none"}} />
            </div>
            <button className="submit-btn" style={{marginTop:0}} onClick={handleForgot} disabled={forgotLoading || !forgotEmail}>
              {forgotLoading ? <><i className="fa-solid fa-spinner fa-spin"/> Sending…</> : <><i className="fa-solid fa-paper-plane"/> Send Reset Link</>}
            </button>
            <button type="button" onClick={() => setTab("login")}
              style={{display:"block",width:"100%",marginTop:"0.75rem",background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:"0.85rem",fontWeight:600}}>
              <i className="fa-solid fa-arrow-left"/> Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );

  // ── Reset-password view ───────────────────────────────────────────────────
  if (tab === "reset") return (
    <div className="auth-wrap">
      <div className="auth-card fade-in" style={{maxWidth:480}}>
        <div style={{textAlign:"center",marginBottom:"1.5rem"}}>
          <div style={{fontSize:"2.8rem",marginBottom:"0.75rem",color:"var(--ocean)"}}><i className="fa-solid fa-key"/></div>
          <h2 style={{margin:"0 0 0.4rem"}}>Set New Password</h2>
          <p style={{color:"var(--muted)",margin:0,lineHeight:1.6}}>Choose a strong password for your account.</p>
        </div>

        {resetDone ? (
          <div style={{textAlign:"center"}}>
            <div style={{background:"#ECFDF5",border:"1px solid #6EE7B7",borderRadius:12,padding:"1.25rem",marginBottom:"1.25rem"}}>
              <i className="fa-solid fa-circle-check" style={{color:"#059669",fontSize:"1.6rem",marginBottom:"0.5rem",display:"block"}}/>
              <div style={{fontWeight:700,color:"#065F46",marginBottom:"0.3rem"}}>Password updated!</div>
              <div style={{fontSize:"0.85rem",color:"#047857"}}>You can now sign in with your new password.</div>
            </div>
            <button className="submit-btn" style={{marginTop:0}} onClick={() => setTab("login")}>
              <i className="fa-solid fa-right-to-bracket"/> Go to Login
            </button>
          </div>
        ) : (
          <>
            <div className="form-group" style={{marginBottom:"1rem"}}>
              <label style={{fontSize:"0.78rem",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:"0.35rem"}}>
                New Password
              </label>
              <div style={{position:"relative"}}>
                <input type={showNewPass ? "text" : "password"} value={newPass} onChange={e => setNewPass(e.target.value)}
                  placeholder="Min. 8 characters"
                  style={{border:"2px solid var(--border)",borderRadius:10,padding:"0.75rem",paddingRight:"3rem",width:"100%",fontFamily:"inherit",fontSize:"0.95rem",outline:"none"}} />
                <button type="button" onClick={() => setShowNewPass(s => !s)}
                  style={{position:"absolute",right:"0.85rem",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--muted)"}}>
                  <i className={`fa-solid ${showNewPass ? "fa-eye-slash" : "fa-eye"}`}/>
                </button>
              </div>
            </div>
            <div className="form-group" style={{marginBottom:"1rem"}}>
              <label style={{fontSize:"0.78rem",fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:"0.35rem"}}>
                Confirm New Password
              </label>
              <div style={{position:"relative"}}>
                <input type={showNewConfirm ? "text" : "password"} value={newConfirm} onChange={e => setNewConfirm(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleReset()}
                  placeholder="Repeat your new password"
                  style={{border:"2px solid var(--border)",borderRadius:10,padding:"0.75rem",paddingRight:"3rem",width:"100%",fontFamily:"inherit",fontSize:"0.95rem",outline:"none"}} />
                <button type="button" onClick={() => setShowNewConfirm(s => !s)}
                  style={{position:"absolute",right:"0.85rem",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--muted)"}}>
                  <i className={`fa-solid ${showNewConfirm ? "fa-eye-slash" : "fa-eye"}`}/>
                </button>
              </div>
            </div>
            {resetError && (
              <div style={{background:"#FEE2E2",border:"1px solid #FCA5A5",borderRadius:8,padding:"0.7rem 0.9rem",marginBottom:"1rem",fontSize:"0.85rem",color:"#991B1B"}}>
                <i className="fa-solid fa-circle-exclamation"/> {resetError}
              </div>
            )}
            <button className="submit-btn" style={{marginTop:0}} onClick={handleReset} disabled={resetLoading || !newPass}>
              {resetLoading ? <><i className="fa-solid fa-spinner fa-spin"/> Updating…</> : <><i className="fa-solid fa-lock"/> Update Password</>}
            </button>
          </>
        )}
      </div>
    </div>
  );

  // ── Login page ────────────────────────────────────────────────────────────
  if (tab === "login") return (
    <div className="auth-wrap">
      <div className="auth-card fade-in" style={{maxWidth:440}}>
        {/* Brand header */}
        <div style={{textAlign:"center",marginBottom:"2rem"}}>
          <div style={{width:52,height:52,borderRadius:14,background:"var(--ocean)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 0.9rem"}}>
            <i className="fa-solid fa-car" style={{color:"#fff",fontSize:"1.4rem"}}/>
          </div>
          <h2 style={{margin:"0 0 0.3rem",fontSize:"1.5rem"}}>Welcome back</h2>
          <p style={{color:"var(--muted)",margin:0,fontSize:"0.9rem"}}>Sign in to your CebuCarTour account</p>
        </div>

        {inp("email","Email address","you@email.com","email")}
        {pwInp("password","Password","••••••••", showPass, setShowPass)}

        <div style={{textAlign:"right",marginTop:"-0.5rem",marginBottom:"1.25rem"}}>
          <button type="button" onClick={() => setTab("forgot")}
            style={{background:"none",border:"none",color:"var(--ocean)",cursor:"pointer",fontSize:"0.82rem",fontWeight:600,padding:0}}>
            Forgot password?
          </button>
        </div>

        <button className="submit-btn" style={{marginTop:0}} onClick={handleLogin}>
          <i className="fa-solid fa-right-to-bracket"/> Sign In
        </button>

        <div style={{textAlign:"center",marginTop:"1.5rem",fontSize:"0.88rem",color:"var(--muted)"}}>
          Don't have an account?{" "}
          <button type="button" onClick={() => setTab("register")}
            style={{background:"none",border:"none",color:"var(--ocean)",cursor:"pointer",fontWeight:700,fontSize:"0.88rem",padding:0}}>
            Create one
          </button>
        </div>

        <div style={{marginTop:"1.5rem",background:"var(--sand)",borderRadius:"10px",padding:"1rem",fontSize:"0.82rem"}}>
          <div className="log-in-user">
            <strong>Demo Accounts:</strong><br/>
            admin@islatravel.ph / admin123<br/>
            vendor1@example.com / vendor123<br/>
            maria@example.com / pass123
          </div>
        </div>
      </div>
    </div>
  );

  // ── Register page ─────────────────────────────────────────────────────────
  return (
    <div className="auth-wrap">
      <div className="auth-card fade-in" style={{maxWidth:460}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:"0.75rem",marginBottom:"1.75rem"}}>
          <button type="button" onClick={() => setTab("login")}
            style={{background:"var(--sand)",border:"none",borderRadius:8,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,color:"var(--text)"}}>
            <i className="fa-solid fa-arrow-left"/>
          </button>
          <div>
            <h2 style={{margin:0,fontSize:"1.35rem"}}>Create your account</h2>
            <p style={{margin:0,fontSize:"0.82rem",color:"var(--muted)"}}>Join CebuCarTour today — it's free</p>
          </div>
        </div>

        {/* Role picker */}
        <div style={{marginBottom:"1.25rem"}}>
          <label style={{fontSize:"0.78rem",fontWeight:"700",color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:"0.5rem"}}>I am a...</label>
          <div className="role-select">
            {[["customer","fa-solid fa-user","Traveler / Customer"],["vendor","fa-solid fa-building","Vendor / Operator"]].map(([r,icon,label]) => (
              <div key={r} className={`role-opt ${role===r?"selected":""}`} onClick={() => setRole(r)}>
                <span className="role-icon"><i className={icon}/></span>
                <span className="role-name">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Vendor fields: Business Name → Owner Name → Phone → Email */}
        {role === "vendor" ? (
          <>
            {inp("company","Business Name *","e.g. Eastern Visayas Tours")}
            {inp("name","Owner Name *","Juan dela Cruz")}
            <div className="form-group" style={{marginBottom:"1rem"}}>
              <label style={{fontSize:"0.78rem",display:"flex",fontWeight:"700",color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em"}}>Contact Number *</label>
              <input type="tel" value={form.phone} inputMode="numeric" maxLength={11}
                onChange={e => setForm(f=>({...f,phone:e.target.value.replace(/\D/g,'').slice(0,11)}))}
                placeholder="09XXXXXXXXX"
                style={{border:"2px solid var(--border)",borderRadius:"10px",padding:"0.75rem",width:"100%",fontFamily:"inherit",fontSize:"0.95rem",outline:"none"}} />
            </div>
            {inp("email","Email Address *","you@email.com","email")}
            <div style={{marginTop:"0.25rem",background:"#FEF3C7",borderRadius:8,padding:"0.7rem 0.9rem",fontSize:"0.8rem",color:"#92400E",marginBottom:"0.25rem"}}>
              <i className="fa-solid fa-triangle-exclamation"/> Your application will be reviewed by our admin team. Once approved, you'll receive an email to set your password and complete your profile.
            </div>
          </>
        ) : (
          /* Customer fields */
          <>
            {inp("name","Full Name *","Juan dela Cruz")}
            {inp("email","Email Address *","you@email.com","email")}
          </>
        )}

        <button className="submit-btn" style={{marginTop:"1.25rem"}} onClick={handleRegister}>
          {role==="vendor" ? <><i className="fa-solid fa-paper-plane"/> Submit Application</> : <><i className="fa-solid fa-user-plus"/> Create Account</>}
        </button>

        <div style={{textAlign:"center",marginTop:"1.25rem",fontSize:"0.88rem",color:"var(--muted)"}}>
          Already have an account?{" "}
          <button type="button" onClick={() => setTab("login")}
            style={{background:"none",border:"none",color:"var(--ocean)",cursor:"pointer",fontWeight:700,fontSize:"0.88rem",padding:0}}>
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
