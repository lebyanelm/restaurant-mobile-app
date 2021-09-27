import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { google } from 'google-maps';
import * as supeagent from 'superagent';
import { BasketService } from './basket.service';
import { ToastService } from './toast.service';
import { Plugins } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class GoogleapisService {
  protected urls: string[] = [
    [
      environment.BACKEND,
      `geocoding?key=${environment.GOOGLE_KEY}&latlong=`,
    ].join(''),
  ];
  constructor(
    private basket: BasketService,
    private toastService: ToastService
  ) {}
  coordinatesToAddress(coords: any, cb) {
    supeagent
      .get(this.urls[0] + [coords.lat, coords.lng].join())
      .end((error, response: any) => {
        console.log('google', response);
        cb(response.body.results[0]);
      });
  }

  requestPathMapRoute(
    origin: google.maps.LatLng,
    destination: google.maps.LatLng,
    cb: any
  ): void {
    const coordinates = [
      [origin.lat, origin.lng].join(),
      [destination.lat, destination.lng].join(),
    ];
    // Request the path data from the google api
    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: coordinates[0],
        destination: coordinates[1],
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (r) => {
        // console.log(r);
        cb(r.routes[0].overview_path, {
          duration: r.routes[0].legs[0].duration,
          distance: r.routes[0].legs[0].distance,
          steps: r.routes[0].legs[0].steps,
        });
      }
    );
  }

  getUserLocation() {
    return new Promise((resolve, reject) => {
      Plugins.Geolocation.getCurrentPosition({  })
        .then((position) => {
          const coords = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };
              this.coordinatesToAddress(
                coords,
                (response: google.maps.GeocoderResult) => {
                  if (response) {
                    const selectedAddress = {
                      coords,
                      address: response.formatted_address.split(','),
                    };
                    this.basket.destination = selectedAddress;
                    this.basket.isDestinationAutoDetect = true;
                    resolve(selectedAddress);
                  }
                }
              );
        })
        .catch((error) => {
          console.log(error);
          Plugins.Toast.show({text: "Unable to detect your location, please enable your Location services and restart the App."})
        });
    });
  }
}
