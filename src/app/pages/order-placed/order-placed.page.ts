import { SocketsService } from 'src/app/services/sockets.service';
import { ToastService } from './../../services/toast.service';
import { EventsService } from './../../services/events';
import { environment } from './../../../environments/environment';
import { StorageService } from './../../services/storage.service';
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { IonSlides } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-order-placed',
  templateUrl: './order-placed.page.html',
  styleUrls: ['./order-placed.page.scss'],
})
export class OrderPlacedPage implements OnInit {
  // Data
  id: string;

  // States
  isOrderPlaced: boolean = false;
  isOrderOnlinePayment: boolean = true;

  constructor(
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe((params) => {
      this.id = params.id;
      this.isOrderPlaced = params.isOrderPlaced;
      this.isOrderOnlinePayment = params.isPaymentOnline;
    })
  }
}
