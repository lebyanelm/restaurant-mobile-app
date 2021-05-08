import { google } from 'google-maps';
import { Stat } from './Stat';

export interface RouteStats {
    duration: Stat;
    distance: Stat;
    steps: google.maps.DirectionsStep;
}
