import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GPhotosComponent } from "./g-photos.component";

describe("GPhotosComponent", () => {
  let component: GPhotosComponent;
  let fixture: ComponentFixture<GPhotosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GPhotosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GPhotosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
