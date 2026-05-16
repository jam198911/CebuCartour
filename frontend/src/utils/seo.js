import { useEffect } from "react";

// ─── SEO ─────────────────────────────────────────────────────────────────────
function _setMeta(attr, key, content) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute("content", content || "");
}
function _setCanonical(page) {
  let el = document.querySelector("link[rel='canonical']");
  if (!el) { el = document.createElement("link"); el.setAttribute("rel", "canonical"); document.head.appendChild(el); }
  el.setAttribute("href", `${window.location.origin}${page === "home" ? "/" : `/${page}`}`);
}
const PAGE_META = {
  home:    { title: "CebuCarTour — Car Rentals & Tours in Cebu",         desc: "Book car rentals and guided tour packages across Cebu and Eastern Visayas. Explore islands, heritage sites, and adventure destinations." },
  cars:    { title: "Car Rentals | CebuCarTour",                          desc: "Rent cars, vans, SUVs and jeepneys across Cebu and Eastern Visayas. Affordable daily rates, verified vendors." },
  tours:   { title: "Tour Packages | CebuCarTour",                        desc: "Island tours, adventure tours, and cultural heritage packages — discover the best of Cebu and Eastern Visayas." },
  search:  { title: "Search Results | CebuCarTour",                       desc: "Find available cars and tour packages matching your destination and travel dates." },
  booking: { title: "Book Now | CebuCarTour",                             desc: "Complete your car rental or tour package booking on CebuCarTour." },
  about:   { title: "About Us | CebuCarTour",                             desc: "CebuCarTour connects travelers with trusted local vendors and tour operators across Cebu and the Visayas." },
  contact: { title: "Contact Us | CebuCarTour",                           desc: "Get in touch with the CebuCarTour team for bookings, support, and partnership inquiries." },
  login:   { title: "Login or Register | CebuCarTour",                    desc: "Sign in to your CebuCarTour account to manage bookings, listings, and your profile." },
  admin:   { title: "Admin Dashboard | CebuCarTour",                      desc: "" },
  vendor:  { title: "Vendor Dashboard | CebuCarTour",                     desc: "" },
  profile: { title: "My Bookings | CebuCarTour",                          desc: "" },
};
export function usePageMeta(page, bookingItem) {
  useEffect(() => {
    const base  = PAGE_META[page] || PAGE_META.home;
    const title = (page === "booking" && bookingItem) ? `Book ${bookingItem.name} | CebuCarTour` : base.title;
    const desc  = (page === "booking" && bookingItem) ? `Reserve ${bookingItem.name}. ${(bookingItem.description || "").slice(0, 120)}` : base.desc;
    document.title = title;
    _setMeta("name",     "description",    desc);
    _setMeta("property", "og:title",       title);
    _setMeta("property", "og:description", desc);
    _setMeta("property", "og:url",         window.location.href);
    _setCanonical(page);
  }, [page, bookingItem]);
}
