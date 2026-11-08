import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GCustomPlayerComponent } from "./g-custom-player.component";

describe("GCustomPlayerComponent", () => {
  let component: GCustomPlayerComponent;
  let fixture: ComponentFixture<GCustomPlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GCustomPlayerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GCustomPlayerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
