export interface BasketItem {
    name: string;    
    id: string;
    extras: string[];
    quantity: number;
    sides: string[];
    extrasAmount: number;
    price: number;
    originalPrice: number;
    selectedOptions?: any;
    isSide?: boolean;
    mainProduct?: string;
}