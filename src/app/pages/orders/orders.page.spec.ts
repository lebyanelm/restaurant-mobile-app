import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { OrdersPage } from './orders.page';

describe('OrdersPage', () => {
  let component: OrdersPage;
  let fixture: ComponentFixture<OrdersPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OrdersPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(OrdersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});


<ion-content>
  <!-- For selecting payment option, either online or cash -->
  <div class="payment-option-selection-backlight" [attr.isOpen]="isPaymentOptionsOpen"></div>


  <!-- Page header -->
  <div class="page-header">
    <div class="top-header">
      <!-- <div class="back-button clickable" [routerLink]="returnPage ? returnPage : '/home'" routerDirection="back"><ion-icon class="center" name="close"></ion-icon></div> -->
      <div class="space"></div>
      <div class="buttons">
       <div class="button clickable" (click)="basket.clear()">Clear basket</div>
      </div>
    </div>
    <div class="header-details">
      <!-- Delivery address -->
      <div class="destination-map-snapshot">
        <div class="details">
          <div class="address" *ngIf="basket.destination">
            <span *ngFor="let addressLine of basket.destination.address">{{addressLine}}<br></span>
          </div>
          <div class="address" *ngIf="!basket.destination">Unable to load location</div>
          <div class="description" (click)="openAddNoteModal(true)">
            <b>Delivery Instructions</b>
            <br>
            <span>{{basket.deliveryNote ? basket.deliveryNote : 'Add delivery a note'}}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- <ion-content> -->
      <div class="page-content">


        <!-- Time estimation of the delivery (Currently Off) -->
        <p class="ion-text-center delivery-time-estimation" *ngIf="basket.basketSummary.eta.lower && basket.basketSummary.eta.upper">DELIVERING TO YOUR DOOR &mdash; {{basket.basketSummary.eta.lower < 60 ? basket.basketSummary.eta.lower : (basket.basketSummary.eta.lower / 60).toFixed(0)}} {{basket.basketSummary.eta.lower < 60 ? 'MIN' : 'HRS'}} - {{basket.basketSummary.eta.upper < 60 ? basket.basketSummary.eta.upper : (basket.basketSummary.eta.upper / 60).toFixed(0)}} {{basket.basketSummary.eta.upper < 60 ? 'MIN' : 'HRS'}}</p>
        <p class="ion-text-center" style="color: grey;" *ngIf="!basket.count">No items in your orders.</p>

        <!-- Product items -->
        <div class="order-items" *ngIf="basket.products.length > 0">
          <div class="order-items-title">Your basket items</div>
          <div class="order-item flex" *ngFor="let product of basket.products">
            <div class="order-index">{{product.quantity}}</div>
            <span class="multiplier"><ion-icon name=close></ion-icon></span>
            <div class="left-side" (click)="openProduct(product.id)">
              <div class="order-name">{{product.name}}</div>
              <div class="order-price flex">ZAR {{product.price + product.extrasAmount}}</div>
            </div>
            <div class="space" (click)="openProduct(product.id)"></div>
            <div class="right-side" (click)="basket.minusQuantity(product.id)">
              <div class="minus-button" ><ion-icon class=center name=remove></ion-icon></div>
            </div>
          </div>
        </div>

        <div [class]="'payment-option-selection-modal ' + (isPaymentOptionsOpen ? 'open' : 'closed')">
          <div class="payment-modal-title">Payment method</div>
          <div class="payment-modal-options">
            <div class="payment-modal-option" (click)="this.basket.paymentMethod = 'online'">
              <div class="checkbox side-checkbox" [attr.checked]="this.basket.paymentMethod === 'online'"></div>
              <div class="name">Online Payment</div>
            </div>
            <div class="payment-modal-option" (click)="this.basket.paymentMethod = 'cash'">
              <div class="checkbox side-checkbox" [attr.checked]="this.basket.paymentMethod === 'cash'"></div>
              <div class="name">Cash Payment</div>
            </div>
          </div>
        </div>

        <div class="delivery-collection leave-a-note-button ion-activatable">
          <div class="delivery-collection-title">Delivery / Collection</div>
          <div class="flex">
            <div
              class="delivery"
              [attr.selected]="this.basket.orderingMode === 'delivery'"
              (click)="this.basket.orderingMode = 'delivery'">Delivery</div>
            <div
              class="delivery"
              [attr.selected]="this.basket.orderingMode === 'collection'"
              (click)="this.basket.orderingMode = 'collection'">Collection</div>
          </div>
        </div>

        <div class="leave-a-note-button ion-activatable" (click)="openAddNoteModal(false)">
          <ion-ripple-effect></ion-ripple-effect>
          <b>Restaurant Instructions</b>
          <br>
          <span>{{basket.specialInstructions.length ? basket.specialInstructions : 'Leave a note (eg. Extra sauce, extra napkins)'}}</span>
        </div>

        <div class="order-summary">
          <!-- <h5 class="ion-text-center">Order Summary</h5> -->
          <span class="summary promocode flex" (click)="openPromocodeModal()">
            <b>Promocode</b>
            <div class="space"></div>
            <span class="link" *ngIf="!basket.basketSummary.promocode.code">ENTER</span>
            <b class="border" *ngIf="basket.basketSummary.promocode.code" (click)="openPromocodeModal(basket.basketSummary.promocode.code)">{{basket.basketSummary.promocode.code}} (-{{basket.basketSummary.promocode.discount}}%)</b>
          </span>

          <span class="summary flex">
            <b>Subtotal</b>
            <div class="space"></div>
            <span>R {{basket.basketSummary.orderPrice.toFixed(2)}}</span>
          </span>

          <span class="summary flex discount" [attr.isDiscountApplied]="basket.basketSummary.promocode && basket.basketSummary.promocode.code ? true : false">
            <span>Discount</span>
            <div class="space"></div>
            <span>-R {{basket.basketSummary.discount.toFixed(2)}}</span>
          </span>

          <span class="summary flex">
            <b>Delivery Fee</b>
            <div class="space"></div>
            <span>+R {{basket.basketSummary.deliveryPayment.toFixed(2)}}</span>
          </span>

          <!-- <span class="summary flex">
            <span>Tax (15%)</span>
            <div class="space"></div>
            <span>R {{basket.basketSummary.tax.toFixed(2)}}</span>
          </span> -->

          <span class="summary flex total">
            <b>Order Total</b>
            <div class="space"></div>
            <span><b>R {{basket.basketSummary.totalPayment.toFixed(2)}}</b></span>
          </span>
        </div>
      </div>
  <!-- </ion-content> -->
</ion-content>

<ion-footer class="buttons">
  <button (click)="placeOrder()" [disabled]="basket.count === 0" #PlaceOrderButton>Confirm & Checkout</button>
</ion-footer>
