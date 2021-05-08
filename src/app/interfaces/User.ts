import { TimeCreated } from './TimeCreated';
import { Order } from 'src/app/interfaces/Order';
import { Location } from './Location';
export interface User {
    media: string[];
    locations: Location[];
    isVerified: boolean[];
    orders: Order[];
    favorites: string[];
    completedOrders: Order[];
    timeCreated: TimeCreated;
    id: string;
    names: string;
    businessName?: string;
    partnerId: string;
    phoneNumber: string;
    isTwoFactorLogin: boolean;
    isOnline: boolean;
    username: string;
    emailAddress: string;
    gender: number;
    token?: string;
    type: 'account' | 'partner';
}
