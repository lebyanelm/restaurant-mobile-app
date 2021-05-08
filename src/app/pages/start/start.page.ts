import { ToastService } from './../../services/toast.service';
import { SocketsService } from './../../services/sockets.service';
import { StorageService } from './../../services/storage.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { IonSlides, Platform } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import * as helpers from '../../helpers/helpers';
import { Router } from '@angular/router';
import * as superagent from 'superagent';
import { Plugins } from '@capacitor/core';

@Component({
  selector: 'app-start',
  templateUrl: './start.page.html',
  styleUrls: ['./start.page.scss'],
})
export class StartPage implements OnInit {
  @ViewChild('Slider', {static: false}) slider: IonSlides;
  appId: string;
  isLoading = true;

  constructor(
    private storage: StorageService,
    private router: Router,
    private platform: Platform,
    private sockets: SocketsService,
    private toast: ToastService
  ) { }

  ngOnInit() {
    this.platform.ready()
      .then(() => {
        // Verify a user has logged in, if not navigate to the sign in/up page
        this.storage.getItem(environment.customerDataName, true, false)
        .then((data) => {
          if (data) {
            // Create an a socket connection if there's an account signed in
            this.sockets.createConnection()
              .then(() => {
                if (data && data.type === 'account') {
                  // Then send analytics ntag data to the server
                  superagent.
                    post(environment.BACKEND + 'ntag')
                      .send({ uid: data.id, partnerId: environment.PARTNER_ID })
                      .end((_,__) => {});
                }
              });

            if (data.type === 'account') {
              this.router.navigate(['home']);
            } else {
              this.router.navigate(['driver-navigation']);
            }
          } else {
            this.router.navigate(['welcome']);
          }
          Plugins.SplashScreen.hide();
        }).catch((reason) => {
          Plugins.SplashScreen.hide();
          this.router.navigate(['welcome']);
        });
      });
  }
}
