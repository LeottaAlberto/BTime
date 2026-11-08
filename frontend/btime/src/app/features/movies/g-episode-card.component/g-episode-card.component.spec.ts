import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GEpisodeCardComponent } from "./g-episode-card.component";

describe("GEpisodeCardComponent", () => {
  let component: GEpisodeCardComponent;
  let fixture: ComponentFixture<GEpisodeCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GEpisodeCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GEpisodeCardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
