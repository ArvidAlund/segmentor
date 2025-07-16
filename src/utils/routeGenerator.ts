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
  waypoints?: any[];
}

export interface RoadRouteResult {
  distance: number;
  duration: number;
  waypoints: google.maps.LatLngLiteral[];
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

// Snap point to nearest road using Google Maps
async function snapToRoad(point: google.maps.LatLngLiteral): Promise<google.maps.LatLngLiteral> {
  return new Promise((resolve) => {
    const directionsService = new google.maps.DirectionsService();
    
    // Create a very short route to snap the point to a road
    const nearbyPoint = {
      lat: point.lat + 0.001,
      lng: point.lng + 0.001
    };
    
    directionsService.route({
      origin: point,
      destination: nearbyPoint,
      travelMode: google.maps.TravelMode.DRIVING,
      avoidHighways: false,
      avoidTolls: false
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        const route = result.routes[0];
        const snappedPoint = route.legs[0].start_location;
        resolve({
          lat: snappedPoint.lat(),
          lng: snappedPoint.lng()
        });
      } else {
        // If snapping fails, return original point
        resolve(point);
      }
    });
  });
}

// Get actual road route between two points
async function getRoadRoute(start: google.maps.LatLngLiteral, end: google.maps.LatLngLiteral): Promise<RoadRouteResult | null> {
  return new Promise((resolve) => {
    const directionsService = new google.maps.DirectionsService();
    
    directionsService.route({
      origin: start,
      destination: end,
      travelMode: google.maps.TravelMode.DRIVING,
      avoidHighways: Math.random() > 0.7, // Sometimes avoid highways for variety
      avoidTolls: Math.random() > 0.8, // Sometimes avoid tolls
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        const route = result.routes[0];
        const leg = route.legs[0];
        
        // Extract waypoints from the route
        const waypoints: google.maps.LatLngLiteral[] = [];
        route.overview_path.forEach(point => {
          waypoints.push({
            lat: point.lat(),
            lng: point.lng()
          });
        });
        
        resolve({
          distance: leg.distance?.value ? leg.distance.value / 1000 : 0, // Convert to km
          duration: leg.duration?.value || 0, // In seconds
          waypoints: waypoints
        });
      } else {
        console.warn('Failed to get road route:', status);
        resolve(null);
      }
    });
  });
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
    `A ${difficulty} ${distance.toFixed(1)}km route perfect for testing your speed and endurance on real roads.`,
    `Experience this ${distance.toFixed(1)}km ${difficulty} circuit designed for competitive road racing.`,
    `Challenge yourself on this ${distance.toFixed(1)}km ${difficulty} route following actual street paths.`,
    `A carefully crafted ${distance.toFixed(1)}km ${difficulty} road course for serious racers.`,
    `Navigate this ${distance.toFixed(1)}km ${difficulty} route featuring real-world driving challenges.`
  ];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

// Determine difficulty based on distance
function determineDifficulty(distance: number): 'easy' | 'medium' | 'hard' {
  if (distance < 3) return 'easy';
  if (distance < 7) return 'medium';
  return 'hard';
}

// Generate tags for route
function generateTags(difficulty: string, distance: number): string[] {
  const baseTags = ['auto-generated', 'road-route'];
  
  if (difficulty === 'easy') baseTags.push('beginner-friendly');
  if (difficulty === 'hard') baseTags.push('challenging');
  
  if (distance < 2) baseTags.push('sprint');
  else if (distance > 8) baseTags.push('endurance');
  
  const additionalTags = ['urban', 'scenic', 'training', 'competitive'];
  const randomTag = additionalTags[Math.floor(Math.random() * additionalTags.length)];
  baseTags.push(randomTag);
  
  return baseTags;
}

// Main route generation function with road following
export async function generateRoutes(params: RouteGenerationParams): Promise<GeneratedRoute[]> {
  const routes: GeneratedRoute[] = [];
  
  for (let i = 0; i < params.count; i++) {
    let attempts = 0;
    let validRoute = false;
    
    while (!validRoute && attempts < 10) {
      try {
        // Generate start point and snap to road
        const startPoint = generateRandomPoint(
          params.centerLat, 
          params.centerLng, 
          params.radiusKm
        );
        const snappedStart = await snapToRoad(startPoint);
        
        // Generate end point and snap to road
        let endPoint;
        let snappedEnd;
        let roadRoute: RoadRouteResult | null = null;
        let endAttempts = 0;
        
        do {
          endPoint = generateRandomPoint(
            params.centerLat, 
            params.centerLng, 
            params.radiusKm
          );
          snappedEnd = await snapToRoad(endPoint);
          roadRoute = await getRoadRoute(snappedStart, snappedEnd);
          endAttempts++;
        } while (
          (!roadRoute || 
           roadRoute.distance < params.minDistanceKm || 
           roadRoute.distance > params.maxDistanceKm) && 
          endAttempts < 8
        );
        
        if (roadRoute && roadRoute.distance >= params.minDistanceKm && roadRoute.distance <= params.maxDistanceKm) {
          const difficulty = determineDifficulty(roadRoute.distance);
          
          routes.push({
            name: generateRouteName(),
            description: generateRouteDescription(roadRoute.distance, difficulty),
            start_lat: snappedStart.lat,
            start_lng: snappedStart.lng,
            end_lat: snappedEnd.lat,
            end_lng: snappedEnd.lng,
            distance: Math.round(roadRoute.distance * 100) / 100,
            estimated_time: roadRoute.duration,
            difficulty_level: difficulty,
            tags: generateTags(difficulty, roadRoute.distance),
            is_public: true,
            waypoints: roadRoute.waypoints
          });
          validRoute = true;
        }
      } catch (error) {
        console.warn('Error generating route:', error);
      }
      attempts++;
    }
  }
  
  return routes;
}

// Preset city centers for quick selection
export const CITY_PRESETS = {
  'New York': { lat: 40.7128, lng: -74.0060 },
  'Los Angeles': { lat: 34.0522, lng: -118.2437 },
  'Chicago': { lat: 41.8781, lng: -87.6298 },
  'London': { lat: 51.5074, lng: -0.1278 },
  'Paris': { lat: 48.8566, lng: 2.3522 },
  'Tokyo': { lat: 35.6762, lng: 139.6503 },
  'Sydney': { lat: -33.8688, lng: 151.2093 }
};