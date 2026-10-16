import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GNavbarComponent } from "./g-navbar.component";

describe("GNavbarComponent", () => {
  let component: GNavbarComponent;
  let fixture: ComponentFixture<GNavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GNavbarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GNavbarComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
