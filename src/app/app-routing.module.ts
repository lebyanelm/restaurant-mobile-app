import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'start',
    pathMatch: 'full'
  },
  {
    path: 'start',
    loadChildren: () => import('./pages/start/start.module').then( m => m.StartPageModule)
  },
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then( m => m.HomePageModule)
  },
  {
    path: 'product/:productId',
    loadChildren: () => import('./pages/product/product.module').then( m => m.ProductPageModule)
  },
  {
    path: 'contact',
    loadChildren: () => import('./pages/contact/contact.module').then( m => m.ContactPageModule)
  },
  {
    path: 'promocode',
    loadChildren: () => import('./pages/promocode/promocode.module').then( m => m.PromocodePageModule)
  },
  {
    path: 'forgot-password',
    loadChildren: () => import('./pages/forgot-password/forgot-password.module').then( m => m.ForgotPasswordPageModule)
  },
  {
    path: 'order-placed',
    loadChildren: () => import('./pages/order-placed/order-placed.module').then( m => m.OrderPlacedPageModule)
  },
  {
    path: 'driver-navigation',
    loadChildren: () => import('./pages/driver-navigation/driver-navigation.module').then( m => m.DriverNavigationPageModule)
  },
  {
    path: 'about',
    loadChildren: () => import('./pages/about/about.module').then( m => m.AboutPageModule)
  },
  {
    path: 'profile',
    loadChildren: () => import('./pages/profile/profile.module').then( m => m.ProfilePageModule)
  },
  // {
  //   path: 'payment-methods',
  //   loadChildren: () => import('./pages/payment-methods/payment-methods.module').then( m => m.PaymentMethodsPageModule)
  // },
  {
    path: 'order',
    loadChildren: () => import('./pages/order/order.module').then( m => m.OrderPageModule)
  },
  {
    path: 'favorites',
    loadChildren: () => import('./pages/favorites/favorites.module').then( m => m.FavoritesPageModule)
  },
  {
    path: 'welcome',
    loadChildren: () => import('./pages/welcome/welcome.module').then( m => m.WelcomePageModule)
  },
  {
    path: 'signin',
    loadChildren: () => import('./pages/signin/signin.module').then( m => m.SigninPageModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./pages/register/register.module').then( m => m.RegisterPageModule)
  },
  {
    path: 'phonenumber-verification',
    loadChildren: () => import('./pages/phonenumber-verification/phonenumber-verification.module').then( m => m.PhonenumberVerificationPageModule)
  },
  {
    path: 'payment-completed',
    loadChildren: () => import('./pages/payment-completed/payment-completed.module').then( m => m.PaymentCompletedPageModule)
  },
  {
    path: 'payment-error',
    loadChildren: () => import('./pages/payment-error/payment-error.module').then( m => m.PaymentErrorPageModule)
  },
  {
    path: 'payment-cancelled',
    loadChildren: () => import('./pages/payment-cancelled/payment-cancelled.module').then( m => m.PaymentCancelledPageModule)
  },
  {
    path: 'payment-notification',
    loadChildren: () => import('./pages/payment-notification/payment-notification.module').then( m => m.PaymentNotificationPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
