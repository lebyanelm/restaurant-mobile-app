import { Plugins, ToastShowOptions } from '@capacitor/core';
import { AlertComponent } from './../alert/alert.component';
import { Injectable } from '@angular/core';
import { ToastController, AlertController, Platform, ModalController } from '@ionic/angular';
import { ToastOptions, AlertOptions } from '@ionic/core';

@Injectable({
  providedIn: 'root'
})

export class ToastService {
  constructor(
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private platform: Platform,
    private modalCtrl: ModalController) { }

  show(message: string) {
    return Plugins.Toast.show({ text: message, position: 'bottom' });
  }

  // tslint:disable-next-line: variable-name
  showAlert(isInternetConnection: boolean | any, options?: AlertOptions, handler?: () => void, _t?: any) {
    return new Promise(async (resolve, reject) => {
      if (isInternetConnection !== undefined && typeof isInternetConnection === 'object') {
        options = isInternetConnection;
        isInternetConnection = false;
      } else if (isInternetConnection && typeof isInternetConnection === 'boolean') {
        options = {
          header: 'No Connection',
          message: 'You are not connected to the internet. Check your connection and try again.',
          buttons: [{ text: 'Retry Again', handler: () => {
            if (handler && _t) { handler.bind(_t); } else { this.modalCtrl.dismiss(); } } }] };
      }
      const alert = await this.modalCtrl.create({
        component: AlertComponent,
        mode: 'ios',
        cssClass: 'alert-modal',
        componentProps: {options}
      });

      alert.present();

      alert.onDidDismiss()
        .then((d) => { resolve(d); });
    });
  }
}
