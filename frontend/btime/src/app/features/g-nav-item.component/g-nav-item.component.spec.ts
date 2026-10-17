import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GNavItemComponent } from "./g-nav-item.component";

describe("GNavItemComponent", () => {
  let component: GNavItemComponent;
  let fixture: ComponentFixture<GNavItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GNavItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GNavItemComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
