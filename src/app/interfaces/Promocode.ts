import { TimeCreated } from './TimeCreated';

export interface Promocode {
    id?: string;
    timeCreated?: TimeCreated;
    code?: string;
    discount?: number;
    usage?: number;
    ends?: string;
}
