import { Router } from '@angular/router';
import { StorageService } from './storage.service';
import { SocketsService } from 'src/app/services/sockets.service';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StatusService {
  // tslint:disable variable-name
  private _status = false;
  private _branch;
  private data;
  constructor(
    private sockets: SocketsService,
    private storage: StorageService,
    private router: Router
  ) {
    this.storage
      .getItem(environment.customerDataName)
      .then((data) => {
        this.data = data;
        if (!this.data) {
          this.router.navigate(['accounts']);
        } else {
          this.sockets.onConnect.subscribe((connection: any) => {
            if (this.branch !== undefined) {
              this.setBranch(this.branch);
            }
          });
        }
      });
  }

  set status(status) {
    this._status = status;

    this.sockets
      .createConnection()
      .then((connection: any) => {
        connection.emit('set status', { partnerId: this.data.id, socketId: connection.id, state: this.status });
      });
  }

  get status() {
    return this._status;
  }

  setBranch(branch) {
    return new Promise((resolve, reject) => {
      this._branch = branch;

      this.sockets
        .createConnection()
        .then((connection: any) => {
          connection.emit('set branch', branch, () => {
            resolve();
            if (this.status !== undefined) {
              this.status = this.status;
            } else {
              this.status = true;
            }
          });
        });
    });
  }

  get branch() {
    return this._branch;
  }
}
