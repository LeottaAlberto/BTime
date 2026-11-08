import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GSearchInputComponent } from "./g-search-input.component";

describe("GSearchInputComponent", () => {
  let component: GSearchInputComponent;
  let fixture: ComponentFixture<GSearchInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GSearchInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GSearchInputComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
