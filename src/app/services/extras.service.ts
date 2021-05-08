import { Injectable } from '@angular/core';
import { get } from 'superagent';
import { environment } from 'src/environments/environment';
import { ToastService } from './toast.service';
import { Extra } from '../interfaces/Extra';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class ExtrasService {
  private id: string;
  private _extras: Extra[] = [];

  constructor(
    private toast: ToastService,
    private storage: StorageService
  ) {
    this.id = environment.PARTNER_ID;
  }
  getExtras(extras: string[]): Promise<Extra[]> {
    return new Promise((resolve, reject) => {
      get(environment.BACKEND + 'extras?partnerId=' + this.id)
      .end((error, response) => {
        if (!error) {
          const _e = [];
          this._extras = response.body.extras || [];
          this._extras.forEach((extra: Extra) => {
            if (extras.includes(extra.id)) {
              _e.push(extra);
            }
            resolve(_e);
          });
        } else {
          if (response) {
            this.toast.showAlert({
              message: response.body.reason,
              buttons: [{ text: 'Retry', handler: this.getExtras }]});
          } else {
            this.toast.showAlert({
              message: 'You are not connected to the internet. Check your connection and try again.',
              buttons: [{ text: 'Retry', handler: this.getExtras }]});
          }
          reject(error);
        }
      });
    });
  }

  getExtra(id: string): Promise<Extra> {
    return new Promise((resolve, reject) => {
      this.getExtras([id])
        .then((extras: Extra[]) => {
          extras.forEach((extra) => {
            if (extra.id === id) {
              resolve(extra);
            }
          });
        }).catch((e) => resolve(e));
    });
  }
}
