import { Component, HostListener } from "@angular/core";
import { GNavbarComponent } from "../g-navbar.component/g-navbar.component";
import { RouterOutlet } from "@angular/router";

@Component({
  imports: [GNavbarComponent, RouterOutlet],
  selector: "g-dashboard",
  styleUrl: "./g-dashboard.component.css",
  templateUrl: "./g-dashboard.component.html",
})
export class GDashboardComponent {

  @HostListener("window:keydown", ["$event"])
  public onTvKeyDown(event: KeyboardEvent): void {
    // Supporto universale: PC, Smart TV Samsung Tizen, LG webOS, Amazon Fire TV Stick (Fire OS) e Xiaomi Box (Android TV)
    const isRight = event.key === "ArrowRight" || event.key === "Right" || event.keyCode === 39 || event.keyCode === 22;
    const isLeft = event.key === "ArrowLeft" || event.key === "Left" || event.keyCode === 37 || event.keyCode === 21;
    const isUp = event.key === "ArrowUp" || event.key === "Up" || event.keyCode === 38 || event.keyCode === 19;
    const isDown = event.key === "ArrowDown" || event.key === "Down" || event.keyCode === 40 || event.keyCode === 20;
    const isSelect = event.key === "Enter" || event.key === "Select" || event.keyCode === 13 || event.keyCode === 23 || event.keyCode === 66;

    if (!isRight && !isLeft && !isUp && !isDown && !isSelect) return;

    const navbar = document.getElementById("app-navbar");
    const main = document.getElementById("app-main");
    if (!navbar || !main) return;

    const active = document.activeElement as HTMLElement | null;

    // Helper per ottenere tutti gli elementi focusabili visibili in un contenitore (compatibile Android TV & Silk)
    const getFocusable = (container: HTMLElement): HTMLElement[] => {
      return Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex="0"], a[href], input:not([disabled]), video[tabindex="0"]'
        )
      ).filter((el) => {
        const isVisible = el.offsetParent !== null || el.getClientRects().length > 0;
        const style = window.getComputedStyle(el);
        return (
          isVisible &&
          !el.hasAttribute("disabled") &&
          style.display !== "none" &&
          style.visibility !== "hidden"
        );
      });
    };

    // Tasto CENTRALE (OK / Select / Enter) su telecomando Firestick o Xiaomi Box:
    // Se premuto su un elemento custom con tabindex (come una card o episodio), scatena l'evento click nativo
    if (isSelect) {
      if (active && active !== document.body && active.tagName !== "BUTTON" && active.tagName !== "A" && active.tagName !== "INPUT") {
        event.preventDefault();
        active.click();
        return;
      }
      return;
    }

    // Se nessun elemento ha il focus (o se è sul body), parte dalla voce attiva della navbar
    if (!active || active === document.body || (!navbar.contains(active) && !main.contains(active))) {
      const activeNav =
        navbar.querySelector<HTMLElement>('[class*="bg-cyan-600"], .active') ||
        getFocusable(navbar)[0];
      if (activeNav) {
        event.preventDefault();
        activeNav.focus();
      }
      return;
    }

    const inNavbar = navbar.contains(active);
    const inMain = main.contains(active);

    // ==========================================
    // 1. FOCUS ALL'INTERNO DELLA NAVBAR
    // ==========================================
    if (inNavbar) {
      const navItems = getFocusable(navbar);
      const currentIndex = navItems.indexOf(active);

      // FRECCIA DESTRA -> Salta dalla Navbar al Main della Dashboard!
      if (isRight) {
        const mainItems = getFocusable(main);
        if (mainItems.length > 0) {
          event.preventDefault();
          // Su TV preferiamo non focalizzare l'input per evitare che si apra la tastiera virtuale a schermo intero
          const target = mainItems.find((el) => el.tagName !== "INPUT") || mainItems[0];
          target.focus();
          target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
        }
        return;
      }

      // FRECCIA GIÙ -> Scende tra le voci della Navbar
      if (isDown) {
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % navItems.length;
        navItems[nextIndex]?.focus();
        return;
      }

      // FRECCIA SU -> Sale tra le voci della Navbar
      if (isUp) {
        event.preventDefault();
        const prevIndex = (currentIndex - 1 + navItems.length) % navItems.length;
        navItems[prevIndex]?.focus();
        return;
      }
    }

    // ==========================================
    // 2. FOCUS ALL'INTERNO DEL MAIN DASHBOARD
    // ==========================================
    if (inMain) {
      // Se l'utente sta scrivendo in una casella di testo (es. search bar), permettiamo al cursore di muoversi
      if (active instanceof HTMLInputElement && isLeft && active.selectionStart !== 0) {
        return;
      }

      const mainItems = getFocusable(main);
      const activeRect = active.getBoundingClientRect();

      // FRECCIA SINISTRA -> Controlla se siamo sul bordo sinistro per tornare alla NAVBAR!
      if (isLeft) {
        const itemsToLeft = mainItems.filter((el) => {
          if (el === active) return false;
          const r = el.getBoundingClientRect();
          const isToLeft = r.right <= activeRect.left + 25;
          const verticalOverlap = Math.max(0, Math.min(r.bottom, activeRect.bottom) - Math.max(r.top, activeRect.top));
          return isToLeft && (verticalOverlap > 10 || Math.abs(r.top - activeRect.top) < 70);
        });

        // Se non c'è nessun elemento a sinistra all'interno del Main -> TORNA ALLA NAVBAR
        if (itemsToLeft.length === 0) {
          event.preventDefault();
          const activeNav =
            navbar.querySelector<HTMLElement>('[class*="bg-cyan-600"], .active') ||
            navbar.querySelectorAll<HTMLElement>("g-nav-item [tabindex='0']")[0] ||
            getFocusable(navbar)[0];

          if (activeNav) {
            activeNav.focus();
            activeNav.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
          return;
        }
      }

      // Navigazione Spaziale Smart 2D all'interno del Main (tra righe, card e pulsanti)
      let bestCandidate: HTMLElement | null = null;
      let minDistance = Infinity;

      for (const el of mainItems) {
        if (el === active) continue;
        const r = el.getBoundingClientRect();

        let isDirectionValid = false;
        let primaryDist = 0;
        let secondaryDist = 0;

        if (isRight) {
          isDirectionValid = r.left >= activeRect.right - 25;
          primaryDist = r.left - activeRect.right;
          secondaryDist = Math.abs(r.top + r.height / 2 - (activeRect.top + activeRect.height / 2));
        } else if (isLeft) {
          isDirectionValid = r.right <= activeRect.left + 25;
          primaryDist = activeRect.left - r.right;
          secondaryDist = Math.abs(r.top + r.height / 2 - (activeRect.top + activeRect.height / 2));
        } else if (isDown) {
          isDirectionValid = r.top >= activeRect.bottom - 25;
          primaryDist = r.top - activeRect.bottom;
          secondaryDist = Math.abs(r.left + r.width / 2 - (activeRect.left + activeRect.width / 2));
        } else if (isUp) {
          isDirectionValid = r.bottom <= activeRect.top + 25;
          primaryDist = activeRect.top - r.bottom;
          secondaryDist = Math.abs(r.left + r.width / 2 - (activeRect.left + activeRect.width / 2));
        }

        if (isDirectionValid) {
          const dist = primaryDist + secondaryDist * 1.6;
          if (dist < minDistance) {
            minDistance = dist;
            bestCandidate = el;
          }
        }
      }

      if (bestCandidate) {
        event.preventDefault();
        bestCandidate.focus();
        bestCandidate.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      }
    }
  }
}
