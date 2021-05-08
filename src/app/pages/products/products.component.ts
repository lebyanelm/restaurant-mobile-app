import { ToastService } from './../../services/toast.service';
import { ModalEventsService } from './../../services/modal-events.service';
import { GoogleapisService } from './../../services/googleapis.service';
import { OrdersPage } from './../orders/orders.page';
import { BasketService } from 'src/app/services/basket.service';
import { Destination } from './../../interfaces/Destination';
import { IonRefresher, IonSlides, ModalController, Platform } from '@ionic/angular';
import { Product } from './../../interfaces/Product';
import { ProductsService } from './../../services/products.service';
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Banner } from 'src/app/interfaces/Banner';
import { DeliveryLocationComponent } from 'src/app/components/delivery-location/delivery-location.component';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
})
export class ProductsComponent implements AfterViewInit {
  @ViewChild('BannerSlides', {static: false}) bannerSlides: IonSlides;
  @ViewChild('Refresher', {static: false}) refresher: IonRefresher;

  public products: Product[] = [];
  public banners: Banner[] = [];
  public bannerIndices: number[] = [];
  public currentSlideIndex: number = 0;
  public isPreviousDisabled = true;
  public isNextDisabled = false;
  selectedAddress: Destination;
  // tslint:disable-next-line: variable-name
  _platform: string;

  // tslint:disable-next-line: variable-name
  constructor(private _products: ProductsService,
              private modalCtrl: ModalController,
              public basket: BasketService,
              private googleServices: GoogleapisService,
              private modalEvents: ModalEventsService,
              private toastService: ToastService,
              private platform: Platform) {
                this._platform = platform.platforms()[0];
              }
  ngAfterViewInit() {
    // Detect current customer's location
    this.getUserLocation();
  }

  startBannerSlideAnimation() {
    this.bannerSlides.startAutoplay();

    // For creating a custom indicator for the slides
    this.getBannerIndices();
    
    this.bannerSlides.ionSlideDidChange
      .subscribe(_=> {
        this.bannerSlides.getActiveIndex()
          .then((index) => {
            this.currentSlideIndex = index;

            // Get the length to determine which button to disable
            this.bannerSlides.length()
              .then((length) => {
                if ((length - 1) === this.currentSlideIndex) {
                  this.isNextDisabled = true
                  this.isPreviousDisabled = false;
                } else if (this.currentSlideIndex === 0) { 
                  this.isPreviousDisabled = true;
                  this.isNextDisabled = false;
                } else {
                  this.isNextDisabled = false;
                  this.isPreviousDisabled = false; }
              });
          });
      });
  }

  getBannerIndices() {
    this.bannerIndices = [];
    this.banners.forEach((_, index) => {
      this.bannerIndices.push(index);
    });
  }

  async changeDeliveryAddress() {
    const deliveryLocationSelector = await this.modalCtrl.create({
      component: DeliveryLocationComponent,
      cssClass: ['delivery-location-selector']
    });

    this.modalEvents.statusChange.next(true);
    deliveryLocationSelector.onDidDismiss()
      .then((data) => {
        this.modalEvents.statusChange.next(false);
        if (data.data) {
          this.basket.destination = data.data;
          this.basket.isDestinationAutoDetect = false;
        }
      });
    deliveryLocationSelector.present();
  }

  getUserLocation() {
    navigator.geolocation.getCurrentPosition((position) => {
      const coords = {lat: position.coords.latitude, lng: position.coords.longitude};
      this.googleServices.coordinatesToAddress(coords, (response: google.maps.GeocoderResult) => {
        if (response) {
          this.selectedAddress = { coords, address: response.formatted_address.split(',') };
          this.basket.destination = this.selectedAddress;
          this.basket.isDestinationAutoDetect = true;
        }
      });
    }, (error) => {
      this.toastService.show('Unable to detect your location.');
    });
  }

  // Reload any data that can be updated by the partner, Banners, Products and all
  doReload() {
    this._products.getProducts()
      .then((products) => {
        // Replace the older products with the newly reloaded products
        this.products = products;

        // Place the products in the order of popularity in a descending manner
        const orderedProducts = this.products.sort(this.comparePopularityRate).reverse();
        this.products = orderedProducts;
        
        // Also refresh the banners
        this._products.getBanners()
          .then((banners: Banner[]) => {
            this.banners = banners;
            this.getBannerIndices();
            this.refresher.complete();
          }).catch((error) => {
            this.toastService.show('Failed to refresh the banners. Please try again.');
            // Hide the refresh loader
            this.refresher.complete();
          })
      }).catch((error) => {
        this.toastService.show('Failed to refresh the page. Please try again.');
        this.refresher.complete();
      });
  }

  comparePopularityRate(product1: Product, product2: Product): number {
    // Calculate the popularity rate of both the compared products
    const product1PopularityRate = product1.buys ? (product1.buys / product2.views) * 5 : 0,
          product2PopularityRate = product2.buys ? (product2.buys / product2.views) * 5 : 0;

    if (product1PopularityRate < product2PopularityRate) {
      return -1;
    } else if (product1PopularityRate > product2PopularityRate) {
      return 1;
    } else {
      return 0;
    }
  }

  nextSlide(): void {
    this.bannerSlides.lockSwipes(false);
    this.bannerSlides.slideNext();
    this.bannerSlides.lockSwipes(true);
  }

  previousSlide(): void {
    this.bannerSlides.lockSwipes(false);
    this.bannerSlides.slidePrev();
    this.bannerSlides.lockSwipes(true);
  }
}