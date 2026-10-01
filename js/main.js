// Mobile navigation: hamburger button shows/hides the menu,
// and tapping "Portfolio" opens its submenu on touch screens.

const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-menu");

navToggle.addEventListener("click", () => {
  navMenu.classList.toggle("open");
});

const dropdown = document.querySelector(".dropdown");
const dropdownLink = dropdown.querySelector(":scope > a");

dropdownLink.addEventListener("click", (event) => {
  // On small screens the first tap opens the submenu instead of navigating
  if (window.matchMedia("(max-width: 820px)").matches && !dropdown.classList.contains("open")) {
    event.preventDefault();
    dropdown.classList.add("open");
  }
});

// Keep the footer year current automatically
const yearSpan = document.querySelector("#year");
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

// ------------------------------------------------------------
// Homepage game shelf: give each cartridge some thickness by
// stacking thin shell-coloured layers behind its face, and tilt
// it towards the pointer while hovered.
// ------------------------------------------------------------
const CART_LAYERS = 9;
const canTilt = window.matchMedia("(hover: hover) and (prefers-reduced-motion: no-preference)").matches;

document.querySelectorAll(".cart-slot").forEach((slot) => {
  const tilt = slot.querySelector(".cart-tilt");
  const face = tilt.querySelector(".cart-face");

  // deepest layer first, so the face ends up on top
  for (let z = CART_LAYERS; z >= 1; z--) {
    const layer = document.createElement("div");
    layer.className = "cart-layer";
    layer.style.setProperty("--z", z);
    tilt.insertBefore(layer, face);
  }

  if (!canTilt) return;

  slot.addEventListener("pointermove", (e) => {
    const r = tilt.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    slot.classList.add("is-tilting");
    tilt.style.setProperty("--ry", `${x * 34}deg`);
    tilt.style.setProperty("--rx", `${-y * 22}deg`);
  });
  slot.addEventListener("pointerleave", () => {
    slot.classList.remove("is-tilting");
    tilt.style.removeProperty("--ry");
    tilt.style.removeProperty("--rx");
  });
});

// ------------------------------------------------------------
// Skill cards: expand on hover via CSS; clicking (touch screens)
// or pressing Enter toggles them open too.
// ------------------------------------------------------------
document.querySelectorAll(".skill").forEach((skill) => {
  skill.addEventListener("click", () => skill.classList.toggle("open"));
  skill.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      skill.classList.toggle("open");
    }
  });
});

// ------------------------------------------------------------
// Gallery carousel: arrows, dots and swipe.
// To add an image, just add an <img> line inside .carousel-track
// in the HTML — the buttons and dots adjust automatically.
// ------------------------------------------------------------
document.querySelectorAll(".carousel").forEach((carousel) => {
  const track = carousel.querySelector(".carousel-track");
  const slides = Array.from(track.children);
  const prevBtn = carousel.querySelector(".carousel-btn.prev");
  const nextBtn = carousel.querySelector(".carousel-btn.next");
  const dotsBox = carousel.querySelector(".carousel-dots");

  // With a single image there is nothing to scroll through
  if (slides.length < 2) {
    prevBtn.remove();
    nextBtn.remove();
    dotsBox.remove();
    return;
  }

  let index = 0;

  // stop the browser's native image-drag fighting the swipe gesture
  slides.forEach((img) => { img.draggable = false; });

  // one dot per slide
  const dots = slides.map((_, i) => {
    const dot = document.createElement("button");
    dot.setAttribute("aria-label", "Go to image " + (i + 1));
    dot.addEventListener("click", () => goTo(i));
    dotsBox.appendChild(dot);
    return dot;
  });

  function goTo(i) {
    index = (i + slides.length) % slides.length; // wraps around at the ends
    track.style.transform = "translateX(-" + index * 100 + "%)";
    dots.forEach((dot, d) => dot.classList.toggle("active", d === index));
  }

  prevBtn.addEventListener("click", () => goTo(index - 1));
  nextBtn.addEventListener("click", () => goTo(index + 1));

  // swipe support for touch screens
  let startX = null;
  carousel.addEventListener("pointerdown", (e) => { startX = e.clientX; });
  carousel.addEventListener("pointerup", (e) => {
    if (startX === null) return;
    const moved = e.clientX - startX;
    if (moved > 40) goTo(index - 1);
    if (moved < -40) goTo(index + 1);
    startX = null;
  });

  goTo(0);
});
