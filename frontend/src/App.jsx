import { useState, useEffect, useRef, lazy, Suspense } from "react";
import './styles/app.css';
import { api } from "./api.js";
import { usePageMeta } from "./utils/seo.js";
import { ErrorBoundary, PageErrorBoundary } from "./components/ErrorBoundaries.jsx";
import { Toast } from "./components/SharedUI.jsx";
import BookingSummaryModal from "./components/BookingSummaryModal.jsx";
import DetailModal from "./components/DetailModal.jsx";
import Nav from "./components/Nav.jsx";
import Home, { CEBU_DESTINATIONS } from "./pages/Home.jsx";
import SearchResultsPage from "./pages/SearchResultsPage.jsx";
import CarsPage from "./pages/CarsPage.jsx";
import ToursPage from "./pages/ToursPage.jsx";
import BookingPage from "./pages/BookingPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import AboutPage, { ContactPage } from "./pages/AboutPage.jsx";

const CustomerProfile = lazy(() => import("./pages/CustomerProfile.jsx"));
const AdminDashboard  = lazy(() => import("./pages/AdminDashboard.jsx"));
const VendorDashboard = lazy(() => import("./pages/VendorDashboard.jsx"));

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("cebuCartour_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [resetToken, setResetToken] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('reset') || null;
  });
  const [page, setPage] = useState(() => {
    if (new URLSearchParams(window.location.search).get('reset')) return "login";
    try {
      const saved = localStorage.getItem("cebuCartour_user");
      const u = saved ? JSON.parse(saved) : null;
      if (u?.role === "admin") return "admin";
      if (u?.role === "vendor") return "vendor";
    } catch {}
    return "home";
  });
  const [modal, setModal] = useState(null);
  const [bookingItem, setBookingItem] = useState(null);
  const [toast, setToast] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [cars, setCars] = useState([]);
  const [tours, setTours] = useState([]);
  const [pdfModal, setPdfModal] = useState(null);
  const [serviceFee, setServiceFee] = useState(5);
  const [destinations, setDestinations] = useState(CEBU_DESTINATIONS);
  const [teamMembers, setTeamMembers] = useState([]);
  const [searchFilters, setSearchFilters] = useState({ location: "", date: "" });

  useEffect(() => {
    // Strip ?reset=... from the URL so it doesn't persist on refresh
    if (resetToken) window.history.replaceState({}, '', window.location.pathname);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const deepLinkHandled = useRef(false);
  useEffect(() => {
    if (deepLinkHandled.current) return;
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const id = Number(params.get('id'));
    if (!type || !id) return;
    const list = type === 'car' ? cars : tours;
    if (list.length === 0) return;
    const item = list.find(i => i.id === id);
    if (!item) return;
    deepLinkHandled.current = true;
    window.history.replaceState({}, '', window.location.pathname);
    setModal({ ...item, itemType: type });
  }, [cars, tours]);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = () => {
      setUser(null);
      setPage('login');
      setToast('Your session has expired. Please log in again.');
    };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAllData = (forRole = user?.role) => {
    const token = localStorage.getItem('cebuCartour_token');

    // Public data — no auth required
    api.cars.getAll().then(setCars).catch(() => {});
    api.tours.getAll().then(setTours).catch(() => {});
    api.destinations.getAll().then(setDestinations).catch(() => {});
    api.settings.getServiceFee().then(f => setServiceFee(f.fee ?? 5)).catch(() => {});
    api.settings.getTeamMembers().then(r => { if (r.members?.length) setTeamMembers(r.members); }).catch(() => {});

    // Protected data — only fetch when a session is active
    if (token) {
      const userParams = forRole === 'admin'
        ? { limit: 200 }
        : { role: 'vendor', status: 'active', limit: 100 };
      api.users.list(userParams).then(r => setUsers(r.data ?? [])).catch(() => {});
      api.bookings.getAll().then(setBookings).catch(() => {});
    }
  };

  useEffect(() => {
    // Verify stored JWT and refresh user session from API
    const token = localStorage.getItem("cebuCartour_token");
    if (token) {
      api.auth.me()
        .then((freshUser) => {
          // /me returns the user object directly (not wrapped in { user: ... })
          if (freshUser?.id) {
            setUser(freshUser);
            localStorage.setItem("cebuCartour_user", JSON.stringify(freshUser));
          }
        })
        .catch(() => {
          // Token expired or invalid — clear session so user is shown as logged out
          localStorage.removeItem("cebuCartour_token");
          localStorage.removeItem("cebuCartour_user");
          setUser(null);
        });
    }

    fetchAllData();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (msg) => { setToast(msg); };
  usePageMeta(page, bookingItem);

  const updateServiceFee = async (pct) => {
    const val = Math.min(100, Math.max(0, +pct));
    try { await api.settings.updateServiceFee(val); } catch (e) { console.error(e); }
    setServiceFee(val);
    showToast(`Service fee updated to ${val}%`);
  };

  const updateCar = async (id, data) => {
    try {
      const updated = await api.cars.update(id, data);
      setCars(prev => prev.map(c => c.id === id ? updated : c));
      showToast("Car listing updated!");
    } catch (e) {
      console.error(e);
      showToast("Failed to update car: " + (e.message || "Server error"));
    }
  };
  const updateTour = async (id, data) => {
    try {
      const updated = await api.tours.update(id, data);
      setTours(prev => prev.map(t => t.id === id ? updated : t));
      showToast("Tour listing updated!");
    } catch (e) {
      console.error(e);
      showToast("Failed to update tour: " + (e.message || "Server error"));
    }
  };
  const deleteCar = async (id) => {
    try { await api.cars.delete(id); } catch (e) { console.error(e); }
    setCars(prev => prev.filter(c => c.id !== id));
    showToast("Car removed.");
  };
  const deleteTour = async (id) => {
    try { await api.tours.delete(id); } catch (e) { console.error(e); }
    setTours(prev => prev.filter(t => t.id !== id));
    showToast("Tour removed.");
  };

  const goTo = (p) => { setPage(p); setModal(null); if (p !== "booking") setBookingItem(null); window.scrollTo(0,0); };

  const openBooking = (item, type) => { const enriched = { ...item, itemType: type }; setBookingItem(enriched); setModal(null); setPage("booking"); window.scrollTo(0,0); };

  const handleLogin = (u) => {
    setUser(u);
    localStorage.setItem("cebuCartour_user", JSON.stringify(u));
    fetchAllData(u.role);
    if (u.role === "admin") goTo("admin");
    else if (u.role === "vendor") goTo("vendor");
    else goTo("home");
    showToast(`Welcome back, ${u.name.split(" ")[0]}!`);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("cebuCartour_user");
    localStorage.removeItem("cebuCartour_token");
    goTo("home");
    showToast("Logged out successfully.");
    fetchAllData(null);
  };

  const updateUser = async (updatedFields) => {
    try { await api.users.update(user?.id, updatedFields); } catch (e) { console.error(e); }
    setUser(prev => {
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem("cebuCartour_user", JSON.stringify(updated));
      return updated;
    });
    setUsers(prev => prev.map(u => u.id === user?.id ? { ...u, ...updatedFields } : u));
    showToast("Profile updated successfully!");
  };

  const handleBook = async (booking) => {
    // Normalise field name: frontend uses "payment", backend expects "paymentMethod"
    const payload = { ...booking };
    if (payload.payment !== undefined && payload.paymentMethod === undefined) {
      payload.paymentMethod = payload.payment;
      delete payload.payment;
    }
    try {
      const created = await api.bookings.create(payload);
      setBookings(prev => [...prev, created]);
      showToast("Booking submitted! Await vendor confirmation.");
      goTo("home");
    } catch (e) {
      console.error(e);
      showToast("Failed to save booking: " + (e.message || "Server error. Is the backend running?"));
    }
  };

  const updateBookingStatus = async (id, status) => {
    try { await api.bookings.update(id, { status }); } catch (e) { console.error(e); }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    showToast(`Booking ${id} marked as ${status}.`);
  };

  const submitRating = async (bookingId, itemType, itemId, stars, note) => {
    try { await api.bookings.update(bookingId, { rating: stars, ratingNote: note }); } catch (e) { console.error(e); }
    const updatedBookings = bookings.map(b => b.id === bookingId ? { ...b, rating: stars, ratingNote: note } : b);
    setBookings(updatedBookings);
    const rated = updatedBookings.filter(b => b.type === itemType && b.itemId === itemId && b.rating > 0);
    const avg   = +(rated.reduce((s, b) => s + b.rating, 0) / rated.length).toFixed(1);
    const count = rated.length;
    if (itemType === "car") {
      try { await api.cars.update(itemId, { rating: avg, reviews: count }); } catch (e) { console.error(e); }
      setCars(prev => prev.map(c => c.id === itemId ? { ...c, rating: avg, reviews: count } : c));
    } else {
      try { await api.tours.update(itemId, { rating: avg, reviews: count }); } catch (e) { console.error(e); }
      setTours(prev => prev.map(t => t.id === itemId ? { ...t, rating: avg, reviews: count } : t));
    }
    showToast("Thank you for your rating!");
  };

  const approveVendor = async (uid) => {
    let setUrl = null;
    try {
      const result = await api.users.approve(uid);
      if (result?._setUrl) setUrl = result._setUrl;
    } catch (e) { console.error(e); }
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, approved: true, status: "active", approvalStatus: "approved", rejectionReason: "" } : u));
    showToast("User approved! Set-password email sent.");
    return setUrl;
  };
  const rejectVendor = async (uid, reason) => {
    try { await api.users.reject(uid, reason); } catch (e) { console.error(e); }
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, approved: false, status: "rejected", approvalStatus: "rejected", rejectionReason: reason || "Your application did not meet our requirements." } : u));
    showToast("Vendor application rejected.");
  };
  const disableUser = async (uid) => {
    try { await api.users.suspend(uid); } catch (e) { console.error(e); }
    setUsers(prev => prev.map(u => {
      if (u.id !== uid) return u;
      const beingSuspended = u.status === "active";
      return {
        ...u,
        status: beingSuspended ? "inactive" : "active",
        // Vendors: track suspension separately so they stay out of approved/rejected
        ...(u.role === "vendor" ? {
          approvalStatus: beingSuspended ? "suspended" : "approved",
        } : {}),
      };
    }));
    showToast("User status updated.");
  };
  const deleteUser = async (uid) => {
    try { await api.users.delete(uid); } catch (e) { console.error(e); }
    setUsers(prev => prev.filter(u => u.id !== uid));
    setCars(prev => prev.filter(c => c.vendorId !== uid));
    setTours(prev => prev.filter(t => t.vendorId !== uid));
    showToast("User deleted.");
  };
  const deleteListing = async (type, id) => {
    try {
      if (type === "car") await api.cars.delete(id);
      else await api.tours.delete(id);
    } catch (e) { console.error(e); }
    if (type === "car") setCars(prev => prev.filter(c => c.id !== id));
    else setTours(prev => prev.filter(t => t.id !== id));
    showToast("Listing removed.");
  };

  const deleteBooking = async (id) => {
    try { await api.bookings.delete(id); } catch (e) { console.error(e); }
    setBookings(prev => prev.filter(b => b.id !== id));
    showToast("Booking deleted.");
  };

  const requestDeletion = async (uid, reason) => {
    if (reason === "__cancel__") {
      try { await api.users.cancelDeletion(uid); } catch (e) { console.error(e); }
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, deletionRequested: false, deletionReason: "", deletionRequestedAt: "" } : u));
      setUser(prev => ({ ...prev, deletionRequested: false, deletionReason: "", deletionRequestedAt: "" }));
      showToast("Deletion request cancelled. Your account is active.");
      return;
    }
    try { await api.users.requestDeletion(uid, reason); } catch (e) { console.error(e); }
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, deletionRequested: true, deletionReason: reason || "No reason provided.", deletionRequestedAt: new Date().toLocaleDateString("en-PH") } : u));
    setUser(prev => ({ ...prev, deletionRequested: true, deletionReason: reason || "No reason provided.", deletionRequestedAt: new Date().toLocaleDateString("en-PH") }));
    showToast("Deletion request submitted. Awaiting admin approval.");
  };

  const approveDeletion = async (uid) => {
    try { await api.users.delete(uid); } catch (e) { console.error(e); }
    setUsers(prev => prev.filter(u => u.id !== uid));
    if (user?.id === uid) { setUser(null); goTo("home"); }
    showToast("Account permanently deleted.");
  };

  const declineDeletion = async (uid) => {
    try { await api.users.cancelDeletion(uid); } catch (e) { console.error(e); }
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, deletionRequested: false, deletionReason: "", deletionRequestedAt: "" } : u));
    showToast("Deletion request declined. Account retained.");
  };

  const vendorBookings = user ? bookings.filter(b => b.vendorId === user.id) : [];
  const myBookings = user ? bookings.filter(b => b.userId === user.id) : [];
  const vendorCars = user ? cars.filter(c => c.vendorId === user.id) : [];
  const vendorTours = user ? tours.filter(t => t.vendorId === user.id) : [];

  return (
    <ErrorBoundary>
      {page !== "admin" && page !== "vendor" && (
        <Nav user={user} goTo={goTo} onLogout={handleLogout} />
      )}
      <PageErrorBoundary key={page} goTo={goTo}>
      {page === "home" && <Home goTo={goTo} cars={cars} tours={tours} setModal={setModal} openBooking={openBooking} users={users} destinations={destinations} onSearch={(loc, date) => setSearchFilters({ location: loc, date: date })} />}
      {page === "search" && <SearchResultsPage cars={cars} tours={tours} setModal={setModal} openBooking={openBooking} users={users} searchFilters={searchFilters} clearSearch={() => { setSearchFilters({ location: "", date: "" }); goTo("home"); }} goTo={goTo} />}
      {page === "cars" && <CarsPage cars={cars} setModal={setModal} openBooking={openBooking} users={users} searchFilters={searchFilters} clearSearch={() => setSearchFilters({ location: "", date: "" })} />}
      {page === "tours" && <ToursPage tours={tours} setModal={setModal} openBooking={openBooking} users={users} searchFilters={searchFilters} clearSearch={() => setSearchFilters({ location: "", date: "" })} />}
      {page === "booking" && <BookingPage item={bookingItem} user={user} onBook={handleBook} goTo={goTo} serviceFee={serviceFee} users={users} />}
      {page === "about" && <AboutPage teamMembers={teamMembers} />}
      {page === "contact" && <ContactPage user={user} />}
      {(page === "login" || page === "register") && <AuthPage startTab={page} onLogin={handleLogin} goTo={goTo} users={users} onRegister={u => setUsers(prev => [...prev, u])} resetToken={resetToken} onResetDone={() => setResetToken(null)} />}
      <Suspense fallback={<div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",color:"var(--muted)",fontSize:"0.9rem"}}><i className="fa-solid fa-spinner fa-spin" style={{marginRight:"0.5rem"}}/> Loading...</div>}>
        {page === "admin" && user?.role === "admin" && (
          <AdminDashboard user={user} bookings={bookings} users={users} cars={cars} tours={tours} serviceFee={serviceFee} updateServiceFee={updateServiceFee} onLogout={handleLogout} goTo={goTo} updateBookingStatus={updateBookingStatus} approveVendor={approveVendor} rejectVendor={rejectVendor} disableUser={disableUser} deleteUser={deleteUser} deleteBooking={deleteBooking} deleteListing={deleteListing} setPdfModal={setPdfModal} updateUser={updateUser} approveDeletion={approveDeletion} declineDeletion={declineDeletion} destinations={destinations} setDestinations={setDestinations} teamMembers={teamMembers} setTeamMembers={setTeamMembers} showToast={showToast} onRefresh={fetchAllData} />
        )}
        {page === "vendor" && user?.role === "vendor" && (
          <VendorDashboard user={user} bookings={vendorBookings} cars={vendorCars} tours={vendorTours} onLogout={handleLogout} goTo={goTo} updateBookingStatus={updateBookingStatus} deleteBooking={deleteBooking} setCars={setCars} setTours={setTours} updateCar={updateCar} updateTour={updateTour} deleteCar={deleteCar} deleteTour={deleteTour} showToast={showToast} setPdfModal={setPdfModal} allCars={cars} allTours={tours} serviceFee={serviceFee} updateUser={updateUser} requestDeletion={requestDeletion} />
        )}
        {page === "profile" && user?.role === "customer" && (
          <CustomerProfile user={user} bookings={myBookings} goTo={goTo} onLogout={handleLogout} updateUser={updateUser} cars={cars} tours={tours} requestDeletion={requestDeletion} users={users} deleteBooking={deleteBooking} serviceFee={serviceFee} submitRating={submitRating} />
        )}
      </Suspense>
      </PageErrorBoundary>
      <PageErrorBoundary key="modal" goTo={goTo}>
        {modal && <DetailModal item={modal} onClose={() => setModal(null)} openBooking={openBooking} users={users} />}
      </PageErrorBoundary>
      {pdfModal && <BookingSummaryModal booking={pdfModal.booking} itemName={pdfModal.itemName} item={pdfModal.item} onClose={() => setPdfModal(null)} vendor={users.find(u => u.id === pdfModal.booking?.vendorId)} serviceFee={serviceFee} />}
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </ErrorBoundary>
  );
}
