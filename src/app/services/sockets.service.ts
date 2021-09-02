// import { InAppBrowser } from '@ionic-native/in-app-browser';
import { EventsService } from './events';
import { StorageService } from './storage.service';
import { environment } from './../../environments/environment';
import { Injectable } from '@angular/core';
import { connect } from 'socket.io-client';
import { ToastService } from './toast.service';
import { Subject } from 'rxjs';
import { Order } from '../interfaces/Order';
import { Plugins } from '@capacitor/core';
import { StatusService } from './status.service';
import * as superagent from 'superagent';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class SocketsService {
  connection;
  onConnect: Subject<any> = new Subject<any>();
  onPaymentStatus: Subject<any> = new Subject<any>();
  hasDisconnectedBefore = false;

  constructor(
    private storage: StorageService,
    private toast: ToastService,
    private events: EventsService,
    private platform: Platform
  ) {}

  createConnection(): Promise<null> {
    return new Promise((resolve, _) => {
      this.storage.getItem(environment.customerDataName).then((data) => {
        if (!this.connection) {
          if (data) {
            this.storage
              .getItem(environment.driverDataName, true)
              .then((driverData) => {
                // tslint:disable-next-line: max-line-length
                this.connection = connect(environment.IO, {
                  path: environment.production
                    ? '/partners/socket.io'
                    : '/socket.io/',
                  query: {
                    token: data.token,
                    type: data.type === 'partner' ? 'driver' : 'account',
                    username:
                      data.type === 'partner' ? driverData.username : null,
                    name: data.type === 'partner' ? driverData.name : null,
                    partnerId: environment.PARTNER_ID,
                  },
                  upgrade: false,
                  transports: ['websocket'],
                });

                this.connection.on('authenticated', (update) => {
                  resolve(this.connection);
                  this.onConnect.next(this.connection);

                  this.storage.setItem(environment.customerDataName, update);
                  console.log('SocketIO: Connected.');
                });

                this.connection.on('payment-status', (payload) => {
                  // Forward the payment status to the payment order instance
                  this.onPaymentStatus.next(payload);
                });

                this.connection.on('order-status-change', (order) => {
                  this.events.status.next(order);
                });

                this.connection.on('dispatch', (order: Order) => {
                  this.events.dispatched.next(order);
                });

                this.connection.on('authentication error', () => {
                  // tslint:disable-next-line: max-line-length
                  // eslint-disable-next-line max-len
                  this.toast.showAlert({
                    header: 'Sync Error',
                    message:
                      "An error occured while trying to sync with the NextApp server, it's possible that your previous used account does not exist. Visit our Forum for help.",
                  });
                });

                this.connection.on('disconnect', () => {
                  this.hasDisconnectedBefore = true;
                });

                // Await driver location as order is the way and has been processed
                this.connection.on('location dispatch', (location) => {
                  this.events.location_dispatch.next(location);
                });
              });
          }
        } else {
          resolve(this.connection);
        }
      });
    });
  }

  disconnect() {
    if (this.connection) {
      this.storage.remove(environment.ORDER);
      this.connection.disconnect();
      this.connection = null;
    }
  }
}
