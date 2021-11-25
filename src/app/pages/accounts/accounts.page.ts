import { StorageService } from './../../services/storage.service';
import { SocketsService } from './../../services/sockets.service';
import { IonSlides } from '@ionic/angular';
import { environment } from '../../../environments/environment';
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import * as superagent from 'superagent';
import { Router } from '@angular/router';
import { Plugins } from '@capacitor/core';

@Component({
  selector: 'app-signup',
  templateUrl: './accounts.page.html',
  styleUrls: ['./accounts.page.scss'],
})
export class AccountsPage implements AfterViewInit {
  @ViewChild('Names', {static: false}) names: ElementRef<HTMLInputElement>;
  @ViewChild('PhoneNumber', {static: false}) phoneNumber: ElementRef<HTMLInputElement>;
  @ViewChild('VerificationCode', {static: false}) phoneNumberVerification: ElementRef<HTMLInputElement>;
  @ViewChild('Password', {static: false}) password: ElementRef<HTMLInputElement>;
  @ViewChild('NextButton', {static: false}) nextButton: ElementRef<HTMLButtonElement>;
  @ViewChild('IonSlides', {static: false}) ionSlides: IonSlides;
  @ViewChild('Instructions', {static: false}) instruction: ElementRef<HTMLParagraphElement>;
  @ViewChild('NextButtonText', {static: false}) nextButtonText: ElementRef<HTMLSpanElement>;
  @ViewChild('HeaderText', {static: false}) headerText: ElementRef<HTMLSpanElement>;

  isLoading = false;
  isError = false;
  isDriverSignin = false;
  currentSignupStep = 0;
  accountFinishupKey;
  data = { names: '', phoneNumber: '', password: '', code: '' };
  appId;
  intervals = [];

  constructor(
    private router: Router,
    private sockets: SocketsService,
    private storage: StorageService
  ) { }

  ngAfterViewInit() {
    // tslint:disable: max-line-length
    const fields = ['phoneNumber', 'phoneNumberVerification', 'names', 'password'];
    fields.forEach((field, index) => {
      const input = this[field].nativeElement;
      input.onpaste = (e) => {
        this.intervals.push(setTimeout(() => this.checkInputState(index, input), 50));
      };

      input.onkeyup = () => {
        this.checkInputState(index, input);
      };
    });

    this.nextButton.nativeElement.onclick = () => { this.requestPhoneNumberVerification(); };
    this.nextButton.nativeElement.disabled = true;
    this.ionSlides.lockSwipes(true);

    this.storage.getItem(environment.AppId, false)
      .then((appId) => {
        this.appId = appId;
      });
  }

  checkInputState(index: number, input: HTMLInputElement) {
    if (index === this.currentSignupStep) {
      if (index === 0) {
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (emailRegex.test(input.value)) {
          return this.check(true);
        }
        this.check(!((input.value.startsWith('0') && input.value.length !== 10) || (!input.value.startsWith('0') && input.value.length !== 12)) || input.value.length === 13);
      } else if (index === 1) {
        this.check(input.value.length === 4);
      } else if (index === 2) {
        this.check(input.value.length);
      } else {
        this.check(input.value.length >= 8);
      }
    }
  }

  check(condition) {
    if (condition) {
      this.nextButton.nativeElement.disabled = false;
    } else {
      this.nextButton.nativeElement.disabled = true;
    }
  }

  requestPhoneNumberVerification() {
    const data = { phoneNumber: this.phoneNumber.nativeElement.value.toLowerCase(), name: '', partnerId: environment.PARTNER_ID };

    // Make the phone number international
    if (data.phoneNumber.startsWith('0')) {
      let newPhoneNumber: any = data.phoneNumber.split('0');
      newPhoneNumber.splice(0, 1);
      newPhoneNumber = newPhoneNumber.join('0');
      data.phoneNumber = '+27' + newPhoneNumber;
      this.phoneNumber.nativeElement.value = data.phoneNumber;
    }

    this.nextButton.nativeElement.disabled = true;
    this.isLoading = true;
    superagent
      .post(environment.BACKEND + 'accounts')
      .send(data)
      .end((error, response) => {
        if (!error) {
          console.log(response.status)
          if (response.status === 200) {
            this.currentSignupStep++;
            this.ionSlides.lockSwipes(false);
            this.ionSlides.slideTo(this.currentSignupStep);
            this.ionSlides.lockSwipes(true);
            this.instruction.nativeElement.innerText = response.body.message;
            this.nextButtonText.nativeElement.innerText = 'Verify';
            this.nextButton.nativeElement.onclick = () => { this.verifyVerificationCode(); };
            this.isLoading = false;
          } else if (response.status === 202) {
            this.instruction.nativeElement.innerText = '';
            this.nextButtonText.nativeElement.innerText = 'Sign in';
            this.headerText.nativeElement.innerText = 'Sign in to your driver account';
            this.currentSignupStep = 3;
            this.isDriverSignin = true;
            this.ionSlides.lockSwipes(false);
            this.ionSlides.slideTo(this.currentSignupStep);
            this.ionSlides.lockSwipes(true);
            this.isLoading = false;
            this.nextButton.nativeElement.onclick = () => { this.signin(); };
          } else if (response.status === 404) {
            this.isError = true;
            this.isLoading = false;
            this.nextButton.nativeElement.disabled = false;
            // tslint:disable-next-line: max-line-length
            this.instruction.nativeElement.innerText = 'Partner account doesn\'t exist.';
          } else if (response.status === 208) {
            this.instruction.nativeElement.innerText = '';
            this.nextButtonText.nativeElement.innerText = 'Sign in';
            this.headerText.nativeElement.innerText = `Welcome back, ${response.body.names}`;
            this.currentSignupStep = 3;
            this.ionSlides.lockSwipes(false);
            this.ionSlides.slideTo(this.currentSignupStep);
            this.ionSlides.lockSwipes(true);
            this.isLoading = false;
            this.nextButton.nativeElement.onclick = () => { this.signin(); };
          }
        } else {
          if (response === undefined) {
            this.isError = true;
            this.isLoading = false;
            this.nextButton.nativeElement.disabled = false;
            // tslint:disable-next-line: max-line-length
            this.instruction.nativeElement.innerText = 'There was a server connection error. Check your internet connection and try again.';
          }
        }
      });
  }

  verifyVerificationCode() {
    this.isLoading = true;
    // tslint:disable-next-line: max-line-length
    let url = environment.BACKEND + `customers/verify-number?p=${this.phoneNumber.nativeElement.value}&c=${this.phoneNumberVerification.nativeElement.value}&type=create`;
    url = encodeURI(url);
    superagent
      .get(url)
      .end((error, response) => {
        if (!error) {
          if (response.body.isAuthorable) {
            this.isLoading = false;
            this.currentSignupStep++;
            this.ionSlides.lockSwipes(false);
            this.ionSlides.slideTo(this.currentSignupStep);
            this.ionSlides.lockSwipes(true);
            this.instruction.nativeElement.innerText = 'You\'re almost there...';
            this.nextButtonText.nativeElement.innerText = 'Next';
            this.nextButton.nativeElement.onclick = () => { this.getUsername(); };
            this.nextButton.nativeElement.disabled = true;
            this.isError = false;
            this.accountFinishupKey = response.body.key;
          } else {
            this.instruction.nativeElement.innerText = 'Invalid verification code.';
            this.isLoading = false;
            this.isError = true;
          }
        } else {
          if (response === undefined) {
            this.isError = true;
            this.isLoading = false;
            this.nextButton.nativeElement.disabled = false;
            // tslint:disable-next-line: max-line-length
            this.instruction.nativeElement.innerText = 'There was a server connection error. Check your internet connection and try again.';
          }
        }
      });
  }

  getUsername() {
    this.nextButton.nativeElement.onclick = () => { this.finishSignup(); };
    this.nextButton.nativeElement.disabled = true;
    this.nextButtonText.nativeElement.innerText = 'Finish up';
    this.instruction.nativeElement.innerText = 'Make sure it\'s secure, with a minimum of <b>8 characters.</b>';
    this.currentSignupStep++;
    this.ionSlides.lockSwipes(false);
    this.ionSlides.slideTo(this.currentSignupStep);
    this.ionSlides.lockSwipes(true);
  }

  finishSignup() {
    this.data = {
      names: this.names.nativeElement.value,
      phoneNumber: this.phoneNumber.nativeElement.value,
      password: this.password.nativeElement.value,
      code: this.phoneNumberVerification.nativeElement.value };
    this.isLoading = true;
    this.nextButton.nativeElement.disabled = true;
    superagent
      .post(environment.BACKEND + 'customers/finish-signup?key=' + this.accountFinishupKey)
      .send(this.data)
      .end((error, response) => {
        if (!error) {
          this.storage.setItem(environment.customerDataName, {token: response.body.token});
          this.sockets.createConnection()
            .then((s) => {
              this.intervals.forEach((interval) => {
                clearTimeout(interval);
              });
              this.router.navigate(['home']);
            });
        } else {
          if (response === undefined) {
            this.isError = true;
            this.isLoading = false;
            this.nextButton.nativeElement.disabled = false;
            // tslint:disable-next-line: max-line-length
            this.instruction.nativeElement.innerText = 'There was a server connection error. Check your internet connection and try again.';
          }
        }
      });
  }

  signin() {
    this.isLoading = true;
    this.nextButton.nativeElement.disabled = true;
    this.nextButtonText.nativeElement.innerText = 'Signing you in';
    const data = {
      phoneNumber: this.phoneNumber.nativeElement.value,
      password: this.password.nativeElement.value
    }, credentials = 'Account ' + btoa([data.phoneNumber, data.password].join(':'));
    superagent
      .get(environment.BACKEND + 'accounts?partnerId=' + environment.PARTNER_ID)
      .set('Authorization', credentials)
      .end((error, response) => {
        if (response.status === 200) {
          this.intervals.forEach((interval) => {
            clearTimeout(interval);
          });

          // tslint:disable-next-line: max-line-length
          this.storage.setItem(environment.customerDataName, this.isDriverSignin ? {
            token: response.body.token,
            type: 'partner',
            name: response.body.name,
            username: response.body.username } : { token: response.body.token, type: 'account' }).then(() => {
            this.sockets.createConnection()
              .then((s) => {
                this.phoneNumber.nativeElement.value = '';
                this.names.nativeElement.value = '';
                this.phoneNumberVerification.nativeElement.value = '';
                this.password.nativeElement.value = '';
                this.isLoading = false;
                this.isError = false;
                this.headerText.nativeElement.innerHTML = 'Enter your phone number';
                this.nextButtonText.nativeElement.innerHTML = 'Next';
                this.nextButton.nativeElement.onclick = () => { this.requestPhoneNumberVerification(); };
                this.instruction.nativeElement.innerHTML = 'Use the international format, South African format will be used if not.';
                this.currentSignupStep = 0;
                this.ionSlides.lockSwipes(false);
                this.ionSlides.slideTo(this.currentSignupStep);
                this.ionSlides.lockSwipes(true);

                this.router.navigate(this.isDriverSignin ? ['driver-navigation'] : ['home']);
                this.isDriverSignin = false;
                Plugins.Toast.show({ text: 'Succesful.', position: 'bottom' });
              });
          });
        } else if (response.status === 403) {
          this.isError = true;
          this.isLoading = false;
          this.nextButtonText.nativeElement.innerText = 'Sign in';
          this.nextButton.nativeElement.disabled = false;
          Plugins.Toast.show({ text: 'Incorrect credentials entered, try again.', position: 'bottom' });
        } else if (response.status === 404) {
          Plugins.Toast.show({ text: 'Account not found.', position: 'bottom' });
        }
      });
  }

  goToForgotPasswordPage() {
    this.router.navigate(['forgot-password'], {queryParams: {phoneNumber: this.phoneNumber.nativeElement.value}});
  }
}
