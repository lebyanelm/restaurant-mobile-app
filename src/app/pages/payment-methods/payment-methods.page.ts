import { StorageService } from './../../services/storage.service';
import { AddPaymentOptionPage } from './../add-payment-option/add-payment-option.page';
import { ModalEventsService } from './../../services/modal-events.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BasketService } from './../../services/basket.service';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { PaymentComponent } from 'src/app/components/payment/payment.component';
import { environment } from 'src/environments/environment';
import { ChangeDetectionStrategy } from '@angular/compiler/src/compiler_facade_interface';

@Component({
  selector: 'app-payment-methods',
  templateUrl: './payment-methods.page.html',
  styleUrls: ['./payment-methods.page.scss'],
})
export class PaymentMethodsPage implements OnInit {
  return: string;
  selectedPayment: any = 0;
  isCheckout: any = false;
  methods: any = [
    { id: 'cash', cardNumber: 'Cash On Delivery', description: 'Pay with cash at delivery', type: 25 }
  ];

  constructor(
    public basket: BasketService,
    private modalCtrl: ModalController,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private modalEvents: ModalEventsService,
    private storage: StorageService,
    private cdr: ChangeDetectorRef
  ) {
    this.storage.getItem(environment.customerDataName)
      .then((data) => {
        this.methods = [...this.methods, ...data.paymentMethods];
        this.cdr.detectChanges();
        console.log('[LOG]', 'Payment methods loaded:', this.methods.length);
      });
    this.storage.change.subscribe((data) => {
      this.methods = [this.methods[0], ...data.data.paymentMethods];
    });
  }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe((q) => {
      this.return = q.return;
      this.return = this.return ? this.return : '/home';
    });

    this.activatedRoute.queryParamMap.subscribe((params) => {
      this.isCheckout = params.get('isCheckout');
      if (this.isCheckout) {
        this.isCheckout = this.isCheckout === 'true' ? true : false;
        if (this.isCheckout) {
          this.basket.paymentMethodId = this.methods[this.selectedPayment].id;
        }
      }
    });
  }

  async processPayment() {
    const paymentModal = await this.modalCtrl.create({
      component: PaymentComponent,
      cssClass: ['modal', 'payment-modal'],
      componentProps: { selectPaymentMethods: 1 }
    });

    this.modalEvents.statusChange.next(true);
    paymentModal.onDidDismiss()
      .then((d) => { this.modalEvents.statusChange.next(false); })
      .catch((e) => { this.modalEvents.statusChange.next(false); });
    paymentModal.present();
  }

  async openAddPaymentMethodModal(data?) {
    const addPaymentMethodModal = await this.modalCtrl.create({
      component: AddPaymentOptionPage,
      componentProps: { data: data ? data : {} },
      cssClass: ['modal', 'payment-modal']
    });

    this.modalEvents.statusChange.next(true);
    addPaymentMethodModal.onDidDismiss()
      .then(() => {
        this.modalEvents.statusChange.next(false);
      })
      .catch(() => { this.modalEvents.statusChange.next(false); });

    addPaymentMethodModal.present();
  }

  selectMethod(id: string) {
    for (let index = 0; index < this.methods.length; index++) {
      if (this.methods[index].id === id) {
        this.selectedPayment = index;
        // Set the selected method as payment method on the order
        this.basket.paymentMethodId = this.methods[index].id;
      }
    }
  }

  routeTo(url, params = {}) {
    this.router.navigateByUrl(url, {queryParams: params});
  }
}
