(() => {
  // <stdin>
  (function() {
    var span = document.getElementById("hero-typewriter");
    if (!span) return;
    var outerSpan = span.parentElement;
    var words = ["AI Workloads.", "LLM Models.", "MCP Tools."];
    var wordIndex = 0;
    var charIndex = words[0].length;
    var isDeleting = false;
    var PAUSE = 5e3;
    var TYPE_SPEED = 80;
    var DELETE_SPEED = 45;
    span.style.display = "inline";
    var textNode = document.createElement("span");
    textNode.textContent = words[0];
    var cursor = document.createElement("span");
    cursor.className = "hero-cursor";
    cursor.textContent = "|";
    span.textContent = "";
    span.appendChild(textNode);
    span.appendChild(cursor);
    outerSpan.style.display = "inline-block";
    outerSpan.style.textAlign = "center";
    var maxWidth = 0;
    words.forEach(function(w) {
      textNode.textContent = w;
      maxWidth = Math.max(maxWidth, outerSpan.offsetWidth);
    });
    outerSpan.style.minWidth = maxWidth + "px";
    textNode.textContent = words[0];
    function tick() {
      var word = words[wordIndex];
      if (isDeleting) {
        charIndex--;
        textNode.textContent = word.substring(0, charIndex);
      } else {
        charIndex++;
        textNode.textContent = word.substring(0, charIndex);
      }
      var delay = isDeleting ? DELETE_SPEED : TYPE_SPEED;
      if (!isDeleting && charIndex === word.length) {
        isDeleting = true;
        delay = PAUSE;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        delay = 200;
      }
      setTimeout(tick, delay);
    }
    setTimeout(function() {
      isDeleting = true;
      tick();
    }, PAUSE);
  })();
  (function() {
    if (window.innerWidth >= 768) return;
    var imgWrap = document.querySelector(".section-hero--ai-gateway .section-hero__image");
    if (!imgWrap) return;
    var img = imgWrap.querySelector("img");
    if (!img) return;
    var offsetTop = imgWrap.getBoundingClientRect().top + window.scrollY;
    var vh = window.innerHeight;
    var rangeStart = Math.max(0, offsetTop - vh);
    var rangeEnd = offsetTop - vh * 0.3;
    function update() {
      var progress = (window.scrollY - rangeStart) / (rangeEnd - rangeStart);
      progress = Math.max(0, Math.min(1, progress));
      img.style.transform = "translateX(-" + progress * 34.4844 + "%)";
    }
    window.addEventListener("scroll", update, { passive: true });
    update();
  })();
})();
