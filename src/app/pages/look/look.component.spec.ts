import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { LookComponent } from './look.component';

describe('LookComponent', () => {
  let component: LookComponent;
  let fixture: ComponentFixture<LookComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LookComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(LookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
