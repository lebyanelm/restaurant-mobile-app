import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PhonenumberVerificationPage } from './phonenumber-verification.page';

const routes: Routes = [
  {
    path: '',
    component: PhonenumberVerificationPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PhonenumberVerificationPageRoutingModule {}
