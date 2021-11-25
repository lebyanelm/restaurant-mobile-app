import { ModalEventsService } from './../../services/modal-events.service';
import { Router } from '@angular/router';
import { SocketsService } from 'src/app/services/sockets.service';
import { User } from 'src/app/interfaces/User';
import { StorageService } from 'src/app/services/storage.service';
import { BasketService } from 'src/app/services/basket.service';
import { ModalController, NavController, Platform } from '@ionic/angular';
import { Component, OnInit } from '@angular/core';
import { Plugins } from '@capacitor/core';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { environment } from 'src/environments/environment';
import { Branch } from 'src/app/interfaces/Branch';
import { Destination } from 'src/app/interfaces/Destination';
import * as superagent from 'superagent';
import { DeliveryLocationComponent } from 'src/app/components/delivery-location/delivery-location.component';
import { GoogleapisService } from 'src/app/services/googleapis.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.page.html',
  styleUrls: ['./checkout.page.scss'],
})
export class CheckoutPage implements OnInit {
  data: User;
  branch: Branch;

  constructor(
    private navCtrl: NavController,
    private storage: StorageService,
    public basket: BasketService,
    private platform: Platform,
    private sockets: SocketsService,
    private router: Router,
    private modalCtrl: ModalController,
    private modalEvents: ModalEventsService,
    private googleServices: GoogleapisService
  ) {}

  ngOnInit() {
    console.log(this.basket);
    this.storage
      .getItem(environment.customerDataName)
      .then((data) => (this.data = data));
  }

  setDeliveryAddress() {
    return new Promise(async (resolve, reject) => {
      const deliveryLocationSelector = await this.modalCtrl.create({
        component: DeliveryLocationComponent,
        cssClass: ['delivery-location-selector'],
      });

      this.modalEvents.statusChange.next(true);
      deliveryLocationSelector.onDidDismiss().then((data) => {
        this.modalEvents.statusChange.next(false);
        if (data.data) {
          this.basket.destination = data.data;
          this.basket.isDestinationAutoDetect = false;
          resolve(this.basket.destination);
        }
      });
      deliveryLocationSelector.present();
    });
  }

  findNearestBranch() {
    return new Promise((resolve, reject) => {
      const findBranch = (destination) => {
        superagent
          .get(
            [
              environment.BACKEND,
              'branch?coordinates=',
              [destination.lat, destination.lng].join(),
              '&partnerId=',
              environment.PARTNER_ID,
            ].join('')
          )
          .end((_, response) => {
            if (response) {
              if (response.ok) {
                resolve(response.body.branch);
              } else {
                reject(response.body.reason || 'Something went wrong.');
              }
            } else {
              reject('No connection. Please check your internet connection.');
            }
          });
      };

      // Find the location of the customer
      if (
        this.basket.destination ||
        this.basket.orderingMode === 'collection'
      ) {
        // Send a request to the backend to find the nearest branch to the customer
        findBranch(this.basket.destination.coords);
      } else {
        this.setDeliveryAddress().then((destination: Destination) =>
          findBranch(destination.coords)
        );
      }
    });
  }

  // When payment has been selected, place an order to the nearest restaurant
  placeOrder() {
    this.findNearestBranch()
      .then((branch: Branch) => {
        this.branch = branch;
        // Check whether to accept payment first before sending the order or not
        if (this.basket.paymentMethod === 'online-payment') {
          this.onlinePaymentCheckout();
        } else {
          this.sendOrderCheckout(null);
        }
      })
      .catch((error) => {
        Plugins.Toast.show({ text: error });
      });
  }

  async onlinePaymentCheckout() {
    // Prepare the data to be sent to the OZOW API ENDPOINT
    const NGROK_TEST_BACKEND = 'https://c751-41-116-104-238.ngrok.io/';

    // eslint-disable @typescript-eslint/naming-convention
    const OZOW_API_DATA = {
      siteCode: 'TSTSTE0001',
      countryCode: 'ZA',
      currencyCode: 'ZAR',
      amount: this.basket.basketSummary.totalPayment.toFixed(2).toString(),
      transactionReference: environment.PARTNER_ID,
      bankReference: environment.PARTNER_ID,
      registerTokenProfile: true,
      tokenNotificationUrl: [environment.BACKEND, 'token-registration'].join(
        ''
      ),
      tokenDeletedNotificationUrl: [environment.BACKEND, 'token-delete'].join(
        ''
      ),
      cancelUrl: [
        environment.production ? environment.BACKEND : NGROK_TEST_BACKEND,
        'payment-status?status=cancel',
      ].join(''),
      errorUrl: [
        environment.production ? environment.BACKEND : NGROK_TEST_BACKEND,
        'payment-status?status=error',
      ].join(''),
      successUrl: [
        environment.production ? environment.BACKEND : NGROK_TEST_BACKEND,
        'payment-status?status=success',
      ].join(''),
      notifyUrl: [
        environment.production ? environment.BACKEND : NGROK_TEST_BACKEND,
        'payment-status?status=notify',
      ].join(''),
      optional1: this.data.id,
      isTest: true,
    };

    // Make a lowercase string of all the data items to send them to Ozow
    const hashCheckBefore = [
      OZOW_API_DATA.siteCode,
      OZOW_API_DATA.countryCode,
      OZOW_API_DATA.currencyCode,
      OZOW_API_DATA.amount,
      OZOW_API_DATA.transactionReference,
      OZOW_API_DATA.bankReference,
      OZOW_API_DATA.optional1,
      // OZOW_API_DATA.registerTokenProfile,
      // OZOW_API_DATA.tokenNotificationUrl,
      // OZOW_API_DATA.tokenDeletedNotificationUrl,
      OZOW_API_DATA.cancelUrl,
      OZOW_API_DATA.errorUrl,
      OZOW_API_DATA.successUrl,
      OZOW_API_DATA.notifyUrl,
      OZOW_API_DATA.isTest,
      '215114531AFF7134A94C88CEEA48E',
    ]
      .join('')
      .toLowerCase();

    const hashRequest = await fetch(
      ['https://api.hashify.net/hash/sha512/hex?value=', hashCheckBefore].join(
        ''
      )
    );

    const HASH_CHECK = await hashRequest.json();

    const pageHTML = `
      <html>
        <body>
          <form action="https://pay.ozow.com/" id="ozow-form">
            <input type="text" name="SiteCode" value="${OZOW_API_DATA.siteCode}" hidden>
            <input type="text" name="CountryCode" value="${OZOW_API_DATA.countryCode}" hidden>
            <input type="text" name="CurrencyCode" value="${OZOW_API_DATA.currencyCode}" hidden>
            <input type="text" name="Amount" value="${OZOW_API_DATA.amount}" hidden>
            <input type="text" name="TransactionReference" value="${OZOW_API_DATA.transactionReference}" hidden>
            <input type="text" name="BankReference" value="${OZOW_API_DATA.bankReference}" hidden>
            <input type="text" name="Optional1" value="${OZOW_API_DATA.optional1}" hidden>
            <input type="text" name="CancelUrl" value="${OZOW_API_DATA.cancelUrl}" hidden>
            <input type="text" name="ErrorUrl" value="${OZOW_API_DATA.errorUrl}" hidden>
            <input type="text" name="SuccessUrl" value="${OZOW_API_DATA.successUrl}" hidden>
            <input type="text" name="NotifyUrl" value="${OZOW_API_DATA.notifyUrl}" hidden>
            <input type="text" name="IsTest" value="${OZOW_API_DATA.isTest}" hidden>
            <input type="text" name="HashCheck" value="${HASH_CHECK.Digest}" hidden>
          </form>
        </body>
        <script>
          const formElement = document.getElementById('ozow-form');
          formElement.submit();
        </script>
      </html>
    `;

    const htmlDataURL = ['data:text/html;base64', btoa(pageHTML)].join();

    let refWindow;
    if (this.platform.is('desktop')) {
      // eslint-disable-next-line max-len
      refWindow = window.open(
        '',
        '_blank',
        'hidden=no,location=no,clearsessioncache=yes,clearcache=yes,height=650,width=350'
      );
      refWindow.document.body.innerHTML = pageHTML;
      refWindow.document.getElementsByTagName('form')[0].submit();
    } else {
      // eslint-disable-next-line max-len
      refWindow = InAppBrowser.create(
        htmlDataURL,
        '',
        'hidden=no,location=yes,clearsessioncache=yes,clearcache=yes,height=400,width=200'
      );
    }

    // Listen for a payment status to close the browser moda window
    this.sockets.onPaymentStatus.subscribe((payment) => {
      // Close the modal window
      refWindow.close();

      if (
        payment.status === 'Complete' ||
        payment.status === 'Pending' ||
        payment.status === 'PendingInvestigation'
      ) {
        // Send the order to the partner
        this.sendOrderCheckout(payment);
      } else {
        this.router.navigate(['order-placed'], {
          queryParams: { isOrderPlaced: false, isPaymentOnline: true },
        });
        Plugins.Toast.show({ text: 'Error, Payment not successful.' });
      }
    });
  }

  sendOrderCheckout(paymentData) {
    // Prepare the order request data to be sent to the backend
    const orderData = {
      products: this.basket.products,
      paymentMethod: this.basket.paymentMethod,
      restaurantInstructions: this.basket.specialInstructions,
      deliveryInstructions: this.basket.deliveryNote,
      orderingMode: this.basket.orderingMode,
      destination: this.basket.destination,

      customer: this.data.names,
      uid: this.data.id,
      branch: this.branch,

      transactionId: paymentData ? paymentData.transactionId : null,
      transactionReference: paymentData
        ? paymentData.transactionReference
        : null,
      transactionStatus: paymentData ? paymentData.status : null,

      orderPrice: this.basket.basketSummary.orderPrice,
      promocodeUsed: this.basket.basketSummary.promocode,
      discount: this.basket.basketSummary.discount,
      deliveryFee: this.basket.basketSummary.deliveryPayment,
      tax: this.basket.basketSummary.tax,
      totalPayment: this.basket.basketSummary.totalPayment,
    };

    // Send the order request data to the backend for further processing
    superagent
      .post([environment.BACKEND, 'order'].join(''))
      .set('Authorization', this.data.token)
      .send(orderData)
      .end((_, response) => {
        if (response) {
          console.log(JSON.stringify(response.body));
          if (response.ok) {
            Plugins.Toast.show({ text: 'Order placed!' });
            this.data.orders.push(response.body.order);
            this.storage.setItem(environment.customerDataName, this.data);
            this.storage.setItem(environment.ORDER, response.body.order.id);
            this.router.navigate(['order-placed'], {
              queryParams: {
                id: response.body.order.id,
                isOrderPlaced: true,
                isPaymentOnline: paymentData ? true : false,
              },
            });
          } else {
            Plugins.Toast.show({
              text:
                response.body.reason ||
                'Error, Something went wrong. Please contact the restaurant for assistance.',
            });
            this.router.navigate(['order-placed'], {
              queryParams: {
                id: response.body.order.id,
                isOrderPlaced: false,
                isPaymentOnline: paymentData ? true : false,
              },
            });
          }
        } else {
          Plugins.Toast.show({ text: 'Error, No internet connection.' });
        }
      });
  }

  goBack() {
    this.navCtrl.back();
  }
}
