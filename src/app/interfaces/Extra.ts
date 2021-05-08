import { TimeCreated } from './TimeCreated';
export interface Extra {
    timeCreated?: TimeCreated;
    id?: string;
    name: string;
    price: string;
    noUses: number;
}
