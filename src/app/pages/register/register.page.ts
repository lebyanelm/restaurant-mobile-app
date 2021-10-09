import { Plugins } from '@capacitor/core';
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import * as superagent from 'superagent';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  isLoading: boolean = false;
  data: any = {};
  error = '';

  constructor(private router: Router) {}

  ngOnInit() {}

  register() {
    this.isLoading = true;
    this.error = '';

    if (this.data.phoneNumber.startsWith('0')) {
      let newPhoneNumber: any = this.data.phoneNumber.split('0');
      newPhoneNumber.splice(0, 1);
      newPhoneNumber = newPhoneNumber.join('0');
      this.data.phoneNumber = '+27' + newPhoneNumber;
    }

    console.log(this.data);

    Plugins.Toast.show({ text: environment.BACKEND });
    superagent
      .post([environment.BACKEND, 'accounts'].join(''))
      .send({ ...this.data, partnerId: environment.PARTNER_ID })
      .end((_, response) => {
        console.log(response);
        this.isLoading = false;
        if (response) {
          if (response.status === 200) {
            Plugins.Toast.show(response.body.message);
            this.router.navigate(['phonenumber-verification'], {
              queryParams: { phoneNumber: this.data.phoneNumber },
            });
          } else {
            if (response.status === 208) {
              this.error = 'Account already exists, consider logging in';
            }
          }
        }
      });
  }
}
