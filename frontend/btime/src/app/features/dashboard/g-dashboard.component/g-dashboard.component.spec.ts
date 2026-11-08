import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GDashboardComponent } from "./g-dashboard.component";

describe("GDashboardComponent", () => {
  let component: GDashboardComponent;
  let fixture: ComponentFixture<GDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GDashboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GDashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
