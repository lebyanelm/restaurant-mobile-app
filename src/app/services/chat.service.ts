import { StorageService } from 'src/app/services/storage.service';
import { Branch } from './../interfaces/Branch';
import { SocketsService } from './sockets.service';
import { Message } from './../interfaces/Message';
import { ToastService } from './toast.service';
import { environment } from './../../environments/environment';
import { BasketService } from './basket.service';
import { ModalEventsService } from './modal-events.service';
import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular';
import * as superagent from 'superagent';
import { Subject } from 'rxjs';
import { Plugins } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  hasConnection = false;
  connectedBranch: Branch;
  onMessage: Subject<Message> = new Subject<Message>();
  token: string;
  messages: Message[] = [];
  isChatOpen = false;

  constructor(
    private modalCtrl: ModalController,
    private modalEvents: ModalEventsService,
    private basket: BasketService,
    private toast: ToastService,
    private sockets: SocketsService,
    private storage: StorageService
  ) {
    this.sockets.createConnection()
      .then((connection: any) => {
        connection.on('message', (message) => {
          // this.messages.push(message);
          this.onMessage.next(message);
          Plugins.LocalNotifications.schedule({
            notifications: [{
              id: message.id,
              title: 'Grillo\'s Peri-Peri & Pizza',
              body: message.body,
              attachments: message.attachments
            }]
          });
        });
      });
  }

  closeChatModal() {
    this.modalCtrl.dismiss();
    this.modalEvents.statusChange.next(false);
    this.isChatOpen = false;
  }

  connect(token: string, partnerId: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let coords;
      if (this.basket.destination) {
        coords = this.basket.destination.coords;
      } else {
        await navigator.geolocation.getCurrentPosition((position) => {
          coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        }, () => reject({ body: {
          message: 'Unable to load your location. Make sure location is enabled, and check your internet connection.' } }), {
          enableHighAccuracy: true
        });
      }

      if (coords) {
        // Send a message connect request
        this.token = token;
        superagent
          .post(environment.BACKEND + 'messaging/connect')
          .set('Authorization', token)
          .send({ coords, partnerId })
          .end((error, response) => {
            if (response) {
              if (response.ok) {
                this.hasConnection = true;
                this.connectedBranch = response.body.branch;
                resolve(response);
              } else if (response.status === 306) {
                this.toast.showAlert(false,  {
                  header: response.body.reason,
                  message: 'Nearest branch is currently offline, and not available to connect with on chat. Please try again later.',
                  buttons: [{ text: 'Okay' }]
                }).then(() => {
                  this.modalCtrl.dismiss()
                    .then(() => this.modalCtrl.dismiss());
                });
              } else if (response.status === 416) {
                this.toast.showAlert(false,  {
                  header: response.body.reason,
                  message: 'You seem to be far from any of our branches. Please do consider voting for your area.',
                  buttons: [{ text: 'Vote' }, { text: 'Cancel', role: 'danger' }]
                }).then((data: any) => {
                  if (data.data === 0) {
                    superagent
                      .post(environment.BACKEND + 'areas/vote')
                      .set('Authorization', token)
                      .send({ coords, partnerId })
                      .end((e, r) => {
                        if (r) {
                          if (r.status === 200) {
                            this.toast.show('Your vote has been noted.');
                          } else if (r.status === 208) {
                            this.toast.show('Your vote has already been placed.');
                          } else {
                            this.toast.show('There was an error while placing your vote.');
                          }
                        } else {
                          this.toast.showAlert(true);
                        }
                      });
                  }

                  this.modalCtrl.dismiss()
                    .then(() => this.modalCtrl.dismiss());
                });
              } else if (response.status === 404) {
                this.toast.showAlert(false,  {
                  header: response.body.reason,
                  // tslint:disable-next-line: max-line-length
                  message: 'Something unexpected happened. Try restarting the app, contact us if issue persists.',
                  buttons: [{ text: 'Okay' }]
                }).then(() => {
                  this.modalCtrl.dismiss()
                    .then(() => this.modalCtrl.dismiss());
                });
              } else if (response.status === 406) {
                this.toast.showAlert(false,  {
                  header: response.body.reason,
                  // tslint:disable-next-line: max-line-length
                  message: 'We are currently offline, try again later on during our working hours.',
                  buttons: [{ text: 'Okay' }]
                }).then(() => {
                  this.modalCtrl.dismiss()
                    .then(() => this.modalCtrl.dismiss());
                });
              } else if (response.status === 500) {
                this.toast.showAlert(false, {
                  header: response.body.reason,
                  message: 'Something unexpected happened. This is usually an issue from our side, let us know if the issue persists.',
                  buttons: [{ text: 'Okay' }]
                });
              }
            } else {
              this.toast.showAlert(true)
                .then(() => {
                  this.modalCtrl.dismiss()
                    .then(() => this.modalCtrl.dismiss());
                });
            }
          });
      } else {
        reject({ body: { message: 'Unable to load your location. Make sure location is enabled, and check your internet connection.' } });
      }
    });
  }

  sendMessage(msg: Message) {
    return new Promise((resolve, reject) => {
      superagent
        .post(environment.BACKEND + 'messaging/message')
        .send({...msg, branchId: this.connectedBranch.id})
        .set('Authorization', this.token)
        .end((error, response) => {
          if (response) {
            if (response.status === 200) {
              resolve(response.body.message);
            } else {
              this.toast.show('Couldn\'t send you message. Please try again and let us know when the problem persits.')
            }
          } else {
            this.toast.showAlert(true);
          }
        });
    });
  }

  setMessageAsRead() {
    this.storage.getItem(environment.customerDataName)
      .then((data) => {
        superagent
          .post([environment.BACKEND, 'messaging/message/status'].join(''))
          .set('Authorization', data.token)
          .send({ branchId: this.connectedBranch.id, customerId: data.id, partnerId: data.partnerId, isPartner: false, status: 2 })
          .end((_, response) => {
            if (response && response.status === 200) {
              if (data.messages[this.connectedBranch.id]) {
                for (let index = data.messages[this.connectedBranch.id].length - 1; index !== 0; index--) {
                  if (data.messages[this.connectedBranch.id][index].status === 1 && data.messages[this.connectedBranch.id][index].type === 'inbound')
                    data.messages[this.connectedBranch.id][index].status = 2;
                  else
                    break;
                }

                this.storage.setItem(environment.customerDataName, data);
              }
            }
          });
      });
  }
}
