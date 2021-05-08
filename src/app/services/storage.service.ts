import { ToastService } from './toast.service';
import { StorageChangeEvent } from './../interfaces/StorageChangeEvent';
import { Platform } from '@ionic/angular';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  change: Subject<StorageChangeEvent<any>> = new Subject<StorageChangeEvent<any>>();
  data: any;

  constructor(
    private platform: Platform,
    private toast: ToastService,
    private router: Router
  ) { }

  public setItem(name: string, data: any, isJSON = true): Promise<any> {
    return new Promise((resolve, reject) => {
      if (data.constructor !== String) {
        if (data.constructor === Object) {
          data = JSON.stringify(data);
        }
      }

      localStorage.setItem(name, data);
      this.change.next({name, data: isJSON ? JSON.parse(data) : data});
      resolve({name, data});
    });
  }

  public getItem(name: string, isJSON = true, isShowError = true): Promise<any> {
    return new Promise((resolve, reject) => {
      if (localStorage.getItem(name) === null) {
        if (name === environment.customerDataName) {
          if (isShowError) {
            this.noSession();
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      } else {
        resolve(isJSON ? JSON.parse(localStorage.getItem(name)) : localStorage.getItem(name));
      }
    });
  }

  public remove(name: string): Promise<void> {
    localStorage.removeItem(name);
    return new Promise((resolve, reject) => {
      resolve();
      this.change.next({name, data: null});
    });
  }

  public noSession() {
    this.toast.showAlert({
      header: 'Oops!',
      subHeader: 'No session found.',
      message: 'Seems like your local data has been cleared, sign in again to resolve this issue.',
    }).then((t) => {
      this.router.navigate(['welcome']);
    });
  }
}
