import React, { useState, useCallback } from 'react';
import { GoogleMap, useLoadScript, Circle } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MapPin, Crosshair, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const libraries: ("places")[] = ["places"];

interface RouteGeneratorMapProps {
  center: { lat: number; lng: number };
  radius: number;
  onCenterChange: (center: { lat: number; lng: number }) => void;
  onRadiusChange: (radius: number) => void;
}

const RouteGeneratorMap: React.FC<RouteGeneratorMapProps> = ({
  center,
  radius,
  onCenterChange,
  onRadiusChange,
}) => {
  const [isPlacingPin, setIsPlacingPin] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [markerRef, setMarkerRef] = useState<google.maps.marker.AdvancedMarkerElement | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries,
  });

  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: true,
    fullscreenControl: false,
    mapId: "route-generator-map", // Required for AdvancedMarkerElement
  };

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMapRef(map);
    updateMarker(map);
  }, []);

  const updateMarker = useCallback((map: google.maps.Map) => {
    if (!map || !window.google?.maps?.marker?.AdvancedMarkerElement) return;

    // Remove existing marker
    if (markerRef) {
      markerRef.map = null;
    }

    // Create new advanced marker
    const newMarker = new google.maps.marker.AdvancedMarkerElement({
      map,
      position: center,
      title: "Route Generation Center",
    });

    setMarkerRef(newMarker);
  }, [center, markerRef]);

  React.useEffect(() => {
    if (mapRef && isLoaded) {
      updateMarker(mapRef);
    }
  }, [center, mapRef, isLoaded, updateMarker]);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (isPlacingPin && e.latLng) {
      const newCenter = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };
      onCenterChange(newCenter);
      setIsPlacingPin(false);
    }
  }, [isPlacingPin, onCenterChange]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          onCenterChange(newCenter);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  if (!apiKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Generation Area - Setup Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              A Google Maps API key is required to use the map interface. Please enter your API key below to continue.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Label htmlFor="api-key">Google Maps API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your Google Maps API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Get your API key from the{' '}
              <a 
                href="https://console.cloud.google.com/google/maps-apis/overview" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google Cloud Console
              </a>
              . Make sure to enable the Maps JavaScript API and Directions API.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Error loading map. Please check your internet connection.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4"></div>
            <p>Loading map...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Generation Area
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={() => setIsPlacingPin(!isPlacingPin)}
            variant={isPlacingPin ? "default" : "outline"}
            size="sm"
            className="flex-1"
          >
            <Crosshair className="w-4 h-4 mr-2" />
            {isPlacingPin ? 'Click on map' : 'Place Pin'}
          </Button>
          <Button
            onClick={getUserLocation}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Use My Location
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Search Radius: {radius}km</Label>
          <Slider
            value={[radius]}
            onValueChange={(value) => onRadiusChange(value[0])}
            max={50}
            min={1}
            step={1}
            className="w-full"
          />
        </div>

        <div className="h-64 w-full rounded-lg overflow-hidden border">
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={center}
            zoom={12}
            options={mapOptions}
            onClick={onMapClick}
            onLoad={onMapLoad}
          >
            {/* Radius circle */}
            <Circle
              center={center}
              radius={radius * 1000} // Convert km to meters
              options={{
                fillColor: '#3b82f6',
                fillOpacity: 0.1,
                strokeColor: '#3b82f6',
                strokeOpacity: 0.8,
                strokeWeight: 2,
              }}
            />
          </GoogleMap>
        </div>

        <div className="text-sm text-muted-foreground">
          {isPlacingPin ? (
            <p className="text-primary">Click anywhere on the map to set the generation center.</p>
          ) : (
            <p>Routes will be generated within the highlighted area. Use the controls above to adjust the center and radius.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RouteGeneratorMap;