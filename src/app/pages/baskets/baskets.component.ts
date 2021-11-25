import { ToastService } from 'src/app/services/toast.service';
import { OrdersPage } from './../orders/orders.page';
import { Order } from './../../interfaces/Order';
import { StorageService } from './../../services/storage.service';
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { IonSlides, ModalController } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import * as superagent from 'superagent';

@Component({
  selector: 'app-baskets',
  templateUrl: './baskets.component.html',
  styleUrls: ['./baskets.component.scss'],
})
export class BasketsComponent implements AfterViewInit {
  isDeliveredShown = false;
  data;
  delivered: Order[] = [];

  constructor(
    private storage: StorageService,
    private toastService: ToastService,
    private router: Router
  ) {}
  ngAfterViewInit() {
    // Get users orders from the local storage
    this.storage.getItem(environment.customerDataName).then((data) => {
      if (data) {
        this.data = data;
        this.delivered = this.data.orders.reverse();
        this.storage.change.subscribe((_data) => {
          if (_data.name === environment.customerDataName)
            this.delivered = _data.data.orders.reverse();
        });
      } else {
        this.storage.noSession();
      }
    });
  }

  routeTo(id: string) {
    this.router.navigate(['order-tracking'], { queryParams: { id } });
  }

  removeOrders() {
    superagent
      .delete([environment.BACKEND, 'customers/orders'].join(''))
      .set('Authorization', this.data.token)
      .end((_, response) => {
        if (response) {
          if (response.status === 200) {
            this.data.orders = [];
            this.storage.setItem(environment.customerDataName, this.data);
          } else {
            this.toastService
              .showAlert({
                header: response.body.reason || 'ERROR: SOMETHING WENT WRONG',
                // tslint:disable-next-line: max-line-length
                message:
                  response.body.message ||
                  'An unexpected error has occured while removing your favorites from your account, sorry for the inconvinience.',
                buttons: [{ text: 'Retry again' }],
              })
              .then((value) => {
                if (value === 0) {
                  this.removeOrders();
                }
              });
          }
        }
        {
          this.toastService
            .showAlert({
              header: 'ERROR: YOU HAVE NO INTERNET CONNECTION',
              // tslint:disable-next-line: max-line-length
              message:
                response.body.message ||
                'Please check your internet connection and try again. We might be offline, contact us if problem is on our side.',
              buttons: [{ text: 'Retry again' }],
            })
            .then((value) => {
              if (value === 0) {
                this.removeOrders();
              }
            });
        }
      });
  }
}
