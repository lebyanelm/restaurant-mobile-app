/* eslint-disable @typescript-eslint/prefer-for-of */
import { Destination } from './../interfaces/Destination';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Promocode } from '../interfaces/Promocode';
import { BasketSummary } from '../interfaces/BasketSummary';

@Injectable({
  providedIn: 'root'
})
export class BasketService {
  products = [];
  destination: Destination;
  paymentMethod = 'online';
  specialInstructions = '';
  orderingMode = 'delivery';
  deliveryNote = '';
  count = 0;
  changes: Subject<number> = new Subject<number>();
  promocode: Subject<Promocode> = new Subject<Promocode>();
  basketSummary: BasketSummary = {
    orderPrice: 0,
    promocode: {},
    eta: {lower: 0, upper: 0},
    discount: 0,
    deliveryPayment: 5,
    tax: 0,
    totalPayment: 0 };
  isDestinationAutoDetect = false;
  constructor() {
    this.promocode.subscribe((promocode) => {
      this.basketSummary.promocode = promocode;
      this.update();
    });
  }

  update() {
    this.count = this.products.length;
    this.getTotal();
  }

  applyPromocode(promocode: Promocode) {
    this.promocode.next(promocode);
  }

  addQuantity(productId: string) {
    for (let index = 0; index < this.products.length; index++) {
      if (this.products[index].id === productId) {
        this.products[index].quantity++;
        break;
      }
    }

    this.update();
  }

  minusQuantity(productId: string) {
    for (let index = 0; index < this.products.length; index++) {
      if (this.products[index].id === productId) {
        this.products[index].quantity--;
        if (this.products[index].quantity < 1) {
          this.products.splice(index, 1);
          console.log('[LOG]: Removed from the basket');
        }
        break;
      }
    }

    this.update();
  }

  clear() {
    this.products = [];
    this.update();
  }

  getTotal() {
    let total = 0;
    for (let index = 0; index < this.products.length; index++) {
      total += (((this.products[index].price + this.products[index].extrasAmount) * this.products[index].quantity));
    }

    // Apply the promocode, if it has been added
    if (this.basketSummary.promocode && this.basketSummary.promocode.discount) {
      this.basketSummary.discount = total * (this.basketSummary.promocode.discount / 100);
    }

    this.basketSummary.orderPrice = total;
    this.basketSummary.totalPayment = this.basketSummary.orderPrice - this.basketSummary.discount + this.basketSummary.deliveryPayment;

    // TODO: If Ozow requires collection of Tax, add this to the order object and calculation
    this.basketSummary.tax = this.basketSummary.totalPayment * 0.15;
  }
}
