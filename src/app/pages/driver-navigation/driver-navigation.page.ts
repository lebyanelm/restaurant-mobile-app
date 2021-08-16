import { MapComponent } from 'src/app/components/map/map.component';
import { SocketsService } from 'src/app/services/sockets.service';
import { StorageService } from 'src/app/services/storage.service';
import { MapEventsService } from 'src/app/services/map-events.service';
import { Order } from 'src/app/interfaces/Order';
import { EventsService } from './../../services/events';
import { ToastService } from './../../services/toast.service';
import {
  Component,
  ViewChild,
  AfterViewInit,
  ErrorHandler,
} from '@angular/core';
import { Plugins } from '@capacitor/core';
import { LaunchNavigator } from '@ionic-native/launch-navigator/ngx';
import { AlertController, IonSelect, Platform } from '@ionic/angular';
import { get, post } from 'superagent';
import { environment } from 'src/environments/environment';
import { StatusService } from 'src/app/services/status.service';
import { SlideButtonComponent } from 'src/app/components/slide-button/slide-button.component';
import { Router } from '@angular/router';
import * as superagent from 'superagent';

@Component({
  selector: 'app-driver-navigation',
  templateUrl: './driver-navigation.page.html',
  styleUrls: ['./driver-navigation.page.scss'],
  providers: [],
})
export class DriverNavigationPage implements AfterViewInit {
  @ViewChild('SlideButton', { static: false })
  slideButton: SlideButtonComponent;
  @ViewChild('IonSelect', { static: false }) ionSelect: IonSelect;
  @ViewChild('Map', { static: false }) map: MapComponent;

  deliveries: Order[] = [];
  data;
  driverData: {
    name: string;
    username: string;
    deliveries: string[];
    noDeliveries: number;
  };
  isDeliveryStarted = false;
  isDeliveryAllowed = false;
  isLocationDispatchSet = false;
  isFirstConnection = true;
  locationDispatchCustomers = [];
  isCompletedDelivery = false;
  isReachedMax = false;
  isIosPlatform = false;
  branchSelectorOptions = {
    header: 'Connect to a branch',
    interface: 'action-sheet',
    backdropDismiss: false,
  };
  branches = [];
  activeBranch;
  completedDeliveries: Order[] = [];
  currentDeliveryIndex;
  connectionStatus = true;
  locationDispatchInterval;

  constructor(
    private toast: ToastService,
    private events: EventsService,
    private mapEvents: MapEventsService,
    private launchNavigator: LaunchNavigator,
    private storage: StorageService,
    private platform: Platform,
    private sockets: SocketsService,
    private alertController: AlertController,
    private statusService: StatusService,
    private router: Router
  ) {}

  ngAfterViewInit() {
    this.storage.getItem(environment.customerDataName).then((data) => {
      this.data = data;

      // Find the current connected driver
      this.storage.getItem(environment.driverDataName).then((driverData) => {
        this.driverData = driverData;
      });

      Plugins.Toast.show({
        text: this.sockets.connection ? 'Connected' : 'Not connected',
      });
      this.selectBranch();
    });

    this.platform.ready().then((platform) => {
      this.isIosPlatform = this.platform.is('ios');
    });

    this.ionSelect.ionChange.subscribe((option) => {
      if (option.detail) {
        this.activeBranch = option.detail.value;
        this.statusService.setBranch(this.activeBranch);
        if (this.isFirstConnection) {
          // Load the data that has been synced with the database
          const driver = this.data.drivers.find(
            (sDriver) => sDriver.username === this.driverData.username
          );
          this.driverData = driver;
          // Check if the driver has any pending deliveries to make
          if (this.driverData && this.driverData.deliveries.length) {
            // Request the order information from the back-end of each order
            this.driverData.deliveries.forEach((delivery) => {
              superagent
                .get([environment.BACKEND, 'order'].join(''))
                .query({
                  partnerId: environment.PARTNER_ID,
                  branchId: this.activeBranch.id,
                  orderId: delivery,
                })
                .end((_, response) => {
                  if (response) {
                    if (response.ok) {
                      const index = this.deliveries.push(response.body.order);
                      this.deliveries[index - 1].index = index;
                      console.log(
                        this.deliveries[index - 1].destination.coords
                      );
                      this.mapEvents.dropoff.next(
                        this.deliveries[index - 1].destination.coords
                      );

                      // Append the customer into the location dispatch listings
                      this.locationDispatchCustomers.push(
                        this.deliveries[index - 1].uid
                      );

                      this.isDeliveryAllowed = true;
                    } else {
                      Plugins.Toast.show({
                        text: response.body.reason || 'Something went wrong.',
                      });
                    }
                  } else {
                    Plugins.Toast.show({
                      text: 'No internet connection, please check your connection.',
                    });
                  }
                });
            });
          }
        }
      }
    });

    this.slideButton.onSlide.subscribe(() => {
      if (!this.isDeliveryStarted && this.isDeliveryAllowed) {
        this.startDelivery();
      } else {
        this.goToNextDelivery();
      }
    });

    this.events.dispatched.subscribe((order) => {
      const index = this.deliveries.push(order);
      this.deliveries[index - 1].index = index;
      this.mapEvents.dropoff.next(order.destination.coords);

      // Append the customer into the location dispatch listings
      this.locationDispatchCustomers.push(order.uid);

      // When the number of deliveries reach a maximum of 5, disconnect the driver from the driver pool,
      /// and start sending the live location of the driver to the customers
      if (this.deliveries.length === 3) {
        // Set the applicable flag parameters
        this.isLocationDispatchSet = true;
        this.isDeliveryAllowed = true;

        // Disconnect the driver from the driver pool
        this.setDriverConnectionState(false, () =>
          this.toast.show(
            'Error while trying to go offline, please do this manually to prevent exceeding order deliveries.'
          )
        );

        this.locationDispatchInterval = setInterval(() => {
          Plugins.Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
          }).then((location) => {
            const coordinates = {
              lat: location.coords.latitude,
              lng: location.coords.longitude,
              speed: location.coords.speed,
            };
            // Emit the data to the current Socket connection available
            this.sockets.connection.emit('location_pulse', {
              coordinates,
              customers: this.locationDispatchCustomers,
              partnerId: environment.PARTNER_ID,
              branchId: this.activeBranch.id,
            });
          });
        }, 5000);
      }
    });
  }

  startDelivery() {
    this.isDeliveryStarted = true;

    this.toast.show(
      [
        this.deliveries[0].destination.coords.lat,
        this.deliveries[0].destination.coords.lng,
      ].toString()
    );
    this.launchNavigator.navigate([
      this.deliveries[0].destination.coords.lat,
      this.deliveries[0].destination.coords.lng,
    ]);
  }

  sendOrderStatusUpdate(self: DriverNavigationPage, orderIndex: number): void {
    post(environment.BACKEND + 'order/status')
      .set('Authorization', self.data.token)
      .send({
        orderIds: [self.deliveries[orderIndex].id],
        status: 4,
        branchId: this.activeBranch.id,
      })
      .end((error, response) => console.log(error, response));
  }

  goToNextDelivery() {
    // Update the user that the order has been delivered.
    this.sendOrderStatusUpdate(this, 0);
    // Remove the completed deliveries from deliveries to completedDeliveries
    this.completedDeliveries.push(this.deliveries[0]);
    this.deliveries.splice(0, 1);

    this.toast.show('Routing to the next delivery.');
    if (this.deliveries.length) {
      // Move on to the next delivery
      this.startDelivery();

      // Check if the delivery is complete after this ine
      if (!this.deliveries.length) {
        this.isCompletedDelivery = true;
        this.deliveries = [];
        this.isDeliveryStarted = false;
        this.isDeliveryAllowed = false;
        this.isReachedMax = false;
        this.map.removeDropoffLocations();
      } else {
        this.map.removeDropoffLocations(0);
      }
    } else {
      this.isCompletedDelivery = true;
      this.deliveries = [];
      this.isDeliveryStarted = false;
      this.isDeliveryAllowed = false;
      this.map.removeDropoffLocations();
      this.toast.show('No more deliveries left.');
      clearInterval(this.locationDispatchInterval);
    }
  }

  async viewDeliveryInstruction(data: { id: string; note: string }) {
    if (data.note) {
      const alert = this.alertController.create({
        header: 'Delivery instructions',
        subHeader: ['For Order #', data.id].join(' '),
        message: data.note,
      });
      (await alert).present();
    }
  }

  selectBranch() {
    if (this.deliveries.length === 0) {
      get(environment.BACKEND + 'branches?token=' + this.data.token).end(
        (error, response) => {
          if (!error) {
            if (response.status === 200) {
              this.branches = response.body.branches;
            }
            this.ionSelect.open();
          } else {
            this.ionSelect.open();
          }
        }
      );
    } else {
      this.toast.showAlert({
        subHeader: 'Option Unavailable',
        message:
          'You currently have active deliveries with the connected branch.',
      });
    }
  }

  signOut() {
    this.sockets.disconnect();
    Plugins.StatusBar.setBackgroundColor({ color: '#000000' });
    this.storage.remove(environment.customerDataName).then(() => {
      this.storage.remove(environment.driverDataName).then(() => {
        this.router.navigate(['welcome'], { replaceUrl: true });
      });
    });
  }

  async setDriverConnectionState(state?: boolean, errorHandler?: () => void) {
    if (!this.sockets.connection) {
      await this.sockets.createConnection();
    }

    this.sockets.connection.emit(
      'set status',
      {
        socketId: this.sockets.connection.id,
        state: state !== undefined ? state : !this.connectionStatus,
        partnerId: environment.PARTNER_ID,
      },
      (response) => {
        if (response.isSet) {
          this.connectionStatus = response.state;
          if (response && response.state === false) {
            Plugins.StatusBar.setBackgroundColor({ color: '#f44336' });
          } else {
            Plugins.StatusBar.setBackgroundColor({ color: '#000000' });
          }
        } else {
          if (errorHandler) {
            errorHandler();
          } else {
            this.toast.show(
              'Error while changing connection status, please try again. Contact us if error persists.'
            );
          }
        }
      }
    );
  }
}
