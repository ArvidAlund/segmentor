import React, { useState, useCallback } from 'react';
import { GoogleMap, useLoadScript, Marker, Circle } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { MapPin, Crosshair } from 'lucide-react';

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

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "AIzaSyBjCLjNYpUGPJUqF0j4_Q1kN8fmzBpXRtk", // You'll need to replace with your API key
    libraries,
  });

  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: true,
    fullscreenControl: false,
  };

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
          >
            {/* Center pin */}
            <Marker
              position={center}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#ef4444" stroke="#fff" stroke-width="2"/>
                    <circle cx="12" cy="10" r="3" fill="#fff"/>
                  </svg>
                `),
                scaledSize: new google.maps.Size(32, 32),
                anchor: new google.maps.Point(16, 32),
              }}
            />

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