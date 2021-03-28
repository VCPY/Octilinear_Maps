import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GtfsTestComponent } from './gtfs-test.component';

describe('GtfsTestComponent', () => {
  let component: GtfsTestComponent;
  let fixture: ComponentFixture<GtfsTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GtfsTestComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GtfsTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
