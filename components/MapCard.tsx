import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapCardProps {
  lat: number;
  lng: number;
  rawText: string;
}

export const MapCard: React.FC<MapCardProps> = ({ lat, lng }) => {
  return (
    <div className="my-4 border rounded overflow-hidden shadow-sm relative group bg-white dark:bg-gray-800 dark:border-gray-700" style={{ height: '300px', width: '100%', maxWidth: '600px' }}>
       <MapContainer center={[lat, lng]} zoom={13} scrollWheelZoom={true} attributionControl={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
        />
        <Marker position={[lat, lng]}>
          <Popup>
            {lat}, {lng}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};
