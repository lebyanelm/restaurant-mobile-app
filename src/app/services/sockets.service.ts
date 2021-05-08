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
  providedIn: 'root'
})
export class SocketsService {
  connection;
  onConnect: Subject<any> = new Subject<any>();
  hasDisconnectedBefore = false;

  constructor(
    private storage: StorageService,
    private toast: ToastService,
    private events: EventsService,
    private platform: Platform
  ) {
  }

  createConnection(): Promise<null> {
    return new Promise((resolve, _) => {
      this.storage.getItem(environment.customerDataName)
        .then((data) => {
          if (!this.connection) {
            if (data) {
              this.storage.getItem(environment.driverDataName, true)
                .then((driverData) => {
                  console.log(driverData, data.type)
                  // tslint:disable-next-line: max-line-length
                  this.connection = connect(environment.IO, {
                    path: environment.production ? '/partners/socket.io' : '/socket.io/',
                    query: {
                      token: data.token,
                      type: data.type === 'partner' ? 'driver' : 'account',
                      username: data.type === 'partner' ? driverData.username : null,
                      name: data.type === 'partner' ? driverData.name : null,
                      partnerId: environment.PARTNER_ID },
                    upgrade: false,
                    transports: ['websocket']});

                  this.connection.on('authenticated', (update) => {
                    resolve(this.connection);
                    this.onConnect.next(this.connection);

                    this.storage.setItem(environment.customerDataName, update);
                    console.log('SocketIO: Connected.');
                  });

                  this.connection.on('tds authenticate', (payload) => {
                    this.toast.show('Redirecting...');
                    // HTML content to pass to the payment modal as Base64 Text URL
                    // const tdsPageHtmlLoader = `
                    // <html>
                    // <head></head>
                    //   <body>
                    //     <form action="${payload.acsUrl}" method="POST" id="tds-form">
                    //       <input type="hidden" name="PaReq" value="${payload.payload}">
                    //       <input type="hidden" name="TermUrl" value="https://3dfbcccbefe3.ngrok.io/payment-authorized">
                    //       <input type="hidden" name="MD" value="${payload.transactionIndex}">
                    //     </form>
                    //   </body>
                    //   <script type="text/javascript">
                    //     document.getElementById("tds-form").submit();
                    //     console.log('Being executed.')
                    //   </script>
                    // </html>
                    // `,
                    // tdsPageContentUrl = 'data:text/html;base64,' + btoa(tdsPageHtmlLoader);

                    // There's going to be a production mode and test mode 3D Auth Modal
                    if (this.platform.is('desktop')) {
                      // eslint-disable-next-line max-len
                      // const refWindow = window.open('', '_blank', 'hidden=no,location=no,clearsessioncache=yes,clearcache=yes,height=650,width=350');
                      // refWindow.document.body.innerHTML = tdsPageHtmlLoader;
                      // refWindow.document.getElementsByTagName('form')[0].submit();
                      // refWindow.document.onloadstart = (event) => {
                      //   console.log(event);
                      // }

                    } else {
                      // eslint-disable-next-line max-len
                      // const refWindow = InAppBrowser.create(tdsPageContentUrl, '', 'hidden=no,location=yes,clearsessioncache=yes,clearcache=yes,height=400,width=200');
                      // refWindow.on('loadstart')
                      //   .subscribe((event) => {
                      //     if (event.url.match('mobile/close')) {
                      //       refWindow.close();
                      //     }
                      //   });
                      // refWindow.on('exit')
                      //   .subscribe((e) => {
                      //   })
                    }
                  });

                  this.connection.on('order status change', (order) => {
                    this.events.processed.next(order);
                    this.events.notification.next('processed');
                    Plugins.LocalNotifications.schedule({
                      notifications: [{
                        id: 1,
                        title: 'Your order has been processed',
                        groupSummary: true,
                        body: `Order #${order.id} has been processed, a driver will be delivering your order in a bit.`,
                        sound: '/assets/tones/processed.mp3'
                      }]
                    });
                  });

                  this.connection.on('dispatch', (order: Order) => {
                    this.events.dispatched.next(order);
                    this.events.notification.next('dispatched');
                  });

                  this.connection.on('authentication error', () => {
                    // tslint:disable-next-line: max-line-length
                    // eslint-disable-next-line max-len
                    this.toast.showAlert({header: 'Sync Error', message: 'An error occured while trying to sync with the NextApp server, it\'s possible that your previous used account does not exist. Visit our Forum for help.'});
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
