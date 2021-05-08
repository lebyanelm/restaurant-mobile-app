import { ToastService } from './../../services/toast.service';
import { environment } from './../../../environments/environment';
import { StorageService } from './../../services/storage.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Component, OnInit, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import * as superagent from 'superagent';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-add-payment-option',
  templateUrl: './add-payment-option.page.html',
  styleUrls: ['./add-payment-option.page.scss'],
})
export class AddPaymentOptionPage implements OnInit, AfterViewInit {
  @ViewChild('CardNumberFirst', { static: false }) cardNumberFirst: ElementRef<HTMLInputElement>;
  @ViewChild('CardNumberSecond', { static: false }) cardNumberSecond: ElementRef<HTMLInputElement>;
  @ViewChild('CardNumberThird', { static: false }) cardNumberThird: ElementRef<HTMLInputElement>;
  @ViewChild('CardNumberFourth', { static: false }) cardNumberFourth: ElementRef<HTMLInputElement>;

  return = '/home';
  data: any = {};
  hasEnteredCardValue = false;

  isExpiryDateValid = true;
  isCvvValid = true;
  isCardNumberValid = true;
  isLoading = false;

  constructor(
    private router: Router,
    private ar: ActivatedRoute,
    private storage: StorageService,
    private toast: ToastService,
    private modalCtrl: ModalController) { }

  ngOnInit() {
    this.ar.queryParams.subscribe((p) => {
      this.return = p.return || this.return;
    });
  }

  ngAfterViewInit() {
    this.cardNumberFirst.nativeElement.addEventListener('keyup', (event) => {
      // Check the card type and display it's logo
      if (this.cardNumberFirst.nativeElement.value.length) {
        const value = this.cardNumberFirst.nativeElement.value;
        // tslint:disable-next-line: max-line-length
        if ((value.length > 1 && value[0] === '3' && value[1] === '7') || value[0] === '2' || value[0] === '4' || value[0] === '5' || value[0] === '6') {
          this.data.type = value.length > 1 && value[0] === '3' && value[1] === '7' ? '37' : value[0];
        }
      } else {
        this.data.type = undefined;
      }

      if (this.cardNumberFirst.nativeElement.value.length === 4) {
        this.cardNumberSecond.nativeElement.disabled = false;
        this.cardNumberSecond.nativeElement.focus();

        if (event.key !== 'Backspace') {
          // this.cardNumberSecond.nativeElement
        }

      } else if (this.cardNumberFirst.nativeElement.value.length > 4) {
        this.preventCardNumberOverflow(this.cardNumberFirst.nativeElement, this.cardNumberSecond.nativeElement);
      }
    });

    // Second Input Card Number Element
    this.cardNumberSecond.nativeElement.addEventListener('keyup', (event) => {
      if (event.key === 'Backspace') {
        if (this.cardNumberSecond.nativeElement.value.length === 0) {
          this.cardNumberSecond.nativeElement.disabled = true;
          this.cardNumberFirst.nativeElement.focus();
        }
      } else {
        this.hasEnteredCardValue = true;
        if (this.cardNumberSecond.nativeElement.value.length === 4) {
          this.hasEnteredCardValue = false;
          this.cardNumberThird.nativeElement.disabled = false;
          this.cardNumberThird.nativeElement.focus();
        } else if (this.cardNumberSecond.nativeElement.value.length > 4) {
          this.preventCardNumberOverflow(this.cardNumberSecond.nativeElement, this.cardNumberThird.nativeElement);
        }
      }
    });

    this.cardNumberThird.nativeElement.addEventListener('keyup', (event) => {
      if (event.key === 'Backspace') {
        if (this.cardNumberThird.nativeElement.value.length === 0) {
          this.cardNumberThird.nativeElement.disabled = true;
          this.cardNumberSecond.nativeElement.focus();
        }
      } else {
        this.hasEnteredCardValue = true;
        if (this.cardNumberThird.nativeElement.value.length === 4) {
          this.hasEnteredCardValue = false;
          this.cardNumberFourth.nativeElement.disabled = false;
          this.cardNumberFourth.nativeElement.focus();
        } else if (this.cardNumberThird.nativeElement.value.length > 4) {
          this.preventCardNumberOverflow(this.cardNumberThird.nativeElement, this.cardNumberFourth.nativeElement);
        }
      }
    });

    this.cardNumberFourth.nativeElement.addEventListener('keyup', (event) => {
      if (event.key === 'Backspace') {
        if (this.cardNumberFourth.nativeElement.value.length === 0) {
          this.cardNumberFourth.nativeElement.disabled = true;
          this.cardNumberThird.nativeElement.focus();
        }
      } else {
        this.hasEnteredCardValue = true;
        if (this.cardNumberFourth.nativeElement.value.length > 4) {
          this.preventCardNumberOverflow(this.cardNumberFourth.nativeElement);
        }
      }
    });
  }

  preventCardNumberOverflow(input, nextInput?) {
    const digits = input.value.split(''),
          firstFour = [];

    digits.forEach((value) => {
      if (firstFour.length !== 4) {
        firstFour.push(value);
      }
    });

    input.value = firstFour.join('');
    if (nextInput) {
      nextInput.focus();
      this.hasEnteredCardValue = false;
    }
  }

  validateExpiryInput(input: HTMLInputElement, nextInput: HTMLInputElement, isLast = false, isBaskspace = false) {
    if (isBaskspace) {
      if (input.value.length === 0 && isLast) {
        nextInput.focus();
      }
    } else {
      if (input.value.length === 2) {
        if (!isLast) {
          nextInput.focus();
        }
      } else if (input.value.length > 2) {
        const lastTwoDigits = [],
              digits = input.value.split('');

        digits.forEach((value) => {
          if (lastTwoDigits.length !== 2) {
            lastTwoDigits.push(value);
          }
        });

        input.value = lastTwoDigits.join('');
        if (isLast) {
          this.data.expiryYear = input.value;
        } else {
          this.data.expiryMonth = input.value;
        }
        if (!isLast) {
          nextInput.focus();
        }
      }
    }
  }

  saveCard() {
    this.isLoading = true;
    this.data.cardNumber = [
      this.cardNumberFirst.nativeElement.value,
      this.cardNumberSecond.nativeElement.value,
      this.cardNumberThird.nativeElement.value,
      this.cardNumberFourth.nativeElement.value].join('');

    this.storage
      .getItem(environment.customerDataName)
      .then((data) => {
        // Save the card details in the server
        superagent
          .post(environment.BACKEND + 'accounts/payment-method')
          .set('Authorization', data.token)
          .send(this.data)
          .end((error, response) => {
            this.isLoading = false;
            if (response) {
              if (response.status === 403) {
                this.toast.showAlert(false, {
                  header: response.body.message,
                  message: 'You are not authorized to do that, that\'s for authenticated users only.',
                });
              } else if (response.status === 200) {
                this.toast.show('Payment method added!');
                console.log(response.body.card);
                data.paymentMethods.push(response.body.card);
                this.storage
                  .setItem(environment.customerDataName, data)
                  .then(() => {
                    this.modalCtrl.dismiss(response.body.data);
                  });
              }
            }
          });
      });
  }

  saveChanges() {
    this.isLoading = true;
    this.data.cardNumber = [
      this.cardNumberFirst.nativeElement.value,
      this.cardNumberSecond.nativeElement.value,
      this.cardNumberThird.nativeElement.value,
      this.cardNumberFourth.nativeElement.value].join('');

    this.storage
      .getItem(environment.customerDataName)
      .then((data) => {
        if (data) {
          superagent
            .patch(environment.BACKEND + 'accounts/payment-method')
            .set('Authorization', data.token)
            .send(this.data)
            .end((error, response) => {
              this.isLoading = false;
              if (response) {
                if (response.status === 200) {
                  for (let index = 0; index < data.paymentMethods.length; index++) {
                    if (data.paymentMethods[index].id === response.body.card.id) {
                      data.paymentMethods[index] = response.body.card;
                      this.storage.setItem(environment.customerDataName, data);
                      break;
                    }
                  }

                  this.modalCtrl.dismiss();
                } else {
                  this.toast.show(response.body.reason || response.body.message);
                }
              } else {
                this.toast.showAlert(true);
              }
            });
        } else {
          this.isLoading = false;
          this.toast.show('ERROR: Couldn\'t load local data.');
        }
      });
  }

  deletePaymentMethod(paymentMethodId) {
    this.isLoading = true;
    this.storage
      .getItem(environment.customerDataName)
      .then((data) => {
        if (data) {
          superagent
            .delete(environment.BACKEND + 'accounts/payment-method')
            .set('Authorization', data.token)
            .send({ paymentMethodId })
            .end((error, response) => {
              if (response) {
                if (response.status === 200) {
                  for (let index = 0; index < data.paymentMethods.length; index++) {
                    if (data.paymentMethods[index].id === paymentMethodId) {
                      data.paymentMethods.splice(index, 1);
                      this.storage.setItem(environment.customerDataName, data);
                      break;
                    }
                  }

                  this.toast.show('Payment method deleted.');
                  this.modalCtrl.dismiss({ action: 'delete', id: paymentMethodId });
                } else {
                  this.toast.show(response.body.reason || response.body.message);
                }
              } else {
                this.toast.showAlert(true);
              }
            });
        } else {
          this.toast.show('ERROR: Couldn\'t load local data');
        }
      });
  }
}
