import { Component, signal, OnInit, WritableSignal, inject } from "@angular/core";
import { GNavItemComponent } from "../g-nav-item.component/g-nav-item.component";
import { single } from "rxjs";
import { AuthService } from "../../core/auth/auth.service";

@Component({
  imports: [GNavItemComponent],
  selector: "g-navbar",
  styleUrl: "./g-navbar.component.css",
  templateUrl: "./g-navbar.component.html",
})
export class GNavbarComponent implements OnInit {

  public auth = inject(AuthService);

  public navItems: WritableSignal<any[]> = signal([]);
  public selectedLabel: WritableSignal<string> = signal("");

  ngOnInit(): void {
    const items = [
      { icon: "home", label: "Home" },
      { icon: "cog", label: "Settings" },
      { icon: "trash", label: "Trash" },
    ];

    this.navItems.set(items);
  }
}
