import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AddPaymentOptionPage } from './add-payment-option.page';

const routes: Routes = [
  {
    path: '',
    component: AddPaymentOptionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AddPaymentOptionPageRoutingModule {}
