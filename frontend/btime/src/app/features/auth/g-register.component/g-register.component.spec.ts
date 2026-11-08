import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GRegisterComponent } from "./g-register.component";

describe("GRegisterComponent", () => {
  let component: GRegisterComponent;
  let fixture: ComponentFixture<GRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GRegisterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GRegisterComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
