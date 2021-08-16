import { ChatService } from 'src/app/services/chat.service';
import { SocketsService } from '../../services/sockets.service';
import { ToastService } from '../../services/toast.service';
import { ModalEventsService } from './../../services/modal-events.service';
import { StorageService } from './../../services/storage.service';
import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { ModalController, Platform } from '@ionic/angular';
import { ChatComponent } from 'src/app/components/chat/chat.component';
import { ClipboardPluginWeb, Plugins } from '@capacitor/core';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
  providers: [ ClipboardPluginWeb, Platform, ToastService ]
})
export class AccountComponent implements OnInit {
  data;
  constructor(
    private storage: StorageService,
    private router: Router,
    private modalCtrl: ModalController,
    private modalEvents: ModalEventsService,
    private clipboard: ClipboardPluginWeb,
    private toast: ToastService,
    private platform: Platform,
    private sockets: SocketsService,
    private chatService: ChatService
  ) { }

  ngOnInit() {
    this.storage.getItem(environment.customerDataName)
      .then((data) => {
        this.data = data;

        // Listen for changes on the data to update it on the page
        this.storage.change.subscribe((data) => {
          if (data.name === environment.customerDataName) {
            this.data = data.data;
          }
        });
      });
  }

  routeTo(path: string, extras?: any): void {
    this.router.navigate([path], {queryParams: extras || {}});
  }

  async openChatModal() {
    const chatModal = await this.modalCtrl.create({
      component: ChatComponent,
      cssClass: ['modal', 'chat-modal'],
      componentProps: { data: this.data }
    });

    chatModal.present()
      .then(() => {
        if (this.chatService.connectedBranch) this.chatService.setMessageAsRead(); });
    this.modalEvents.statusChange.next(true);
    chatModal.onDidDismiss()
      .then(() => {
        this.modalEvents.statusChange.next(false);
      });
  }

  referApp() {
    Plugins.Share.share({ text: 'I refer you this app to place orders and get delicious food https://play.google.com/store/details?id=com.marios.pizza.grill, place an order from one our branches :)' })
  }

  signout() {
    this.sockets.disconnect();
    this.storage.remove(environment.customerDataName)
      .then(() => {
        this.router.navigate(['welcome']);
      }).catch(() => {
        this.toast.show('There was an error signing you out. Let us know if the problem persists.');
      });
  }
}
