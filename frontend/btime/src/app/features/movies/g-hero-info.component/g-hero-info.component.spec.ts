import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GHeroInfoComponent } from "./g-hero-info.component";

describe("GHeroInfoComponent", () => {
  let component: GHeroInfoComponent;
  let fixture: ComponentFixture<GHeroInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GHeroInfoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GHeroInfoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
