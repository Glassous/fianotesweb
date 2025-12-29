import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';

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

interface CustomZoomControlProps {
  center: [number, number];
  zoom: number;
}

// 自定义缩放控件组件
const CustomZoomControl: React.FC<CustomZoomControlProps> = ({ center, zoom }) => {
  const map = useMap();
  const { t } = useTranslation();

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  const handleReset = () => {
    map.setView(center, zoom);
  };

  return (
    <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-1">
      {/* 放大按钮 */}
      <button
        onClick={handleZoomIn}
        className="group/btn w-8 h-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl 
                   border border-gray-200 dark:border-gray-700 
                   flex items-center justify-center
                   transition-all duration-200 ease-in-out
                   hover:scale-110 active:scale-95
                   hover:bg-blue-50 dark:hover:bg-blue-900/30"
        aria-label={t('map.zoomIn')}
        title={t('map.zoomIn')}
      >
        <svg 
          className="w-4 h-4 text-gray-700 dark:text-gray-300 group-hover/btn:text-blue-600 dark:group-hover/btn:text-blue-400 transition-colors" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* 缩小按钮 */}
      <button
        onClick={handleZoomOut}
        className="group/btn w-8 h-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl 
                   border border-gray-200 dark:border-gray-700 
                   flex items-center justify-center
                   transition-all duration-200 ease-in-out
                   hover:scale-110 active:scale-95
                   hover:bg-blue-50 dark:hover:bg-blue-900/30"
        aria-label={t('map.zoomOut')}
        title={t('map.zoomOut')}
      >
        <svg 
          className="w-4 h-4 text-gray-700 dark:text-gray-300 group-hover/btn:text-blue-600 dark:group-hover/btn:text-blue-400 transition-colors" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
        </svg>
      </button>

      {/* 重置按钮 */}
      <button
        onClick={handleReset}
        className="group/btn w-8 h-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl 
                   border border-gray-200 dark:border-gray-700 
                   flex items-center justify-center
                   transition-all duration-200 ease-in-out
                   hover:scale-110 active:scale-95
                   hover:bg-blue-50 dark:hover:bg-blue-900/30"
        aria-label={t('map.reset')}
        title={t('map.reset')}
      >
        <svg 
          className="w-4 h-4 text-gray-700 dark:text-gray-300 group-hover/btn:text-blue-600 dark:group-hover/btn:text-blue-400 transition-colors" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  );
};

export const MapCard: React.FC<MapCardProps> = ({ lat, lng }) => {
  const DEFAULT_ZOOM = 13;
  
  return (
    <div className="my-4 border rounded-lg overflow-hidden shadow-sm relative group bg-white dark:bg-gray-800 dark:border-gray-700" style={{ height: '300px', width: '100%', maxWidth: '600px' }}>
       <MapContainer 
         center={[lat, lng]} 
         zoom={DEFAULT_ZOOM} 
         scrollWheelZoom={true} 
         attributionControl={false}
         zoomControl={false}
         style={{ height: '100%', width: '100%' }}
       >
        <TileLayer
          url="https://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
        />
        <Marker position={[lat, lng]}>
          <Popup>
            {lat}, {lng}
          </Popup>
        </Marker>
        <CustomZoomControl center={[lat, lng]} zoom={DEFAULT_ZOOM} />
      </MapContainer>
    </div>
  );
};
