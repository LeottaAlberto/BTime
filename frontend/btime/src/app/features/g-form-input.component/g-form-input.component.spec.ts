import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GFormInputComponent } from "./g-form-input.component";

describe("GFormInputComponent", () => {
  let component: GFormInputComponent;
  let fixture: ComponentFixture<GFormInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GFormInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GFormInputComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
