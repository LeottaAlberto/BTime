import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GPosterCardComponent } from "./g-poster-card.component";

describe("GPosterCardComponent", () => {
  let component: GPosterCardComponent;
  let fixture: ComponentFixture<GPosterCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GPosterCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GPosterCardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
