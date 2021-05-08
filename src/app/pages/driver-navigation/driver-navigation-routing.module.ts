import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DriverNavigationPage } from './driver-navigation.page';

const routes: Routes = [
  {
    path: '',
    component: DriverNavigationPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DriverNavigationPageRoutingModule {}
