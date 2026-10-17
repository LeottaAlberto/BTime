import { Component, signal, OnInit, WritableSignal, inject, viewChild } from "@angular/core";
import { GNavItemComponent } from "../g-nav-item.component/g-nav-item.component";
import { AuthService } from "../../core/auth/auth.service";
import { Router } from "@angular/router";
import { GShowMessageComponent } from "../g-show-message.component/g-show-message.component";
import { GShowAlertComponent } from "../g-show-alert.component/g-show-alert.component";

@Component({
  imports: [GNavItemComponent, GShowMessageComponent, GShowAlertComponent],
  selector: "g-navbar",
  styleUrl: "./g-navbar.component.css",
  templateUrl: "./g-navbar.component.html",
})
export class GNavbarComponent implements OnInit {
  public auth = inject(AuthService);
  public router = inject(Router);

  public navItems: WritableSignal<any[]> = signal([]);
  public selectedLabel: WritableSignal<string> = signal("");
  private messageBox = viewChild(GShowMessageComponent);

  ngOnInit(): void {
    const items = [
      { icon: "home", label: "Home" },
      { icon: "cog", label: "Settings" },
      { icon: "trash", label: "Trash" },
    ];

    this.navItems.set(items);
  }

  public logout(): void {
    this.auth.logout();
    this.router.navigate(["login"]);
  }

  public async onClickLogout(): Promise<void> {
    const confirmed = await this.messageBox()?.showMessage("Are you sure you want to log out?");
    if (confirmed)
      this.logout();
  }
}
