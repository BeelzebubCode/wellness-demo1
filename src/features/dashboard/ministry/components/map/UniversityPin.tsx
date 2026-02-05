"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { divIcon } from "leaflet";
import { Marker, Popup } from "react-leaflet";
import { TrendingUp, Users } from "lucide-react";

const createLogoIcon = (logoPath: string, code: string) => {
  // Create HTML with university logo
  const html = `
    <div style="
      position: relative;
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <img 
        src="${logoPath}" 
        alt="${code}"
        style="
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 3px solid white;
          background: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          object-fit: contain;
          padding: 2px;
        "
        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
      />
      <div style="
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 3px solid white;
        background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: none;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
      ">
        ${code.substring(0, 2)}
      </div>
    </div>
  `;

  return divIcon({
    html,
    className: "university-logo-marker",
    iconSize: [50, 50],
    iconAnchor: [25, 50], // Center bottom
    popupAnchor: [0, -50],
  });
};

export function UniversityPin({ data }: { data: any }) {
  const [icon, setIcon] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIcon(createLogoIcon(data.logo, data.code || data.id));
    }
  }, [data.logo, data.code, data.id]);

  if (!icon) return null;

  return (
    <Marker position={[data.lat, data.lng]} icon={icon}>
      <Popup className="glass-popup">
        <div className="p-1 min-w-[200px]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={data.logo} alt={data.name} className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900">{data.name}</h4>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{data.province || data.type}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-3">
             <div className="bg-blue-50 p-2 rounded-lg text-center">
                <Users className="w-4 h-4 mx-auto text-blue-600 mb-1" />
                <div className="text-xs font-bold text-blue-700">{data.students?.toLocaleString() || 0}</div>
                <div className="text-[10px] text-blue-500">Students</div>
             </div>
             <div className="p-2 rounded-lg text-center bg-green-50">
                <TrendingUp className="w-4 h-4 mx-auto mb-1 text-green-600" />
                <div className="text-xs font-bold text-green-700">
                    Active
                </div>
                <div className="text-[10px] text-green-500">Status</div>
             </div>
          </div>

          <Link 
            href={`/ministry/universities/${data.code}`}
            className="mt-3 w-full py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg text-center block"
          >
            View Dashboard →
          </Link>
        </div>
      </Popup>
    </Marker>
  );
}
