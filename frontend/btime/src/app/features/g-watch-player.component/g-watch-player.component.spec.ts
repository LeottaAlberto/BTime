import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GWatchPlayerComponent } from "./g-watch-player.component";

describe("GWatchPlayerComponent", () => {
  let component: GWatchPlayerComponent;
  let fixture: ComponentFixture<GWatchPlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GWatchPlayerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GWatchPlayerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
