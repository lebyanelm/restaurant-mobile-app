import { Coordinates } from './../interfaces/Coordinates';
import { Subject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MapEventsService {
  // tslint:disable: variable-name
  center_changed: Subject<any> = new Subject<any>();
  dropoff: Subject<Coordinates> = new Subject<Coordinates>()
  constructor() { }
}
