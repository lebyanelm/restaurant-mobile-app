import { SocketsService } from 'src/app/services/sockets.service';
import { BasketService } from 'src/app/services/basket.service';
import { Coordinates } from './../../interfaces/Coordinates';
import { StorageService } from './../../services/storage.service';
import { Component, AfterViewInit, ElementRef, ViewChild, Input } from '@angular/core';
import { MapEventsService } from 'src/app/services/map-events.service';
import { Platform } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import * as superagent from 'superagent';

// Include the Mapping library;
import * as mapboxgl from 'mapbox-gl/dist/mapbox-gl.js';
import { Marker, Map, LngLatLike, LngLatBounds } from 'mapbox-gl';
import { Plugins } from '@capacitor/core';
mapboxgl.accessToken = 'pk.eyJ1IjoibGVieWFuZWxtIiwiYSI6ImNrMDFnNWZpOTJidnEzYnV0MXhiazM4cmYifQ.aOIsfqjRmqjXAfnNc4n2CQ';

// Declare a variable to be able to use the embedded in index.html
declare let turf;

// tslint:disable: max-line-length
@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})

export class MapComponent implements AfterViewInit {
  @Input() isEmitCenter: boolean;
  @Input() isNavigation: boolean;
  @Input() isStatic: boolean;
  @Input() isSetAutoWidth: boolean;
  @Input() size: number;
  @Input() height: number;
  @Input() width: number;
  @Input() zoom: number;
  @Input() center: Coordinates;
  @Input() start: number[];
  @Input() end: Coordinates;

  @ViewChild('MapElement', {static: false}) mapElement: ElementRef<HTMLDivElement>;
  @ViewChild('DriverMarker', {static: false}) driverMarkerElement: ElementRef<HTMLDivElement>;
  @ViewChild('CustomerMarkerIcon', {static: false}) customerMarkerIcon: ElementRef<HTMLDivElement>;
  @ViewChild('MarkersContainer', {static: false}) markersContainer: ElementRef<any>;
  isPrepareMap = true;
  isLoading = true;
  isMapMove = false;
  isDriver = false;
  isSetToBounds = false;

  // Markers
  driverMarker: Marker;
  shopMarker: Marker;
  customerMarkers: Marker[] = [];

  // Locations which deliveries will be made and delivery path
  dropoffLocations = turf.featureCollection([]);
  dropoffPath = turf.featureCollection([]);

  // Map options and setup
  map: mapboxgl.Map;
  // map: Map;
  centerCoords: LngLatLike | any;
  currentLocation: LngLatLike | any;

  // TODO: Finely route a driver to a destination point. With GPS, and machine learning.
  // EXPERIMENT: We already have data for the required route the driver needs to take (estimation data)
  //             the goal is to compare those points with the current one and filter GPS Noise.
  constructor(
    private mapEvents: MapEventsService,
    private platform: Platform,
    private storage: StorageService,
    private sockets: SocketsService,
    private basket: BasketService
  ) {
    console.log(this.isSetAutoWidth, 'is auto width');
  }

  ngAfterViewInit() {
    if (!this.sockets.connection) {
      this.sockets.createConnection();
      console.log('[LOG]:Connection initiated.');
    }

    this.map = new Map({
      container: this.mapElement.nativeElement,
      style: 'mapbox://styles/lebyanelm/ckafxhtci05gl1ims03863371',
      zoom: this.zoom || 16,
      center: this.basket.destination ? [this.basket.destination.coords.lng, this.basket.destination.coords.lat] : [0, 0],
      attributionControl: false
    });

    // Map shows half the container width, resize it to full width
    this.updateMapHeight();
    this.map.on('load', async () => {
      this.isLoading = false;
      if (!this.isStatic && !this.isSetAutoWidth) {
        this.map.resize();
      } else {
        if (this.start && this.end) {
          this.createRoutePreview();
        }
      }

      this.isPrepareMap = false;
      this.addMapLayers();

      // Check account type and create a driver marker if type is partner
      await this.storage.getItem(environment.customerDataName)
        .then((user) => {
          console.log(user.type)
          if (user.type === 'partner') {
            this.isDriver = true;
            this.createDriverMarkerIcon();

            // Tilt the map to an angle
            this.map.setBearing(45);
          }
        });
    });

    // As the map is being dragged
    this.map.on(this.platform.is('desktop') ? 'mousedown' : 'touchstart', () => {
      this.isMapMove = true;
      this.isLoading = true;
    });

    // As new orders are dispatched the driver, create a path for them
    this.mapEvents.dropoff.subscribe((coords) => {
      this.addDropoffLocation(coords);
    });

    // When the dragging ends, emits value for isEmitCenter: true
    this.map.on(this.platform.is('desktop') ? 'mouseup' : 'touchend', () => {
      this.isMapMove = false;
      this.isSetToBounds = false;

      Plugins.Toast.show({text: "Changing address."});

      if (this.isEmitCenter) {
        this.emitMapCenter();
      }

      if (!this.isStatic && this.isSetAutoWidth) {
        this.updateMapHeight();
      }
    });

    if (!this.basket.destination) {
      Plugins.Geolocation.getCurrentPosition({enableHighAccuracy: true})
        .then(position => {
          this.setupMapCenter(position);
        });
    } else {
      this.setupMapCenter(this.basket.destination);
    }
  }

  setupMapCenter(position) {
    this.currentLocation = [position.coords.longitude, position.coords.latitude];
    if (!this.isSetToBounds && !this.isStatic && !this.center) {
      this.map.setCenter(this.currentLocation);
    }

    if (this.isEmitCenter && this.isMapMove) {
      this.emitMapCenter();
    }

    if (this.isDriver) {
      if (this.driverMarker) {
        this.driverMarker.setLngLat(this.currentLocation);
      }
    }
  }

  // When there's a Geolocation Error
  geolocationError(reason) {
    console.log(reason);
  }

  emitMapCenter() {
    this.mapEvents.center_changed.next(this.map.getCenter());
  }

  // Update the height of the map
  updateMapHeight() {
    const parentElement = this.mapElement.nativeElement.parentElement;

    // If height and width is set
    if (this.height && this.width) {
      this.mapElement.nativeElement.style.height = this.height + 'px';
      this.mapElement.nativeElement.style.width = this.width + 'px';
    } else if (this.size) {
      this.mapElement.nativeElement.style.height = this.size + 'px';
      this.mapElement.nativeElement.style.width = this.size + 'px';
    }
  }

  createDriverMarkerIcon() {
    this.driverMarker = new Marker(this.driverMarkerElement.nativeElement)
      .setLngLat(this.map.getCenter())
      .addTo(this.map);
  }

  addDropoffLocation(coords: Coordinates) {
    const pt = turf.point([coords.lng, coords.lat], { startTime: Date.now(), key: Math.random() });
    this.dropoffLocations.features.push(pt);

    if (!this.isStatic) {
      this.addCustomerMarker(coords);
    }

    if (this.dropoffLocations.features.length) {
      superagent
        .get(this.assembleDeliveryPathURI())
        .end((error, response) => {
          if (response) {
            if (response.status === 200) {
              const routeGeoJson = turf.featureCollection([turf.feature(response.body.trips[0].geometry)]),
                  route = this.map.getSource('routeline');
              route.setData(routeGeoJson);
              this.updateDropoffLocations(routeGeoJson.features[0].geometry.coordinates);
            }
          }
        });
    } else {
      this.dropoffLocations = turf.featureCollection([]);
      this.map.getSource('routeline').setData(turf.featureCollection([]));
    }
  }

  removeDropoffLocations(index?: number): void {
    if (index !== undefined) {
      this.dropoffLocations.features.splice(index, 1);
      this.removeCustomerMarker(index);
    } else {
      this.dropoffLocations.features = [];
      // Also remove the customer markers on the map
      if (this.customerMarkers.length) {
        this.customerMarkers.forEach((customerMarker) => {
          customerMarker.remove();
        });

        this.customerMarkers = [];
      }
    }

    if (this.dropoffLocations.features.length) {
      superagent
        .get(this.assembleDeliveryPathURI())
        .end((error, response) => {
          if (response) {
            if (response.status === 200) {
              const routeGeoJson = turf.featureCollection([turf.feature(response.body.trips[0].geometry)]),
                  route = this.map.getSource('routeline');
              route.setData(routeGeoJson);
              this.updateDropoffLocations(routeGeoJson.features[0].geometry.coordinates);
            }
          }
        });
    } else {
      this.dropoffLocations = turf.featureCollection([]);
      this.map.getSource('routeline').setData(turf.featureCollection([]));
    }
  }

  createRoutePreview() {
    this.addDropoffLocation(this.end);
    this.addDropoffLocation({ lng: this.start[0], lat: this.start[1] })
    // this.fitToBounds();
  }

  addCustomerMarker(coords: Coordinates) {
    const mElement = this.markersContainer.nativeElement.appendChild(document.createElement('div'));

    mElement.classList.add('customer-marker');
    mElement.classList.add('pulse');
    mElement.innerHTML = ['<div class="center">', this.customerMarkers.length + 1, '</div>'].join('');

    const mIndex = this.customerMarkers.push(new Marker(mElement));
    this.customerMarkers[mIndex - 1]
      .setLngLat([coords.lng, coords.lat])
      .addTo(this.map);
  }

  removeCustomerMarker(index?: number): void {
    this.customerMarkers[index].remove();
    this.customerMarkers.splice(index || 0, 1);
  }

  updateDropoffLocations(coords: LngLatLike[]) {
    this.fitToBounds(coords);
  }

  assembleDeliveryPathURI() {
    const coordinates = [this.currentLocation, ...this.getDropoffLocations()].join(';');

    return 'https://api.mapbox.com/optimized-trips/v1/mapbox/driving/' + coordinates + '?overview=full&steps=true&geometries=geojson&source=first&access_token=' + mapboxgl.accessToken;
  }

  getDropoffLocations() {
    const pts = [];
    this.dropoffLocations.features.forEach((feature) => {
      pts.push(feature.geometry.coordinates);
    });

    return pts;
  }

  fitToBounds(coordinates) {
    this.isSetToBounds = true;
    const bounds = coordinates.reduce((b, c) => {
      return b.extend(c);
    }, new mapboxgl.LngLatBounds());
    this.map.fitBounds(bounds, {padding: 20});
  }

  // Adding map layers to the map
  addMapLayers() {
    // Layer to be used be used for the delivery path routing
    this.map.addLayer({ id: 'routeline', type: 'line',
      source: {
        data: this.dropoffPath,
        type: 'geojson'
      },
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': 'black',
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          12, 3,
          22, 12
        ]
      }
    }, 'waterway-label');

    // Defines the direction of the route line created on the map
    this.map.addLayer({
      id: 'routearrows',
      type: 'symbol',
      source: 'routeline',
      layout: {
        'symbol-placement': 'line',
        'text-field': '▶',
        'text-size': [
          'interpolate',
          ['linear'],
          ['zoom'],
          12, 24,
          22, 60
        ],
        'symbol-spacing': [
          'interpolate',
          ['linear'],
          ['zoom'],
          12, 30,
          22, 160
        ],
        'text-keep-upright': false
      },
      paint: {
        'text-color': 'black',
        'text-halo-color': 'hsl(55, 11%, 96%)',
        'text-halo-width': 3
      }
    }, 'waterway-label');
  }
}
