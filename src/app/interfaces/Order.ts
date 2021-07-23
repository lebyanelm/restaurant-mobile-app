import { TimeCreated } from './TimeCreated';
import { Coordinates } from './Coordinates';
import { Promocode } from './Promocode';
import { Branch } from './Branch';
import { Destination } from './Destination';

export interface Order  {
    id?: string;
    timeCreated?: TimeCreated;
    destination?: Destination;
    branch?: Branch;
    extras?: string[];
    status?: number;
    totalPrice?: number;
    paymentMethod?: string;
    orderingMode?: string;
    discount?: number;
    deliveryFee?: number;
    customer?: string;
    uid?: string;
    products?: OrderProduct[];
    promocodeUsed?: Promocode;
    deliveryInstructions?: string;
    restaurantInstructions?: string;
    location?: Location;
    branchId?: string;
    index?: number;
}

export interface OrderProduct {
    index?: number;
    quantity?: number;
    extras?: string[];
    sides?: string[];
    name?: string;
    id?: string;
    price: number;
    extrasAmount: number;
    selectedOptions: any;
}
