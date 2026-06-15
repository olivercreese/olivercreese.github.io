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
// Homepage project carousel: drifts slowly on its own, pauses on
// hover, and can be moved by hand with the arrows or by dragging.
// The cards are cloned once so the loop wraps around seamlessly.
// ------------------------------------------------------------
const marqueeWrap = document.querySelector(".marquee-wrap");
if (marqueeWrap) {
  const marquee = marqueeWrap.querySelector(".project-marquee");
  const track = marqueeWrap.querySelector(".marquee-track");

  const originals = Array.from(track.children);
  originals.forEach((card) => {
    const clone = card.cloneNode(true);
    // the clones are purely visual: hide them from screen readers
    // and keep their links out of keyboard tab order (the card itself
    // is a link, plus any links nested inside it)
    clone.setAttribute("aria-hidden", "true");
    if (clone.matches("a")) clone.tabIndex = -1;
    clone.querySelectorAll("a").forEach((link) => { link.tabIndex = -1; });
    track.appendChild(clone);
  });
  track.querySelectorAll("img").forEach((img) => { img.draggable = false; });

  // JS drives the movement from here on (the CSS animation is only
  // a fallback for when JS is off)
  track.style.animation = "none";

  const gap = parseFloat(getComputedStyle(track).gap) || 24;
  const AUTO_SPEED = 22;            // drift speed in pixels per second
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let offset = 0;                   // how far the track has moved left
  let glideTarget = null;           // where an arrow press is sending us
  let hovering = false;
  let dragging = false;
  let dragX = 0;
  let dragDistance = 0;
  let lastTime = performance.now();

  // the track holds two copies of the cards; moving by one copy's
  // width lands on an identical frame, so we wrap there
  const wrapWidth = () => (track.scrollWidth + gap) / 2;

  function tick(now) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    if (glideTarget !== null) {
      // ease toward the arrow-press target
      offset += (glideTarget - offset) * Math.min(1, dt * 8);
      if (Math.abs(glideTarget - offset) < 0.5) {
        offset = glideTarget;
        glideTarget = null;
      }
    } else if (!hovering && !dragging && !reduceMotion) {
      offset += AUTO_SPEED * dt;
    }

    const w = wrapWidth();
    if (offset >= w) { offset -= w; if (glideTarget !== null) glideTarget -= w; }
    if (offset < 0)  { offset += w; if (glideTarget !== null) glideTarget += w; }

    track.style.transform = "translateX(" + -offset + "px)";
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  marqueeWrap.addEventListener("mouseenter", () => { hovering = true; });
  marqueeWrap.addEventListener("mouseleave", () => { hovering = false; });

  // arrows move by exactly one card
  const cardStep = () =>
    track.querySelector(".project-card").getBoundingClientRect().width + gap;

  marqueeWrap.querySelector(".marquee-btn.prev").addEventListener("click", () => {
    glideTarget = (glideTarget === null ? offset : glideTarget) - cardStep();
  });
  marqueeWrap.querySelector(".marquee-btn.next").addEventListener("click", () => {
    glideTarget = (glideTarget === null ? offset : glideTarget) + cardStep();
  });

  // drag (or swipe) to scroll
  marquee.addEventListener("pointerdown", (e) => {
    dragging = true;
    dragX = e.clientX;
    dragDistance = 0;
    glideTarget = null;
    marquee.setPointerCapture(e.pointerId);
  });
  marquee.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    offset -= e.clientX - dragX;
    dragDistance += Math.abs(e.clientX - dragX);
    dragX = e.clientX;
  });
  ["pointerup", "pointercancel"].forEach((type) => {
    marquee.addEventListener(type, () => { dragging = false; });
  });
  marquee.addEventListener("click", (e) => {
    // keyboard activation (Enter/Space) has no pointer coordinates —
    // let the browser follow the focused card's link natively
    if (e.detail === 0) return;

    // a real drag shouldn't count as a click on the card underneath
    if (dragDistance > 8) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // setPointerCapture (used for dragging) retargets the click to the
    // marquee, so the card's own link never fires. Resolve the card under
    // the cursor and follow its link ourselves.
    const card = document.elementFromPoint(e.clientX, e.clientY)?.closest(".project-card");
    if (card && card.href) window.location.href = card.href;
  }, true);
}

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
