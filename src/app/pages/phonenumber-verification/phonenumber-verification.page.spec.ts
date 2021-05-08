import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { PhonenumberVerificationPage } from './phonenumber-verification.page';

describe('PhonenumberVerificationPage', () => {
  let component: PhonenumberVerificationPage;
  let fixture: ComponentFixture<PhonenumberVerificationPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PhonenumberVerificationPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(PhonenumberVerificationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
