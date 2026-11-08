import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GActionComponent } from "./g-action.component";

describe("GActionComponent", () => {
  let component: GActionComponent;
  let fixture: ComponentFixture<GActionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GActionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GActionComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
