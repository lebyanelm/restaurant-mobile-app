import { Router } from '@angular/router';
import { SocketsService } from 'src/app/services/sockets.service';
import { StorageService } from 'src/app/services/storage.service';
import { Plugins } from '@capacitor/core';
import { Component, OnDestroy, OnInit } from '@angular/core';
import * as superagent from 'superagent';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.page.html',
  styleUrls: ['./signin.page.scss'],
})
export class SigninPage implements OnInit, OnDestroy {
  isLoading: boolean = false;
  data: any = { phoneNumber: '', password: '' };
  error = '';
  
  constructor(
    private storage: StorageService,
    private sockets: SocketsService,
    private router: Router
  ) {  }

  ngOnInit() {
    Plugins.Keyboard.show();
  }

  ngOnDestroy () {
    Plugins.Keyboard.hide();
  }

  login(): void {
    this.isLoading = true;
    this.error = '';

    // Set the phone number to be in the required format
    if (this.data.phoneNumber.startsWith('0')) {
      let newPhoneNumber: any = this.data.phoneNumber.split('0');
      newPhoneNumber.splice(0, 1);
      newPhoneNumber = newPhoneNumber.join('0');
      this.data.phoneNumber = '+27' + newPhoneNumber;
    }

    // Credentials of the user seperated with a colon (:) for eased parsing in the server
    const credentials = [this.data.phoneNumber, this.data.password].join(':'),
          // Convert the credentials to Base64 for attaching them to the Authorization Request Header
          loginData = ['Basic', btoa(credentials)].join(' ');
    
    // Send the Auth Request
    superagent
      .get([environment.BACKEND, 'accounts?partnerId=' + environment.PARTNER_ID].join(''))
      .set('Authorization', loginData)
      .end((_, response) => {
        if (response.status === 200) {
          // Save the token recieved for automatic logins next time
          this.storage.setItem(environment.customerDataName, {
            type: response.body.isDriver ? 'partner' : 'account',
            token: response.body.token
          }).then(() => {
            // Check if driver data has to be saved or not
            if (response.body.isDriver) {
              this.storage.setItem(environment.driverDataName, { name: response.body.name, username: response.body.username })
                .then(() => finaliseAuthenticationProcess(this));
            } else {
              finaliseAuthenticationProcess(this);              
            }

            // Final route all conditions will end up onto
            function finaliseAuthenticationProcess(_self: SigninPage) {
              _self.sockets.createConnection()
                .then(() => {
                  // Reset the page
                  _self.isLoading = false;
                  _self.data = {};
                  
                  _self.router.navigate(response.body.isDriver ? ['driver-navigation'] : ['home']);
                }).catch(() => {
                  _self.error = 'An error occured while trying to establish a connection. Please try again, let us know if problem persists.'
                });
            }
          });
        } else if (response.status === 403) {
          this.isLoading = false;
          this.error = 'Incorrect credentials entered.';
        } else if ( response.status === 404 ) {
          this.isLoading = false;
          this.error = 'Account not found, please register for an account.';
        } else {
          this.isLoading = false;
          this.error = 'Something wrong happened, let us know if this persists.';
        }
      });
  }
}
