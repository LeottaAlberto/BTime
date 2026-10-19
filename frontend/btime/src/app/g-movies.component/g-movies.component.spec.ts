import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GMoviesComponent } from "./g-movies.component";

describe("GMoviesComponent", () => {
  let component: GMoviesComponent;
  let fixture: ComponentFixture<GMoviesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GMoviesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GMoviesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
