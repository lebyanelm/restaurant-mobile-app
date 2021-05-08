import { Banner } from './../interfaces/Banner';
import { Product } from './../interfaces/Product';
import { SocketsService } from './sockets.service';
import { Subject, timer } from 'rxjs';
import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { environment } from 'src/environments/environment';
import * as superagent from 'superagent';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  changes: Subject<Product[]> = new Subject<Product[]>();
  products: Product[];
  banners: Banner[];

  constructor(
    private sockets: SocketsService
  ) {
  }

  getProducts(): Promise<Product[]> {
    return new Promise((resolve, reject) => {
      superagent
      .get(environment.BACKEND +  environment.PARTNER_ID + '/products')
      .end((error, response) => {
        if (!error) {
          if (response.status === 200) {
            this.products = response.body.products;
            this.changes.next(response.body.products);
            resolve(response.body.products);
          } else {
            this.changes.next(response.body);
            reject(response.body);
          }
        } else {
          resolve([]);
        }
      });
    });
  }

  getCategorizedProducts(products: Product[]) {
    // tslint:disable-next-line: variable-name
    const _products: any = {};
    products.forEach((product) => {
      if (_products[product.category] === undefined) {
        _products[product.category] = [];
      }

      _products[product.category].push(product);
    });

    return _products;
  }

  getCategories(categorizedProducts) {
    const categories = [];
    // tslint:disable-next-line: forin
    for (const category in categorizedProducts) {
      categories.push(category);
    }

    return categories;
  }

  getProduct(id: string) {
    let product: Product;
    this.products.forEach((p) => {
      if (p.id === id) {
        product = p;
      }
    });

    return product;
  }

  getBanners() {
    return new Promise((resolve, reject) => {
      superagent
      .get(environment.BACKEND +  environment.PARTNER_ID + '/banners')
      .end((error, response) => {
        if (!error) {
          if (response.status === 200) {
            this.banners = response.body.banners;
            resolve(this.banners);
          } else {
            reject(response.body);
          }
        } else {
          resolve([]);
        }
      });
    });
  }
}
