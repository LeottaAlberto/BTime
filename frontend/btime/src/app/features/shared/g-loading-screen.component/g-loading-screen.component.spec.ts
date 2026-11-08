import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GLoadingScreenComponent } from "./g-loading-screen.component";

describe("GLoadingScreenComponent", () => {
  let component: GLoadingScreenComponent;
  let fixture: ComponentFixture<GLoadingScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GLoadingScreenComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GLoadingScreenComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
