import { ModalController } from '@ionic/angular';
import { GoogleapisService } from 'src/app/services/googleapis.service';
import { MapEventsService } from 'src/app/services/map-events.service';
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-delivey-location',
  templateUrl: './delivery-location.component.html',
  styleUrls: ['./delivery-location.component.scss'],
})
export class DeliveryLocationComponent implements AfterViewInit {
  @ViewChild('TopNotch', {static: false}) topNotch: ElementRef<HTMLDivElement>;
  selectedAddress: any = { coords: {lat: 0, lng: 0}, address: [] };

  constructor(
    private mapEvents: MapEventsService,
    private googleapisService: GoogleapisService,
    private modalCtrl: ModalController
  ) { }

  ngAfterViewInit() {
    this.topNotch.nativeElement.ondrag = (e) => { console.log(e, 'dragged'); };
    this.mapEvents.center_changed.subscribe((coords) => {
      this.googleapisService.coordinatesToAddress(coords, (response) => {
        this.selectedAddress.coords = coords;
        this.selectedAddress.address = response.formatted_address.split(',');
      });
    });
  }

  setLocation() {
    this.modalCtrl.dismiss(this.selectedAddress);
  }
}
