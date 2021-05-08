import { Coordinates } from './Coordinates';
import { TimeCreated } from './TimeCreated';
export interface Branch {
    id: string;
    timeCreated: TimeCreated;
    coordinates: Coordinates;
    name: string;
    businessName?: string;
    avatar?: string;
}
