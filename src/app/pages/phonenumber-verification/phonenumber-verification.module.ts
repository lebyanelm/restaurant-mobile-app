import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PhonenumberVerificationPageRoutingModule } from './phonenumber-verification-routing.module';

import { PhonenumberVerificationPage } from './phonenumber-verification.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PhonenumberVerificationPageRoutingModule
  ],
  declarations: [PhonenumberVerificationPage]
})
export class PhonenumberVerificationPageModule {}
