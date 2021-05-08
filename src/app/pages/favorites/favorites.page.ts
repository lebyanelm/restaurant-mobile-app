import { ToastService } from './../../services/toast.service';
import { ProductsService } from './../../services/products.service';
import { StorageService } from './../../services/storage.service';
import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Product } from 'src/app/interfaces/Product';
import { Router } from '@angular/router';
import * as superagent from 'superagent';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.page.html',
  styleUrls: ['./favorites.page.scss'],
})
export class FavoritesPage implements OnInit {
  data;
  favorites: Product[] = [];
  missingCount = 0;
  constructor(
    private storage: StorageService,
    private productService: ProductsService,
    private router: Router,
    private toast: ToastService
  ) { }

  async ngOnInit() {
    this.data = await this.storage.getItem(environment.customerDataName);
    if (this.data) {
      this.data.favorites.forEach((favorite: string) => {
        const product = this.productService.getProduct(favorite);
        if (product) {
          this.favorites.push(product);
        } else {
          this.missingCount++;
        }
      });
    }
  }

  openProduct(id: string): void {
    this.router.navigate(['product', id], {queryParams: {return: '/favorites'}});
  }

  clearFavorites(): void {
    superagent
      .post(environment.BACKEND + 'accounts/favorite')
      .send({productIds: this.data.favorites})
      .set('Authorization', this.data.token)
      .end((error, response) => {
        if (response) {
          if (response.status === 200) {
            this.favorites = [];
            this.data.favorites = [];
            this.storage.setItem(environment.customerDataName, this.data);
          } else {
            this.toast.showAlert({
              header: response.body.reason || 'ERROR: SOMETHING WENT WRONG',
              // tslint:disable-next-line: max-line-length
              message: response.body.message || 'An unexpected error has occured while removing your favorites from your account, sorry for the inconvinience.',
              buttons: [{ text: 'Retry again' }]
            }).then((index) => {
              if (index === 0) {
                this.clearFavorites();
              }
            });
          }
        } else {
          this.toast.showAlert(true);
        }
      });
  }
}
