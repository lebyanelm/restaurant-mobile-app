// Dependencies
import { MapEventsService } from './services/map-events.service';
import { BasketService } from './services/basket.service';
import { ProductsService } from './services/products.service';
import { ComponentsModule } from './components/components/components.module';
import { SocketsService } from './services/sockets.service';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { SocketIoModule } from 'ngx-socket-io';
import { EventsService } from './services/events';
import { LaunchNavigator } from '@ionic-native/launch-navigator/ngx';
import { HomePage } from './pages/home/home.page';
import { SafePipe } from './pipes/safe.pipe';

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    IonicModule.forRoot({
      mode: 'md'
    }),
    AppRoutingModule,
    SocketIoModule,
    ComponentsModule
  ],
  providers: [
    SocketsService,
    ProductsService,
    BasketService,
    MapEventsService,
    EventsService,

    // Cordova
    LaunchNavigator,

    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  exports: [
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
