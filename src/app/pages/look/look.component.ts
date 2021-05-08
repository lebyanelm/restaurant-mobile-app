import { Product } from './../../interfaces/Product';
import { StorageService } from './../../services/storage.service';
import { Component, OnInit, Input } from '@angular/core';
import { get } from 'superagent';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-look',
  templateUrl: './look.component.html',
  styleUrls: ['./look.component.scss'],
})
export class LookComponent implements OnInit {
  data;
  keyword = '';
  isShowSearchKeyword = false;
  isLoading = false;
  searchResults: Product[] = [];

  constructor(
    private storage: StorageService,
    private router: Router
  ) { }

  ngOnInit() {
    this.storage.getItem(environment.customerDataName)
      .then((data) => {
        this.data = data;
      });
  }

  openProduct(id: string): void {
    this.router.navigate(['product', id]);
  }

  getResult() {
    this.isShowSearchKeyword = true;
    this.isLoading = true;
    get(environment.BACKEND + environment.PARTNER_ID + '/products?keyword=' + this.keyword)
      .then((response) => {
        if (response.status === 200) {
          this.searchResults = response.body.products;
          this.isLoading = false;
        }
      });
  }
}
