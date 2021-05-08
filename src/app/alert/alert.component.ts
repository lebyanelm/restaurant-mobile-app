import { Component, OnInit, Input } from '@angular/core';
import { AlertOptions } from '@capacitor/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
})
export class AlertComponent implements OnInit {
  @Input() options: any;
  constructor(
    private modalCtrl: ModalController
  ) { }

  ngOnInit() {}

  closeAlert(index) {
    this.modalCtrl.dismiss(index);
  }
}
