import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GShowMessageComponent } from "./g-show-message.component";

describe("GShowMessageComponent", () => {
  let component: GShowMessageComponent;
  let fixture: ComponentFixture<GShowMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GShowMessageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GShowMessageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
