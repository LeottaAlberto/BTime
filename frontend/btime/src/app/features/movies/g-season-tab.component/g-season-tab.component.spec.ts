import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GSeasonTabComponent } from "./g-season-tab.component";

describe("GSeasonTabComponent", () => {
  let component: GSeasonTabComponent;
  let fixture: ComponentFixture<GSeasonTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GSeasonTabComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GSeasonTabComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
