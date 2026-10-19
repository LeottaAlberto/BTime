import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GNotificationBellComponent } from "./g-notification-bell.component";

describe("GNotificationBellComponent", () => {
  let component: GNotificationBellComponent;
  let fixture: ComponentFixture<GNotificationBellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GNotificationBellComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GNotificationBellComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
