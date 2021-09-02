import { SocketsService } from './../../services/sockets.service';
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
    private sockets: SocketsService,
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

  applyPromocode(code: string): void {
    superagent
      .get([environment.BACKEND, 'promocode?partnerId=', [environment.PARTNER_ID, `code=${code}`].join('&')].join(''))
      .end((_, response) => {
        if (response) {
          if (response.ok) {
            // Apply the promocode found
            this.basket.applyPromocode(response.body.promocode);
            Plugins.Toast.show({ text: [response.body.promocode.discount, '% has been applied on your basket.'].join('') });
          } else {
            Plugins.Toast.show({ text: response.body.reason || 'Something went wrong.' });
          }
        } else {
          Plugins.Toast.show({ text: 'You have no internet connection.' });
        }
      });
  }

  toCheckout(): void {
    this.closeOrdersModal()
      .then(() => this.router.navigate(['checkout']))
  }

  closeOrdersModal() {
    return this.modalCtrl.dismiss();
  }
}
