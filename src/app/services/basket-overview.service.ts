import { ModalEventsService } from './modal-events.service';
import { PromocodePage } from './../pages/promocode/promocode.page';
import { OrdersPage } from './../pages/orders/orders.page';
import { ModalController } from '@ionic/angular';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BasketOverviewService {
  previousReturn: string;
  constructor(
    private modalCtrl: ModalController,
    private modalEvents: ModalEventsService
  ) { }

  async open(r: string) {
    this.previousReturn = r;
    const modal = await this.modalCtrl.create({
      component: OrdersPage,
      componentProps: { return: r ? r : '/home' },
      cssClass: ['delivery-location-selector']
    });

    this.modalEvents.statusChange.next(true);
    modal.onDidDismiss()
      .then(() => { this.modalEvents.statusChange.next(false); })
      .catch(() => { this.modalEvents.statusChange.next(false); });
    modal.present();
  }

  async openPromocodeModal(r: string) {
    this.modalCtrl.dismiss();
    const modal = await this.modalCtrl.create({
      component: PromocodePage,
      componentProps: { return: r ? r : '/home' },
      cssClass: ['promocode-modal'],
      mode: 'md',
      showBackdrop: true
    });

    modal.onDidDismiss()
      .then(() => this.open(this.previousReturn));
    modal.present();
  }
}
