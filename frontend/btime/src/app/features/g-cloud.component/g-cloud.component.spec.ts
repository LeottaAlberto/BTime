import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GCloudComponent } from "./g-cloud.component";

describe("GCloudComponent", () => {
  let component: GCloudComponent;
  let fixture: ComponentFixture<GCloudComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GCloudComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GCloudComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
