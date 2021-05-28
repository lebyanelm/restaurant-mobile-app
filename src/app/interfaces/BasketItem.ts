export interface BasketItem {
    id: string;
    name: string;
    description: string;
    placeholder: string;
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
