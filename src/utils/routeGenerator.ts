export interface RouteGenerationParams {
  count: number;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  minDistanceKm: number;
  maxDistanceKm: number;
}

export interface GeneratedRoute {
  name: string;
  description: string;
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  distance: number;
  estimated_time: number;
  difficulty_level: 'easy' | 'medium' | 'hard';
  tags: string[];
  is_public: boolean;
}

// Route name templates
const ROUTE_PREFIXES = [
  'Urban Sprint', 'City Circuit', 'Downtown Dash', 'Metro Loop', 'Central Run',
  'Riverside Route', 'Parkland Path', 'Scenic Circuit', 'Harbor Loop', 'Bridge Run',
  'Hill Climb', 'Valley Sprint', 'Mountain Circuit', 'Coastal Path', 'Forest Loop'
];

const ROUTE_SUFFIXES = [
  'Challenge', 'Circuit', 'Express', 'Classic', 'Adventure',
  'Tour', 'Trail', 'Path', 'Route', 'Loop'
];

// Generate a random point within a circular area
function generateRandomPoint(centerLat: number, centerLng: number, radiusKm: number) {
  // Convert radius to degrees (approximate)
  const radiusDegrees = radiusKm / 111; // 1 degree ≈ 111km
  
  // Generate random angle and distance
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusDegrees;
  
  // Calculate new coordinates
  const lat = centerLat + distance * Math.cos(angle);
  const lng = centerLng + distance * Math.sin(angle);
  
  return { lat, lng };
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Generate route name
function generateRouteName(): string {
  const prefix = ROUTE_PREFIXES[Math.floor(Math.random() * ROUTE_PREFIXES.length)];
  const suffix = ROUTE_SUFFIXES[Math.floor(Math.random() * ROUTE_SUFFIXES.length)];
  const number = Math.floor(Math.random() * 99) + 1;
  return `${prefix} ${suffix} ${number}`;
}

// Generate route description
function generateRouteDescription(distance: number, difficulty: string): string {
  const descriptions = [
    `A ${difficulty} ${distance.toFixed(1)}km route perfect for testing your speed and endurance.`,
    `Experience this ${distance.toFixed(1)}km ${difficulty} circuit designed for competitive racing.`,
    `Challenge yourself on this ${distance.toFixed(1)}km ${difficulty} route with varied terrain.`,
    `A carefully crafted ${distance.toFixed(1)}km ${difficulty} path for serious racers.`,
    `Navigate this ${distance.toFixed(1)}km ${difficulty} course featuring dynamic challenges.`
  ];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

// Determine difficulty based on distance and terrain
function determineDifficulty(distance: number): 'easy' | 'medium' | 'hard' {
  if (distance < 3) return 'easy';
  if (distance < 7) return 'medium';
  return 'hard';
}

// Generate tags for route
function generateTags(difficulty: string, distance: number): string[] {
  const baseTags = ['auto-generated'];
  
  if (difficulty === 'easy') baseTags.push('beginner-friendly');
  if (difficulty === 'hard') baseTags.push('challenging');
  
  if (distance < 2) baseTags.push('sprint');
  else if (distance > 8) baseTags.push('endurance');
  
  const additionalTags = ['urban', 'scenic', 'training', 'competitive'];
  const randomTag = additionalTags[Math.floor(Math.random() * additionalTags.length)];
  baseTags.push(randomTag);
  
  return baseTags;
}

// Main route generation function
export function generateRoutes(params: RouteGenerationParams): GeneratedRoute[] {
  const routes: GeneratedRoute[] = [];
  
  for (let i = 0; i < params.count; i++) {
    let attempts = 0;
    let validRoute = false;
    
    while (!validRoute && attempts < 20) {
      // Generate start point
      const startPoint = generateRandomPoint(
        params.centerLat, 
        params.centerLng, 
        params.radiusKm
      );
      
      // Generate end point with desired distance
      let endPoint;
      let distance;
      let endAttempts = 0;
      
      do {
        endPoint = generateRandomPoint(
          params.centerLat, 
          params.centerLng, 
          params.radiusKm
        );
        distance = calculateDistance(
          startPoint.lat, startPoint.lng,
          endPoint.lat, endPoint.lng
        );
        endAttempts++;
      } while (
        (distance < params.minDistanceKm || distance > params.maxDistanceKm) && 
        endAttempts < 50
      );
      
      if (distance >= params.minDistanceKm && distance <= params.maxDistanceKm) {
        const difficulty = determineDifficulty(distance);
        const estimatedTime = Math.round(distance * 300 + Math.random() * 600); // 5-15 min per km variation
        
        routes.push({
          name: generateRouteName(),
          description: generateRouteDescription(distance, difficulty),
          start_lat: startPoint.lat,
          start_lng: startPoint.lng,
          end_lat: endPoint.lat,
          end_lng: endPoint.lng,
          distance: Math.round(distance * 100) / 100, // Round to 2 decimals
          estimated_time: estimatedTime,
          difficulty_level: difficulty,
          tags: generateTags(difficulty, distance),
          is_public: true
        });
        validRoute = true;
      }
      attempts++;
    }
  }
  
  return routes;
}

// Preset city centers for common locations
export const CITY_PRESETS = {
  'New York': { lat: 40.7128, lng: -74.0060 },
  'Los Angeles': { lat: 34.0522, lng: -118.2437 },
  'Chicago': { lat: 41.8781, lng: -87.6298 },
  'London': { lat: 51.5074, lng: -0.1278 },
  'Paris': { lat: 48.8566, lng: 2.3522 },
  'Tokyo': { lat: 35.6762, lng: 139.6503 },
  'Sydney': { lat: -33.8688, lng: 151.2093 }
};