import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GLoginComponent } from "./g-login.component";

describe("GLoginComponent", () => {
  let component: GLoginComponent;
  let fixture: ComponentFixture<GLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GLoginComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GLoginComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
