import { MapPin, Navigation, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { getCityInfo, type City } from "@shared/cities";

interface Zone {
  id?: number;
  name: string;
  lat: number;
  lng: number;
  color: string;
}

interface IndiaMapProps {
  cityKey: string;
  pickupZone?: string;
  dropZone?: string;
  showRoute?: boolean;
}

export function IndiaMap({ cityKey, pickupZone, dropZone, showRoute = false }: IndiaMapProps) {
  const cityData = getCityInfo(cityKey);
  const zones: Zone[] = cityData.zones;
  
  // Real-time demand simulation (in real app, this would come from API)
  const [zoneDemand, setZoneDemand] = useState<Record<string, number>>({});
  
  useEffect(() => {
    // Initialize demand for each zone
    const initialDemand: Record<string, number> = {};
    zones.forEach(zone => {
      initialDemand[zone.name] = Math.random() * 100;
    });
    setZoneDemand(initialDemand);
    
    // Simulate real-time demand updates every 3 seconds
    const interval = setInterval(() => {
      setZoneDemand(prev => {
        const updated: Record<string, number> = {};
        zones.forEach(zone => {
          // Random walk for realistic demand changes
          const current = prev[zone.name] || 50;
          const change = (Math.random() - 0.5) * 20;
          updated[zone.name] = Math.max(20, Math.min(100, current + change));
        });
        return updated;
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, [zones]);
  
  // Normalize coordinates to screen position
  const coordToPixel = (lat: number, lng: number, city: City) => {
    const allLats = [city.center.lat, ...zones.map(z => z.lat)];
    const allLngs = [city.center.lng, ...zones.map(z => z.lng)];
    
    const minLat = Math.min(...allLats) - 0.1;
    const maxLat = Math.max(...allLats) + 0.1;
    const minLng = Math.min(...allLngs) - 0.1;
    const maxLng = Math.max(...allLngs) + 0.1;
    
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    
    return { x: `${Math.max(5, Math.min(95, x))}%`, y: `${Math.max(5, Math.min(95, y))}%` };
  };

  const findZone = (zoneName?: string) => {
    if (!zoneName) return null;
    return zones.find(z => 
      z.name.toLowerCase().includes(zoneName.toLowerCase()) ||
      zoneName.toLowerCase().includes(z.name.toLowerCase())
    );
  };

  const pickup = findZone(pickupZone);
  const drop = findZone(dropZone);

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-lg overflow-hidden border border-white/10">
      {/* Map Background with Grid */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <svg className="w-full h-full opacity-20">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* City Label */}
      <div className="absolute top-4 left-4 z-20">
        <div className="bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg border border-emerald-400/30">
          <p className="text-xs text-emerald-400 font-semibold flex items-center gap-2">
            <Navigation className="w-3 h-3" />
            <span>{cityData.emoji}</span>
            {cityData.displayName}
          </p>
        </div>
      </div>

      {/* Zone Markers */}
      {zones.map((zone, index) => {
        const pos = coordToPixel(zone.lat, zone.lng, cityData);
        const isPickup = pickup?.name === zone.name;
        const isDrop = drop?.name === zone.name;
        const isActive = isPickup || isDrop;
        const demand = zoneDemand[zone.name] || 50;
        const demandLevel = Math.round(demand / 25); // 0-4 levels

        return (
          <motion.div
            key={zone.id}
            className="absolute z-10"
            style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            {/* Demand Heatmap Ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ 
                width: 40, 
                height: 40,
                backgroundColor: `rgba(16, 185, 129, ${demand / 150})`,
                left: '-20px',
                top: '-20px'
              }}
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* Pulsing Ring for Active Zones */}
            {isActive && (
              <motion.div
                className="absolute inset-0 rounded-full border-2"
                style={{ borderColor: zone.color, width: 50, height: 50, left: '-25px', top: '-25px' }}
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.8, 0, 0.8],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}

            {/* Zone Marker */}
            <div 
              className={`relative w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer hover:scale-110`}
              style={{ 
                backgroundColor: zone.color,
                boxShadow: `0 0 ${15 + demand * 0.2}px ${zone.color}80`
              }}
            >
              {demandLevel >= 3 && (
                <Zap className="w-5 h-5 text-white absolute animate-pulse" />
              )}
              {demandLevel < 3 && (
                <MapPin className="w-5 h-5 text-white" />
              )}
            </div>

            {/* Zone Label with Demand Info */}
            <div className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap ${
              isActive ? 'block' : 'hidden group-hover:block'
            }`}>
              <div className="bg-black/80 backdrop-blur-sm px-2 py-1 rounded border border-white/20">
                <p className="text-xs text-white font-medium">{zone.name}</p>
                <p className="text-[10px] text-emerald-400">Demand: {Math.round(demand)}%</p>
                {isPickup && <p className="text-[10px] text-emerald-400">📍 Pickup</p>}
                {isDrop && <p className="text-[10px] text-blue-400">📍 Drop-off</p>}
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Route Line */}
      {showRoute && pickup && drop && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-5">
          <motion.line
            x1={coordToPixel(pickup.lat, pickup.lng, cityData).x}
            y1={coordToPixel(pickup.lat, pickup.lng, cityData).y}
            x2={coordToPixel(drop.lat, drop.lng, cityData).x}
            y2={coordToPixel(drop.lat, drop.lng, cityData).y}
            stroke="url(#routeGradient)"
            strokeWidth="3"
            strokeDasharray="10,5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={pickup.color} />
              <stop offset="100%" stopColor={drop.color} />
            </linearGradient>
          </defs>
        </svg>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-20">
        <div className="bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10 space-y-1">
          <p className="text-[10px] text-white/60 uppercase tracking-wider mb-1">Active Zones</p>
          {zones.slice(0, 5).map(zone => (
            <div key={zone.name} className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: zone.color }}
              />
              <p className="text-[10px] text-white/80">{zone.name.split(' ')[0]}</p>
            </div>
          ))}
          {zones.length > 5 && (
            <p className="text-[9px] text-white/50 italic">+{zones.length - 5} more...</p>
          )}
        </div>
      </div>
    </div>
  );
}
