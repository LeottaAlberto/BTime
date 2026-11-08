import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GResumeCardComponent } from "./g-resume-card.component";

describe("GResumeCardComponent", () => {
  let component: GResumeCardComponent;
  let fixture: ComponentFixture<GResumeCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GResumeCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GResumeCardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
