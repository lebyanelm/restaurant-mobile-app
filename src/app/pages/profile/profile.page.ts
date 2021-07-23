import { StorageService } from './../../services/storage.service';
import { User } from 'src/app/interfaces/User';
import { Component, ViewChild, AfterViewInit, SecurityContext, ElementRef } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Plugins, CameraResultType, CameraDirection, CameraSource, CameraOptions } from '@capacitor/core';
import * as superagent from 'superagent';
import { DomSanitizer } from '@angular/platform-browser';
import { ModalController, NavController } from '@ionic/angular';
import { AlertComponent } from 'src/app/alert/alert.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements AfterViewInit {
  @ViewChild('UpdateButton', {static: false}) updateButton: ElementRef<HTMLButtonElement>;

  isLoading = false;
  data: User;
  photo: Blob;
  avatar;
  updatedData = {
    names: '',
    emailAddress: '',
    phoneNumber: '',
    gender: ''
  };

  constructor(
    private storage: StorageService,
    private sanitizer: DomSanitizer,
    private router: Router,
    private modalCtrl: ModalController,
    public navCtrl: NavController
  ) {
    this.storage.getItem(environment.customerDataName)
      .then((data) => {
        this.data = data;
        this.avatar = this.data.media.length === 1 ? this.data.media[0] : this.data.media[this.data.media.length - 1];
      });
  }

  ngAfterViewInit() {
  }

  async getProfilePhoto() {
    const options: CameraOptions = {
      resultType: CameraResultType.Uri,
      direction: CameraDirection.Front },
          form = new FormData();
    let image;

    try {
      image = await Plugins.Camera.getPhoto({...options, source: CameraSource.Prompt});
      this.photo = await fetch(image.webPath).then((r) => r.blob());
      form.append('file', this.photo);

      superagent
        .post(environment.BACKEND + 'assets/upload?isPartner=false&isAvatar=true&token=' + this.data.token)
        .attach('file', this.photo)
        .end((_, response) => {
          if (response) {
            if (response.status === 200) {
              this.avatar = response.body.url;
              this.data.media.push(response.body.url);
              this.storage.setItem(environment.customerDataName, this.data);
            }
          }
        });
    } catch (e) {
      Plugins.Toast.show({text: 'No photo has been selected.'});
    }
  }

  updateProfile() {
    this.updateButton.nativeElement.disabled = true;
    this.isLoading = !this.isLoading;

    // Refine the data before it's sent
    const data = {};
    for (const property in this.updatedData) {
      if (this.updatedData[property]) {
        data[property] = this.updatedData[property];
      }
    }

    // Send a request to update the profile details to nextify partners backend
    superagent
      .patch(environment.BACKEND + 'accounts?source=app')
      .send(data)
      .set('Authorization', this.data.token)
      .end((_, response) => {
        this.updateButton.nativeElement.disabled = false;
        if (response) {
          if (response.status === 200) {
            this.isLoading = false;

            // Update the local data
            for (const property in data) {
              if (typeof data[property] === 'string' && typeof this.data[property] === 'string') {
                this.data[property] = data[property];
                this.updatedData[property] = '';

                this.storage.setItem(environment.customerDataName, this.data);
                this.storage.change.next({ name: environment.customerDataName, data: this.data });
              }
            }

            this.navCtrl.back();
          } else {
            Plugins.Toast.show({ text: response.body.reason || 'Something went wrong.' });
            console.log('Something went wrong.');
          }
        } else {
          Plugins.Toast.show({ text: 'No connection. Please check your internet connection.' })
          console.log('Something went wrong.');
        }
      });
  }

  async showDeleteApprovalModal() {
    const deleteApprovalModal = await this.modalCtrl.create({
      component: AlertComponent,
      cssClass: ['alert-modal'],
      componentProps: {
        options: {
          header: 'Are you sure?',
          message: 'You are about to permenantly delete your account, do you approve this action?',
          buttons: [
            { text: 'Yes, I\'m cetain' },
            { text: 'No, cancel' }
          ]
        }
      }
    });

    deleteApprovalModal.onDidDismiss()
      .then((data) => {
        if (data.data === 0) {
          this.deleteAccount();
        }
      });

    deleteApprovalModal.present();
  }

  deleteAccount() {
    superagent
      .delete([environment.BACKEND, 'accounts'].join(''))
      .set('Authorization', this.data.token)
      .send({ partnerId: environment.PARTNER_ID })
      .end((_, response) => {
        if (response) {
          if (response.ok) {
            Plugins.Toast.show({ text: 'Account deleted!' });

            // Remove the data items
            this.storage.remove(environment.customerDataName);
            this.storage.remove(environment.ORDER);

            // Log out the user
            this.router.navigate(['signin']);
          } else {
            Plugins.Toast.show({ text: response.body.reason || 'Something went wrong.' });
          }
        } else {
          Plugins.Toast.show({ text: 'No internet connection. Please check your connection and try agaiin.' });
        }
      });
  }

  setGender(gender: string): void {
    this.updatedData.gender = gender === 'female' ? '0' : '1';
  }
}
