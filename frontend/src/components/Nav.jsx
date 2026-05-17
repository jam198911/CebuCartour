import { useState } from "react";

export default function Nav({ user, goTo, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);
  return (
    <>
      <nav className="nav">
        <div className="nav-brand" onClick={() => { goTo("home"); close(); }}>
          <i className="fa-solid fa-car"/> CebuCar<span>Tour</span>
        </div>
        <div className="nav-links">
          <span className="nav-link" onClick={() => goTo("home")}>Home</span>
          <span className="nav-link" onClick={() => goTo("cars")}>Car Rentals</span>
          <span className="nav-link" onClick={() => goTo("tours")}>Tour Packages</span>
          <span className="nav-link" onClick={() => goTo("about")}>About</span>
          <span className="nav-link" onClick={() => goTo("contact")}>Contact</span>
          {user ? (
            <>
              {(user.role === "admin" || user.role === "vendor") && (
                <span className="nav-link" onClick={() => goTo(user.role)}>Dashboard</span>
              )}
              {user.role === "customer" && (
                <span className="nav-link" onClick={() => goTo("profile")}>My Profile</span>
              )}
              <button className="nav-btn outline" onClick={onLogout}>Logout</button>
            </>
          ) : (
            <>
              <button className="nav-btn outline" onClick={() => goTo("login")}>Login</button>
              <button className="nav-btn" onClick={() => goTo("register")}>Sign Up</button>
            </>
          )}
        </div>
        <button className="nav-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
          {menuOpen ? <i className="fa-solid fa-xmark"/> : <i className="fa-solid fa-bars"/>}
        </button>
      </nav>
      {menuOpen && (
        <div className="nav-mobile">
          <span className="nav-link" onClick={() => { goTo("home"); close(); }}>Home</span>
          <span className="nav-link" onClick={() => { goTo("cars"); close(); }}>Car Rentals</span>
          <span className="nav-link" onClick={() => { goTo("tours"); close(); }}>Tour Packages</span>
          <span className="nav-link" onClick={() => { goTo("about"); close(); }}>About</span>
          <span className="nav-link" onClick={() => { goTo("contact"); close(); }}>Contact</span>
          {user ? (
            <>
              {(user.role === "admin" || user.role === "vendor") && (
                <span className="nav-link" onClick={() => { goTo(user.role); close(); }}>Dashboard</span>
              )}
              {user.role === "customer" && (
                <span className="nav-link" onClick={() => { goTo("profile"); close(); }}>My Profile</span>
              )}
              <div className="nav-mobile-auth">
                <button className="nav-btn outline" onClick={() => { onLogout(); close(); }}>Logout</button>
              </div>
            </>
          ) : (
            <div className="nav-mobile-auth">
              <button className="nav-btn outline" onClick={() => { goTo("login"); close(); }}>Login</button>
              <button className="nav-btn" onClick={() => { goTo("register"); close(); }}>Sign Up</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
