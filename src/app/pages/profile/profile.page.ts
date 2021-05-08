import { StorageService } from './../../services/storage.service';
import { User } from 'src/app/interfaces/User';
import { Component, ViewChild, AfterViewInit, SecurityContext, ElementRef } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Plugins, CameraResultType, CameraDirection, CameraSource, CameraOptions } from '@capacitor/core';
import * as superagent from 'superagent';
import { DomSanitizer } from '@angular/platform-browser';

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
    private sanitizer: DomSanitizer
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
              this.avatar = this.sanitizer.sanitize(SecurityContext.RESOURCE_URL, response.body.url);
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
              }
            }
          } else {
            Plugins.Toast.show({ text: response.body.reason || 'Something went wrong.' });
          }
        } else {
          Plugins.Toast.show({ text: 'No connection. Please check your internet connection.' })
        }
      });
  }

  setGender(gender: string): void {
    this.updatedData.gender = gender === 'female' ? '0' : '1';
  }
}
