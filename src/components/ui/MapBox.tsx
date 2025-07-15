import {
    GoogleMap,
    useLoadScript,
    OverlayView,
    Polyline,
  } from "@react-google-maps/api";
  import { useEffect, useState, useCallback } from "react";

  
  const TargetIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#38b9fa"   // Keep this for CSS stroke color inherit
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
  
  const FlagIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#2bee2b"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
  
  const libraries = ["places"] as const;
  const mapContainerStyle = { width: "100%", height: "500px" };
  const center = { lat: 59.3293, lng: 18.0686 };
  
  export default function MapBox() {
    const { isLoaded, loadError } = useLoadScript({
      googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
      libraries,
    });
  
    const [userPosition, setUserPosition] = useState<google.maps.LatLngLiteral | null>(null);
    const [start, setStart] = useState<google.maps.LatLngLiteral | null>(null);
    const [finish, setFinish] = useState<google.maps.LatLngLiteral | null>(null);
    const [routePath, setRoutePath] = useState<google.maps.LatLngLiteral[]>([]);
  
    useEffect(() => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          (err) => console.error("Geolocation error:", err),
          { enableHighAccuracy: true }
        );
      }
    }, []);
  
    // Function to snap a point to nearest road using DirectionsService with origin==destination
    const snapToRoad = (point: google.maps.LatLngLiteral): Promise<google.maps.LatLngLiteral> => {
      return new Promise((resolve, reject) => {
        const directionsService = new window.google.maps.DirectionsService();
  
        directionsService.route(
          {
            origin: point,
            destination: point,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK && result.routes.length > 0) {
              // The snapped location is the start_location of the first leg
              const snappedLocation = result.routes[0].legs[0].start_location;
              resolve({ lat: snappedLocation.lat(), lng: snappedLocation.lng() });
            } else {
              console.warn("Snap to road failed:", status);
              // Fallback to original point
              resolve(point);
            }
          }
        );
      });
    };
  
    // Fetch route when both start and finish exist
    useEffect(() => {
      if (!start || !finish) {
        setRoutePath([]);
        return;
      }
  
      const directionsService = new window.google.maps.DirectionsService();
  
      directionsService.route(
        {
          origin: start,
          destination: finish,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK && result.routes.length > 0) {
            const path = result.routes[0].overview_path.map((latLng) => ({
              lat: latLng.lat(),
              lng: latLng.lng(),
            }));
            setRoutePath(path);
          } else {
            console.error("Directions request failed due to " + status);
            setRoutePath([]);
          }
        }
      );
    }, [start, finish]);
  
    const onMapClick = useCallback(
      async (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
  
        if (!start) {
          const snapped = await snapToRoad(coords);
          setStart(snapped);
        } else if (!finish) {
          const snapped = await snapToRoad(coords);
          setFinish(snapped);
        } else {
          const snapped = await snapToRoad(coords);
          setStart(snapped);
          setFinish(null);
          setRoutePath([]);
        }
      },
      [start, finish]
    );
  
    if (loadError) return <div>❌ Error loading map</div>;
    if (!isLoaded) return <div>🛰️ Loading map...</div>;
  
    return (
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={14}
        center={userPosition ?? center}
        onClick={onMapClick}
        options={{
            streetViewControl: false, // ✅ Pegman removed
            mapTypeControl: true,
          }}
      >
        {/* User Position */}
        {userPosition && (
          <OverlayView position={userPosition} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
            <div className="relative w-8 h-8">
              <div className="absolute w-full h-full rounded-full bg-[#38b9fa] opacity-70 animate-pulse" />
              <div className="absolute w-3 h-3 top-2.5 left-2.5 rounded-full bg-[#38b9fa] shadow-md border-2 border-white" />
            </div>
          </OverlayView>
        )}
  
        {/* Start marker */}
        {start && (
        <OverlayView position={start} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
            <div className="w-6 h-6">
            <TargetIcon />
            </div>
        </OverlayView>
        )}

        {/* Finish marker */}
        {finish && (
        <OverlayView position={finish} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
            <div className="w-6 h-6">
            <FlagIcon />
            </div>
        </OverlayView>
        )}

  
        {/* Polyline with route */}
        {routePath.length > 0 && (
          <Polyline
            path={routePath}
            options={{
              strokeColor: "#38b9fa",
              strokeOpacity: 0.8,
              strokeWeight: 4,
            }}
          />
        )}
      </GoogleMap>
    );
  }
  