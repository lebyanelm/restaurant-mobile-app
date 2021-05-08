import { ToastService } from './../../services/toast.service';
import { StorageService } from './../../services/storage.service';
import { TimeCreated } from './../../interfaces/TimeCreated';
import { BasketService } from './../../services/basket.service';
import { IonRangeValue } from './../../interfaces/IonRangeValue';
import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { Subject } from 'rxjs';
import { post } from 'superagent';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss'],
})
export class ProductComponent implements OnInit {
  @Input() name: string;
  @Input() timeCreated: TimeCreated;
  @Input() id: string;
  @Input() description: string;
  @Input() category: string;
  @Input() price: string;
  @Input() images: string;
  @Input() inStock: boolean;
  @Input() buys: number;
  @Input() views: number;
  @Input() expectedPrepareTime: IonRangeValue;
  @Input() sellingHours: IonRangeValue;
  @Input() sides: string[];
  @Input() dietary: string;
  @Input() branches: string[];

  data;

  constructor(
    public basket: BasketService,
    public router: Router,
    private storage: StorageService,
    private toast: ToastService
  ) {
    this.storage.getItem(environment.customerDataName)
      .then((data) => {
        this.data = data;
      });
    this.storage.change.subscribe((data) => {
      if (data.name === environment.customerDataName) {
        this.data = data.data;
      }
    });
  }

  ngOnInit() {
  }

  // Adding products to the basket
  incrementToBasket(productId) {
    if (this.basket.products[productId]) {
      this.basket.products[productId].quantity++;
    } else {
      this.basket.products[productId] = { quantity: 1, id: productId };
    }
    this.basket.update();
  }

  // Removing items from the basket
  decrementFromBasket(productId) {
    if (this.basket.products[productId]) {
      if ((this.basket.products[productId].quantity - 1) === 0) {
        delete this.basket.products[productId];
      } else {
        this.basket.products[productId].quantity -= 1;
      }
    }

    this.basket.update();
  }

  openProduct() {
    this.router.navigate(['product', this.id]);
  }

  getDaysFromMilliseconds(milliseconds: number) {
    return ((new Date().getTime() - milliseconds) / 8.64e+7);
  }

  likeProduct(id) {
    post(environment.BACKEND + 'accounts/favorite')
    .set('Authorization', this.data.token)
    .send({ uid: this.data.id, productId: id })
    .end((error, response) => {
      if (response) {
        if (response.status === 200) {
          if (this.data.favorites.indexOf(id) === -1) {
            this.data.favorites.push(id);
          } else {
            this.data.favorites.splice(this.data.favorites.indexOf(id), 1);
          }
          this.storage.setItem(environment.customerDataName, this.data);
        } else {
          this.toast.show(response.body.reason || 'ERROR: SOMETHING WENT WRONG.');
        }
      } else {
        this.toast.showAlert(true);
      }
    });
  }

  hasProduct(id) {
    let isFound = false;
    for (const orderProduct of this.basket.products) {
      if (orderProduct.id === id) {
        isFound = true;
        break;
      }
    }
    return isFound;
  }

  async isFavorite(id: string) {
    let exists = false;
    await this.storage.getItem(environment.customerDataName)
      .then((data) => {
        exists = (data.favorites.indexOf(id) !== -1);
      });
    return exists;
  }
}