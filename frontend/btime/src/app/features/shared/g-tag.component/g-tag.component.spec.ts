import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GTagComponent } from "./g-tag.component";

describe("GTagComponent", () => {
  let component: GTagComponent;
  let fixture: ComponentFixture<GTagComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GTagComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GTagComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
