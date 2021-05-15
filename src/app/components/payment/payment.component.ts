import { ToastService } from './../../services/toast.service';
import { BasketService } from './../../services/basket.service';
import { StorageService } from './../../services/storage.service';
import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import * as superagent from 'superagent';
import { IonicModule, ModalController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
  providers: [IonicModule]
})
export class PaymentComponent implements OnInit {
  status = 'Processing';
  isSuccess;
  statusCode = 0;
  statusMessage = 'Your order is being processed, waiting for response for payment status.';
  isLoading = false;

  constructor(
    private storage: StorageService,
    public basket: BasketService,
    private toast: ToastService,
    private router: Router,
    private modalCtrl: ModalController
  ) { }

  ngOnInit() {
    this.placeOrder();
  }

  placeOrder() {
    this.storage.getItem(environment.customerDataName)
      .then((customerLocalData) => {
        let hasItems = false;
        // tslint:disable-next-line: forin
        for (const product in this.basket.products) {
          hasItems = true;
        }

        if (hasItems) {
          this.isLoading = true;
          console.log(this.basket.destination);
          if (this.basket.destination) {
            // Contact the shop and place the order to thier shop
            superagent
            .post(environment.BACKEND + 'order')
            .send({
                products: this.basket.products,
                destination: { address: this.basket.destination.address, coordinates: this.basket.destination.coords || this.basket.destination.coordinates },
                uid: customerLocalData.id,
                totalPayment: this.basket.basketSummary.totalPayment,
                paymentMethodId: this.basket.paymentMethod,
                promocodeUsed: this.basket.basketSummary.promocode,
                partnerId: environment.PARTNER_ID,
                deliveryInstructions: this.basket.deliveryNote,
                restaurantInstructions: this.basket.specialInstructions,
                VAT: this.basket.basketSummary.tax,
                discount: this.basket.basketSummary.discount,
                deliveryFee: this.basket.basketSummary.deliveryPayment,
                token: customerLocalData.token})
            .end((error, response) => {
              this.isLoading = false;
              if (response) {
                if (response.status === 200) {
                  customerLocalData.orders.push(response.body.order);
                  this.storage.setItem(environment.ORDER, response.body.order.id, false);
                  this.storage.setItem(environment.customerDataName, customerLocalData);
                  this.isSuccess = true;
                  this.status = 'Order Placed';
                  this.statusMessage = 'Your transaction has been processed, order has been placed and will be processed soon.';
                  this.statusCode = 200;
                } else if (response.status === 501) {
                  this.isSuccess = false;
                  this.status = 'Out of Bounds';
                  // tslint:disable-next-line: max-line-length
                  this.statusMessage = [this.basket.destination.address.length > 1 ? [this.basket.destination.address[0], this.basket.destination.address[1]].join() : this.basket.destination.address[0], ' seems to outside of our delivery range, but you can vote for your area.'].join();
                  this.statusCode = 501;
                } else if (response.status === 406) {
                  this.isSuccess = false;
                  this.status = 'We\'re Closed';
                  this.statusMessage = 'Please try again when we open. Be sure to consult our working hours in the About Page.';
                  this.statusCode = 406;
                } else if (response.status === 410) {
                  this.isSuccess = false;
                  this.status = 'Branch Offline';
                  this.statusMessage = 'The closest branch in your area is currently offline, please do try us again at a later stage.';
                  this.statusCode = 406;
                } else {
                  this.isSuccess = false;
                  this.status = response.body.message || 'Something unexpected happened';
                  this.statusMessage = response.body.reason || 'There was a problem processing your transaction, please try again and retry again. If problem persists contact the restaurant.';
                  this.statusCode = response.status || 500;
                }
              }
            });
          } else {
            this.isLoading = false;
            this.statusCode = 422;
            this.isSuccess = false;
            this.status = 'No delivery location selected.';
            this.statusMessage = 'Make sure to pin your delivery location, or enable location services to do this automatically.';
          }
        } else {
          this.isSuccess = false;
          this.status = 'No items';
          this.statusMessage = 'You have\'nt added items to your basket.';
          this.statusCode = -1;
        }
      });
  }

  goBack() {
    this.router.navigate(['home']);
  }

  voteForArea(): void {
    this.storage.getItem(environment.customerDataName)
      .then((data) => {
        superagent
          .post(environment.BACKEND + 'areas/vote')
          .set('Authorization', data.token)
          .send({ coords: this.basket.destination.coords })
          .end((error, response) => {
            if (response) {
              if (response.status === 200) {
                this.toast.show('Your vote has been placed');
              } else {
                console.log(response);
                this.toast.show(response.body.reason || response.body.message);
              }

              this.modalCtrl.dismiss();
            } else {
              this.toast.showAlert(true);
            }
          });
      }).catch((error) => {
        this.toast.show('ERROR: Unable to load your local data.');
      });
  }

  routeTo(path: string): void {
    this.modalCtrl.dismiss()
      .then(() => {
        this.router.navigateByUrl(path);
      }).catch(() => {
        this.toast.show('ERROR: UNEXPECTED ERROR.');
      });
  }
}
