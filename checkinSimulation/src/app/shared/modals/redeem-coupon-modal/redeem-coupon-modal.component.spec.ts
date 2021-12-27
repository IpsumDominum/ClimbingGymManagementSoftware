import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RedeemCouponModalComponent } from './redeem-coupon-modal.component';

describe('RedeemCouponModalComponent', () => {
  let component: RedeemCouponModalComponent;
  let fixture: ComponentFixture<RedeemCouponModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RedeemCouponModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RedeemCouponModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
