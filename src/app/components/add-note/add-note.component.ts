import { Component, OnInit, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-add-note',
  templateUrl: './add-note.component.html',
  styleUrls: ['./add-note.component.scss'],
})
export class AddNoteComponent implements OnInit {
  note: string;
  constructor(private modalCtrl: ModalController) { }

  ngOnInit() {}
  close() {
    this.modalCtrl.dismiss(this.note);
  }
}
