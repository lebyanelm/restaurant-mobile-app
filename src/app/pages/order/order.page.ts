import { ToastService } from 'src/app/services/toast.service';
import { BasketOverviewService } from './../../services/basket-overview.service';
import { Extra } from 'src/app/interfaces/Extra';
import { Order } from './../../interfaces/Order';
import { StorageService } from './../../services/storage.service';
import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import * as superagent from 'superagent';
import { NavigationControl } from 'mapbox-gl';
import { NavController } from '@ionic/angular';
import { ExtrasService } from 'src/app/services/extras.service';
import { BasketService } from 'src/app/services/basket.service';

@Component({
  selector: 'app-order',
  templateUrl: './order.page.html',
  styleUrls: ['./order.page.scss'],
})
export class OrderPage implements OnInit {
  @ViewChild('StaticMapImageContainer', {static: false}) staticMapImageContainer: ElementRef<HTMLDivElement>;

  order: Order;
  extras: any = {};
  data;

  constructor(
    private storage: StorageService,
    private route: ActivatedRoute,
    private extraService: ExtrasService,
    private basketService: BasketService,
    private basketOverview: BasketOverviewService,
    private toastService: ToastService,
    private navCtrl: NavController,
    private router: Router
  ) { }

  ngOnInit() {
    this.storage.getItem(environment.customerDataName)
      .then((data) => {
        this.route.queryParams.subscribe((d) => {
          this.data = data;
          this.order = this.data.orders.find((o) => o.id === d.id);
          this.getExtras();
        });
      });
  }

  goBack() {
    this.navCtrl.back();
  }

  getOrderStatus(_status: number): string {
    let status: string;
    if (_status === 1) {
      status = 'Recieving your order';
    } else if (_status === 2) {
      status = 'Preparing';
    } else if (_status === 3) {
      status = 'In Delivery';
    } else {
      status = 'Delivered';
    }

    return status;
  }

  toFixed(number: number | any): string {
    if (typeof number === 'number') {
      return number.toFixed(2);
    } else {
      try {
        number = parseInt(number);
        return number.toFixed(2);
      } catch {
        return number;
      }
    }
  }

  repeatOrder() {
    // Populate the basket with the older replicatable order information
    this.basketService.deliveryNote = this.order.deliveryInstructions;
    this.basketService.specialInstructions = this.order.restaurantInstructions;
    this.basketService.destination = this.order.destination;
    this.basketService.paymentMethod = this.order.paymentMethod;
    this.basketService.products = this.order.products;
    this.basketService.basketSummary.promocode = this.order.promocodeUsed;

    // Also add the extra amounts to cover the total
    this.basketService.products.forEach((product) => {
      // Add extras total
      product.extras.forEach((extraId) => {
        this.extraService.getExtra(extraId)
          .then((extra) => {
            console.log('Extra:', extra);
          });
      })
    });

    this.basketService.update();

    // Open the basket overview to show items that were added to the basket
    this.basketOverview.open(['order', this.order.id].join('/'));
  }

  removeOrder() {
    superagent
      .delete([environment.BACKEND, 'accounts/order'].join(''))
      .set('Authorization', this.data.token)
      .send({ orderId: this.order.id })
      .end((_, response) => {
        if (response) {
          if (response.status === 200) {
            const orderIndex = this.data.orders.findIndex((o) => o.id === this.order.id);
            if (orderIndex)
              this.data.orders.splice(orderIndex, 1);
            this.storage.setItem(environment.customerDataName, this.data)
              .then(() => {
                this.navCtrl.back();
              });
          } else {
            this.toastService.showAlert({
              header: response.body.reason || 'ERROR: SOMETHING WENT WRONG',
              // tslint:disable-next-line: max-line-length
              message: response.body.message || 'An unexpected error has occured while removing your favorites from your account, sorry for the inconvinience.',
              buttons: [{ text: 'Retry again' }]
            }).then((value) => {
              if (value === 0) {
                this.removeOrder();
              }
            });
          }
        } else {
          this.toastService.showAlert({
            header: 'ERROR: YOU HAVE NO INTERNET CONNECTION',
            // tslint:disable-next-line: max-line-length
            message: response.body.message || 'Please check your internet connection and try again. We might be offline, contact us if problem is on our side.',
            buttons: [{ text: 'Retry again' }]
          }).then((value) => {
            if (value === 0) {
              this.removeOrder();
            }
          });
        }
    });
  }

  objectToArray(object: any = {}) {
    const keys = Object.keys(object),
          array = [];

    for (let key of keys) {
      array.push({ name: key.replace(/_/g, ' '), option: object[key] })
    }

    return array;
  }

  getExtras(): void {
    this.order.products.forEach((product) => {
      this.extraService.getExtras(product.extras)
        .then((extras) => {
          extras.forEach((extra) => {
            if (!this.extras[product.id])
              this.extras[product.id] = [];
            this.extras[product.id].push(extra.name);
          });
        });
    });
  }
}
