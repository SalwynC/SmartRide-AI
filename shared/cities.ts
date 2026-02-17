// Comprehensive Indian Cities and Zones Data for SmartRide.ai

export interface CityZone {
  name: string;
  lat: number;
  lng: number;
  color: string;
}

export interface City {
  name: string;
  displayName: string;
  center: { lat: number; lng: number };
  zones: CityZone[];
  baseFare: number;
  ratePerKm: number;
  emoji: string;
}

export const INDIAN_CITIES: Record<string, City> = {
  "delhi": {
    name: "delhi",
    displayName: "Delhi NCR",
    emoji: "🏛️",
    center: { lat: 28.6139, lng: 77.2090 },
    baseFare: 30,
    ratePerKm: 10,
    zones: [
      { name: "Connaught Place", lat: 28.6315, lng: 77.2167, color: "#10b981" },
      { name: "IGI Airport", lat: 28.5562, lng: 77.1000, color: "#3b82f6" },
      { name: "Cyber City (Gurugram)", lat: 28.4950, lng: 77.0890, color: "#8b5cf6" },
      { name: "Hauz Khas", lat: 28.5494, lng: 77.1960, color: "#f59e0b" },
      { name: "Noida Sector 18", lat: 28.5700, lng: 77.3200, color: "#ec4899" },
      { name: "Dwarka", lat: 28.5921, lng: 77.0460, color: "#14b8a6" },
      { name: "Saket", lat: 28.5244, lng: 77.2066, color: "#f97316" },
    ],
  },
  "mumbai": {
    name: "mumbai",
    displayName: "Mumbai",
    emoji: "🌊",
    center: { lat: 19.0760, lng: 72.8777 },
    baseFare: 35,
    ratePerKm: 12,
    zones: [
      { name: "Bandra West", lat: 19.0596, lng: 72.8295, color: "#10b981" },
      { name: "Andheri East", lat: 19.1136, lng: 72.8697, color: "#3b82f6" },
      { name: "BKC (Bandra Kurla Complex)", lat: 19.0654, lng: 72.8692, color: "#8b5cf6" },
      { name: "Colaba", lat: 18.9067, lng: 72.8147, color: "#f59e0b" },
      { name: "Powai", lat: 19.1176, lng: 72.9060, color: "#ec4899" },
      { name: "Chhatrapati Shivaji Airport", lat: 19.0896, lng: 72.8656, color: "#14b8a6" },
      { name: "Navi Mumbai", lat: 19.0330, lng: 73.0297, color: "#f97316" },
    ],
  },
  "bangalore": {
    name: "bangalore",
    displayName: "Bangalore",
    emoji: "🌳",
    center: { lat: 12.9716, lng: 77.5946 },
    baseFare: 28,
    ratePerKm: 9,
    zones: [
      { name: "Koramangala", lat: 12.9352, lng: 77.6245, color: "#10b981" },
      { name: "Whitefield", lat: 12.9698, lng: 77.7499, color: "#3b82f6" },
      { name: "Electronic City", lat: 12.8456, lng: 77.6603, color: "#8b5cf6" },
      { name: "Indiranagar", lat: 12.9719, lng: 77.6412, color: "#f59e0b" },
      { name: "MG Road", lat: 12.9716, lng: 77.5946, color: "#ec4899" },
      { name: "Kempegowda Airport", lat: 13.1986, lng: 77.7066, color: "#14b8a6" },
      { name: "HSR Layout", lat: 12.9121, lng: 77.6446, color: "#f97316" },
    ],
  },
  "hyderabad": {
    name: "hyderabad",
    displayName: "Hyderabad",
    emoji: "🏰",
    center: { lat: 17.3850, lng: 78.4867 },
    baseFare: 25,
    ratePerKm: 8,
    zones: [
      { name: "HITEC City", lat: 17.4435, lng: 78.3772, color: "#10b981" },
      { name: "Gachibowli", lat: 17.4399, lng: 78.3489, color: "#3b82f6" },
      { name: "Banjara Hills", lat: 17.4239, lng: 78.4499, color: "#8b5cf6" },
      { name: "Jubilee Hills", lat: 17.4312, lng: 78.4098, color: "#f59e0b" },
      { name: "Shamshabad Airport", lat: 17.2403, lng: 78.4294, color: "#ec4899" },
      { name: "Secunderabad", lat: 17.4399, lng: 78.4983, color: "#14b8a6" },
      { name: "Kondapur", lat: 17.4685, lng: 78.3621, color: "#f97316" },
    ],
  },
  "chennai": {
    name: "chennai",
    displayName: "Chennai",
    emoji: "🏖️",
    center: { lat: 13.0827, lng: 80.2707 },
    baseFare: 26,
    ratePerKm: 8,
    zones: [
      { name: "T Nagar", lat: 13.0418, lng: 80.2341, color: "#10b981" },
      { name: "Anna Nagar", lat: 13.0850, lng: 80.2101, color: "#3b82f6" },
      { name: "OMR (IT Corridor)", lat: 12.9249, lng: 80.2277, color: "#8b5cf6" },
      { name: "Adyar", lat: 13.0067, lng: 80.2570, color: "#f59e0b" },
      { name: "Chennai Airport", lat: 12.9941, lng: 80.1709, color: "#ec4899" },
      { name: "Velachery", lat: 12.9750, lng: 80.2210, color: "#14b8a6" },
      { name: "Porur", lat: 13.0358, lng: 80.1561, color: "#f97316" },
    ],
  },
  "pune": {
    name: "pune",
    displayName: "Pune",
    emoji: "🎓",
    center: { lat: 18.5204, lng: 73.8567 },
    baseFare: 24,
    ratePerKm: 7,
    zones: [
      { name: "Hinjewadi", lat: 18.5912, lng: 73.7389, color: "#10b981" },
      { name: "Koregaon Park", lat: 18.5362, lng: 73.8958, color: "#3b82f6" },
      { name: "Kharadi", lat: 18.5515, lng: 73.9373, color: "#8b5cf6" },
      { name: "Viman Nagar", lat: 18.5679, lng: 73.9143, color: "#f59e0b" },
      { name: "Baner", lat: 18.5590, lng: 73.7873, color: "#ec4899" },
      { name: "Pune Airport", lat: 18.5822, lng: 73.9197, color: "#14b8a6" },
      { name: "Magarpatta", lat: 18.5158, lng: 73.9288, color: "#f97316" },
    ],
  },
  "kolkata": {
    name: "kolkata",
    displayName: "Kolkata",
    emoji: "🎭",
    center: { lat: 22.5726, lng: 88.3639 },
    baseFare: 22,
    ratePerKm: 7,
    zones: [
      { name: "Park Street", lat: 22.5535, lng: 88.3525, color: "#10b981" },
      { name: "Salt Lake", lat: 22.5804, lng: 88.4148, color: "#3b82f6" },
      { name: "New Town", lat: 22.5854, lng: 88.4746, color: "#8b5cf6" },
      { name: "Howrah", lat: 22.5958, lng: 88.2636, color: "#f59e0b" },
      { name: "Netaji Airport", lat: 22.6520, lng: 88.4463, color: "#ec4899" },
      { name: "Ballygunge", lat: 22.5354, lng: 88.3640, color: "#14b8a6" },
      { name: "Rajarhat", lat: 22.6211, lng: 88.4564, color: "#f97316" },
    ],
  },
};

export const CITY_LIST = [
  { key: "delhi", name: "Delhi NCR", emoji: "🏛️" },
  { key: "mumbai", name: "Mumbai", emoji: "🌊" },
  { key: "bangalore", name: "Bangalore", emoji: "🌳" },
  { key: "hyderabad", name: "Hyderabad", emoji: "🏰" },
  { key: "chennai", name: "Chennai", emoji: "🏖️" },
  { key: "pune", name: "Pune", emoji: "🎓" },
  { key: "kolkata", name: "Kolkata", emoji: "🎭" },
];

export function getCityZones(cityKey: string): CityZone[] {
  return INDIAN_CITIES[cityKey]?.zones || INDIAN_CITIES.delhi.zones;
}

export function getCityInfo(cityKey: string): City {
  return INDIAN_CITIES[cityKey] || INDIAN_CITIES.delhi;
}
