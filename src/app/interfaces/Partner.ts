import { Extra } from './Extra';
import { Branch } from './Branch';
import { Promocode } from './Promocode';
import { Product } from './Product';
import { TimeCreated } from './TimeCreated';
import { User } from './User';
export interface Partner {
  timeCreated: TimeCreated;
  id: string;
  emailAddress: string;
  businessName: string;
  address: string;
  media: string[];
  locations: any[];
  phoneNumber: string;
  gender: number;
  isVerified: [boolean, boolean];
  isOnline: boolean;
  orders: any;
  isTwoFactorLogin: boolean;
  type: string;
  completedOrders: any;
  deliveryRange: number;
  products: Product[];
  branches: Branch[];
  users: User[];
  promocodes: Promocode[];
  token?: string;
  extras: Extra[];
  snapshots: {
    totalEarnings: number,
    quantitiesSold: number,
    customerAvg: number,
    totalOrders: number
  };
  customers: string[];
}
