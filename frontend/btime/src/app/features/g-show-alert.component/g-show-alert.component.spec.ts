import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GShowAlertComponent } from "./g-show-alert.component";

describe("GShowAlertComponent", () => {
  let component: GShowAlertComponent;
  let fixture: ComponentFixture<GShowAlertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GShowAlertComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GShowAlertComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
