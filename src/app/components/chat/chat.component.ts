import { environment } from 'src/environments/environment';
import { Message } from './../../interfaces/Message';
import { ToastService } from './../../services/toast.service';
import { EventsService } from './../../services/events';
import { ChatService } from 'src/app/services/chat.service';
import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import * as superagent from 'superagent';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements AfterViewInit {
  @ViewChild('ChatMessages', {static: false}) chatMessages: ElementRef<HTMLDivElement>;
  @ViewChild('FileInput', { static: false }) fileInput: ElementRef<HTMLInputElement>;
  @Input() data;
  message: Message = { body: '', type: 'outbound' };

  isChatConnected = false;

  constructor(
    public chat: ChatService,
    private toast: ToastService,
    private modalCtrl: ModalController,
    private events: EventsService,
  ) { }

  ngAfterViewInit() {
    if (!this.chat.hasConnection) {
      this.connect();
    } else {
      this.isChatConnected = true;
    }
  }

  selectFileAttachment() {
    this.fileInput.nativeElement.click();
  }

  uploadAttachments() {
    return new Promise((resolve, reject) => {
      superagent
        .post([environment.BACKEND, 'assets/upload?isPartner=false&isAvatar=false&token=', this.data.token].join(''))
        .attach('file', this.fileInput.nativeElement.files[0])
        .set('Authorization', this.data.token)
        .end((_, response) => {
          if (response) {
            if (response.status === 200) {
              resolve(response.body.url);
            } else {
              reject(response.body.reason);
            }
          } else {
            reject('ERROR: YOU ARE NOT CONNECTED TO THE INTERNET.')
          }
        });
    });
  }

  connect() {
    this.chat.connect(this.data.token, environment.PARTNER_ID)
    .then(() => {
      this.isChatConnected = true;
      this.chat.onMessage.subscribe((message) => {
        this.events.notification.next('message');
        this.chat.messages.push(message);
      });

      // Scroll to the latest message
      setTimeout(() => {
        this.chatMessages.nativeElement.scrollTop = this.chatMessages.nativeElement.scrollHeight;
      }, 500);

      this.chat.setMessageAsRead();
    }).catch((response) => {
      this.toast.showAlert(false, {
        header: 'ERROR',
        message: response.body.message,
        buttons: [{ text: 'Retry again' }, { text: 'Cancel' }]
      }).then((data: any) => {
        if (data) {
          if (data.data === 0) {
            this.modalCtrl.dismiss();
            this.connect();
          } else if (data.data === 1) {
            this.modalCtrl.dismiss().then(() => this.modalCtrl.dismiss());
            this.modalCtrl.dismiss();
          }
        } else {
          this.modalCtrl.dismiss().then(() => this.modalCtrl.dismiss());
        }
      });
    });
  }

  sendMessage() {
    if (this.fileInput.nativeElement.files.length) {
      this.uploadAttachments()
        .then((fileUploadUrl: string) => {
          this.finalizeMessage(fileUploadUrl);
        }).catch((error) => {
          this.toast.show(error || 'ERROR: UPLOAD FAILED UNEXPECTEDLY.');
        });
    } else {
      this.finalizeMessage();
    }
  }

  finalizeMessage(fileUploadUrl?: string) {
    this.message.from = this.data.id;
    this.message.to = environment.PARTNER_ID;
    this.message.attachments = fileUploadUrl ? [fileUploadUrl] : [];
    this.chat.sendMessage(this.message)
      .then((message: Message) => {
        this.message = { body: '', type: 'outbound' };
        this.chat.messages.push(message);
      });
  }

  setTextFieldHeight(textareaElement: HTMLTextAreaElement) {
    textareaElement.style.height = '1px';
    textareaElement.style.height = (textareaElement.scrollHeight) + 'px';
  }
}
