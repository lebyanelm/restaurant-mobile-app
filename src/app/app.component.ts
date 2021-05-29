import { ModalEventsService } from './services/modal-events.service';
import { environment } from './../environments/environment';
import { User } from 'src/app/interfaces/User';
import { EventsService } from './services/events';
import { StorageService } from './services/storage.service';
import { SocketsService } from './services/sockets.service';
import { ProductsService } from './services/products.service';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Platform, IonMenu } from '@ionic/angular';
import { Router } from '@angular/router';
import { Plugins } from '@capacitor/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent implements OnInit {
  @ViewChild('IonMenu', {static: false}) ionMenu: IonMenu;
  @ViewChild('Audio', {static: false}) audio: ElementRef<HTMLAudioElement>;

  // Profile data
  data: User;
  isModalOpen = false;
  // tslint:disable-next-line: variable-name
  _platform: string;

  constructor(
    private platform: Platform,
    private productsService: ProductsService,
    private sockets: SocketsService,
    private storage: StorageService,
    private router: Router,
    private events: EventsService,
    private modalEvents: ModalEventsService
  ) {
    this.events.notification.subscribe((name) => {
      this.audio.nativeElement.src = '/assets/tones/' + name + '.mp3';
      this.audio.nativeElement.onloadedmetadata = () => {
        this.audio.nativeElement.play();
      };

      this.audio.nativeElement.onended = () => {
        this.audio.nativeElement.pause();
      };
    });
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this._platform = this.platform.platforms()[0];
      // this.statusBar.styleLightContent();

      /** Listen for changes to the local data */
      this.storage
        .change.subscribe((reference) => {
          if (reference.name === environment.customerDataName) {
            this.data = reference.data;
          }
        });
    });
  }

  ngOnInit() {
    this.modalEvents.statusChange.subscribe((s) => {
      // this.isModalOpen = s;

      if (s) {
        // this.statusBar.styleLightContent();
      } else {
        // this.statusBar.styleLightContent();
      }
      document.body.setAttribute('isModalOpen', s.toString());
    });
  }

  signOut() {
    this.sockets.disconnect();
    this.storage.remove(environment.customerDataName)
      .then(() => {
        this.router.navigate(['accounts']);
      });
  }
}
