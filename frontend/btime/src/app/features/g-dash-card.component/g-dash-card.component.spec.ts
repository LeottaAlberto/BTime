import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GDashCardComponent } from "./g-dash-card.component";

describe("GDashCardComponent", () => {
  let component: GDashCardComponent;
  let fixture: ComponentFixture<GDashCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GDashCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GDashCardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
