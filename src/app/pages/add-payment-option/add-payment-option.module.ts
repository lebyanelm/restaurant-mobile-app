import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AddPaymentOptionPageRoutingModule } from './add-payment-option-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AddPaymentOptionPageRoutingModule
  ],
  declarations: []
})
export class AddPaymentOptionPageModule {}
