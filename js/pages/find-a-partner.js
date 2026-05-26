(() => {
  // <stdin>
  (() => {
    const REGION_LABELS = {
      all: "All",
      north_america: "North America",
      latin_america: "Latin America",
      europe: "Europe",
      middle_east: "Middle East",
      africa: "Africa",
      asia: "Asia",
      oceania: "Oceania"
    };
    const map = document.querySelector(".partners-map");
    const chips = Array.from(document.querySelectorAll(".partners-chip"));
    const cards = Array.from(document.querySelectorAll(".partners-card"));
    const tooltip = document.querySelector(".partners-map__tooltip");
    if (!map || !chips.length || !cards.length) return;
    const counts = {};
    cards.forEach((card) => {
      (card.dataset.regions || "").split(/\s+/).filter(Boolean).forEach((r) => {
        counts[r] = (counts[r] || 0) + 1;
      });
    });
    const regionsInMap = Array.from(map.querySelectorAll("[data-region]"));
    const setActive = (region) => {
      chips.forEach((chip) => {
        const isActive = chip.dataset.region === region;
        chip.classList.toggle("partners-chip--active", isActive);
        chip.setAttribute("aria-selected", isActive ? "true" : "false");
      });
      regionsInMap.forEach((g) => {
        const slug = g.dataset.region;
        const hasPartners = (counts[slug] || 0) > 0;
        g.classList.remove(
          "partners-map__region--selected",
          "partners-map__region--dimmed",
          "partners-map__region--empty"
        );
        if (!hasPartners) {
          g.classList.add("partners-map__region--empty");
          return;
        }
        if (region !== "all") {
          if (slug === region) {
            g.classList.add("partners-map__region--selected");
          } else {
            g.classList.add("partners-map__region--dimmed");
          }
        }
      });
      cards.forEach((card) => {
        const cardRegions = (card.dataset.regions || "").split(/\s+/).filter(Boolean);
        const show = region === "all" || cardRegions.includes(region);
        if (show) {
          card.removeAttribute("hidden");
        } else {
          card.setAttribute("hidden", "");
        }
      });
    };
    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const region = chip.dataset.region;
        const isActive = chip.classList.contains("partners-chip--active");
        setActive(region === "all" || isActive ? "all" : region);
      });
    });
    regionsInMap.forEach((g) => {
      const slug = g.dataset.region;
      const hasPartners = (counts[slug] || 0) > 0;
      if (!hasPartners) return;
      const activate = () => {
        const alreadyActive = g.classList.contains(
          "partners-map__region--selected"
        );
        setActive(alreadyActive ? "all" : slug);
      };
      g.addEventListener("click", activate);
      g.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate();
        }
      });
    });
    if (tooltip) {
      const wrapper = map.closest(".partners-map-wrapper") || map.parentElement;
      regionsInMap.forEach((g) => {
        g.addEventListener("mouseenter", () => {
          const slug = g.dataset.region;
          const label = REGION_LABELS[slug] || slug;
          const n = counts[slug] || 0;
          if (n === 0) {
            tooltip.textContent = `${label}: no partners yet`;
          } else {
            tooltip.textContent = `${label}: ${n} partner${n === 1 ? "" : "s"}`;
          }
          tooltip.removeAttribute("hidden");
        });
        g.addEventListener("mouseleave", () => {
          tooltip.setAttribute("hidden", "");
        });
        g.addEventListener("mousemove", (e) => {
          const rect = wrapper.getBoundingClientRect();
          tooltip.style.left = `${e.clientX - rect.left}px`;
          tooltip.style.top = `${e.clientY - rect.top}px`;
        });
      });
    }
    setActive("all");
  })();
})();
