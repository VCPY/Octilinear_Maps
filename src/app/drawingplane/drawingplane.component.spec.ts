import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrawingplaneComponent } from './drawingplane.component';

describe('DrawingplaneComponent', () => {
  let component: DrawingplaneComponent;
  let fixture: ComponentFixture<DrawingplaneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DrawingplaneComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DrawingplaneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
