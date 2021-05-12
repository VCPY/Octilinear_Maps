import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiMenuComponent } from './ui-menu.component';

describe('UiMenuComponent', () => {
  let component: UiMenuComponent;
  let fixture: ComponentFixture<UiMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UiMenuComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UiMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
