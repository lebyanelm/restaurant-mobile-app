import { environment } from 'src/environments/environment';
import { ChatService } from 'src/app/services/chat.service';
import { Component, OnInit, Input, Sanitizer } from '@angular/core';
import { StorageService } from 'src/app/services/storage.service';

@Component({
  selector: 'app-chat-message',
  templateUrl: './chat-message.component.html',
  styleUrls: ['./chat-message.component.scss'],
})
export class ChatMessageComponent implements OnInit {
  @Input() id: string;
  @Input() body: string;
  @Input() attachments: string;
  @Input() from: string;
  @Input() to: string;
  @Input() type: string;
  @Input() reply: any;
  @Input() timeCreated: any;
  @Input() state: any;
  @Input() isShowTime: boolean;
  @Input() isNewDay: boolean;
  @Input() isNewOrder: boolean;
  avatar: string;
  constructor(
    public chatService: ChatService,
    private storage: StorageService,
    public sanitize: Sanitizer
  ) {
    if (this.isShowTime === undefined) {
      this.isShowTime = true;
    }

    // Get the avatar of the customer
    this.storage.getItem(environment.customerDataName)
      .then((data) => {
        if (data)
          this.avatar = data.media[data.media.length - 1];
      });
  }

  ngOnInit() {}
}
