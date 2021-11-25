import { SocketsService } from './../../services/sockets.service';
import { StorageService } from './../../services/storage.service';
import { ToastService } from './../../services/toast.service';
import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import * as superagent from 'superagent';

@Component({
  selector: 'app-phonenumber-verification',
  templateUrl: './phonenumber-verification.page.html',
  styleUrls: ['./phonenumber-verification.page.scss'],
})
export class PhonenumberVerificationPage implements OnInit, AfterViewInit {
  @ViewChild('FirstNumber', { static: false })
  firstNumber: ElementRef<HTMLInputElement>;
  @ViewChild('SecondNumber', { static: false })
  secondNumber: ElementRef<HTMLInputElement>;
  @ViewChild('ThirdNumber', { static: false })
  thirdNumber: ElementRef<HTMLInputElement>;
  @ViewChild('FourthNumber', { static: false })
  fourthNumber: ElementRef<HTMLInputElement>;

  data = { '1': '', '2': '', '3': '', '4': '' };
  isLoading: boolean = false;
  error = '';
  phoneNumber: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private storage: StorageService,
    private sockets: SocketsService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    this.activatedRoute.queryParamMap.subscribe((queryParamMap) => {
      this.phoneNumber = queryParamMap.get('phoneNumber');
    });
  }

  ngAfterViewInit() {
    this.firstNumber.nativeElement.onkeyup = (event) => {
      if (event.key !== 'Backspace') {
        this.secondNumber.nativeElement.disabled = false;
        this.secondNumber.nativeElement.focus();
      }
    };

    this.secondNumber.nativeElement.onkeyup = (event) => {
      if (event.key === 'Backspace') {
        this.firstNumber.nativeElement.focus();
        this.secondNumber.nativeElement.disabled = true;
      } else {
        this.thirdNumber.nativeElement.disabled = false;
        this.thirdNumber.nativeElement.focus();
      }
    };

    this.thirdNumber.nativeElement.onkeyup = (event) => {
      if (event.key === 'Backspace') {
        this.secondNumber.nativeElement.disabled = false;
        this.secondNumber.nativeElement.focus();
        this.thirdNumber.nativeElement.disabled = true;
      } else {
        this.fourthNumber.nativeElement.disabled = false;
        this.fourthNumber.nativeElement.focus();
      }
    };

    this.fourthNumber.nativeElement.onkeyup = (event) => {
      if (event.key === 'Backspace') {
        this.fourthNumber.nativeElement.disabled = true;
        this.thirdNumber.nativeElement.focus();
      } else {
        this.secondNumber.nativeElement.disabled = true;
        this.thirdNumber.nativeElement.disabled = true;
        this.fourthNumber.nativeElement.disabled = true;
        this.verifyPhoneNumber();
      }
    };
  }

  verifyPhoneNumber() {
    this.isLoading = true;
    this.error = '';
    const code = [
      this.data['1'],
      this.data['2'],
      this.data['3'],
      this.data['4'],
    ].join('');
    console.log(code);

    // Send the code to the server for verification to check if the code is valid or not
    superagent
      .post([environment.BACKEND, 'customers/verify-number'].join(''))
      .send({ phoneNumber: this.phoneNumber, code })
      .end((_, response) => {
        console.log(response);
        if (response) {
          if (response.status === 200) {
            this.storage
              .setItem(environment.customerDataName, {
                token: response.body.token,
                type: 'account',
              })
              .then(() => {
                this.sockets.createConnection().then(() => {
                  this.isLoading = false;
                  this.router.navigate(['home']);
                  console.log('Routed to home');

                });
              });
          } else {
            this.isLoading = false;
            if (response.status === 500) {
              this.error = 'Something went wrong';
            } else if (response.status === 403) {
              this.error = 'Incorrect code entered';
            } else {
              this.error = response.body.reason || response.body.message;
            }
          }
        } else {
          this.isLoading = false;
          this.error =
            'No internet connection, check your connection and try again.';
        }
      });
  }
}
