import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-browser-page',
  templateUrl: './browser-page.component.html',
  styleUrls: ['./browser-page.component.scss'],
})
export class BrowserPageComponent implements OnInit {
  @Input() url: string;

  constructor() { }

  ngOnInit() {}

}
