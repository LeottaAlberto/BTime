import { Component, computed, signal, OnInit, WritableSignal, inject, viewChild } from "@angular/core";
import { GNavItemComponent } from "../g-nav-item.component/g-nav-item.component";
import { AuthService } from "../../../core/auth/auth.service";
import { Router } from "@angular/router";
import { GShowMessageComponent } from "../../shared/g-show-message.component/g-show-message.component";
import { AlertService } from "../../../core/services/alertMessage/alert.service";
import { StatusType } from "../../../core/enums/statusType.enum";
import { UserService } from "../../../core/services/user/user.service";
import { environment } from "../../../../environments/environment";

const DEFAULT_AVATAR =
  "https://imgs.search.brave.com/Nt1z2ObBrGxK-9i_PJ6ioz7PbFpYm1yCo7tbltrIVV0/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzL2M4LzA5/L2MzL2M4MDljM2Fh/MjI1N2I2ZTEwM2Zl/OGIzNzcwMWMwZDAw/LmpwZw";

@Component({
  imports: [GNavItemComponent, GShowMessageComponent],
  selector: "g-navbar",
  styleUrl: "./g-navbar.component.css",
  templateUrl: "./g-navbar.component.html",
})
export class GNavbarComponent implements OnInit {
  public auth = inject(AuthService);
  private userService = inject(UserService);
  public router = inject(Router);
  private alert = inject(AlertService);

  public navItems: WritableSignal<any[]> = signal([]);
  public selectedLabel: WritableSignal<string> = signal("");
  private messageBox = viewChild(GShowMessageComponent);

  public resolvedAvatarUrl = computed(() => {
    const raw = this.auth.currentUser()?.avatarUrl;
    if (!raw) return DEFAULT_AVATAR;
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    if (raw.startsWith("/uploads")) {
      const backendOrigin = environment.apiUrl.replace(/\/api\/?$/, "");
      return `${backendOrigin}${raw}`;
    }
    return raw;
  });

  ngOnInit(): void {
    const items = [
      { icon: "home", label: "Home" },
      ...(this.auth.isAdmin() ? [{ icon: "shield", label: "Admin" }] : []),
      { icon: "cog", label: "Settings" },
      { icon: "trash", label: "Trash" },
    ];

    this.navItems.set(items);
    if (this.router.url.includes("/admin")) this.selectedLabel.set("Admin");
    else if (this.router.url.includes("/profile")) this.selectedLabel.set("Settings");
    else this.selectedLabel.set("Home");

    if (this.auth.currentUser()) {
      this.userService.getProfile().subscribe({ error: () => {} });
    }
  }

  public onSelectNavItem(label: string): void {
    this.selectedLabel.set(label);
    if (label === "Home") {
      this.router.navigate(["/dashboard"]);
    } else if (label === "Admin") {
      this.router.navigate(["/dashboard/admin"]);
    } else if (label === "Settings") {
      this.router.navigate(["/dashboard/profile"]);
    }
  }

  public logout(): void {
    this.auth.logout();
    this.router.navigate(["login"]);
  }

  public async onClickLogout(): Promise<void> {
    const confirmed = await this.messageBox()?.showMessage("Are you sure you want to log out?");
    if (confirmed) {
      this.logout();
      this.alert.show({
        title: "Logout Status",
        message: "Logout done successfully",
        status: StatusType.Good,
      });
    }
  }

  public onClick(): void {
    this.selectedLabel.set("Settings");
    this.router.navigate(["/dashboard/profile"]);
  }
}
