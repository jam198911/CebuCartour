import { useState, useEffect, useRef } from "react";
import CarCard from "../components/CarCard.jsx";
import TourCard from "../components/TourCard.jsx";
import { Footer } from "./AboutPage.jsx";
import { api } from "../api.js";

export const HERO_SLIDES = [/*
  { img:"https://images.unsplash.com/photo-1604537466158-719b1972feb8?w=1600&q=80", label:"Kawasan Falls, Badian — Cebu" },
  { img:"https://images.unsplash.com/photo-1559628233-100c798642d4?w=1600&q=80", label:"Whale Shark Watching, Oslob — Cebu" },
  { img:"https://images.unsplash.com/photo-1551632811-561732d1e306?w=1600&q=80", label:"Osmena Peak, Dalaguete — Cebu" },
  { img:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80", label:"Malapascua Island — Cebu" },
  { img:"https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=1600&q=80", label:"Moalboal Sardine Run — Cebu" },
*/
  ];

export const CEBU_DESTINATIONS = [/*
  {
    name:"Kawasan Falls", tag:"Waterfall", tagColor:"#0D9488",
    img:"https://images.unsplash.com/photo-1604537466158-719b1972feb8?w=800&q=80",
    location:"Badian, Cebu", bestTime:"Nov â€“ May", duration:"Full Day", difficulty:"Moderate",
    distance:"120 km from Cebu City",
    description:"Kawasan Falls is Cebu's crown jewel — a multi-tiered cascade fed by underground springs that keeps the water a breathtaking turquoise-blue year-round. Surrounded by lush jungle, it's the finish line of the legendary Badian canyoneering route.",
    highlights:["Canyoneering adventure","Turquoise natural pool","3-tier waterfall","Bamboo raft rides","Jungle trekking trails"],
  },
  {
    name:"Malapascua Island", tag:"Diving", tagColor:"#2563EB",
    img:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    location:"Daanbantayan, Cebu", bestTime:"Mar â€“ Jun", duration:"2â€“3 Days", difficulty:"Easy",
    distance:"136 km from Cebu City",
    description:"Malapascua is a tiny island paradise famous worldwide as the only place on Earth where thresher sharks can be reliably spotted daily. Its white sand beaches and gin-clear waters make it a dream for divers and beach lovers alike.",
    highlights:["Thresher shark diving (Monad Shoal)","White sand Bounty Beach","Vibrant coral reefs","Sunset island hopping","Laid-back beach bars"],
  },
  {
    name:"Oslob Whale Sharks", tag:"Wildlife", tagColor:"#3578C5",
    img:"https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&q=80",
    location:"Oslob, Cebu", bestTime:"Year-round", duration:"Half Day", difficulty:"Easy",
    distance:"130 km from Cebu City",
    description:"Swimming alongside whale sharks — the world's largest fish — is a bucket-list experience that Oslob uniquely offers every morning. These gentle giants gather in the bay at dawn, giving visitors an up-close encounter unlike anywhere else.",
    highlights:["Whale shark interaction","Snorkeling with gentle giants","Sumilon Island side trip","Tumalog Falls nearby","Cuartel ruins"],
  },
  {
    name:"Bantayan Island", tag:"Beach", tagColor:"#F97316",
    img:"https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=800&q=80",
    location:"Santa Fe, Bantayan", bestTime:"Dec â€“ May", duration:"2â€“3 Days", difficulty:"Easy",
    distance:"155 km from Cebu City",
    description:"Bantayan Island is Cebu's best-kept secret — miles of powdery white sand, crystal-clear shallow waters, and a relaxed pace of life far from the crowds. Its old church and tight-knit community give it a charming, authentic character.",
    highlights:["Powdery white sand beaches","Virgin Island sandbar","Old Bantayan Church (1584)","Fresh seafood dining","Peaceful sunset views"],
  },
  {
    name:"Sumilon Island", tag:"Sandbar", tagColor:"#0891B2",
    img:"https://images.unsplash.com/photo-1604537529428-15bcbeecfe4d?w=800&q=80",
    location:"Oslob, Cebu", bestTime:"Mar â€“ Aug", duration:"Half Day", difficulty:"Easy",
    distance:"131 km from Cebu City",
    description:"Sumilon Island features a magical disappearing sandbar that shifts with the tides, creating ever-changing landscapes of white sand arcing into the blue sea. It's often paired with an Oslob whale shark tour for a perfect Cebu day.",
    highlights:["Shifting white sandbar","Crystal-clear lagoon","Snorkeling & diving","Saltwater swimming pool","Island picnic packages"],
  },
  {
    name:"Osmena Peak", tag:"Trekking", tagColor:"#16A34A",
    img:"https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80",
    location:"Dalaguete, Cebu", bestTime:"Oct â€“ Apr", duration:"Full Day", difficulty:"Moderate",
    distance:"97 km from Cebu City",
    description:"At 1,013 meters, Osmena Peak is Cebu's highest point and rewards hikers with jaw-dropping 360Â° panoramas of rolling hills, valleys, and the sea below. The jagged karst formations near the summit are unlike anywhere else in the Philippines.",
    highlights:["Highest peak in Cebu","360Â° panoramic views","Dramatic karst formations","Sunrise & sunset hikes","Campsite available"],
  },
  {
    name:"Moalboal", tag:"Snorkeling", tagColor:"#0369A1",
    img:"https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&q=80",
    location:"Moalboal, Cebu", bestTime:"Nov â€“ Jun", duration:"Full Day", difficulty:"Easy",
    distance:"90 km from Cebu City",
    description:"Moalboal is home to one of the ocean's most mind-blowing spectacles — millions of sardines swirling in a massive, shimmering tornado just meters from shore. No boat needed; this reef dive is right off the beach.",
    highlights:["Sardine Run (year-round)","Turtle colony snorkeling","Pescador Island dive","White Beach relaxation","Freediving community"],
  },
  {
    name:"Simala Shrine", tag:"Heritage", tagColor:"#DC2626",
    img:"https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80",
    location:"Sibonga, Cebu", bestTime:"Year-round", duration:"Half Day", difficulty:"Easy",
    distance:"60 km from Cebu City",
    description:"The Monastery of the Holy Eucharist, known as Simala Shrine, is a grand neo-Gothic hilltop church that draws thousands of pilgrims daily. Its ornate interiors, bell towers, and the miraculous image of Our Lady of Simala make it one of the Philippines' most visited sites.",
    highlights:["Miraculous Virgin Mary image","Stunning Gothic architecture","Panoramic hilltop views","Votive offerings display","Peaceful prayer garden"],
  },
  {
    name:"Cebu City Heritage", tag:"Culture", tagColor:"#B45309",
    img:"https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80",
    location:"Cebu City", bestTime:"Year-round", duration:"Full Day", difficulty:"Easy",
    distance:"City center",
    description:"Cebu City is the Queen City of the South and the oldest city in the Philippines. A walk through its heritage core reveals Magellan's Cross, the oldest street, and centuries of Spanish colonial history — all still alive and breathing.",
    highlights:["Magellan's Cross (1521)","Basilica Minore del Sto. NiÃ±o","Fort San Pedro","Carbon Market","Colon Street (oldest in PH)"],
  },
  {
    name:"Camotes Islands", tag:"Island Hop", tagColor:"#0D9488",
    img:"https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&q=80",
    location:"Camotes, Cebu", bestTime:"Dec â€“ Jun", duration:"2 Days", difficulty:"Easy",
    distance:"by ferry from Danao City",
    description:"The Camotes Islands are a cluster of four islands with a refreshingly unhurried atmosphere — hidden lakes, sea caves, white beaches, and waterfalls all within a tiny area. Lake Danao and Santiago Bay are the standouts of this under-the-radar paradise.",
    highlights:["Lake Danao freshwater lake","Timubo Cave & lagoon","Santiago Bay white beach","Mangodlong Rock Resort","Buho Rock cliff diving"],
  },
  {
    name:"Kalanggaman Island", tag:"Island Tour", tagColor:"#F59E0B",
    img:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    location:"Palompon, Leyte", bestTime:"Mar â€“ Jun", duration:"Full Day", difficulty:"Easy",
    distance:"via Palompon port",
    description:"Kalanggaman is consistently ranked among the Philippines' most beautiful islands — a thin sliver of pure white sand stretching into the turquoise sea, with no hotels or resorts to interrupt the pristine natural setting.",
    highlights:["Iconic elongated sandbar","Crystal-clear snorkeling","Dramatic aerial views","Day trip & overnight camping","Pristine untouched reef"],
  },
  {
    name:"Bohol Day Trip", tag:"Province", tagColor:"#3578C5",
    img:"https://images.unsplash.com/photo-1604537529428-15bcbeecfe4d?w=800&q=80",
    location:"Tagbilaran, Bohol", bestTime:"Year-round", duration:"Full Day", difficulty:"Easy",
    distance:"2h ferry from Cebu Port",
    description:"Just a short ferry ride from Cebu, Bohol delivers the iconic Chocolate Hills, adorable Philippine tarsiers, and a scenic river cruise all in one day. It's the most popular day trip from Cebu for good reason.",
    highlights:["Chocolate Hills (1,776 mounds)","Philippine tarsier sanctuary","Loboc River cruise","Panglao Island beaches","Baclayon Church (1595)"],
  },*/
];

export default function Home({ goTo, cars, tours, setModal, openBooking, users = [], destinations = CEBU_DESTINATIONS, onSearch }) {
  const [search, setSearch]           = useState({ type: "all", location: "", date: "" });
  const [showAllCars, setShowAllCars]   = useState(false);
  const [showAllTours, setShowAllTours] = useState(false);
  const [slide, setSlide]             = useState(0);
  const [paused, setPaused]           = useState(false);
  const [destModal, setDestModal]     = useState(null);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [slides, setSlides]           = useState(HERO_SLIDES);
  const intervalRef                   = useRef(null);
  const datePickerRef                 = useRef(null);

  const CARDS_VISIBLE = 5;
  const maxCarouselIdx = Math.max(0, destinations.length - CARDS_VISIBLE);

  const INTERVAL = 3000;

  const goSlide = (idx) => setSlide((idx + slides.length) % slides.length);

  useEffect(() => {
    api.settings.getHeroSlides()
      .then(d => { if (d?.slides?.length === 5) setSlides(d.slides); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (paused) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => setSlide(s => (s + 1) % slides.length), INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [paused, slides.length]);

  const availCars  = cars.filter(c => c.available);
  const availTours = tours.filter(t => t.available);
  const displayCars  = showAllCars  ? availCars  : availCars.slice(0, 6);
  const displayTours = showAllTours ? availTours : availTours.slice(0, 6);
  const locations = [...new Set([...cars.map(c=>c.location), ...tours.map(t=>t.location)])].sort();

  const handleSearch = () => {
    if (onSearch) onSearch(search.location, search.date);
    if (search.type === "cars") goTo("cars");
    else if (search.type === "tours") goTo("tours");
    else goTo("search");
  };

  return (
    <div>
      {/* â”€â”€ HERO â”€â”€ */}
      <section className="hero"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}>

        {/* Carousel background slides */}
        {slides.map((s, i) => (
          <div key={i} className="hero-slide" style={{
            backgroundImage: `linear-gradient(160deg,rgba(5,30,52,0.85) 0%,rgba(10,77,104,0.50) 55%,rgba(5,30,52,0.78) 100%), url('${s.img}')`,
            opacity: i === slide ? 1 : 0,
            zIndex: i === slide ? 1 : 0,
          }} />
        ))}

        {/* Slide dots */}
        <div className="hero-dots">
          {slides.map((_, i) => (
            <button key={i}
              className={`hero-dot${i === slide ? " active" : ""}`}
              onClick={() => { goSlide(i); setPaused(true); setTimeout(()=>setPaused(false), 8000); }} />
          ))}
        </div>

        {/* Location caption */}
        <div className="hero-caption"><i className="fa-solid fa-location-dot"></i> {slides[slide]?.label}</div>

        <div className="hero-content">
          <h1>Experience <em>Cebu</em><br/>Like Never Before</h1>
          <p>Pristine beaches, crystal waterfalls, and rich heritage await. Premium car rentals and curated tour packages across Cebu — all in one place.</p>

          <div className="hero-btns">
            <button className="btn-primary" onClick={() => goTo("tours")}><i className="fa-solid fa-map"/> Explore Tours</button>
            <button className="btn-ghost" onClick={() => goTo("cars")}><i className="fa-solid fa-car"/> Rent a Car</button>
          </div>
        </div>

        {/* â”€â”€ Search Bar — bottom center â”€â”€ */}
        <div className="hero-search-wrap">
          <div className="search-wrap">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem",flexWrap:"wrap",gap:"0.5rem"}}>
              <div className="search-tabs" style={{margin:0}}>
                {[["all","fa-solid fa-globe","All"],["cars","fa-solid fa-car","Cars"],["tours","fa-solid fa-map","Tours"]].map(([val,icon,label]) => (
                  <button key={val} className={`search-tab ${search.type===val?"active":""}`}
                    onClick={() => setSearch(s=>({...s,type:val}))}>
                    <i className={icon}/> {label}
                  </button>
                ))}
              </div>
              <div className="search-chips-row">
                {["Island Tour","Adventure Tour","SUV","Van","Cultural Tour","Trekking"].map(chip => (
                  <button key={chip}
                    onClick={() => goTo(["SUV","Van"].includes(chip)?"cars":"tours")}
                    style={{background:"#F0F9FF",color:"var(--ocean)",border:"1px solid #BAE6FD",
                      borderRadius:50,padding:"0.2rem 0.65rem",cursor:"pointer",fontSize:"0.74rem",
                      fontWeight:600,transition:"all .15s"}}
                    onMouseEnter={e=>{e.target.style.background="var(--ocean)";e.target.style.color="#fff";}}
                    onMouseLeave={e=>{e.target.style.background="#F0F9FF";e.target.style.color="var(--ocean)";}}>
                    {chip}
                  </button>
                ))}
              </div>
            </div>
            <div className="search-fields">
              <div className="search-input-wrap">
                <span className="search-input-icon"><i class="fa-solid fa-map-pin"></i></span>
                <div className="search-input-inner">
                  <label>Location</label>
                  <select value={search.location} onChange={e=>setSearch(s=>({...s,location:e.target.value}))}>
                    <option value="">All locations</option>
                    {locations.map(l=><option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="search-input-wrap" style={{ cursor: "pointer", position: "relative" }}
                onClick={() => { try { datePickerRef.current?.showPicker(); } catch { datePickerRef.current?.click(); } }}>
                <span className="search-input-icon" style={{ color: search.date ? "var(--ocean)" : undefined }}>
                  <i className="fa-solid fa-calendar-days"/>
                </span>
                <div className="search-input-inner">
                  <label>{search.type==="cars"?"Pickup Date":"Tour Date"}</label>
                  <div style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
                    <span style={{ fontSize:"0.9rem", flex:1, fontWeight: search.date ? 600 : 400,
                      color: search.date ? "var(--ink)" : "#94A3B8" }}>
                      {search.date
                        ? new Date(search.date+"T00:00:00").toLocaleDateString("en-PH",{weekday:"short",month:"short",day:"numeric",year:"numeric"})
                        : "Select a date"}
                    </span>
                    {search.date && (
                      <button onClick={e => { e.stopPropagation(); setSearch(s=>({...s,date:""})); }}
                        style={{ background:"#F1F5F9", border:"none", borderRadius:50,
                          width:20, height:20, cursor:"pointer", color:"#94A3B8",
                          fontSize:"0.65rem", display:"flex", alignItems:"center",
                          justifyContent:"center", flexShrink:0 }}>
                        <i className="fa-solid fa-xmark"/>
                      </button>
                    )}
                  </div>
                </div>
                <input ref={datePickerRef} type="date" value={search.date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={e=>setSearch(s=>({...s,date:e.target.value}))}
                  style={{ position:"absolute", opacity:0, pointerEvents:"none", width:1, height:1, top:0, left:0 }} />
              </div>
              <button className="search-go-btn" onClick={handleSearch}><i className="fa-solid fa-magnifying-glass"/> Search</button>
            </div>
          </div>
        </div>

        <div className="hero-wave" />
      </section>

      {/* â”€â”€ CEBU DESTINATIONS SHOWCASE â”€â”€ */}
      <div className="dest-section">
        <div className="dest-section-header">
          <div className="section-tag">Top Destinations</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(1.9rem,3.5vw,2.6rem)",color:"var(--ink)",marginBottom:"0.6rem",marginTop:"0.3rem"}}>
            Discover Cebu's Finest
          </h2>
          <p style={{color:"var(--muted)",maxWidth:460,margin:"0 auto",fontSize:"0.98rem",lineHeight:1.7}}>
            From turquoise waters to misty waterfalls — every corner tells a story.
          </p>
        </div>

        {/* Carousel container */}
        <div style={{position:"relative",padding:"0.5rem 0 1.4rem"}}>
          {/* Prev button */}
          {carouselIdx > 0 && (
            <button className="dest-carousel-btn" onClick={() => setCarouselIdx(i => Math.max(0, i - 1))}
              style={{position:"absolute",left:"0.8rem",top:"50%",transform:"translateY(-50%)",
                zIndex:10,width:44,height:44,borderRadius:"50%",border:"none",
                background:"#fff",boxShadow:"0 4px 16px rgba(0,0,0,0.18)",
                cursor:"pointer",fontSize:"1.4rem",fontWeight:900,color:"var(--ocean)",
                display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="var(--ocean)";e.currentTarget.style.color="#fff";}}
              onMouseLeave={e=>{e.currentTarget.style.background="#fff";e.currentTarget.style.color="var(--ocean)";}}>
              <i className="fa-solid fa-chevron-left"/>
            </button>
          )}
          {/* Next button */}
          {carouselIdx < maxCarouselIdx && (
            <button className="dest-carousel-btn" onClick={() => setCarouselIdx(i => Math.min(maxCarouselIdx, i + 1))}
              style={{position:"absolute",right:"0.8rem",top:"50%",transform:"translateY(-50%)",
                zIndex:10,width:44,height:44,borderRadius:"50%",border:"none",
                background:"#fff",boxShadow:"0 4px 16px rgba(0,0,0,0.18)",
                cursor:"pointer",fontSize:"1.4rem",fontWeight:900,color:"var(--ocean)",
                display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="var(--ocean)";e.currentTarget.style.color="#fff";}}
              onMouseLeave={e=>{e.currentTarget.style.background="#fff";e.currentTarget.style.color="var(--ocean)";}}>
              <i className="fa-solid fa-chevron-right"/>
            </button>
          )}

          {/* Sliding track */}
          <div className="dest-carousel-track">
            <div style={{
              display:"flex",gap:"1.2rem",
              transform:`translateX(calc(-${carouselIdx} * (195px + 1.2rem)))`,
              transition:"transform 0.42s cubic-bezier(0.4,0,0.2,1)",
            }}>
              {destinations.map(d => (
                <div key={d.name} className="dest-card" onClick={() => setDestModal(d)}>
                  <img src={d.img||"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400"} alt={d.name}
                    onError={e=>{e.target.src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400";}}
                    style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} />
                  <div style={{position:"absolute",inset:0,
                    background:"linear-gradient(to top,rgba(5,30,52,0.9) 0%,rgba(5,30,52,0.1) 55%,transparent 100%)"}} />
                  <div style={{position:"absolute",top:13,left:13,
                    background:d.tagColor,color:"#fff",fontSize:"0.65rem",fontWeight:700,
                    padding:"0.18rem 0.65rem",borderRadius:50,textTransform:"uppercase",letterSpacing:".07em"}}>
                    {d.tag}
                  </div>
                  <div style={{position:"absolute",bottom:16,left:14,right:14}}>
                    <div style={{color:"#fff",fontFamily:"'Playfair Display',serif",fontSize:"1rem",
                      fontWeight:700,lineHeight:1.2,marginBottom:"0.4rem"}}>{d.name}</div>
                    <div style={{color:"rgba(255,255,255,0.6)",fontSize:"0.72rem",fontWeight:600,
                      display:"flex",alignItems:"center",gap:"0.3rem"}}>
                      Read more <i className="fa-solid fa-arrow-right"/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dot indicators */}
          {destinations.length > CARDS_VISIBLE && (
            <div className="dest-carousel-dots" style={{display:"flex",justifyContent:"center",gap:"0.45rem",marginTop:"1.2rem"}}>
              {Array.from({length: maxCarouselIdx + 1}).map((_,i) => (
                <button key={i} onClick={() => setCarouselIdx(i)}
                  style={{width: i === carouselIdx ? 22 : 10, height:10,borderRadius:50,border:"none",
                    background: i === carouselIdx ? "var(--ocean)" : "#CBD5E1",
                    cursor:"pointer",padding:0,transition:"all .3s"}} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* â”€â”€ DESTINATION BLOG MODAL â”€â”€ */}
      {destModal && (
        <div className="overlay" onClick={() => setDestModal(null)} style={{zIndex:300,alignItems:"flex-start",paddingTop:"4rem"}}>
          <div onClick={e => e.stopPropagation()}
            style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:650,
              maxHeight:"88vh",overflowY:"auto",boxShadow:"0 32px 80px rgba(0,0,0,0.28)"}}>

            {/* Hero image */}
            <div style={{position:"relative",height:300,overflow:"hidden",borderRadius:"20px 20px 0 0",flexShrink:0}}>
              <img src={destModal.img||"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400"} alt={destModal.name}
                onError={e=>{e.target.src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400";}}
                style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} />
              <div style={{position:"absolute",inset:0,
                background:"linear-gradient(to top,rgba(5,30,52,0.75) 0%,transparent 60%)"}} />
              {/* Close btn */}
              <button onClick={() => setDestModal(null)}
                style={{position:"absolute",top:16,right:16,background:"rgba(0,0,0,0.45)",
                  border:"none",borderRadius:"50%",width:38,height:38,cursor:"pointer",
                  color:"#fff",fontSize:"1.1rem",display:"flex",alignItems:"center",
                  justifyContent:"center",backdropFilter:"blur(4px)"}}>
                <i className="fa-solid fa-xmark"/>
              </button>
              {/* Title over image */}
              <div style={{position:"absolute",bottom:20,left:24,right:24}}>
                <div style={{color:"rgba(255,255,255,0.75)",fontSize:"0.8rem",fontWeight:600,
                  marginBottom:"0.3rem",display:"flex",alignItems:"center",gap:"0.3rem"}}>
                  <i class="fa-solid fa-magnifying-glass"></i> {destModal.location}
                </div>
                <h2 style={{color:"#fff",fontFamily:"'Playfair Display',serif",
                  fontSize:"clamp(1.6rem,3vw,2rem)",fontWeight:700,margin:0,lineHeight:1.15}}>
                  {destModal.name}
                </h2>
              </div>
            </div>

            {/* Blog body */}
            <div className="dest-modal-body">

              {/* Quick facts row */}
              <div style={{display:"flex",gap:"0.8rem",flexWrap:"wrap",marginBottom:"1.6rem",
                paddingBottom:"1.4rem",borderBottom:"1px solid #F1F5F9"}}>
                {[
                  {icon:"fa-solid fa-location-dot",label:"Location",val:destModal.location},
                  {icon:"fa-solid fa-clock",label:"Operating Hours",val:destModal.bestTime},
                  {icon:"fa-solid fa-ticket",label:"Entrance Fee",val:destModal.difficulty},
                  {icon:"fa-solid fa-route",label:"Distance",val:destModal.distance},
                ].map(f => (
                  <div key={f.label} style={{background:"#F8FAFC",borderRadius:12,
                    padding:"0.6rem 1rem",flex:"1 1 130px",minWidth:0}}>
                    <div style={{fontSize:"0.68rem",fontWeight:700,color:"#94A3B8",
                      textTransform:"uppercase",letterSpacing:".06em",marginBottom:"0.2rem"}}>
                      <i className={f.icon}/> {f.label}
                    </div>
                    <div style={{fontSize:"0.88rem",fontWeight:700,color:"#1E3A5F"}}>{f.val}</div>
                  </div>
                ))}
              </div>

              {/* Description */}
              <p style={{fontSize:"1rem",lineHeight:1.8,color:"#374151",marginBottom:"1.6rem",textAlign:"justify"}}>
                {destModal.description}
              </p>

              {/* Highlights */}
              <div style={{marginBottom:"2rem"}}>
                <h3 style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:"0.88rem",
                  textTransform:"uppercase",letterSpacing:".1em",color:"#94A3B8",marginBottom:"0.9rem"}}>
                  What to Expect
                </h3>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:"0.6rem"}}>
                  {destModal.highlights.map(h => (
                    <div key={h} style={{display:"flex",alignItems:"center",gap:"0.6rem",
                      background:"#F0FDF4",borderRadius:10,padding:"0.55rem 0.85rem",
                      border:"1px solid #DCFCE7"}}>
                      <span style={{color:"#16A34A",fontSize:"0.9rem",flexShrink:0}}>âœ“</span>
                      <span style={{fontSize:"0.85rem",fontWeight:600,color:"#166534"}}>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA row */}
              <div style={{display:"flex",gap:"0.8rem",flexWrap:"wrap",
                paddingTop:"1.4rem",borderTop:"1px solid #F1F5F9"}}>
                <button className="btn-primary" onClick={() => { setDestModal(null); goTo("tours"); }}
                  style={{flex:"1 1 160px",padding:"0.85rem 1.5rem"}}>
                  <i className="fa-solid fa-map"/> Book a Tour Here
                </button>
                <button onClick={() => { setDestModal(null); goTo("cars"); }}
                  style={{flex:"1 1 130px",background:"#F0F9FF",color:"var(--ocean)",
                    border:"1.5px solid #BAE6FD",borderRadius:50,padding:"0.85rem 1.5rem",
                    cursor:"pointer",fontWeight:700,fontSize:"0.95rem",transition:"all .2s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#E0F2FE"}
                  onMouseLeave={e=>e.currentTarget.style.background="#F0F9FF"}>
                  <i className="fa-solid fa-car"/> Rent a Car
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ STATS STRIP â”€â”€ */}
      <div className="stats-strip">
        {[
          {n:"0",l:"Happy Travelers",icon:"fa-solid fa-face-smile",dest:"tours"},
          {n:"0", l:"Car Options",    icon:"fa-solid fa-car",        dest:"cars"},
          {n:"0", l:"Tour Packages",  icon:"fa-solid fa-map",        dest:"tours"},
          {n:"0", l:"Local Vendors",  icon:"fa-solid fa-handshake",  dest:"about"},
        ].map(s => (
          <div key={s.l} onClick={() => goTo(s.dest)}
            style={{textAlign:"center",color:"#fff",cursor:"pointer",
              transition:"transform .2s",padding:"0.4rem 1rem",borderRadius:14}}
            onMouseEnter={e=>e.currentTarget.style.transform="translateY(-4px)"}
            onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
            <div style={{fontSize:"1.4rem",marginBottom:"0.3rem"}}><i className={s.icon}/></div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"2.1rem",
              fontWeight:900,color:"var(--sand)",lineHeight:1}}>{s.n}</div>
            <div style={{fontSize:"0.82rem",opacity:.8,marginTop:"0.3rem"}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* â”€â”€ POPULAR CARS â”€â”€ */}
      <div className="section">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:"2rem",flexWrap:"wrap",gap:"1rem"}}>
          <div>
            <div className="section-tag">Fleet Available Now</div>
            <h2 style={{marginBottom:"0.4rem"}}>Popular Car Rentals</h2>
            <p style={{color:"var(--muted)"}}>From vans to 4x4s — travel Cebu in style and comfort.</p>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
            <span style={{fontSize:"0.85rem",color:"var(--muted)"}}>
              Showing <strong>{displayCars.length}</strong> of <strong>{availCars.length}</strong>
            </span>
            <button className="btn-view-all" onClick={()=>goTo("cars")}>View All <i className="fa-solid fa-arrow-right"/></button>
          </div>
        </div>
        <div className="grid-3">
          {displayCars.map(car => (
            <CarCard key={car.id} car={car} vendor={users.find(u=>u.id===car.vendorId)}
              onClick={()=>setModal({...car,itemType:"car"})} onBook={()=>openBooking(car,"car")} />
          ))}
        </div>
        {availCars.length > 6 && (
          <div style={{textAlign:"center",marginTop:"2rem"}}>
            <button onClick={()=>setShowAllCars(v=>!v)}
              style={{background:"#fff",border:"2px solid var(--ocean)",color:"var(--ocean)",
                padding:"0.75rem 2rem",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.95rem",transition:"all .2s"}}
              onMouseEnter={e=>{e.target.style.background="var(--ocean)";e.target.style.color="#fff";}}
              onMouseLeave={e=>{e.target.style.background="#fff";e.target.style.color="var(--ocean)";}}>
              {showAllCars ? <><i className="fa-solid fa-chevron-up"/> Show Less</> : <><i className="fa-solid fa-chevron-down"/> Show All {availCars.length} Cars</>}
            </button>
          </div>
        )}
      </div>

      {/* â”€â”€ FEATURED TOURS â”€â”€ */}
      <div style={{background:"#F0F9FF",padding:"1px 0"}}>
        <div className="section">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:"2rem",flexWrap:"wrap",gap:"1rem"}}>
            <div>
              <div className="section-tag">Curated Experiences</div>
              <h2 style={{marginBottom:"0.4rem"}}>Featured Tour Packages</h2>
              <p style={{color:"var(--muted)"}}>Discover Cebu's best with expert local guides and guaranteed memories.</p>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
              <span style={{fontSize:"0.85rem",color:"var(--muted)"}}>
                Showing <strong>{displayTours.length}</strong> of <strong>{availTours.length}</strong>
              </span>
              <button className="btn-view-all" onClick={()=>goTo("tours")}>View All <i className="fa-solid fa-arrow-right"/></button>
            </div>
          </div>
          <div className="grid-3">
            {displayTours.map(tour => (
              <TourCard key={tour.id} tour={tour} vendor={users.find(u=>u.id===tour.vendorId)}
                onClick={()=>setModal({...tour,itemType:"tour"})} onBook={()=>openBooking(tour,"tour")} />
            ))}
          </div>
          {availTours.length > 6 && (
            <div style={{textAlign:"center",marginTop:"2rem"}}>
              <button onClick={()=>setShowAllTours(v=>!v)}
                style={{background:"#fff",border:"2px solid var(--ocean)",color:"var(--ocean)",
                  padding:"0.75rem 2rem",borderRadius:50,cursor:"pointer",fontWeight:700,fontSize:"0.95rem",transition:"all .2s"}}
                onMouseEnter={e=>{e.target.style.background="var(--ocean)";e.target.style.color="#fff";}}
                onMouseLeave={e=>{e.target.style.background="#fff";e.target.style.color="var(--ocean)";}}>
                {showAllTours ? <><i className="fa-solid fa-chevron-up"/> Show Less</> : <><i className="fa-solid fa-chevron-down"/> Show All {availTours.length} Tours</>}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* â”€â”€ WHY CHOOSE US â”€â”€ */}
      <div style={{background:"linear-gradient(150deg,#051e34 0%,#0a4d68 55%,#073d54 100%)",
        position:"relative",overflow:"hidden"}}>
        {/* Faint background photo texture */}
        <div style={{position:"absolute",inset:0,
          backgroundImage:"url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=20')",
          backgroundSize:"cover",backgroundPosition:"center",opacity:0.07}} />

        <div className="why-inner">
          {/* Section header */}
          <div style={{textAlign:"center",marginBottom:"3.5rem"}}>
            <div style={{display:"inline-block",
              background:"rgba(244,228,193,0.15)",border:"1px solid rgba(244,228,193,0.38)",
              color:"var(--sand)",padding:"0.28rem 1rem",borderRadius:50,
              fontSize:"0.76rem",fontWeight:700,letterSpacing:".12em",
              textTransform:"uppercase",marginBottom:"1.1rem"}}>
              Why Choose Us
            </div>
            <h2 style={{color:"#fff",fontFamily:"'Playfair Display',serif",
              fontSize:"clamp(2rem,4vw,3rem)",lineHeight:1.12,
              marginBottom:"0.9rem",marginTop:"0"}}>
              Your Cebu Journey,<br/>
              <em style={{color:"var(--sand)",fontStyle:"normal"}}>Perfectly Crafted</em>
            </h2>
            <p style={{color:"rgba(255,255,255,0.6)",maxWidth:500,margin:"0 auto",
              fontSize:"0.98rem",lineHeight:1.75}}>
              We connect travelers with Cebu's finest local vendors — making every trip seamless, safe, and unforgettable.
            </p>
          </div>

          {/* Feature cards */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:"1.5rem",marginBottom:"3rem"}}>
            {[
              { num:"01",icon:"fa-solid fa-umbrella-beach",color:"#F97316",title:"Born in Cebu",
                desc:"Every vendor is Cebu-based, giving you authentic local knowledge and insider access to hidden gems.",
                cta:"Meet our vendors",dest:"about" },
              { num:"02",icon:"fa-solid fa-circle-check",color:"#10B981",title:"Verified & Trusted",
                desc:"All vendors pass strict verification — business permits, ID checks, and quality standards before going live.",
                cta:"Learn about safety",dest:"about" },
              { num:"03",icon:"fa-solid fa-car",color:"#3B82F6",title:"Flexible Options",
                desc:"Vans, SUVs, sedans and more. Private or group — transportation for every budget and travel style.",
                cta:"Browse cars",dest:"cars" },
              { num:"04",icon:"fa-solid fa-comments",color:"#A855F7",title:"Always Here For You",
                desc:"Cebuano-speaking support via WhatsApp & Messenger — before, during, and after your adventure.",
                cta:"Contact us",dest:"contact" },
            ].map(f => (
              <div key={f.num} onClick={() => goTo(f.dest)}
                style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.11)",
                  borderRadius:20,padding:"1.8rem",cursor:"pointer",transition:"all 0.22s",
                  backdropFilter:"blur(8px)"}}
                onMouseEnter={e=>{
                  e.currentTarget.style.background="rgba(255,255,255,0.11)";
                  e.currentTarget.style.transform="translateY(-7px)";
                  e.currentTarget.style.borderColor="rgba(255,255,255,0.24)";
                  e.currentTarget.style.boxShadow="0 20px 50px rgba(0,0,0,0.2)";
                }}
                onMouseLeave={e=>{
                  e.currentTarget.style.background="rgba(255,255,255,0.06)";
                  e.currentTarget.style.transform="translateY(0)";
                  e.currentTarget.style.borderColor="rgba(255,255,255,0.11)";
                  e.currentTarget.style.boxShadow="none";
                }}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1.2rem"}}>
                  <span style={{fontSize:"3rem",fontFamily:"'Playfair Display',serif",fontWeight:900,
                    color:"rgba(255,255,255,0.08)",lineHeight:1,userSelect:"none"}}>
                    {f.num}
                  </span>
                  <div style={{width:48,height:48,borderRadius:13,
                    background:`${f.color}1A`,border:`1.5px solid ${f.color}44`,
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.35rem",flexShrink:0}}>
                    <i className={f.icon} style={{fontSize:"1.35rem",color:f.color}}/>
                  </div>
                </div>
                <h3 style={{color:"#fff",fontFamily:"'DM Sans',sans-serif",fontWeight:700,
                  fontSize:"1.05rem",marginBottom:"0.55rem"}}>{f.title}</h3>
                <p style={{color:"rgba(255,255,255,0.58)",fontSize:"0.88rem",lineHeight:1.72,marginBottom:"1.1rem"}}>
                  {f.desc}
                </p>
                <div style={{fontSize:"0.78rem",color:f.color,fontWeight:700}}>{f.cta} <i className={`fa-solid fa-arrow-right`}/></div>
              </div>
            ))}
          </div>

          {/* CTA banner */}
          <div style={{textAlign:"center",background:"rgba(255,255,255,0.06)",
            border:"1px solid rgba(255,255,255,0.14)",borderRadius:22,
            padding:"2.5rem 2rem",backdropFilter:"blur(10px)"}}>
            <div style={{color:"rgba(255,255,255,0.62)",fontSize:"0.88rem",marginBottom:"0.45rem"}}>
              Ready to explore Cebu?
            </div>
            <div style={{color:"#fff",fontFamily:"'Playfair Display',serif",
              fontSize:"clamp(1.5rem,3vw,2.1rem)",fontWeight:700,marginBottom:"1.8rem",lineHeight:1.2}}>
              Book Your Adventure Today
            </div>
            <div style={{display:"flex",gap:"1rem",justifyContent:"center",flexWrap:"wrap"}}>
              <button className="btn-primary" onClick={() => goTo("tours")}
                style={{padding:"0.9rem 2.4rem",fontSize:"0.98rem"}}>
                <i className="fa-solid fa-map"/> Browse Tours
              </button>
              <button onClick={() => goTo("cars")}
                style={{background:"transparent",border:"2px solid rgba(255,255,255,0.45)",color:"#fff",
                  padding:"0.9rem 2.4rem",borderRadius:50,cursor:"pointer",fontWeight:700,
                  fontSize:"0.98rem",transition:"all .2s"}}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.1)";}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
                <i className="fa-solid fa-car"/> Find a Car
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer goTo={goTo} />
    </div>
  );
}

