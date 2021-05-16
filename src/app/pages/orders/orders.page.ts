import { User } from 'src/app/interfaces/User';
import { StorageService } from 'src/app/services/storage.service';
import { Plugins } from '@capacitor/core';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { environment } from './../../../environments/environment';
import { ModalEventsService } from './../../services/modal-events.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Promocode } from './../../interfaces/Promocode';
import { BasketService } from './../../services/basket.service';
import { Component, AfterViewInit, Input, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { Order } from 'src/app/interfaces/Order';
import { ModalController, Platform } from '@ionic/angular';
import { PromocodePage } from '../promocode/promocode.page';
import { AddNoteComponent } from 'src/app/components/add-note/add-note.component';
import * as superagent from 'superagent';
import { Branch } from 'src/app/interfaces/Branch';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
})
export class OrdersPage implements AfterViewInit {
  @ViewChild('PlaceOrderButton') placeOrderButton: ElementRef<HTMLButtonElement>;
  @Input() return: string;

  // Page States
  isBasketHaveItems = false;
  isPriorityDelivery = false;
  isPromoCodeApplied = false;
  isPaymentOptionsOpen = false;

  // Page Data
  returnPage;
  order: Order = { products: [] };
  data: User;
  branch: Branch;

  constructor(
    public basket: BasketService,
    private storage: StorageService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private modalCtrl: ModalController,
    private modalEvents: ModalEventsService,
    private platform: Platform
  ) {
    // When the user applies a promocode
    this.basket.promocode.subscribe((p: Promocode) => {
      this.basket.basketSummary.promocode = p;
    });

    this.activatedRoute.queryParams.subscribe((queryParams) => {
      this.returnPage = queryParams.return ? ['', queryParams.return].join('/') : '/home';
      console.log(this.returnPage, queryParams.return)
    });
  }

  async ngAfterViewInit() {
    this.data = await this.storage.getItem(environment.customerDataName);
  }

  openProduct(id: string): void {
    this.modalCtrl.dismiss()
      .then(() => {
        this.router.navigate(['product', id], {queryParams: {return: location.href }});
      });
  }

  findNearestBranch() {
    // Find the location of the customer
    return new Promise<Branch | string>((resolve, reject) => {
      Plugins.Geolocation.getCurrentPosition({ enableHighAccuracy: true })
        .then((position) => {
          // Send a request to the backend to find the nearest branch to the customer
          superagent
            .get([environment.BACKEND, 'branch?coordinates=',
              [position.coords.latitude, position.coords.longitude].join(), '&partnerId=', environment.PARTNER_ID].join(''))
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
        }).catch((error) => {
          reject('Could not find your location');
        });
    });
  }

  // When payment has been selected, place an order to the nearest restaurant
  placeOrder() {
    this.findNearestBranch()
      .then((branch: Branch) => {
        this.branch = branch;
        // Check whether to accept payment first before sending the order or not
        if (this.basket.paymentMethod === 'online') {
          this.onlinePaymentCheckout();
        } else {
          this.sendOrderCheckout(null);
        }
      }).catch((error) => {
        Plugins.Toast.show({ text: error });
      });
  }

  async onlinePaymentCheckout() {
    // Prepare the data to be sent to the OZOW API ENDPOINT
    const NGROK_TEST_BACKEND = 'https://cda0f68a34cb.ngrok.io/';

    // eslint-disable @typescript-eslint/naming-convention
    const OZOW_API_DATA = {
      siteCode: 'TSTSTE0001',
      countryCode: 'ZA',
      currencyCode: 'ZAR',
      amount: this.basket.basketSummary.totalPayment.toFixed(2).toString(),
      transactionReference: environment.PARTNER_ID,
      bankReference: environment.PARTNER_ID,
      registerTokenProfile: true,
      tokenNotificationUrl: [environment.BACKEND, 'token-registration'].join(''),
      tokenDeletedNotificationUrl: [environment.BACKEND, 'token-delete'].join(''),
      cancelUrl: [
        environment.production ? environment.BACKEND : NGROK_TEST_BACKEND, 'payment-status?status=cancel'].join(''),
      errorUrl: [
        environment.production ? environment.BACKEND : NGROK_TEST_BACKEND, 'payment-status?status=error'].join(''),
      successUrl: [
        environment.production ? environment.BACKEND : NGROK_TEST_BACKEND, 'payment-status?status=success'].join(''),
      notifyUrl: [
        environment.production ? environment.BACKEND : NGROK_TEST_BACKEND, 'payment-status?status=notify'].join(''),
      isTest: !environment.production
    };

    // Make a lowercase string of all the data items to send them to Ozow
    const hashCheckBefore = [
      OZOW_API_DATA.siteCode,
      OZOW_API_DATA.countryCode,
      OZOW_API_DATA.currencyCode,
      OZOW_API_DATA.amount,
      OZOW_API_DATA.transactionReference,
      OZOW_API_DATA.bankReference,
      // OZOW_API_DATA.registerTokenProfile,
      // OZOW_API_DATA.tokenNotificationUrl,
      // OZOW_API_DATA.tokenDeletedNotificationUrl,
      OZOW_API_DATA.cancelUrl,
      OZOW_API_DATA.errorUrl,
      OZOW_API_DATA.successUrl,
      OZOW_API_DATA.notifyUrl,
      OZOW_API_DATA.isTest,
      '215114531AFF7134A94C88CEEA48E',
    ].join('').toLowerCase();

    const hashRequest = await fetch(
      [
        'https://api.hashify.net/hash/sha512/hex?value=',
        hashCheckBefore
      ].join(''));

    const hashCheck = await hashRequest.json();

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
            <input type="text" name="CancelUrl" value="${OZOW_API_DATA.cancelUrl}" hidden>
            <input type="text" name="ErrorUrl" value="${OZOW_API_DATA.errorUrl}" hidden>
            <input type="text" name="SuccessUrl" value="${OZOW_API_DATA.successUrl}" hidden>
            <input type="text" name="NotifyUrl" value="${OZOW_API_DATA.notifyUrl}" hidden>
            <input type="text" name="IsTest" value="${OZOW_API_DATA.isTest}" hidden>
            <input type="text" name="HashCheck" value="${hashCheck.Digest}" hidden>
          </form>
        </body>
        <script>
          const formElement = document.getElementById('ozow-form');
          formElement.submit();
        </script>
      </html>
    `;

    const htmlDataURL = [ 'data:text/html;base64', btoa(pageHTML) ].join();

    if (this.platform.is('desktop')) {
      // eslint-disable-next-line max-len
      const refWindow = window.open('', '_blank', 'hidden=no,location=no,clearsessioncache=yes,clearcache=yes,height=650,width=350');
      refWindow.document.body.innerHTML = pageHTML;
      refWindow.document.getElementsByTagName('form')[0].submit();
    } else {
      // eslint-disable-next-line max-len
      const refWindow = InAppBrowser.create(htmlDataURL, '', 'hidden=no,location=yes,clearsessioncache=yes,clearcache=yes,height=400,width=200');
      refWindow.on('loadstart')
        .subscribe((event) => {
          if (event.url.match('mobile/sucess')) {
            console.log('Sucess');
            // refWindow.close();
          } else if (event.url.match('mobile/cancelled')) {
            console.log('Cancelled');
          } else {
            console.log('Cancelled');
          }
        });
      refWindow.on('exit')
        .subscribe((e) => {
        });
    }
  }

  sendOrderCheckout(paymentData) {
    // Prepare the order request data to be sent to the backend
    const orderData = {
      // General
      products: this.basket.products,
      paymentMethod: this.basket.paymentMethod,
      restaurantInstructions: this.basket.specialInstructions,
      deliveryInstructions: this.basket.deliveryNote,
      orderingMode: this.basket.orderingMode,
      destination: this.basket.destination,

      // References
      customer: this.data.names,
      uid: this.data.id,
      branch: this.branch,

      // Online transaction references
      transactionId: paymentData ? paymentData.transactionId : null,
      transactionReference: paymentData ? paymentData.transactionReference : null,
      transactionStatus: paymentData ? paymentData.status : null,

      // Prices
      orderPrice: this.basket.basketSummary.orderPrice,
      promocodeUsed: this.basket.basketSummary.promocode,
      discount: this.basket.basketSummary.discount,
      deliveryFee: this.basket.basketSummary.deliveryPayment,
      tax: this.basket.basketSummary.tax,
      totalPayment: this.basket.basketSummary.totalPayment,
    };

    console.log(orderData);

    // Send the order request data to the backend
    superagent
      .post([environment.BACKEND, 'order'].join(''))
      .set('Authorization', this.data.token)
      .send(orderData)
      .end((_, response) => {
        console.log(response);
      });
  }

  async openPromocodeModal(r = location.href) {
    this.modalCtrl.dismiss();
    const modal = await this.modalCtrl.create({
      component: PromocodePage,
      cssClass: ['modal', 'promocode-modal'],
      mode: 'md',
      showBackdrop: true
    });

    modal.onDidDismiss()
      .then(async () => {
        this.openOrdersModal(r);
      });
    modal.present();
  }

  async openOrdersModal(r: string) {
    const basketModal = await this.modalCtrl.create({
      component: OrdersPage,
      componentProps: { return: r ? r : '/home' },
      cssClass: ['delivery-location-selector'],
      showBackdrop: true
    });

    basketModal.onDidDismiss()
      .then(() => {
        this.modalEvents.statusChange.next(false);
      });

    basketModal.present();
    this.modalEvents.statusChange.next(true);
  }

  async openAddNoteModal(isDriverNote) {
    const addNoteModal = await this.modalCtrl.create({
      component: AddNoteComponent,
      cssClass: ['modal', 'add-note-modal', 'promocode-modal']
    });

    addNoteModal.onDidDismiss()
      .then((data) => {
        if (data.data) {
          if (isDriverNote) {
            this.basket.deliveryNote = data.data;
          } else {
            this.basket.specialInstructions = data.data;
          }
        }
      });
    addNoteModal.present();
  }
}
