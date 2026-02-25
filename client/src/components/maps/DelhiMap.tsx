import { MapPin, Navigation, Zap, Car } from "lucide-react";
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

interface Driver {
  id: number;
  lat: number;
  lng: number;
  isActive: boolean;
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
    
    // Simulate real-time demand updates every 8 seconds (reduced for performance)
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
    }, 8000);
    
    return () => clearInterval(interval);
  }, [zones]);
  
  // Simulated driver locations (real-time moving cars)
  const [drivers, setDrivers] = useState<Driver[]>([]);
  
  useEffect(() => {
    // Initialize drivers with random positions near zones (reduced to 5 for performance)
    const initialDrivers: Driver[] = Array.from({ length: 5 }, (_, i) => {
      const randomZone = zones[Math.floor(Math.random() * zones.length)];
      return {
        id: i,
        lat: randomZone.lat + (Math.random() - 0.5) * 0.05,
        lng: randomZone.lng + (Math.random() - 0.5) * 0.05,
        isActive: Math.random() > 0.3,
      };
    });
    setDrivers(initialDrivers);
    
    // Simulate driver movement every 6 seconds (reduced for performance)
    const driverInterval = setInterval(() => {
      setDrivers(prev => prev.map(driver => {
        // Move driver slightly in random direction
        const moveLat = (Math.random() - 0.5) * 0.02;
        const moveLng = (Math.random() - 0.5) * 0.02;
        return {
          ...driver,
          lat: driver.lat + moveLat,
          lng: driver.lng + moveLng,
          isActive: Math.random() > 0.2, // Occasionally change status
        };
      }));
    }, 6000);
    
    return () => clearInterval(driverInterval);
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
    <div className="relative w-full h-full bg-slate-900 dark:bg-slate-900 rounded-lg overflow-hidden border border-border/30">
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
            {/* Colorful Demand Heatmap Ring - Optimized for performance */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ 
                width: 40 + (demand * 0.3), 
                height: 40 + (demand * 0.3),
                backgroundColor: 
                  demand > 75 ? `rgba(239, 68, 68, ${demand / 120})` :    // Red for high demand
                  demand > 50 ? `rgba(245, 158, 11, ${demand / 120})` :   // Amber for medium
                  `rgba(16, 185, 129, ${demand / 120})`,                  // Green for low
                left: `-${20 + (demand * 0.15)}px`,
                top: `-${20 + (demand * 0.15)}px`,
                filter: 'blur(8px)',
                willChange: 'transform, opacity' // GPU acceleration
              }}
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.4, 0.6, 0.4]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                repeatType: "loop"
              }}
            />

            {/* Pulsing Ring for Active Zones - Optimized */}
            {isActive && (
              <motion.div
                className="absolute inset-0 rounded-full border-2"
                style={{ 
                  borderColor: zone.color, 
                  width: 55, 
                  height: 55, 
                  left: '-27.5px', 
                  top: '-27.5px',
                  boxShadow: `0 0 15px ${zone.color}60`,
                  willChange: 'transform, opacity'
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.8, 0, 0.8],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  repeatType: "loop"
                }}
              />
            )}

            {/* Interactive Zone Marker with Gradient */}
            <motion.div 
              className="relative w-12 h-12 rounded-full flex items-center justify-center shadow-2xl cursor-pointer group"
              style={{ 
                background: 
                  demand > 75 ? 'linear-gradient(135deg, #ef4444, #dc2626)' :  // Red gradient
                  demand > 50 ? 'linear-gradient(135deg, #f59e0b, #d97706)' :  // Amber gradient
                  'linear-gradient(135deg, #10b981, #059669)',                 // Green gradient
                boxShadow: `0 0 ${20 + demand * 0.3}px ${
                  demand > 75 ? '#ef444480' :
                  demand > 50 ? '#f59e0b80' :
                  '#10b98180'
                }`
              }}
              whileHover={{ scale: 1.2, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {/* Inner glow */}
              <div className="absolute inset-1 rounded-full bg-white/20 backdrop-blur-sm" />
              
              {/* Icon based on demand level */}
              {demandLevel >= 3 && (
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  <Zap className="w-6 h-6 text-white relative z-10 drop-shadow-lg" />
                </motion.div>
              )}
              {demandLevel < 3 && (
                <MapPin className="w-6 h-6 text-white relative z-10 drop-shadow-lg" />
              )}
              
              {/* Demand badge */}
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black/90 border-2 border-white/50 flex items-center justify-center text-[9px] font-bold text-white shadow-lg">
                {Math.round(demand)}
              </div>
            </motion.div>

            {/* Zone Label with Demand Info - Always visible for active zones */}
            <motion.div 
              className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: isActive ? 1 : 0.7, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: isActive ? 'block' : 'none' }}
            >
              <div className="bg-black/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/30 shadow-lg">
                <p className="text-xs text-white font-semibold">{zone.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[10px] text-emerald-400 font-medium">🔥 {Math.round(demand)}%</p>
                  {isPickup && <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded">PICKUP</span>}
                  {isDrop && <span className="text-[10px] bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded">DROP</span>}
                </div>
              </div>
            </motion.div>
          </motion.div>
        );
      })}

      {/* Driver Markers - Real-time locations */}
      {drivers.map((driver) => {
        const pos = coordToPixel(driver.lat, driver.lng, cityData);
        return (
          <motion.div
            key={driver.id}
            className="absolute z-20"
            style={{ 
              left: pos.x, 
              top: pos.y, 
              transform: 'translate(-50%, -50%)',
              willChange: 'transform' // GPU acceleration
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              left: pos.x,
              top: pos.y
            }}
            transition={{ 
              scale: { duration: 0.3 },
              left: { duration: 4, ease: "easeInOut" },
              top: { duration: 4, ease: "easeInOut" }
            }}
          >
            {/* Driver pulse ring - Optimized */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ 
                width: 26, 
                height: 26,
                backgroundColor: driver.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                left: '-13px',
                top: '-13px',
                willChange: 'transform, opacity'
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 0, 0.4]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Driver car icon */}
            <div 
              className={`w-6 h-6 rounded-full flex items-center justify-center shadow-lg ${
                driver.isActive 
                  ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' 
                  : 'bg-gradient-to-br from-gray-400 to-gray-600'
              }`}
            >
              <Car className="w-3.5 h-3.5 text-white" />
            </div>
            
            {/* Driver status badge */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <div className="bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] font-semibold">
                <span className={driver.isActive ? 'text-emerald-400' : 'text-gray-400'}>
                  {driver.isActive ? '🚗 Available' : '⏸️ Busy'}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Route Line with Animation */}
      {showRoute && pickup && drop && (
        <>
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-5">
            {/* Glowing background line */}
            <motion.line
              x1={coordToPixel(pickup.lat, pickup.lng, cityData).x}
              y1={coordToPixel(pickup.lat, pickup.lng, cityData).y}
              x2={coordToPixel(drop.lat, drop.lng, cityData).x}
              y2={coordToPixel(drop.lat, drop.lng, cityData).y}
              stroke="rgba(16, 185, 129, 0.3)"
              strokeWidth="8"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
            {/* Main route line */}
            <motion.line
              x1={coordToPixel(pickup.lat, pickup.lng, cityData).x}
              y1={coordToPixel(pickup.lat, pickup.lng, cityData).y}
              x2={coordToPixel(drop.lat, drop.lng, cityData).x}
              y2={coordToPixel(drop.lat, drop.lng, cityData).y}
              stroke="url(#routeGradient)"
              strokeWidth="4"
              strokeDasharray="10,5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            />
            {/* Animated dot along route - Optimized */}
            <motion.circle
              r="4"
              fill="#14b8a6"
              style={{ willChange: 'transform' }}
              initial={{ 
                cx: coordToPixel(pickup.lat, pickup.lng, cityData).x,
                cy: coordToPixel(pickup.lat, pickup.lng, cityData).y 
              }}
              animate={{ 
                cx: coordToPixel(drop.lat, drop.lng, cityData).x,
                cy: coordToPixel(drop.lat, drop.lng, cityData).y
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "linear",
                repeatType: "loop"
              }}
            />
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Distance Badge */}
          <motion.div
            className="absolute z-30"
            style={{
              left: `calc((${coordToPixel(pickup.lat, pickup.lng, cityData).x} + ${coordToPixel(drop.lat, drop.lng, cityData).x}) / 2)`,
              top: `calc((${coordToPixel(pickup.lat, pickup.lng, cityData).y} + ${coordToPixel(drop.lat, drop.lng, cityData).y}) / 2)`,
              transform: 'translate(-50%, -50%)'
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            <div className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border-2 border-white/20">
              🚗 Route Active
            </div>
          </motion.div>
        </>
      )}

      {/* Legend - Theme Aware & Responsive */}
      <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 z-20">
        <div className="bg-card/95 backdrop-blur-sm px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg border border-border shadow-lg transition-colors">
          <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5 sm:mb-1 font-semibold">Active Zones</p>
          {zones.slice(0, 5).map(zone => (
            <div key={zone.name} className="flex items-center gap-1.5 sm:gap-2">
              <div 
                className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full" 
                style={{ backgroundColor: zone.color }}
              />
              <p className="text-[9px] sm:text-[10px] text-foreground/80">{zone.name.split(' ')[0]}</p>
            </div>
          ))}
          {zones.length > 5 && (
            <p className="text-[8px] sm:text-[9px] text-muted-foreground italic">+{zones.length - 5} more...</p>
          )}
        </div>
      </div>
    </div>
  );
}
