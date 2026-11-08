import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GHeroBannerComponent } from "./g-hero-banner.component";

describe("GHeroBannerComponent", () => {
  let component: GHeroBannerComponent;
  let fixture: ComponentFixture<GHeroBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GHeroBannerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GHeroBannerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
