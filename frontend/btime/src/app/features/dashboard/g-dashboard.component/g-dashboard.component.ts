import { AfterViewInit, Component, HostListener, inject, OnDestroy } from "@angular/core";
import { GNavbarComponent } from "../g-navbar.component/g-navbar.component";
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { filter, Subscription } from "rxjs";

@Component({
  imports: [GNavbarComponent, RouterOutlet],
  selector: "g-dashboard",
  styleUrl: "./g-dashboard.component.css",
  templateUrl: "./g-dashboard.component.html",
})
export class GDashboardComponent implements AfterViewInit, OnDestroy {
  private router = inject(Router);
  private routerSub?: Subscription;
  private mutationObserver?: MutationObserver;
  private lastMainFocused: HTMLElement | null = null;
  private pendingAutoFocus = false;

  public ngAfterViewInit(): void {
    // Ad ogni cambio rotta (es. ingresso in Movies, Dettagli Serie o Player), prepara l'auto-focus nel Main
    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        this.lastMainFocused = null;
        this.pendingAutoFocus = true;
        setTimeout(() => this.tryAutoFocusMain(), 80);
      });

    // Osserva il caricamento asincrono delle card (film, serie, episodi) nel Main
    const main = document.getElementById("app-main");
    if (main) {
      this.mutationObserver = new MutationObserver(() => {
        const active = document.activeElement as HTMLElement | null;
        const hasNoFocus = !active || active === document.body;
        if (hasNoFocus || this.pendingAutoFocus) {
          this.tryAutoFocusMain();
        }
      });
      this.mutationObserver.observe(main, { childList: true, subtree: true });
    }

    setTimeout(() => this.tryAutoFocusMain(), 150);
  }

  public ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.mutationObserver?.disconnect();
  }

  private getFocusable(container: HTMLElement): HTMLElement[] {
    return Array.from(
      container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [tabindex="0"], a[href], video[tabindex="0"]'
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
  }

  private tryAutoFocusMain(): void {
    const main = document.getElementById("app-main");
    if (!main) return;

    // Preferisci focalizzare direttamente una card contenuto (film, serie, modulo, episodio, player) se presente
    const preferredCard = main.querySelector<HTMLElement>(
      'g-poster-card [tabindex="0"], g-resume-card [tabindex="0"], g-dash-card [tabindex="0"], g-media-detail [tabindex="0"][role="button"], g-watch-player button[tabindex="0"]'
    );
    if (preferredCard) {
      this.pendingAutoFocus = false;
      this.focusMainElement(preferredCard, main);
      return;
    }

    const items = this.getFocusable(main);
    if (items.length > 0) {
      this.focusMainElement(items[0], main);
    }
  }

  private focusMainElement(target: HTMLElement, main: HTMLElement): void {
    this.lastMainFocused = target;
    target.focus({ preventScroll: true });

    const mainRect = main.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const offsetTop = targetRect.top - mainRect.top + main.scrollTop;
    const desiredTop = Math.max(0, offsetTop - mainRect.height / 2 + targetRect.height / 2);

    main.scrollTo({ top: desiredTop, behavior: "smooth" });
    target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }

  private isSameRow(a: DOMRect, b: DOMRect): boolean {
    const cyA = a.top + a.height / 2;
    const cyB = b.top + b.height / 2;
    const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    const minHeight = Math.min(a.height, b.height);
    return overlapY > minHeight * 0.35 || Math.abs(cyA - cyB) < 30;
  }

  @HostListener("window:keydown", ["$event"])
  public onTvKeyDown(event: KeyboardEvent): void {
    // Supporto universale: PC, Smart TV Samsung Tizen, LG webOS, Amazon Fire TV Stick (Fire OS) e Xiaomi Box (Android TV)
    const isRight = event.key === "ArrowRight" || event.key === "Right" || event.keyCode === 39 || event.keyCode === 22;
    const isLeft = event.key === "ArrowLeft" || event.key === "Left" || event.keyCode === 37 || event.keyCode === 21;
    const isUp = event.key === "ArrowUp" || event.key === "Up" || event.keyCode === 38 || event.keyCode === 19;
    const isDown = event.key === "ArrowDown" || event.key === "Down" || event.keyCode === 40 || event.keyCode === 20;
    const isSelect = event.key === "Enter" || event.key === "Select" || event.keyCode === 13 || event.keyCode === 23 || event.keyCode === 66;

    if (!isRight && !isLeft && !isUp && !isDown && !isSelect) return;

    this.pendingAutoFocus = false;

    const navbar = document.getElementById("app-navbar");
    const main = document.getElementById("app-main");
    if (!navbar || !main) return;

    const active = document.activeElement as HTMLElement | null;

    // Se l'utente sta digitando dentro l'input di ricerca:
    if (active instanceof HTMLInputElement) {
      if (isDown || isUp) {
        active.blur();
        const searchWrapper = active.closest<HTMLElement>('[tabindex="0"]');
        if (searchWrapper) {
          searchWrapper.focus();
        }
      } else {
        return;
      }
    }

    // Gestione tasto OK / Select su Firestick e Android TV (keyCode 23 / "Select")
    if (isSelect) {
      if ((event.keyCode === 23 || event.key === "Select") && event.key !== "Enter") {
        if (active && active !== document.body && active.tagName !== "BUTTON" && active.tagName !== "A" && active.tagName !== "INPUT") {
          event.preventDefault();
          active.click();
        }
      }
      return;
    }

    // Se nessun elemento ha il focus (o se è sul body), focalizza il contenuto del Main (o la Navbar)
    if (!active || active === document.body || (!navbar.contains(active) && !main.contains(active))) {
      event.preventDefault();
      const mainItems = this.getFocusable(main);
      if (mainItems.length > 0) {
        const preferred =
          (this.lastMainFocused && main.contains(this.lastMainFocused) ? this.lastMainFocused : null) ||
          main.querySelector<HTMLElement>('g-poster-card [tabindex="0"], g-resume-card [tabindex="0"], g-dash-card [tabindex="0"]') ||
          mainItems[0];
        this.focusMainElement(preferred, main);
        return;
      }
      const activeNav =
        navbar.querySelector<HTMLElement>('[class*="bg-cyan-600"], .active') ||
        this.getFocusable(navbar)[0];
      activeNav?.focus();
      return;
    }

    const inNavbar = navbar.contains(active);
    const inMain = main.contains(active);

    // ==========================================
    // 1. FOCUS ALL'INTERNO DELLA NAVBAR
    // ==========================================
    if (inNavbar) {
      const navItems = this.getFocusable(navbar);
      const currentIndex = navItems.indexOf(active);

      // FRECCIA DESTRA -> Salta dalla Navbar al Main della Dashboard!
      if (isRight) {
        const mainItems = this.getFocusable(main);
        if (mainItems.length > 0) {
          event.preventDefault();
          const target =
            (this.lastMainFocused && main.contains(this.lastMainFocused) ? this.lastMainFocused : null) ||
            main.querySelector<HTMLElement>('g-poster-card [tabindex="0"], g-resume-card [tabindex="0"], g-dash-card [tabindex="0"]') ||
            mainItems[0];
          this.focusMainElement(target, main);
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
      const mainItems = this.getFocusable(main);
      const activeRect = active.getBoundingClientRect();
      const cxA = activeRect.left + activeRect.width / 2;
      const cyA = activeRect.top + activeRect.height / 2;

      // --- MOVIMENTO ORIZZONTALE (DESTRA / SINISTRA SULLA STESSA RIGA) ---
      if (isRight || isLeft) {
        const sameRowItems = mainItems.filter((el) => {
          if (el === active) return false;
          const r = el.getBoundingClientRect();
          if (!this.isSameRow(activeRect, r)) return false;
          const cxB = r.left + r.width / 2;
          return isRight ? cxB > cxA + 5 : cxB < cxA - 5;
        });

        if (sameRowItems.length > 0) {
          event.preventDefault();
          sameRowItems.sort((a, b) => {
            const distA = Math.abs(a.getBoundingClientRect().left + a.getBoundingClientRect().width / 2 - cxA);
            const distB = Math.abs(b.getBoundingClientRect().left + b.getBoundingClientRect().width / 2 - cxA);
            return distA - distB;
          });
          this.focusMainElement(sameRowItems[0], main);
          return;
        }

        // Se ha premuto SINISTRA e siamo sul primo elemento della riga -> TORNA ALLA NAVBAR!
        if (isLeft) {
          event.preventDefault();
          this.lastMainFocused = active;
          const activeNav =
            navbar.querySelector<HTMLElement>('[class*="bg-cyan-600"], .active') ||
            navbar.querySelectorAll<HTMLElement>("g-nav-item [tabindex='0']")[0] ||
            this.getFocusable(navbar)[0];

          if (activeNav) {
            activeNav.focus();
            activeNav.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
          return;
        }
      }

      // --- MOVIMENTO VERTICALE (SU / GIÙ TRA RIGHE DIVERSE) ---
      if (isDown || isUp) {
        const verticalCandidates = mainItems
          .filter((el) => {
            if (el === active) return false;
            const r = el.getBoundingClientRect();
            if (this.isSameRow(activeRect, r)) return false;
            const cyB = r.top + r.height / 2;
            return isDown ? cyB > cyA + 15 : cyB < cyA - 15;
          })
          .map((el) => {
            const r = el.getBoundingClientRect();
            const dy = isDown
              ? Math.max(0, r.top - activeRect.bottom)
              : Math.max(0, activeRect.top - r.bottom);
            const dx = Math.abs(r.left + r.width / 2 - cxA);
            return { el, rect: r, dy, dx };
          });

        if (verticalCandidates.length > 0) {
          event.preventDefault();
          // 1. Trova la riga più vicina verticalmente
          verticalCandidates.sort((a, b) => a.dy - b.dy);
          const closestRowRect = verticalCandidates[0].rect;

          // 2. Filtra tutti gli elementi appartenenti a quella riga più vicina
          const closestRowItems = verticalCandidates.filter((c) => this.isSameRow(closestRowRect, c.rect));

          // 3. All'interno di quella riga, scegli l'elemento più allineato orizzontalmente
          closestRowItems.sort((a, b) => a.dx - b.dx);
          this.focusMainElement(closestRowItems[0].el, main);
        }
      }
    }
  }
}
