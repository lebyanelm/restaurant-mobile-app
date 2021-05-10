import { SafePipe } from './../../pipes/safe.pipe';
import { BrowserPageComponent } from './../browser-page/browser-page.component';
import { SlideButtonComponent } from './../slide-button/slide-button.component';
import { ChatMessageComponent } from './../chat-message/chat-message.component';
import { AlertComponent } from './../../alert/alert.component';
import { AddPaymentOptionPage } from './../../pages/add-payment-option/add-payment-option.page';
import { BasketOverviewComponent } from './../basket-overview/basket-overview.component';
import { PromocodePage } from './../../pages/promocode/promocode.page';
import { DeliveryLocationComponent } from './../delivery-location/delivery-location.component';
import { AccountComponent } from './../../pages/account/account.component';
import { BasketsComponent } from './../../pages/baskets/baskets.component';
import { LookComponent } from './../../pages/look/look.component';
import { ProductsComponent } from './../../pages/products/products.component';
import { MapComponent } from './../map/map.component';
import { ProductComponent } from './../product/product.component';
import { ProductShimmerComponent } from './../product-shimmer/product-shimmer.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { PromocodeModalComponent } from '../promocode-modal/promocode-modal.component';
import { OrdersPage } from '../../pages/orders/orders.page';
import { PaymentComponent } from '../payment/payment.component';
import { ChatService } from 'src/app/services/chat.service';
import { ChatComponent } from './../chat/chat.component';
import { AddNoteComponent } from '../add-note/add-note.component';

@NgModule({
  entryComponents: [
    DeliveryLocationComponent,
    OrdersPage,
    PromocodePage,
    PaymentComponent,
    AddPaymentOptionPage,
    AlertComponent,
    ChatComponent,
    AddNoteComponent,
    BrowserPageComponent
  ],
  declarations: [
    ProductShimmerComponent,
    ProductComponent,
    MapComponent,
    PromocodeModalComponent,
    ProductsComponent,
    LookComponent,
    BasketsComponent,
    AccountComponent,
    DeliveryLocationComponent,
    OrdersPage,
    PromocodePage,
    PaymentComponent,
    BasketOverviewComponent,
    AddPaymentOptionPage,
    AlertComponent,
    ChatMessageComponent,
    ChatComponent,
    AddNoteComponent,
    SlideButtonComponent,
    BrowserPageComponent,
    SafePipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule.forRoot({ mode: 'md' }),
  ],
  providers: [
    MapComponent,
    DeliveryLocationComponent,
    ChatService
  ],
  exports: [
    ProductShimmerComponent,
    ProductComponent,
    MapComponent,
    PromocodeModalComponent,
    ProductsComponent,
    LookComponent,
    BasketsComponent,
    AccountComponent,
    DeliveryLocationComponent,
    OrdersPage,
    PromocodePage,
    PaymentComponent,
    BasketOverviewComponent,
    AddPaymentOptionPage,
    AlertComponent,
    ChatMessageComponent,
    ChatComponent,
    AddNoteComponent,
    SlideButtonComponent,
    BrowserPageComponent
  ]
})
export class ComponentsModule { }
