(() => {
  // <stdin>
  (function() {
    var quotes = JSON.parse(document.getElementById("sp-quotes").innerHTML || "[]");
    if (!quotes.length) return;
    var quoteBody = document.querySelector(".sp-quote-body");
    var quotePerson = document.querySelector(".sp-quote-person");
    var quotePosition = document.querySelector(".sp-quote-position");
    var quoteCompany = document.querySelector(".sp-quote-company");
    var container = document.querySelector(".social-proof-strip__content");
    var currentIndex = Math.floor(Math.random() * quotes.length);
    function renderQuote(index) {
      var q = quotes[index];
      quoteBody.innerHTML = q.quote.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      quotePerson.textContent = q.person;
      quotePosition.textContent = q.position;
      quoteCompany.textContent = q.company;
    }
    function init() {
      var maxH = 0;
      for (var i = 0; i < quotes.length; i++) {
        renderQuote(i);
        var h = container.offsetHeight;
        if (h > maxH) maxH = h;
      }
      container.style.minHeight = maxH + "px";
      renderQuote(currentIndex);
      container.style.transition = "opacity 0.6s ease";
      setInterval(function() {
        container.style.opacity = "0";
        setTimeout(function() {
          currentIndex = (currentIndex + 1) % quotes.length;
          renderQuote(currentIndex);
          container.style.opacity = "1";
        }, 600);
      }, 15e3);
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(init);
    } else {
      init();
    }
  })();
})();
