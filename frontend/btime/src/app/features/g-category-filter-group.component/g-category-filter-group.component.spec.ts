import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GCategoryFilterGroupComponent } from "./g-category-filter-group.component";

describe("GCategoryFilterGroupComponent", () => {
  let component: GCategoryFilterGroupComponent;
  let fixture: ComponentFixture<GCategoryFilterGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GCategoryFilterGroupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GCategoryFilterGroupComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
