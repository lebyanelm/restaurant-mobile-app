import { SocketsService } from './../../services/sockets.service';
import { StorageService } from './../../services/storage.service';
import { IonSlides } from '@ionic/angular';
import {
  Component,
  OnInit,
  Input,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import * as superagent from 'superagent';
import { environment } from 'src/environments/environment';
import { ThrowStmt } from '@angular/compiler';
import { Plugins } from '@capacitor/core';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
})
export class ForgotPasswordPage implements AfterViewInit {
  @ViewChild('IonSlides', { static: false }) ionSlides: IonSlides;
  @ViewChild('PhoneNumber', { static: false })
  phoneNumber: ElementRef<HTMLInputElement>;
  @ViewChild('VerificationCode', { static: false })
  verificationCode: ElementRef<HTMLInputElement>;
  @ViewChild('Password', { static: false })
  password: ElementRef<HTMLInputElement>;
  @ViewChild('NextButton', { static: false })
  nextButton: ElementRef<HTMLButtonElement>;
  @ViewChild('NextButtonText', { static: false })
  nextButtonText: ElementRef<HTMLParagraphElement>;
  @ViewChild('Instructions', { static: false })
  instructions: ElementRef<HTMLParagraphElement>;

  autofill = '';
  isError = false;
  isLoading = false;
  currentSignupStep = 0;
  passwordChangeToken = '';
  // tslint:disable-next-line: max-line-length
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private storage: StorageService,
    private sockets: SocketsService
  ) {}

  ngAfterViewInit() {
    this.nextButton.nativeElement.disabled = true;
    this.ionSlides.lockSwipes(true);

    this.activatedRoute.queryParamMap.subscribe((s) => {
      this.autofill = s.get('phoneNumber');
      if (this.autofill.length >= 10) {
        this.nextButton.nativeElement.disabled = false;
      }
    });

    this.nextButton.nativeElement.onclick = () => {
      this.sendVerificationCodeToPhoneNumber();
    };

    const fields = ['phoneNumber', 'verificationCode', 'password'];
    fields.forEach((field, index) => {
      const input = this[field].nativeElement;
      input.onkeyup = () => {
        if (index === this.currentSignupStep) {
          if (index === 0) {
            // tslint:disable-next-line: max-line-length
            this.check(
              !(
                (input.value.startsWith('0') && input.value.length !== 10) ||
                (!input.value.startsWith('0') && input.value.length !== 12)
              )
            );
          } else if (index === 1) {
            this.check(input.value.length === 4);
          } else if (index === 2) {
            this.check(input.value.length >= 8);
          }
        }
      };
    });
  }

  check(condition) {
    if (condition) {
      this.nextButton.nativeElement.disabled = false;
    } else {
      this.nextButton.nativeElement.disabled = true;
    }
  }

  sendVerificationCodeToPhoneNumber() {
    this.isLoading = true;
    this.autofill = this.phoneNumber.nativeElement.value;
    if (this.autofill.startsWith('0')) {
      let newPhoneNumber: any = this.autofill.split('0');
      newPhoneNumber.splice(0, 1);
      newPhoneNumber = newPhoneNumber.join('0');
      this.autofill = '+27' + newPhoneNumber;
    }

    superagent
      .get(
        environment.BACKEND +
          'customers/request-reset-password?phonenumber=' +
          this.autofill
      )
      .end((_, response) => {
        if (response) {
          if (response.status === 200) {
            this.isLoading = false;
            this.instructions.nativeElement.innerText =
              'An SMS has been sent to your phone number.';
            this.nextButtonText.nativeElement.innerText = 'Verify';
            this.nextButton.nativeElement.onclick = () => {
              this.verifyPhoneNumber();
            };
            this.nextSlide();
          } else if (response.status === 404) {
            this.isLoading = false;
            this.instructions.nativeElement.innerText =
              'An account with that phone number was not found. Please consider creating an account.';
          } else {
            this.isLoading = false;
            this.instructions.nativeElement.innerText = response.body.reason
              ? response.body.reason
              : 'There was an unexpected error sending the SMS, try again. Let us know if the problem persists.';
          }
        } else {
          this.isLoading = false;
          this.instructions.nativeElement.innerHTML =
            'No internet connection, please check your internet connection and try again.';
        }
      });
  }

  nextSlide() {
    this.currentSignupStep++;
    this.ionSlides.lockSwipes(false);
    this.ionSlides.slideTo(this.currentSignupStep);
    this.ionSlides.lockSwipes(false);
  }

  verifyPhoneNumber() {
    this.isLoading = true;
    superagent
      .post(environment.BACKEND + `customers/verify-number?type=reset`)
      .send({
        phoneNumber: this.phoneNumber.nativeElement.value,
        code: this.verificationCode.nativeElement.value,
      })
      .end((error, response) => {
        this.isLoading = false;
        if (!error) {
          if (response.status === 200) {
            this.nextSlide();
            this.isError = false;
            this.passwordChangeToken = response.body.token;
            this.instructions.nativeElement.innerText =
              'Be sure to remember it this time. :)';
            this.nextButtonText.nativeElement.innerText = 'Change';
            this.nextButton.nativeElement.onclick = () => {
              this.changePassword();
            };
          } else {
            this.isError = true;
            this.instructions.nativeElement.innerText =
              "Invalid verification code entered. Make sure it's typed correctly.";
          }
        } else {
          if (response === undefined) {
            this.isError = true;
            this.isLoading = false;
            this.instructions.nativeElement.innerText =
              'There was a server connection error. Check your internet connection and try again.';
          }
        }
      });
  }

  changePassword() {
    this.isLoading = true;
    superagent
      .post(environment.BACKEND + `customers/reset-password`)
      .send({ password: this.password.nativeElement.value })
      .set('Authorization', this.passwordChangeToken)
      .end((error, response) => {
        if (!error) {
          Plugins.Toast.show({ text: 'Password reset successfull.' });
          this.router.navigate(['signin']);
        } else {
          if (response === undefined) {
            this.isLoading = false;
            this.instructions.nativeElement.innerText =
              'There was a server connection error. Check your internet connection and try again.';
          }

          if (response) {
            if (response.status === 500) {
              let code = '';
              if (response.body) {
                code = response.body.code || '';
              }
              this.instructions.nativeElement.innerText =
                'An unexpected error has occured. Please try again.' +
                (code.length > 0 ? 'Reference code: ' + code : '');
            } else if (response.status === 403) {
              this.instructions.nativeElement.innerText = response.body.message;
            }
          }
        }
      });
  }
}
