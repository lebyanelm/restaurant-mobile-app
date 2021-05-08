import { ModalEventsService } from './../../services/modal-events.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Promocode } from './../../interfaces/Promocode';
import { ProductsService } from './../../services/products.service';
import { BasketService } from './../../services/basket.service';
import { Component, AfterViewInit, Input, ChangeDetectorRef } from '@angular/core';
import { Order } from 'src/app/interfaces/Order';
import { ModalController } from '@ionic/angular';
import { PromocodePage } from '../promocode/promocode.page';
import { AddNoteComponent } from 'src/app/components/add-note/add-note.component';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
})
export class OrdersPage implements AfterViewInit {
  @Input() return: string;

  isBasketHaveItems = false;
  order: Order = { products: [] };
  isPriorityDelivery = false;
  isPromoCodeApplied = false;
  returnPage;

  constructor(
    public basket: BasketService,
    private productService: ProductsService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private modalCtrl: ModalController,
    private modalEvents: ModalEventsService,
    private cds: ChangeDetectorRef
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

  ngAfterViewInit() {
  }

  openProduct(id: string): void {
    this.modalCtrl.dismiss()
      .then(() => {
        this.router.navigate(['product', id], {queryParams: {return: location.href }});
      });
  }

  checkout(r) {
    this.activatedRoute.url.subscribe((url) => {
      this.router.navigate(['payment-methods'], {queryParams: {return: r, isCheckout: true }});
      this.modalCtrl.dismiss();
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
      })
    addNoteModal.present();
  }
}
