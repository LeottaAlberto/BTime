import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GPillComponent } from "./g-pill.component";

describe("GPillComponent", () => {
  let component: GPillComponent;
  let fixture: ComponentFixture<GPillComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GPillComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GPillComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
