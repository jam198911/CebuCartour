import { useState } from "react";
import { fmtPeso } from "../utils/helpers.js";
import { Stars } from "./SharedUI.jsx";

export default function CarCard({ car, onClick, onBook, vendor }) {
  const [imgErr, setImgErr] = useState(false);
  const rawSrc = (car.images && car.images.length > 0) ? car.images[0] : (car.image || null);
  const imgSrc = imgErr ? null : rawSrc;
  return (
    <div className="card fade-in" style={{cursor:"pointer"}} onClick={onClick}>
      <div className="card-img-wrap">
        {imgSrc
          ? <img src={imgSrc} alt={car.name} onError={() => setImgErr(true)} />
          : <div style={{width:"100%",height:"100%",minHeight:180,background:"#F1F5F9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2.8rem",color:"#D1D5DB"}}><i className="fa-solid fa-car"/></div>
        }
        <span className={`card-badge ${!car.available?"unavailable":""}`}>
          {car.available ? car.type : "Unavailable"}
        </span>
        {car.images && car.images.length > 1 && (
          <div style={{position:"absolute",bottom:8,right:8,background:"rgba(0,0,0,0.55)",color:"#fff",
            fontSize:"0.68rem",fontWeight:700,padding:"0.15rem 0.5rem",borderRadius:50}}>
            1/{car.images.length} <i className="fa-solid fa-camera"/>
          </div>
        )}
      </div>
      <div className="card-body">
        <div className="card-title">{car.name}</div>
        <div className="card-loc"><i className="fa-solid fa-location-dot"/> {car.location}</div>
        <div className="card-tags">
          <span className="tag"><i className="fa-solid fa-gas-pump"/> {car.fuel}</span>
          <span className="tag"><i className="fa-solid fa-gears"/> {car.transmission}</span>
          <span className="tag"><i className="fa-solid fa-users"/> {car.seats} seats</span>
        </div>
        <div className="card-meta">
          <div><div className="card-price">{fmtPeso(car.price)}<span>/day</span></div></div>
          <Stars rating={car.rating} />
        </div>
        {vendor && (
          <div style={{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.5rem 0",
            borderTop:"1px solid #F3F4F6",marginTop:"0.6rem"}}>
            <div style={{width:22,height:22,borderRadius:"50%",overflow:"hidden",flexShrink:0,
              border:"1px solid var(--border)"}}>
              {vendor.profilePhoto
                ? <img src={vendor.profilePhoto} alt={vendor.name} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                : <div style={{width:"100%",height:"100%",background:"linear-gradient(135deg,var(--ocean),var(--teal))",
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.7rem",color:"#fff"}}>
                    <i className="fa-solid fa-building"/>
                  </div>
              }
            </div>
            <span style={{fontSize:"0.75rem",color:"var(--muted)",fontWeight:500,
              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              {vendor.company||vendor.name}
            </span>
          </div>
        )}
        <div style={{display:"flex",gap:"0.6rem",marginTop:"0.8rem",alignItems:"center"}}>
          {car.available ? (
            <button className="book-now-btn" style={{flex:1,padding:"0.7rem",margin:0}}
              onClick={e=>{e.stopPropagation();onBook();}}>
              Book This Car
            </button>
          ) : null}
          <button onClick={e=>{e.stopPropagation();onClick();}}
            style={{flex:car.available?0:1,background:"transparent",border:"1px solid var(--border)",
              borderRadius:10,padding:"0.65rem 0.9rem",cursor:"pointer",fontSize:"0.8rem",
              fontWeight:600,color:"var(--muted)",whiteSpace:"nowrap",transition:"all .2s"}}>
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
