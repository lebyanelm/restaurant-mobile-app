import { BrowserPageComponent } from './../components/browser-page/browser-page.component';
import { ModalController } from '@ionic/angular';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BrowserPageService {

  constructor(
    private modalCtrl: ModalController
  ) { }

  openUrl(url: string) {
    return new Promise(async (resolve, reject) => {
      const browserPageModal = await this.modalCtrl.create({
        component: BrowserPageComponent,
        componentProps: {
          url
        }
      });

      browserPageModal.onDidDismiss()
        .then((data) => resolve(data));

      browserPageModal.present();
    });
  }
}
