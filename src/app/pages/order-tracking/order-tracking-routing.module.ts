import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OrderTrackingPage } from './order-tracking.page';

const routes: Routes = [
  {
    path: '',
    component: OrderTrackingPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrderTrackingPageRoutingModule {}
