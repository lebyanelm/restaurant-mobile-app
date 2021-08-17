import { User } from './../../interfaces/User';
import { BasketItem } from './../../interfaces/BasketItem';
import { BasketOverviewService } from './../../services/basket-overview.service';
import { StorageService } from './../../services/storage.service';
import { ToastService } from './../../services/toast.service';
import { Product } from './../../interfaces/Product';
import { ProductsService } from './../../services/products.service';
import { BasketService } from './../../services/basket.service';
import { Component, OnInit, AfterViewInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonCheckbox, IonContent, AlertController } from '@ionic/angular';
import { ExtrasService } from 'src/app/services/extras.service';
import { Extra } from 'src/app/interfaces/Extra';
import { post } from 'superagent';
import { environment } from 'src/environments/environment';
import { Plugins } from '@capacitor/core';
import { Section } from 'src/app/interfaces/Section';
import { SectionOption } from 'src/app/interfaces/SectionOption';

@Component({
  selector: 'app-product',
  templateUrl: './product.page.html',
  styleUrls: ['./product.page.scss'],
})
export class ProductPage implements AfterViewInit {
  @ViewChild('MainContent', {static: false}) ionContent: IonContent;

  backButtonPage: string;
  product: Product;
  extras: Extra[];
  return: string;
  bData: BasketItem = {
    id: '',
    quantity: 1,
    sides: [],
    extras: [],
    selectedOptions: {},
    extrasAmount: 0,
    description: '',
    placeholder: '',
    name: '',
    price: 0,
    originalPrice: 0 };
  sides: Product[] = [];
  basketSides: BasketItem[] = [];
  isFailedToLoadExtras = false;

  data: User;

  isAddableToBasket = false;
  constructor(
    private activetedRoute: ActivatedRoute,
    private alertController: AlertController,
    public basket: BasketService,
    public basketOverview: BasketOverviewService,
    private productService: ProductsService,
    private extrasService: ExtrasService,
    private storage: StorageService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    // Get account data
    this.storage.getItem(environment.customerDataName)
      .then((data: User) => {
        this.data = data;
      });

    const checker = setInterval(() => {
      if (this.product) {
        // STATS: Let the server know the product has been viewed
        post(environment.BACKEND + 'product/views')
          .send({ id: this.product.id, partnerId: environment.PARTNER_ID })
          .end();

        this.bData.name = this.product.name;
        this.bData.description = this.product.description;
        this.bData.placeholder = this.product.images[0];
        this.bData.price = parseFloat(this.product.price);
        this.product.sides.forEach((side: any) => {
          side = this.productService.getProduct(side);
          if (side) {
            this.sides.push(side);
          }
        });

        // Automatically select the first option if a section is required
        if (this.product.sections.length) {
          this.product.sections.forEach((section) => {
            if (section.isRequired) {
              const sectionName = section.name.replace(/\s/g, '_');
              this.bData.selectedOptions[sectionName] = section.options[0].name;
            }
          });
        }

        if (this.product.extras.length) {
          this.extrasService.getExtras(this.product.extras)
            .then((extras) => {
              this.extras = extras;
            }).catch(error => {
              this.isFailedToLoadExtras = true;
              Plugins.Toast.show({ text: ['Couldn\'t load extras for', this.product.name].join(' ') });
            });
        }
        clearInterval(checker);
      }
    }, 200);
  }

  ngAfterViewInit() {
    this.activetedRoute.paramMap.subscribe(async (param) => {
      this.product = await this.productService.getProduct(param.get('productId'));
      this.bData.id = param.get('productId');
      this.bData = this.basket.products[param.get('productId')] || this.bData;
      if (this.product) {
        // Change the price type from string to a number for calculations
        this.product.price = parseFloat(this.product.price);
        this.bData.originalPrice = this.product.price;
      }
    });

    this.activetedRoute.queryParamMap.subscribe((queryParams) => {
      this.return = queryParams.get('return');
    });

    this.activetedRoute.queryParamMap.subscribe((queryParams) => {
      this.backButtonPage = queryParams.get('return');
      if (!this.backButtonPage) {
        this.backButtonPage = '/home';
      }
    });
  }

  openBasket(): void {
    this.basketOverview.open('/product/' + this.product.id);
  }

  selectExtra(extra: Extra): void {
    const syncObject = this.inBasket() !== -1 ? this.basket.products[this.inBasket()] : this.bData;

    if (syncObject.extras.indexOf(extra.id) === -1) {
      syncObject.extras.push(extra.id);
      syncObject.extrasAmount += parseFloat(extra.price);
    } else {
      syncObject.extras.splice(syncObject.extras.indexOf(extra.id), 1);
      syncObject.extrasAmount -= parseFloat(extra.price);
    }

    this.basket.update();
  }

  selectSectionOption(section: any, option: SectionOption): void {
    const syncObject: BasketItem = this.inBasket() !== -1 ? this.basket.products[this.inBasket()] : this.bData,
          // Remove spaces from the name of the section for use in the basket
          name = section.name.replace(/\s/g, '_');

    // Find a proper way to append the selected option
    if (!syncObject.selectedOptions[name]) {
      syncObject.selectedOptions[name] = [option.name];
    } else {
      // Check if option has been selected in order to remove it if it does
      if (syncObject.selectedOptions[name].includes(option.name)) {
        syncObject.selectedOptions[name].splice(syncObject.selectedOptions[name].indexOf(option.name), 1);
      } else {
       // Check if section is multi-select
       if (section.isMultiSelect) {
          // Add the option in the stack of selected options
          syncObject.selectedOptions[name].push(option.name);
       } else {
          // Add the option in the stack of selected options
          syncObject.selectedOptions[name] = [option.name];
       }
      }
    }

    // If the option has a price change to it, appy the price changes to the basket
    // Only if the section is not a multi-select
    if (option.price && !section.isMultiSelect) {
      // Save the original price
      syncObject.originalPrice = syncObject.price;
      syncObject.price = parseFloat(option.price);
      this.product.price = syncObject.price;
    } else {
      // Restore to the original price
      syncObject.price = syncObject.originalPrice;
      this.product.price = syncObject.price;
    }

    this.basket.update();
  }

  returnRegex(regex, flags) {
    return new RegExp(regex, flags);
  }

  addToBasket() {
    this.basket.products.push(this.bData);

    // Also add the sides to the basket
    this.basketSides.forEach((side) => {
      const index: number = this.basket.products.findIndex((_product) => _product.id === side.id);
      if (index === -1) {
        this.basket.products.push(side);
      } else {
        this.basket.products[index].quantity++;
        this.basket.products[index].isSide = true;
        this.basket.products[index].mainProduct = this.product.id;
      }
    });

    this.basket.update();
    this.cdr.detectChanges();
  }

  addQuantity() {
    let isFound = false;
    // tslint:disable: prefer-for-of
    for (let index = 0; index < this.basket.products.length; index++) {
      if (this.basket.products[index].id === this.product.id) {
        this.basket.products[index].quantity++;
        isFound = true;
        break;
      }
    }

    // If it isn't found increment in the temporary bData
    if (!isFound) {
      this.bData.quantity++;
    }

    this.basket.update();
  }

  removeQuantity() {
    let isFound = false;
    for (let index = 0; index < this.basket.products.length; index++) {
      if (this.basket.products[index].id === this.product.id) {
        isFound = true;
        this.basket.minusQuantity(this.product.id);
      }
    }

    if (!isFound) {
      this.bData.quantity--;
      if (this.bData.quantity < 1) {
        this.bData.quantity = 1;
      }
    }
  }

  async selectSide(side: Product | any) {
    const syncObject = this.inBasket() !== -1 ? this.basket.products[this.inBasket()] : this.bData;
    if (!syncObject.quantity) { syncObject.quantity = 1; }

    if (syncObject.sides.indexOf(side.id) === -1) {
      const sideObject: BasketItem = {
        name: side.name,
        id: side.id,
        extras: [],
        sides: [],
        extrasAmount: 0,
        price: side.price,
        originalPrice: side.price,
        description: side.description,
        placeholder: side.images[0],
        isSide: true,
        mainProduct: this.product.id,
        quantity: 1 };

      syncObject.sides.push(side.id);
      this.basketSides.push(sideObject);
      this.bData.extrasAmount += parseFloat(side.price);
    } else {
      // Check if the product has any required sides
      if (this.product.noRequiredSides) {
        if (syncObject.sides.length - 1 < this.product.noRequiredSides && this.inBasket() !== -1) {
          // Show the user that removing the side will remove the product from the basket
          const alert = await this.alertController.create({
            header: 'Approve your action',
            // tslint:disable-next-line: max-line-length
            message: [this.product.name, 'requires', this.product.noRequiredSides, 'to be able to remain in the basket. Removing the selected side will remove the product from the basket.'].join(' '),
            buttons: [{ text: 'Yes, Remove.', handler: () => {
              for (let index = 0; index < this.basket.products.length; index++) {
                if (this.basket.products[index].id === this.product.id) {
                  // Keep the copy of the basket product and remove only the removed side.
                  this.bData = {...this.basket.products[index]};
                  this.bData.sides.splice(this.bData.sides.indexOf(side.id), 1);
                  this.bData.extrasAmount -= parseFloat(side.price);

                  this.basketSides = [];
                  // Find the sides related to this product
                  this.removeSideFromBasket(side);

                  // Remove the product from the basket and update the related parameters.
                  this.basket.products.splice(index, 1);
                  this.basket.count = this.basket.products.length;
                }
              }

              // Update the view of the changes made
              this.isAddableToBasket = false;
              this.cdr.detectChanges();
            }}, { text: 'No, Cancel.' }]});
          alert.present();
        } else {
          syncObject.sides.splice(syncObject.sides.indexOf(side.id), 1);
          syncObject.extrasAmount -= parseFloat(side.price);
          this.basketSides.forEach((basketSide, index) => {
            if (basketSide.id === side.id) {
              this.basketSides.splice(index, 1);
            }
          });
          this.removeSideFromBasket(side);
        }
      } else {
        syncObject.sides.splice(syncObject.sides.indexOf(side.id), 1);
        syncObject.extrasAmount -= parseFloat(side.price);
        this.basketSides.forEach((basketSide, index) => {
          if (basketSide.id === side.id) {
            this.basketSides.splice(index, 1);
          }
        });
        this.removeSideFromBasket(side);
      }
    }

    // Check if the required items have been selected
    if (syncObject.sides.length > this.product.noRequiredSides || syncObject.sides.length === this.product.noRequiredSides) {
      this.isAddableToBasket = true;
    } else {
      this.isAddableToBasket = false;
    }
    this.basket.update();
  }

  removeSideFromBasket(side: BasketItem) {
    this.basket.products.forEach((product, sideIndex) => {
      if (product.isSide) {
        if (product.mainProduct === this.product.id) {
          if (product.id !== side.id) {
            this.basketSides.push(product);
          }
          this.basket.products.splice(sideIndex, 1);
        }
      }
    });
  }

  toggleCheckbox(checkboxId: string) {
    const _: any = document.getElementById(checkboxId),
      checkbox: IonCheckbox = _;
    checkbox.checked = !checkbox.checked;
  }

  inBasket() {
    let isFound = -1;
    for (let index = 0; index < this.basket.products.length; index++) {
      if (this.basket.products[index].id === this.product.id) {
        isFound = index;
        break;
      }
    }

    return isFound;
  }

  isSideSelected(sideId: string) {
    let isFound = false;
    if (this.basket.products.length) {
      for (let index = 0; index < this.basket.products.length; index++) {
        if (this.basket.products[index].sides.includes(sideId)) {
          isFound = true;
          break;
        }
      }
    }

    return isFound;
  }

  isExtraSelected(extraId: string) {
    let isFound = false;
    if (this.basket.products.length) {
      for (let index = 0; index < this.basket.products.length; index++) {
        if (this.basket.products[index].extras.includes(extraId)) {
          isFound = true;
          break;
        }
      }
    }

    return isFound;
  }

  likeProduct() {
    post(environment.BACKEND + 'accounts/favorite')
    .set('Authorization', this.data.token)
    .send({ uid: this.data.id, productId: this.product.id })
    .end((error, response) => {
      if (response) {
        if (response.status === 200) {
          if (this.data.favorites.indexOf(this.product.id) === -1) {
            this.data.favorites.push(this.product.id);
          } else {
            this.data.favorites.splice(this.data.favorites.indexOf(this.product.id), 1);
          }
          this.storage.setItem(environment.customerDataName, this.data);
        } else {
          this.toast.show(response.body.reason || 'ERROR: SOMETHING WENT WRONG.');
        }
      } else {
        this.toast.showAlert(true);
      }
    });
  }
}
