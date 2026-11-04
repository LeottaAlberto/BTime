import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GPlayerBtnComponent } from "./g-player-btn.component";

describe("GPlayerBtnComponent", () => {
  let component: GPlayerBtnComponent;
  let fixture: ComponentFixture<GPlayerBtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GPlayerBtnComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GPlayerBtnComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
