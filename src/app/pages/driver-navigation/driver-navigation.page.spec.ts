import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { DriverNavigationPage } from './driver-navigation.page';

describe('DriverNavigationPage', () => {
  let component: DriverNavigationPage;
  let fixture: ComponentFixture<DriverNavigationPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DriverNavigationPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(DriverNavigationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
