import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("App error:", error, info); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#F0F4F8",fontFamily:"DM Sans,sans-serif",padding:"2rem"}}>
        <div style={{background:"#fff",borderRadius:20,padding:"3rem",maxWidth:480,width:"100%",boxShadow:"0 8px 40px rgba(0,0,0,0.1)",textAlign:"center"}}>
          <div style={{fontSize:"3rem",marginBottom:"1rem"}}><i className="fa-solid fa-triangle-exclamation" style={{color:"#F59E0B"}}/></div>
          <h2 style={{fontFamily:"Playfair Display,serif",marginBottom:"0.75rem",color:"#1A1A2E"}}>Something went wrong</h2>
          <p style={{color:"#6B7280",marginBottom:"0.5rem",fontSize:"0.9rem"}}>The app encountered an unexpected error.</p>
          <p style={{color:"#9CA3AF",fontSize:"0.8rem",marginBottom:"2rem",background:"#F9FAFB",padding:"0.75rem",borderRadius:8,textAlign:"left",wordBreak:"break-all"}}>
            {this.state.error?.message}
          </p>
          <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            style={{background:"#0A4D68",color:"#fff",border:"none",padding:"0.75rem 2rem",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.95rem"}}>
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}

export class PageErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("Page error:", error, info); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{minHeight:"60vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#F3F4F6",padding:"2rem"}}>
        <div style={{background:"#fff",borderRadius:20,padding:"2.5rem",maxWidth:440,width:"100%",boxShadow:"0 8px 32px rgba(0,0,0,0.08)",textAlign:"center"}}>
          <div style={{fontSize:"2.5rem",marginBottom:"0.75rem"}}><i className="fa-solid fa-triangle-exclamation" style={{color:"#F59E0B"}}/></div>
          <h3 style={{fontFamily:"Playfair Display,serif",marginBottom:"0.5rem",color:"#1A1A2E",fontSize:"1.3rem"}}>This page ran into a problem</h3>
          <p style={{color:"#6B7280",fontSize:"0.88rem",marginBottom:"0.5rem"}}>An unexpected error occurred. The rest of the site is still working.</p>
          <p style={{color:"#9CA3AF",fontSize:"0.78rem",marginBottom:"1.75rem",background:"#F9FAFB",padding:"0.65rem",borderRadius:8,textAlign:"left",wordBreak:"break-all"}}>
            {this.state.error?.message}
          </p>
          <div style={{display:"flex",gap:"0.75rem",justifyContent:"center"}}>
            <button onClick={() => this.setState({ hasError: false, error: null })}
              style={{background:"#F3F4F6",color:"#374151",border:"none",padding:"0.65rem 1.4rem",borderRadius:50,cursor:"pointer",fontWeight:600,fontSize:"0.88rem"}}>
              Try Again
            </button>
            <button onClick={() => { this.setState({ hasError: false, error: null }); this.props.goTo?.("home"); }}
              style={{background:"#0A4D68",color:"#fff",border:"none",padding:"0.65rem 1.4rem",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.88rem"}}>
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }
}
