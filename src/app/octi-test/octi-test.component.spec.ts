import {ComponentFixture, TestBed} from '@angular/core/testing';

import {OctiTestComponent} from './octi-test.component';

describe('OctiTestComponent', () => {
  let component: OctiTestComponent;
  let fixture: ComponentFixture<OctiTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OctiTestComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OctiTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
