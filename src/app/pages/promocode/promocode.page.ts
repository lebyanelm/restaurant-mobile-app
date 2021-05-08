import { ModalEventsService } from './../../services/modal-events.service';
import { ModalController } from '@ionic/angular';
import { ToastService } from './../../services/toast.service';
import { Component, OnInit } from '@angular/core';
import * as superagent from 'superagent';
import { environment } from 'src/environments/environment';
import { BasketService } from 'src/app/services/basket.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-promocode',
  templateUrl: './promocode.page.html',
  styleUrls: ['./promocode.page.scss'],
})
export class PromocodePage implements OnInit {
  promocode = '';
  constructor(
    private basket: BasketService,
    private toast: ToastService,
    private modalEvents: ModalEventsService,
    private router: Router,
    private modalCtrl: ModalController
  ) { }

  ngOnInit() {
  }

  verifyPromocode() {
    superagent
      .get(environment.BACKEND + 'promocode?code=' + this.promocode + '&partnerId=' + environment.PARTNER_ID)
      .end((error, response) => {
        if (response) {
          if (response.status === 200) {
            this.toast.show(`${response.body.promocode.discount}% has been applied to your basket.`);
            this.basket.applyPromocode(response.body.promocode);
            this.modalCtrl.dismiss();
          } else if (response.status === 404) {
            this.toast.show(`Promocode expired or does not exist.`);
          }
        }
      });
  }
}
