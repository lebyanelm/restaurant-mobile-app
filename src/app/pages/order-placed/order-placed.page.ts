import { SocketsService } from 'src/app/services/sockets.service';
import { ToastService } from './../../services/toast.service';
import { EventsService } from './../../services/events';
import { environment } from './../../../environments/environment';
import { StorageService } from './../../services/storage.service';
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { IonSlides } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-order-placed',
  templateUrl: './order-placed.page.html',
  styleUrls: ['./order-placed.page.scss'],
})
export class OrderPlacedPage implements AfterViewInit {
  @ViewChild('StatusSlidesButton', {static: false}) statusSlidesButtons: ElementRef<HTMLButtonElement>;
  @ViewChild('StatusSlides', {static: false}) statusSlides: IonSlides;
  order;

  constructor(
    private storage: StorageService,
    private events: EventsService,
    private router: Router,
    private toast: ToastService,
    private sockets: SocketsService
  ) { }

  ngAfterViewInit() {
    this.statusSlides.lockSwipes(true);
    this.storage.getItem(environment.ORDER, false)
      .then((orderId) => {
        console.log(orderId)
        this.storage.getItem(environment.customerDataName)
          .then((data) => {
            this.order = data.orders.find((o) => o.id === orderId);
          });
      });
    this.events.processed.subscribe((o) => {
      this.storage.getItem(environment.customerDataName)
        .then((data) => {
          data.orders.map((order) => {
            if (order.id === o.id) {
              order.status = o.status;
              this.order = order;
            }
          });

          this.storage.setItem(environment.customerDataName, data);
        });
    });

    // Check or create a new connection to listen for location dispatches
    this.sockets.createConnection()
      .then(() => {
        this.sockets.connection.on('location_pulse', (location: { coordinates: Coordinates, speed: number | null, driverId: string }) => {
          alert('Got a location pulse ' + location.driverId);
        });
      });
  }

  changeSlide() {
    this.statusSlides.getActiveIndex()
      .then((index) => {
        this.statusSlides.length()
          .then((length) => {
            if (index === (length - 1)) {
              this.prev();
            } else {
              this.next();
            }
          });
      });
  }

  next() {
    this.statusSlides.lockSwipes(false);
    this.statusSlides.slideNext();
    this.statusSlides.lockSwipes(true);
    this.statusSlidesButtons.nativeElement.innerHTML = 'TRACK STATUS';
  }

  prev() {
    this.statusSlides.lockSwipes(false);
    this.statusSlides.slidePrev();
    this.statusSlides.lockSwipes(true);
    this.statusSlidesButtons.nativeElement.innerHTML = 'TRACK DELIVERY';
  }

  orderDelivered() {
    this.storage.remove(environment.ORDER)
      .then(() => {
        this.router.navigate(['home']);
      }).catch(() => {
        this.toast.show('Opps! Please try that again.');
      });
  }
}
