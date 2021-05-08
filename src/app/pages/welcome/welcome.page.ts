import { Plugins } from '@capacitor/core';
import { Component, OnInit } from '@angular/core';

declare const FB;
@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
})
export class WelcomePage implements OnInit {

  constructor(
  ) { }

  ngOnInit() {
    Plugins.Keyboard.hide();
  }

  openFacebookLogin() {
  }
}
