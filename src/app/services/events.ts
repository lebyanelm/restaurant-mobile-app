import { Coordinates } from './../interfaces/Coordinates';
import { Order } from '../interfaces/Order';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Plugins } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class EventsService {
  processed: Subject<{ id: string; status: number }> = new Subject<{ id: string; status: number }>();
  dispatched: Subject<Order> = new Subject<Order>();
  notification: Subject<string> = new Subject<string>();
  location_dispatch: Subject<Coordinates> = new Subject<Coordinates>();
  constructor() {
    this.location_dispatch.subscribe((d) => console.log('Location Dispatch:', d));
  }

  notify(type: string) {
  }
}
