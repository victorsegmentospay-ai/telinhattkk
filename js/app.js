(function () {
  // Link do checkout: preencha aqui para os botões "Comprar" e "Adicionar ao carrinho" levarem até ele.
  var CHECKOUT_URL = "";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var byText = function (sel, txt) {
    return $$(sel).filter(function (e) { return e.textContent.replace(/\s+/g, " ").trim().indexOf(txt) === 0; })[0];
  };

  // ---- Voltar / Compartilhar / Copiar link
  var back = $('[aria-label="Voltar"]');
  if (back) back.addEventListener("click", function () {
    if (history.length > 1) history.back();
  });

  function share() {
    var data = { title: document.title, url: location.href };
    if (navigator.share) { navigator.share(data).catch(function () {}); }
    else copy();
  }
  function copy() {
    var done = function () { toast("Link copiado"); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(location.href).then(done, done);
    } else {
      var t = document.createElement("textarea");
      t.value = location.href; document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(t); done();
    }
  }
  var shareBtn = $('[aria-label="Compartilhar"]');
  if (shareBtn) shareBtn.addEventListener("click", share);
  var shareBtn2 = byText("button", "Compartilhar");
  if (shareBtn2) shareBtn2.addEventListener("click", share);
  var copyBtn = byText("button", "Copiar link");
  if (copyBtn) copyBtn.addEventListener("click", copy);

  function toast(msg) {
    var t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:rgba(0,0,0,.8);color:#fff;padding:8px 16px;border-radius:999px;font-size:13px;z-index:100";
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 1800);
  }

  // ---- Abas (rolagem até a seção + destaque da aba ativa)
  var nav = $("header nav");
  var tabs = nav ? $$("button", nav) : [];
  var targets = ["#top", "#desc", "#reviews", "#loja"].map(function (s) { return $(s); });
  function setActive(i) {
    tabs.forEach(function (b, k) {
      var on = k === i;
      b.classList.toggle("border-foreground", on);
      b.classList.toggle("font-semibold", on);
      b.classList.toggle("border-transparent", !on);
      b.classList.toggle("text-muted-foreground", !on);
    });
  }
  tabs.forEach(function (b, i) {
    b.addEventListener("click", function () {
      var el = targets[i];
      if (!el) return;
      var y = el.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: i === 0 ? 0 : y, behavior: "smooth" });
    });
  });
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var cur = 0;
      targets.forEach(function (el, i) {
        if (el && el.getBoundingClientRect().top <= 110) cur = i;
      });
      setActive(cur);
    });
  }, { passive: true });

  // ---- Galeria
  var top = $("#top");
  var track = top && top.firstElementChild;
  var slides = track ? Array.prototype.slice.call(track.children) : [];
  var counter = top && $("span", top);
  var nextBtn = top && $("button", top);
  var thumbsWrap = top && top.nextElementSibling;
  var thumbs = thumbsWrap ? $$("button", thumbsWrap) : [];
  var idx = 0;

  function current() {
    if (!track || !slides.length) return 0;
    return Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / track.clientWidth)));
  }
  function goTo(i) {
    if (!track || !slides.length) return;
    i = Math.max(0, Math.min(slides.length - 1, i));
    track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
  }
  function sync() {
    idx = current();
    if (counter) counter.textContent = (idx + 1) + "/" + slides.length;
    thumbs.forEach(function (t, k) {
      t.classList.toggle("border-foreground", k === idx);
      t.classList.toggle("border-transparent", k !== idx);
    });
    var t = thumbs[idx];
    if (t && thumbsWrap) {
      thumbsWrap.scrollTo({ left: t.offsetLeft - thumbsWrap.clientWidth / 2 + t.clientWidth / 2, behavior: "smooth" });
    }
  }
  if (track) {
    track.addEventListener("scroll", function () {
      clearTimeout(track._t);
      track._t = setTimeout(sync, 60);
    }, { passive: true });
    // arrastar com o mouse no desktop
    var down = false, sx = 0, sl = 0;
    track.addEventListener("mousedown", function (e) { down = true; sx = e.pageX; sl = track.scrollLeft; track.style.scrollSnapType = "none"; });
    window.addEventListener("mouseup", function () {
      if (!down) return; down = false;
      track.style.scrollSnapType = "";
      goTo(Math.round(track.scrollLeft / track.clientWidth));
    });
    window.addEventListener("mousemove", function (e) { if (down) { e.preventDefault(); track.scrollLeft = sl - (e.pageX - sx); } });
  }
  if (nextBtn) nextBtn.addEventListener("click", function () { goTo(idx + 1 >= slides.length ? 0 : idx + 1); });
  thumbs.forEach(function (t, i) { t.addEventListener("click", function () { goTo(i); }); });
  sync();

  // ---- Contagem regressiva (Black Friday)
  var cd = $$("div").filter(function (e) {
    return e.children.length <= 3 && /Termina em\s*\d\d:\d\d:\d\d/.test(e.textContent) && e.textContent.length < 60;
  }).pop();
  if (cd) {
    var node = null;
    var w = document.createTreeWalker(cd, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) { if (/^\d\d:\d\d:\d\d$/.test(w.currentNode.nodeValue.trim())) node = w.currentNode; }
    if (node) {
      var START = 5 * 60;
      var left = START - 15;
      var pad = function (n) { return (n < 10 ? "0" : "") + n; };
      setInterval(function () {
        left = left <= 0 ? START : left - 1;
        node.nodeValue = "00:" + pad(Math.floor(left / 60)) + ":" + pad(left % 60);
      }, 1000);
    }
  }

  // ---- Botões de compra
  function buy() {
    if (CHECKOUT_URL) { location.href = CHECKOUT_URL; }
    else toast("Em breve");
  }
  var bar = $('[aria-label="Compra rápida"]');
  if (bar) {
    var btns = $$("button", bar);
    var chat = btns[0], add = btns[1], buyBtn = btns[2];
    if (add) add.addEventListener("click", function () { CHECKOUT_URL ? buy() : toast("Adicionado ao carrinho"); });
    if (buyBtn) buyBtn.addEventListener("click", buy);
    if (chat) chat.addEventListener("click", function () { toast("Atendimento: seg a sex, 9h às 18h"); });
  }
  var cart = $('[aria-label="Carrinho"]') || $$("header button")[2];
  if (cart) cart.addEventListener("click", buy);
})();
