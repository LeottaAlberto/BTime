import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GShowToastComponent } from "./g-show-toast.component";

describe("GShowToastComponent", () => {
  let component: GShowToastComponent;
  let fixture: ComponentFixture<GShowToastComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GShowToastComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GShowToastComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
