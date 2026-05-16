import { useState } from "react";
import { fmtPeso } from "../utils/helpers.js";
import { Stars } from "./SharedUI.jsx";

export default function DetailModal({ item, onClose, openBooking }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {(() => {
          const imgs = (item.images && item.images.length > 0) ? item.images : item.image ? [item.image] : [];
          const [activeImg, setActiveImg] = useState(0);
          return imgs.length > 0 ? (
            <div style={{position:"relative"}}>
              <img src={imgs[activeImg] || imgs[0]} alt={item.name} className="modal-hero-img" />
              {imgs.length > 1 && (
                <div style={{display:"flex",gap:"0.5rem",padding:"0.5rem",background:"#000",overflowX:"auto"}}>
                  {imgs.map((src,i) => (
                    <img key={i} src={src} alt={`Photo ${i+1}`}
                      onClick={()=>setActiveImg(i)}
                      style={{width:60,height:45,objectFit:"cover",cursor:"pointer",borderRadius:4,
                        border:`2px solid ${activeImg===i?"var(--teal)":"transparent"}`,flexShrink:0,opacity:activeImg===i?1:0.65,transition:"all .2s"}} />
                  ))}
                </div>
              )}
            </div>
          ) : null;
        })()}
        <div className="modal-body">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"1rem"}}>
            <div>
              <h2 className="modal-title">{item.name}</h2>
              <div className="card-loc"><i className="fa-solid fa-location-dot"/> {item.location}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div className="card-price" style={{fontSize:"1.8rem"}}>{fmtPeso(item.price)}</div>
              <div style={{color:"var(--muted)",fontSize:"0.85rem"}}>{item.itemType === "car" ? "per day" : "per person"}</div>
            </div>
          </div>

          <div className="modal-meta">
            <div className="meta-item"><span className="meta-label">Type</span><span className="meta-val"><span className="tag">{item.type || item.category}</span></span></div>
            {item.itemType === "car" ? <>
              <div className="meta-item"><span className="meta-label">Seats</span><span className="meta-val"><i className="fa-solid fa-users"/> {item.seats}</span></div>
              <div className="meta-item"><span className="meta-label">Fuel</span><span className="meta-val"><i className="fa-solid fa-gas-pump"/> {item.fuel}</span></div>
              <div className="meta-item"><span className="meta-label">Transmission</span><span className="meta-val"><i className="fa-solid fa-gears"/> {item.transmission}</span></div>
              <div className="meta-item"><span className="meta-label">Rating</span><span className="meta-val"><Stars rating={item.rating} /></span></div>
            </> : <>
              <div className="meta-item"><span className="meta-label">Duration</span><span className="meta-val"><i className="fa-solid fa-calendar-days"/> {item.duration}</span></div>
              <div className="meta-item"><span className="meta-label">Group Size</span><span className="meta-val"><i className="fa-solid fa-users"/> Max {item.groupSize}</span></div>
              <div className="meta-item"><span className="meta-label">Rating</span><span className="meta-val"><Stars rating={item.rating} /></span></div>
            </>}
          </div>

          <p style={{color:"var(--muted)",lineHeight:"1.8",marginTop:"1rem"}}>{item.description}</p>

          {item.includes && (
            <div className="modal-includes">
              <h4>What's Included</h4>
              <div className="include-list">
                {item.includes.map(i => <span key={i} className="include-tag"><i className="fa-solid fa-check"/> {i}</span>)}
              </div>
            </div>
          )}

          <div style={{display:"flex",gap:"1rem",marginTop:"1.5rem"}}>
            {item.available && (
              <button className="book-now-btn" style={{flex:1,margin:0}} onClick={() => { onClose(); openBooking(item, item.itemType); }}>
                <i className="fa-solid fa-calendar-check"/> Book Now
              </button>
            )}
            <button onClick={onClose} style={{flex:1,background:"#E9E9E9",color:"#7A7A7A",border:"none",borderRadius:"14px",padding:"1rem",cursor:"pointer",fontWeight:"700",fontSize:"1rem"}}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
