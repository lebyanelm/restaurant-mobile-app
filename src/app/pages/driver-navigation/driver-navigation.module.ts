import { ComponentsModule } from './../../components/components/components.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DriverNavigationPageRoutingModule } from './driver-navigation-routing.module';

import { DriverNavigationPage } from './driver-navigation.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ComponentsModule,
    IonicModule,
    DriverNavigationPageRoutingModule
  ],
  declarations: [DriverNavigationPage]
})
export class DriverNavigationPageModule {}
