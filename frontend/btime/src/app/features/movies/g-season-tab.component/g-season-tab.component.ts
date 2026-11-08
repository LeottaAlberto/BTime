import { Component, input, output } from "@angular/core";
import { SeasonDetail } from "../../../core/interfaces/dashboard/movies/seriesDetail.interface";

@Component({
  imports: [],
  selector: "g-season-tab",
  styleUrl: "./g-season-tab.component.css",
  templateUrl: "./g-season-tab.component.html",
})
export class GSeasonTabComponent {
  public season = input.required<SeasonDetail>();
  public isActive = input<boolean>(false);

  public tabClick = output<SeasonDetail>();

  public onClick(): void {
    this.tabClick.emit(this.season());
  }
}
