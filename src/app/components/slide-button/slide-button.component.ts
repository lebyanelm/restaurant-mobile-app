import { Component, OnInit, AfterViewInit, Input, ElementRef, ViewChild, Output } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-slide-button',
  templateUrl: './slide-button.component.html',
  styleUrls: ['./slide-button.component.scss'],
})
export class SlideButtonComponent implements AfterViewInit {
  @Input() title: string;
  @Input() subTitle: string;
  @Input() disabled: boolean;
  onSlide: Subject<any> = new Subject<any>();

  // tslint:disable-next-line: no-input-rename
  @ViewChild('InputRange', {static: false}) inputRange: ElementRef<HTMLInputElement>;

  private MAX_VALUE = 150;
  private SPEED = 12;
  private RAF_ID;
  private currentValue = 0;

  constructor() {
    if (this.disabled === undefined) {
      this.disabled = false;
    }
  }

  ngAfterViewInit() {
    this.inputRange.nativeElement.min = '0';
    this.inputRange.nativeElement.max = this.MAX_VALUE.toString();

    this.inputRange.nativeElement.addEventListener('mousedown', () => {
      this.unlockStartHandler(this);
    });

    this.inputRange.nativeElement.addEventListener('touchstart', () => {
      this.unlockStartHandler(this);
    });

    this.inputRange.nativeElement.addEventListener('mouseup', () => {
      this.unlockEndHandler(this);
    });

    this.inputRange.nativeElement.addEventListener('touchend', () => {
      this.unlockEndHandler(this);
    });
  }

  unlockStartHandler(self: SlideButtonComponent) {
    window.cancelAnimationFrame(this.RAF_ID);
    console.log(this.inputRange.nativeElement.value, parseInt(this.inputRange.nativeElement.value))
    self.currentValue += parseInt(this.inputRange.nativeElement.value);
    console.log('Current Value', self.currentValue);
  }

  unlockEndHandler(self: SlideButtonComponent) {
    self.currentValue = parseInt(this.inputRange.nativeElement.value);
    if (self.currentValue >= this.MAX_VALUE) {
      self.successHandler();
    } else {
      self.RAF_ID = window.requestAnimationFrame(() => self.animateHandler(self));
    }
  }

  animateHandler(self: SlideButtonComponent) {
    // Update the input range
    self.inputRange.nativeElement.value = self.currentValue.toString();

    // Determine if we need to continue
    if (self.currentValue > -1) {
      window.requestAnimationFrame(() => self.animateHandler(self));
    }

    // Decrement the value
    self.currentValue = self.currentValue - self.SPEED;
  }

  successHandler() {
    this.onSlide.next();

    // Reset the input range value
    this.inputRange.nativeElement.value = '0';
  }
}
