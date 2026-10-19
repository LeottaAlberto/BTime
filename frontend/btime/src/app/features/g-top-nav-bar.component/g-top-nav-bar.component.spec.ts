import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GTopNavBarComponent } from "./g-top-nav-bar.component";

describe("GTopNavBarComponent", () => {
  let component: GTopNavBarComponent;
  let fixture: ComponentFixture<GTopNavBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GTopNavBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GTopNavBarComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
