import { Coordinates } from './Coordinates';
import { google } from 'google-maps';

declare var google;
export interface Destination {
    address: string | any;
    coords?: Coordinates;
    coordinates?: any;
}
