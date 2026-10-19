import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GMediaRowComponent } from "./g-media-row.component";

describe("GMediaRowComponent", () => {
  let component: GMediaRowComponent;
  let fixture: ComponentFixture<GMediaRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GMediaRowComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GMediaRowComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
