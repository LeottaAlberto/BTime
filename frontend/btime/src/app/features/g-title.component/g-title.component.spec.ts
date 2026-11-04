import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GTitleComponent } from "./g-title.component";

describe("GTitleComponent", () => {
  let component: GTitleComponent;
  let fixture: ComponentFixture<GTitleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GTitleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GTitleComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
