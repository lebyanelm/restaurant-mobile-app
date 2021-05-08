import { SocketsService } from 'src/app/services/sockets.service';
import { ProductsComponent } from 'src/app/pages/products/products.component';
import { ToastService } from './../../services/toast.service';
import { BasketOverviewService } from './../../services/basket-overview.service';
import { StorageService } from './../../services/storage.service';
import { BasketService } from './../../services/basket.service';
import { ProductsService } from './../../services/products.service';
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MenuController, Platform, IonSlides } from '@ionic/angular';
import { timer, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { Plugins } from '@capacitor/core';
import { environment } from 'src/environments/environment';
import * as superagent from 'superagent';
import * as helpers from '../../helpers/helpers';
import { Banner } from 'src/app/interfaces/Banner';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements AfterViewInit {
  @ViewChild('TabsSlides', {static: false}) tabsSlides: IonSlides;
  @ViewChild('ProductsComponent', {static: false}) productsComponent: ProductsComponent;
  currentTabIndex = 0;
  data: Subject<any> = new Subject<any>();
  appId: string;

  isCategoryButtonActive = false;
  isCategoryButtonRemove = false;
  isShowButton = true;
  isLoading = true;
  isSplashscreenShown = true;
  products: any;
  categories: string[];
  currentCategory: string;

  // Number of items in the users basket
  noOfBasketProducts;

  constructor(
    public productsService: ProductsService,
    public basket: BasketService,
    public basketOverview: BasketOverviewService,
    public router: Router,
    private storage: StorageService,
    private sockets: SocketsService,
    private toast: ToastService
  ) {
  }

  ngAfterViewInit() {
    this.storage.getItem(environment.customerDataName)
      .then((data) => {
        this.data.next(data);
        this.verifyConnectivity();
      });

    this.basket.changes
      .subscribe((noOfBasketProducts) => {
        this.noOfBasketProducts = noOfBasketProducts;
      });
    this.tabsSlides.lockSwipes(true);
  }

  changeTab(index) {
    if (!this.isSplashscreenShown) {
      this.tabsSlides.lockSwipes(false);
      this.tabsSlides.slideTo(index || this.currentTabIndex);
      this.tabsSlides.lockSwipes(true);

      if (index === 3) {
        this.isShowButton = false;
      } else {
        this.isShowButton = true;
      }

      // Re-select the active element
      const previousActiveTabLink = document.querySelector('.tab.active'),
        selectedTabLink = document.querySelector('.tab-' + index);

      previousActiveTabLink.classList.remove('active');
      selectedTabLink.classList.add('active');
    }
  }

  requestConnectionStatus() {
    return new Promise((resolve, reject) => {
      // Send a request to check if the server is online
      superagent
        .get(environment.BACKEND + 'status?partnerId=' + environment.PARTNER_ID)
        .end((_, response) => {
          if (response) {
            resolve(response.status);
          } else {
            reject(0);
          }
        });
    });
  }

  verifyConnectivity() {
    /* Check if the application has an app id assigned to it for stats measuring and identification */
    this.storage.getItem(environment.AppId, false)
      .then((appId) => {
        // Retrieve the AppId or assign a newly generated for identifying the app in the server
        this.appId = appId;

        this.storage.getItem(environment.customerDataName)
          .then((data) => {
            if (data !== null) {
              this.requestConnectionStatus()
                .then((status) => {
                  console.log('Status:', status);
                  if (status === 200) {
                    // Initiate a socket connection to start exchanging data with at real-time
                    this.sockets.createConnection()
                      .then(() => {
                        this.initiateHomePage(data);
                      }).catch((error) => {
                        this.toast.showAlert({
                          header: 'ERROR: SOMETHING WENT WRONG.',
                          message: [error.toString(), '. If error persits please contact us.'],
                          buttons: [{ text: 'Retry' }]
                        }).then((alertHandlerData: any) => {
                          if (alertHandlerData && alertHandlerData.data === 0) {
                            this.initiateHomePage(data);
                          }
                        });
                      })
                  } else if (status === 404) {
                    this.toast.showAlert({
                      header: 'ERROR: APP TERMINATED.',
                      message: 'Partner no longer exists, probably means the app\'s functionalities has been terminated.' });
                  } else {
                    this.toast.showAlert({
                      header: 'ERROR: SOMETHING WENT WRONG.',
                      message: 'An unexpected error has occured, we are aware of this and we are on it.',
                      buttons: [{ text: 'Retry' }]
                    }).then((alertHandlerData: any) => {
                      if (alertHandlerData && alertHandlerData.data === 0) {
                        this.verifyConnectivity();
                      }
                    });
                  }
                }).catch((status) => {
                  this.toast.showAlert({
                    header: 'ERROR: NO INTERNET CONNECTION.',
                    message: 'You\'re not connected to the internet, please check your internet connection and try again.',
                    buttons: [{ text: 'Retry' }]
                  }).then((alertHandlerData: any) => {
                    if (alertHandlerData && alertHandlerData.data === 0) {
                      this.verifyConnectivity();
                    }
                  });
                });
            } else {
              this.router.navigate(['accounts'], {replaceUrl: true});
            }
          });
      }).catch(error => {
        this.appId = helpers.generateSeperatedKey();
        this.storage.setItem(environment.AppId, this.appId, false);
      });
  }

  initiateHomePage(data) {
    // Remove the SplashScreen since loading has completed
    this.isSplashscreenShown = false;
    console.log('Data Type:', data.type)
    // Check what type of account has logged in, if partner account has logged in then navigate to the navigation page
    if (data.type === 'partner') {
      this.router.navigate(['driver-navigation'], {replaceUrl: true});
    } else {
      // If the Order Number exists in the local storage, only show the order-placed page
      this.storage.getItem(environment.ORDER, false)
        .then((orderId) => {
          if (orderId) {
            this.router.navigate(['order-placed'], {replaceUrl: true});
          } else {
            // Load the products from the partners server
          this.productsService.getProducts()
          .then((products) => {
            this.productsComponent.products = products.sort(this.productsComponent.comparePopularityRate).reverse();
          }).catch(() => {
            // tslint:disable-next-line: max-line-length
            this.toast.showAlert(false, { header: 'ERROR: SOMETHING UNEXPECTED HAPPENED.', message: 'There was an error loading products from our servers.' });
          });

          // Load the banners
          this.productsService.getBanners()
            .then((banners: Banner[]) => {
              this.productsComponent.banners = banners;
              if (this.productsComponent.banners && this.productsComponent.banners.length) {
                this.productsComponent.startBannerSlideAnimation();
              }
            });
          }
        });
    }
  }
}
