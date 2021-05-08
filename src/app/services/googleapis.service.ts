import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { google } from 'google-maps';
import * as supeagent from 'superagent';

@Injectable({
  providedIn: 'root'
})
export class GoogleapisService {
  protected urls: string[] = [
    `https://maps.googleapis.com/maps/api/geocode/json?key=${environment.GoogleApiKey}&latlng=`,
  ];
  constructor() {}
  coordinatesToAddress(coords: any, cb) {
    supeagent
      .get(this.urls[0] + [coords.lat, coords.lng].join())
      .end((error, response: any) => {
        cb(response.body.results[0]);
      });
  }

  requestPathMapRoute(origin: google.maps.LatLng, destination: google.maps.LatLng, cb: any): void {
    const coordinates = [[origin.lat, origin.lng].join(), [destination.lat, destination.lng].join()];
    // Request the path data from the google api
    const directionsService = new google.maps.DirectionsService();
    directionsService.route({
      origin: coordinates[0],
      destination: coordinates[1],
      travelMode: google.maps.TravelMode.DRIVING
    }, (r) => {
      // console.log(r);
      cb(r.routes[0].overview_path, {
        duration: r.routes[0].legs[0].duration,
        distance: r.routes[0].legs[0].distance,
        steps: r.routes[0].legs[0].steps
      });
    });
  }
}
