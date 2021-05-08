import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { PromocodePage } from './promocode.page';

describe('PromocodePage', () => {
  let component: PromocodePage;
  let fixture: ComponentFixture<PromocodePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PromocodePage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(PromocodePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
