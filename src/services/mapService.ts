import type { LocationData } from '@/lib/utils';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeocodingResult {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface PlacesPrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text?: string;
  };
  types: string[];
}

interface GoogleGeocodingResult {
  place_id?: string;
  formatted_address: string;
  address_components: GoogleAddressComponent[];
  types: string[];
}

interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface NominatimResult {
  place_id?: number;
  display_name?: string;
  name?: string;
  address?: Record<string, string>;
  lat?: string;
  lon?: string;
  osm_type?: string;
  osm_id?: number;
  licence?: string;
}

interface GooglePlacePrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
  types?: string[];
}

export abstract class MapService {
  abstract geocodeLocation(location: string): Promise<LatLng | null>;
  abstract reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null>;
  abstract getCurrentLocation(): Promise<LocationData>;
  abstract getPlacePredictions(input: string): Promise<PlacesPrediction[]>;
  abstract getPlaceDetails(placeId: string): Promise<GeocodingResult | null>;
}

class OpenStreetMapService extends MapService {
  async geocodeLocation(locationName: string): Promise<LatLng | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName + ', India')}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (error) {
      console.error('OSM Geocoding error:', error);
      return null;
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && !data.error) {
        const addressParts = data.address || {};
        
        return {
          lat,
          lng,
          address: data.display_name || '',
          city: addressParts.city || 
                addressParts.town || 
                addressParts.village || 
                addressParts.county || 
                addressParts.state_district || 
                '',
          state: addressParts.state || '',
          country: addressParts.country || 'India'
        };
      }
      return null;
    } catch (error) {
      console.error('OSM Reverse geocoding error:', error);
      return null;
    }
  }

  async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const result = await this.reverseGeocode(latitude, longitude);
            
            if (result) {
              resolve({
                address: result.address || '',
                city: result.city || '',
                state: result.state || '',
                country: result.country || 'India',
                lat: latitude,
                lng: longitude
              });
            } else {
              // Fallback if reverse geocoding fails
              resolve({
                address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                city: '',
                state: '',
                country: 'India',
                lat: latitude,
                lng: longitude
              });
            }
          } catch (error) {
            reject(error);
          }
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  async getPlacePredictions(input: string): Promise<PlacesPrediction[]> {
    try {
      if (input.length < 4) return [];
      
      // First try enhanced Indian cities database for fast local matching
      const localMatches = this.getIndianCitySuggestions(input);
      if (localMatches.length > 0) {
        return localMatches;
      }
      
      // Fallback to OpenStreetMap search for broader coverage
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input + ', India')}&limit=5&addressdetails=1`
      );
      const data = await response.json();
      
      // Convert OSM results to PlacesPrediction format
      return data.map((item: NominatimResult, index: number) => ({
        place_id: item.place_id?.toString() || index.toString(),
        description: item.display_name || '',
        structured_formatting: {
          main_text: item.name || item.display_name?.split(',')[0] || '',
          secondary_text: item.display_name?.split(',').slice(1).join(',').trim() || ''
        },
        types: ['establishment']
      }));
    } catch (error) {
      console.error('OSM Places search error:', error);
      // Fallback to local database
      return this.getIndianCitySuggestions(input);
    }
  }

  private getIndianCitySuggestions(input: string): PlacesPrediction[] {
    const query = input.toLowerCase();
    
    // Enhanced Indian cities database with states
    const indianCities = [
      { city: 'Mumbai', state: 'Maharashtra', aliases: ['bombay'] },
      { city: 'Delhi', state: 'Delhi', aliases: ['new delhi'] },
      { city: 'Bangalore', state: 'Karnataka', aliases: ['bengaluru'] },
      { city: 'Hyderabad', state: 'Telangana', aliases: ['hyderabad'] },
      { city: 'Chennai', state: 'Tamil Nadu', aliases: ['madras'] },
      { city: 'Kolkata', state: 'West Bengal', aliases: ['calcutta'] },
      { city: 'Pune', state: 'Maharashtra', aliases: ['poona'] },
      { city: 'Ahmedabad', state: 'Gujarat', aliases: ['amdavad'] },
      { city: 'Jaipur', state: 'Rajasthan', aliases: ['pink city'] },
      { city: 'Surat', state: 'Gujarat', aliases: [] },
      { city: 'Lucknow', state: 'Uttar Pradesh', aliases: [] },
      { city: 'Kanpur', state: 'Uttar Pradesh', aliases: [] },
      { city: 'Nagpur', state: 'Maharashtra', aliases: [] },
      { city: 'Indore', state: 'Madhya Pradesh', aliases: [] },
      { city: 'Thane', state: 'Maharashtra', aliases: [] },
      { city: 'Bhopal', state: 'Madhya Pradesh', aliases: [] },
      { city: 'Visakhapatnam', state: 'Andhra Pradesh', aliases: ['vizag'] },
      { city: 'Patna', state: 'Bihar', aliases: [] },
      { city: 'Vadodara', state: 'Gujarat', aliases: ['baroda'] },
      { city: 'Ghaziabad', state: 'Uttar Pradesh', aliases: [] },
      { city: 'Ludhiana', state: 'Punjab', aliases: [] },
      { city: 'Agra', state: 'Uttar Pradesh', aliases: [] },
      { city: 'Nashik', state: 'Maharashtra', aliases: [] },
      { city: 'Faridabad', state: 'Haryana', aliases: [] },
      { city: 'Meerut', state: 'Uttar Pradesh', aliases: [] },
      { city: 'Rajkot', state: 'Gujarat', aliases: [] },
      { city: 'Kalyan-Dombivali', state: 'Maharashtra', aliases: ['kalyan', 'dombivali'] },
      { city: 'Vasai-Virar', state: 'Maharashtra', aliases: ['vasai', 'virar'] },
      { city: 'Varanasi', state: 'Uttar Pradesh', aliases: ['benares', 'kashi'] },
      { city: 'Srinagar', state: 'Jammu and Kashmir', aliases: [] },
      { city: 'Aurangabad', state: 'Maharashtra', aliases: [] },
      { city: 'Dhanbad', state: 'Jharkhand', aliases: [] },
      { city: 'Amritsar', state: 'Punjab', aliases: [] },
      { city: 'Navi Mumbai', state: 'Maharashtra', aliases: ['new mumbai'] },
      { city: 'Allahabad', state: 'Uttar Pradesh', aliases: ['prayagraj'] },
      { city: 'Ranchi', state: 'Jharkhand', aliases: [] },
      { city: 'Howrah', state: 'West Bengal', aliases: [] },
      { city: 'Coimbatore', state: 'Tamil Nadu', aliases: [] },
      { city: 'Jabalpur', state: 'Madhya Pradesh', aliases: [] },
      { city: 'Gwalior', state: 'Madhya Pradesh', aliases: [] },
      { city: 'Vijayawada', state: 'Andhra Pradesh', aliases: [] },
      { city: 'Jodhpur', state: 'Rajasthan', aliases: [] },
      { city: 'Madurai', state: 'Tamil Nadu', aliases: [] },
      { city: 'Raipur', state: 'Chhattisgarh', aliases: [] },
      { city: 'Kota', state: 'Rajasthan', aliases: [] },
      { city: 'Chandigarh', state: 'Chandigarh', aliases: [] },
      { city: 'Gurgaon', state: 'Haryana', aliases: ['gurugram'] },
      { city: 'Hubli', state: 'Karnataka', aliases: ['hubballi'] },
      { city: 'Dharwad', state: 'Karnataka', aliases: [] },
      { city: 'Mysore', state: 'Karnataka', aliases: ['mysuru'] },
      { city: 'Mangalore', state: 'Karnataka', aliases: ['mangaluru'] },
      { city: 'Noida', state: 'Uttar Pradesh', aliases: [] },
      { city: 'Kochi', state: 'Kerala', aliases: ['cochin'] },
      { city: 'Thiruvananthapuram', state: 'Kerala', aliases: ['trivandrum'] },
      { city: 'Bhubaneswar', state: 'Odisha', aliases: [] },
      { city: 'Dehradun', state: 'Uttarakhand', aliases: [] }
    ];

    const matches = indianCities.filter(cityData => {
      const cityMatch = cityData.city.toLowerCase().includes(query);
      const aliasMatch = cityData.aliases.some(alias => alias.toLowerCase().includes(query));
      return cityMatch || aliasMatch;
    }).slice(0, 5);

    return matches.map((cityData, index) => ({
      place_id: `city_${index}`,
      description: `${cityData.city}, ${cityData.state}, India`,
      structured_formatting: {
        main_text: cityData.city,
        secondary_text: `${cityData.state}, India`
      },
      types: ['locality', 'political']
    }));
  }

  async getPlaceDetails(placeId: string): Promise<GeocodingResult | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/details?format=json&place_id=${placeId}&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.centroid) {
        const addressParts = data.address || {};
        return {
          lat: parseFloat(data.centroid.coordinates[1]),
          lng: parseFloat(data.centroid.coordinates[0]),
          address: data.display_name || '',
          city: addressParts.city || addressParts.town || addressParts.village || '',
          state: addressParts.state || '',
          country: addressParts.country || 'India'
        };
      }
      return null;
    } catch (error) {
      console.error('OSM Place details error:', error);
      return null;
    }
  }
}

class GoogleMapsService extends MapService {
  private geocodingApiKey: string;
  private placesApiKey: string;

  constructor(geocodingApiKey: string, placesApiKey: string) {
    super();
    this.geocodingApiKey = geocodingApiKey;
    this.placesApiKey = placesApiKey;
  }

  async geocodeLocation(locationName: string): Promise<LatLng | null> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationName)}&region=IN&key=${this.geocodingApiKey}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng
        };
      }
      
      if (data.status === 'ZERO_RESULTS') {
        console.warn('Google Geocoding: No results found for', locationName);
      } else if (data.status !== 'OK') {
        console.error('Google Geocoding error:', data.status, data.error_message);
      }
      
      return null;
    } catch (error) {
      console.error('Google Maps Geocoding error:', error);
      return null;
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.geocodingApiKey}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const addressComponents: GoogleAddressComponent[] = result.address_components;
        
        // Extract city (locality or administrative_area_level_2)
        const city = addressComponents.find((comp: GoogleAddressComponent) => 
          comp.types.includes('locality') || comp.types.includes('administrative_area_level_2')
        )?.long_name || '';
        
        // Extract state (administrative_area_level_1)
        const state = addressComponents.find((comp: GoogleAddressComponent) => 
          comp.types.includes('administrative_area_level_1')
        )?.long_name || '';
        
        // Extract country
        const country = addressComponents.find((comp: GoogleAddressComponent) => 
          comp.types.includes('country')
        )?.long_name || 'India';

        return {
          lat,
          lng,
          address: result.formatted_address,
          city,
          state,
          country
        };
      }
      
      if (data.status !== 'OK') {
        console.error('Google Reverse Geocoding error:', data.status, data.error_message);
      }
      
      return null;
    } catch (error) {
      console.error('Google Maps Reverse geocoding error:', error);
      return null;
    }
  }

  async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const result = await this.reverseGeocode(latitude, longitude);
            
            if (result) {
              resolve({
                address: result.address || '',
                city: result.city || '',
                state: result.state || '',
                country: result.country || 'India',
                lat: latitude,
                lng: longitude
              });
            } else {
              // Fallback if reverse geocoding fails
              resolve({
                address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                city: '',
                state: '',
                country: 'India',
                lat: latitude,
                lng: longitude
              });
            }
          } catch (error) {
            reject(error);
          }
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  async getPlacePredictions(input: string): Promise<PlacesPrediction[]> {
    try {
      if (input.length < 4) return [];
      
      // Use Geocoding API instead of Places API (browser-safe)
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(input)}&region=IN&key=${this.geocodingApiKey}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.results) {
        // Convert geocoding results to predictions format
        return data.results.slice(0, 5).map((result: GoogleGeocodingResult, index: number) => {
          const addressComponents: GoogleAddressComponent[] = result.address_components || [];
          
          // Extract city and state for structured formatting
          const city = addressComponents.find((comp: GoogleAddressComponent) => 
            comp.types.includes('locality') || comp.types.includes('administrative_area_level_2')
          )?.long_name || '';
          
          const state = addressComponents.find((comp: GoogleAddressComponent) => 
            comp.types.includes('administrative_area_level_1')
          )?.long_name || '';

          return {
            place_id: result.place_id || `geocode_${index}`,
            description: result.formatted_address,
            structured_formatting: {
              main_text: city || result.formatted_address.split(',')[0],
              secondary_text: state ? `${state}, India` : result.formatted_address.split(',').slice(1).join(',').trim()
            },
            types: result.types || ['geocode']
          };
        });
      }
      
      // Fallback to enhanced text search with multiple Indian cities
      return this.getIndianCitySuggestions(input);
    } catch (error) {
      console.error('Google Geocoding autocomplete error:', error);
      return this.getIndianCitySuggestions(input);
    }
  }

  private getIndianCitySuggestions(input: string): PlacesPrediction[] {
    const query = input.toLowerCase();
    
    // Enhanced Indian cities database with states
    const indianCities = [
      { city: 'Mumbai', state: 'Maharashtra', aliases: ['bombay'] },
      { city: 'Delhi', state: 'Delhi', aliases: ['new delhi'] },
      { city: 'Bangalore', state: 'Karnataka', aliases: ['bengaluru'] },
      { city: 'Hyderabad', state: 'Telangana', aliases: ['hyderabad'] },
      { city: 'Chennai', state: 'Tamil Nadu', aliases: ['madras'] },
      { city: 'Kolkata', state: 'West Bengal', aliases: ['calcutta'] },
      { city: 'Pune', state: 'Maharashtra', aliases: ['poona'] },
      { city: 'Ahmedabad', state: 'Gujarat', aliases: ['amdavad'] },
      { city: 'Jaipur', state: 'Rajasthan', aliases: ['pink city'] },
      { city: 'Surat', state: 'Gujarat', aliases: [] },
      { city: 'Lucknow', state: 'Uttar Pradesh', aliases: [] },
      { city: 'Kanpur', state: 'Uttar Pradesh', aliases: [] },
      { city: 'Nagpur', state: 'Maharashtra', aliases: [] },
      { city: 'Indore', state: 'Madhya Pradesh', aliases: [] },
      { city: 'Thane', state: 'Maharashtra', aliases: [] },
      { city: 'Bhopal', state: 'Madhya Pradesh', aliases: [] },
      { city: 'Visakhapatnam', state: 'Andhra Pradesh', aliases: ['vizag'] },
      { city: 'Patna', state: 'Bihar', aliases: [] },
      { city: 'Vadodara', state: 'Gujarat', aliases: ['baroda'] },
      { city: 'Ghaziabad', state: 'Uttar Pradesh', aliases: [] },
      { city: 'Ludhiana', state: 'Punjab', aliases: [] },
      { city: 'Agra', state: 'Uttar Pradesh', aliases: [] },
      { city: 'Nashik', state: 'Maharashtra', aliases: [] },
      { city: 'Faridabad', state: 'Haryana', aliases: [] },
      { city: 'Meerut', state: 'Uttar Pradesh', aliases: [] },
      { city: 'Rajkot', state: 'Gujarat', aliases: [] },
      { city: 'Kalyan-Dombivali', state: 'Maharashtra', aliases: ['kalyan', 'dombivali'] },
      { city: 'Vasai-Virar', state: 'Maharashtra', aliases: ['vasai', 'virar'] },
      { city: 'Varanasi', state: 'Uttar Pradesh', aliases: ['benares', 'kashi'] },
      { city: 'Srinagar', state: 'Jammu and Kashmir', aliases: [] },
      { city: 'Aurangabad', state: 'Maharashtra', aliases: [] },
      { city: 'Dhanbad', state: 'Jharkhand', aliases: [] },
      { city: 'Amritsar', state: 'Punjab', aliases: [] },
      { city: 'Navi Mumbai', state: 'Maharashtra', aliases: ['new mumbai'] },
      { city: 'Allahabad', state: 'Uttar Pradesh', aliases: ['prayagraj'] },
      { city: 'Ranchi', state: 'Jharkhand', aliases: [] },
      { city: 'Howrah', state: 'West Bengal', aliases: [] },
      { city: 'Coimbatore', state: 'Tamil Nadu', aliases: [] },
      { city: 'Jabalpur', state: 'Madhya Pradesh', aliases: [] },
      { city: 'Gwalior', state: 'Madhya Pradesh', aliases: [] },
      { city: 'Vijayawada', state: 'Andhra Pradesh', aliases: [] },
      { city: 'Jodhpur', state: 'Rajasthan', aliases: [] },
      { city: 'Madurai', state: 'Tamil Nadu', aliases: [] },
      { city: 'Raipur', state: 'Chhattisgarh', aliases: [] },
      { city: 'Kota', state: 'Rajasthan', aliases: [] },
      { city: 'Chandigarh', state: 'Chandigarh', aliases: [] },
      { city: 'Gurgaon', state: 'Haryana', aliases: ['gurugram'] },
      { city: 'Hubli', state: 'Karnataka', aliases: ['hubballi'] },
      { city: 'Dharwad', state: 'Karnataka', aliases: [] },
      { city: 'Mysore', state: 'Karnataka', aliases: ['mysuru'] },
      { city: 'Mangalore', state: 'Karnataka', aliases: ['mangaluru'] },
      { city: 'Noida', state: 'Uttar Pradesh', aliases: [] },
      { city: 'Kochi', state: 'Kerala', aliases: ['cochin'] },
      { city: 'Thiruvananthapuram', state: 'Kerala', aliases: ['trivandrum'] },
      { city: 'Bhubaneswar', state: 'Odisha', aliases: [] },
      { city: 'Dehradun', state: 'Uttarakhand', aliases: [] }
    ];

    const matches = indianCities.filter(cityData => {
      const cityMatch = cityData.city.toLowerCase().includes(query);
      const aliasMatch = cityData.aliases.some(alias => alias.toLowerCase().includes(query));
      return cityMatch || aliasMatch;
    }).slice(0, 5);

    return matches.map((cityData, index) => ({
      place_id: `city_${index}`,
      description: `${cityData.city}, ${cityData.state}, India`,
      structured_formatting: {
        main_text: cityData.city,
        secondary_text: `${cityData.state}, India`
      },
      types: ['locality', 'political']
    }));
  }

  async getPlaceDetails(placeId: string): Promise<GeocodingResult | null> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address,address_components&key=${this.placesApiKey}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.result) {
        const result = data.result;
        const addressComponents: GoogleAddressComponent[] = result.address_components || [];
        
        // Extract city (locality or administrative_area_level_2)
        const city = addressComponents.find((comp: GoogleAddressComponent) => 
          comp.types.includes('locality') || comp.types.includes('administrative_area_level_2')
        )?.long_name || '';
        
        // Extract state (administrative_area_level_1)
        const state = addressComponents.find((comp: GoogleAddressComponent) => 
          comp.types.includes('administrative_area_level_1')
        )?.long_name || '';
        
        // Extract country
        const country = addressComponents.find((comp: GoogleAddressComponent) => 
          comp.types.includes('country')
        )?.long_name || 'India';

        return {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          address: result.formatted_address,
          city,
          state,
          country
        };
      }
      
      if (data.status !== 'OK') {
        console.error('Google Place Details error:', data.status, data.error_message);
      }
      
      return null;
    } catch (error) {
      console.error('Google Place Details error:', error);
      return null;
    }
  }
}

// Factory function to create the appropriate map service
export const createMapService = (): MapService => {
  const useGoogleMaps = import.meta.env.VITE_USE_GOOGLE_MAPS === 'true';
  const googleGeocodingApiKey = import.meta.env.VITE_GOOGLE_GEOCODING_API_KEY;
  const googlePlacesApiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

  if (useGoogleMaps && googleGeocodingApiKey && googlePlacesApiKey) {
    console.log('Using Google Maps Service');
    return new GoogleMapsService(googleGeocodingApiKey, googlePlacesApiKey);
  }
  
  console.log('Using OpenStreetMap Service');
  return new OpenStreetMapService();
};

// Singleton instance
export const mapService = createMapService();
