import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GGlobalErrorComponent } from "./g-global-error.component";

describe("GGlobalErrorComponent", () => {
  let component: GGlobalErrorComponent;
  let fixture: ComponentFixture<GGlobalErrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GGlobalErrorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GGlobalErrorComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
