import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GMediaDetailComponent } from "./g-media-detail.component";

describe("GMediaDetailComponent", () => {
  let component: GMediaDetailComponent;
  let fixture: ComponentFixture<GMediaDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GMediaDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GMediaDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
