import { Promocode } from './Promocode';

export interface BasketSummary {
    orderPrice: number;
    promocode: Promocode;
    discount: number;
    eta: {lower: number, upper: number};
    deliveryPayment: number;
    tax: number;
    totalPayment: number;
}
