import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GButtonComponent } from "./g-button.component";

describe("GButtonComponent", () => {
  let component: GButtonComponent;
  let fixture: ComponentFixture<GButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GButtonComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
