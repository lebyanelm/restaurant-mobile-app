import { ChatService } from 'src/app/services/chat.service';
import { User } from 'src/app/interfaces/User';
import { environment } from 'src/environments/environment';
import { StorageService } from 'src/app/services/storage.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { Order } from 'src/app/interfaces/Order';
import { Plugins } from '@capacitor/core';
import * as superagent from 'superagent';

@Component({
  selector: 'app-order-tracking',
  templateUrl: './order-tracking.page.html',
  styleUrls: ['./order-tracking.page.scss'],
})
export class OrderTrackingPage implements OnInit {
  data: User;
  order: Order;
  id: string;
  steps = [];

  constructor(
    private router: Router,
    private storage: StorageService,
    private activatedRoute: ActivatedRoute,
    private chat: ChatService
  ) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe((params) => {
      this.id = params.id;
      this.storage.getItem(environment.customerDataName)
        .then((data) => {
          this.data = data;
          for (let order of this.data.orders) {
            if (order.id === this.id) {
              this.order = order;
              console.log(this.order);
              break;
            }
          }
        });
    });
  }

  cancelOrder() {
    // Check if the order is at a stage to be cancelled
    if (this.order.status <= 2) {
      superagent
        .post([environment.BACKEND, 'order/status'])
        .send({
          orderIds: [this.order.id],
          branchId: this.order.branch.id,
          status: 6,
          partnerId: this.data.partnerId })
        .end((_, response) => {
          console.log(response);
        })
    } else {
      Plugins.Toast.show({ text: 'Error: Order can not be cancelled. Contact us instead.' });
      console.log('Error: Order can not be cancelled. Contact us instead.')
    }
  }

  openChat() {
    this.chat.openModal();
  }

  closeOrderTrackingPage() {
    this.storage.remove(environment.ORDER);
    this.router.navigate(['home']);
  }
}
