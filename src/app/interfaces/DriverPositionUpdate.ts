import { google } from 'google-maps';
import { Coordinates } from './Coordinates';
export interface DriverPositionUpdate {
    location: google.maps.LatLng;
    magneticBearing: number;
}
