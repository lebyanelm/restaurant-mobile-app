import { Subject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ModalEventsService {
  statusChange: Subject<boolean> = new Subject<boolean>();
  constructor() { }
}
