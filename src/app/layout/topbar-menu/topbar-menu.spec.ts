import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TopbarMenu } from './topbar-menu';

describe('TopbarMenu', () => {
  let component: TopbarMenu;
  let fixture: ComponentFixture<TopbarMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopbarMenu],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TopbarMenu);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
