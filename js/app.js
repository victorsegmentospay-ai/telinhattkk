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

  // ---- Seleção de modelo / tamanho / quantidade (abre ao clicar em Comprar)
  var MODELS = [
    "Norisk FF302 Soul Azul",
    "Norisk FF302 Soul Grand Prix Itália",
    "Norisk FF302 Soul Grand Prix Inglaterra",
    "Norisk FF302 Soul Grand Prix Brasil",
    "Norisk FF302 Soul Grand Prix Alemanha",
    "Norisk Flow Monocolor Preto Fosco",
    "LS2 FF358 Preto/Vermelho",
    "LS2 FF358 Branco/Preto",
    "LS2 FF358 Starwar Preto/Cinza Fosco",
    "Norisk FF302 Soul Monocolor Preto Fosco",
    "Norisk FF302 Soul Rosa Fosco",
    "Norisk FF302 Soul World Challenge Branco/Vermelho"
  ];
  var SIZES = ["56", "58", "60", "62"];
  var imgs = thumbs.map(function (t) { var im = $("img", t); return im ? im.getAttribute("src") : ""; });
  var sel = { model: 0, size: "58", qty: 1 };
  var sheet = null;

  function css(el, st) { el.style.cssText = st; return el; }
  function h(tag, st, txt) { var e = document.createElement(tag); if (st) e.style.cssText = st; if (txt) e.textContent = txt; return e; }
  var PINK = "var(--tt)";

  function closeSheet() {
    if (!sheet) return;
    sheet.remove(); sheet = null;
    document.body.style.overflow = "";
  }

  function openSheet() {
    if (sheet) return;
    document.body.style.overflow = "hidden";
    sheet = h("div", "position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;justify-content:center");
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-label", "Selecionar opções");
    sheet.addEventListener("click", function (e) { if (e.target === sheet) closeSheet(); });

    var box = h("div", "background:var(--background);width:100%;max-width:500px;border-radius:16px 16px 0 0;padding:16px 16px calc(16px + env(safe-area-inset-bottom));max-height:90vh;overflow-y:auto;font-size:14px");
    if (window.innerWidth >= 640) box.style.maxWidth = "420px";

    // topo: foto + preço + fechar
    var head = h("div", "display:flex;gap:12px;align-items:flex-start;margin-bottom:16px");
    var pic = h("img", "width:64px;height:64px;object-fit:contain;border-radius:8px;background:var(--muted)");
    pic.alt = "";
    var info = h("div", "flex:1;min-width:0");
    info.appendChild(h("div", "color:" + PINK + ";font-weight:700;font-size:18px", "R$ 68,34"));
    info.appendChild(h("div", "color:#8a8a8a;font-size:12px;text-decoration:line-through", "R$ 947,90"));
    var chosen = h("div", "font-size:12px;color:#666;margin-top:2px");
    info.appendChild(chosen);
    var x = h("button", "width:32px;height:32px;border:0;background:none;font-size:22px;line-height:1;cursor:pointer;color:inherit", "×");
    x.setAttribute("aria-label", "Fechar");
    x.addEventListener("click", closeSheet);
    head.appendChild(pic); head.appendChild(info); head.appendChild(x);
    box.appendChild(head);

    // modelos
    box.appendChild(h("div", "font-weight:600;margin-bottom:8px", "Modelo"));
    var grid = h("div", "display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px");
    var cells = MODELS.map(function (name, i) {
      var b = h("button", "aspect-ratio:1/1;border-radius:6px;padding:2px;background:var(--muted);cursor:pointer;overflow:hidden;border:2px solid transparent");
      b.setAttribute("aria-label", name);
      b.title = name;
      var im = h("img", "width:100%;height:100%;object-fit:contain;display:block");
      im.src = imgs[i] || ""; im.alt = name;
      b.appendChild(im);
      b.addEventListener("click", function () { sel.model = i; render(); });
      grid.appendChild(b);
      return b;
    });
    box.appendChild(grid);

    // tamanhos
    box.appendChild(h("div", "font-weight:600;margin-bottom:8px", "Tamanho"));
    var sg = h("div", "display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px");
    var sbtn = SIZES.map(function (z) {
      var b = h("button", "height:36px;border-radius:6px;cursor:pointer;border:1px solid transparent;font-size:13px", z);
      b.addEventListener("click", function () { sel.size = z; render(); });
      sg.appendChild(b);
      return b;
    });
    box.appendChild(sg);

    // quantidade
    var qrow = h("div", "display:flex;align-items:center;justify-content:space-between;margin-bottom:16px");
    qrow.appendChild(h("div", "font-weight:600", "Quantidade"));
    var qc = h("div", "display:flex;align-items:center;gap:14px");
    var minus = h("button", "width:28px;height:28px;border:0;background:none;font-size:20px;cursor:pointer;color:inherit", "−");
    var qn = h("span", "min-width:18px;text-align:center");
    var plus = h("button", "width:28px;height:28px;border:0;background:none;font-size:20px;cursor:pointer;color:inherit", "+");
    minus.setAttribute("aria-label", "Diminuir"); plus.setAttribute("aria-label", "Aumentar");
    minus.addEventListener("click", function () { sel.qty = Math.max(1, sel.qty - 1); render(); });
    plus.addEventListener("click", function () { sel.qty = Math.min(10, sel.qty + 1); render(); });
    qc.appendChild(minus); qc.appendChild(qn); qc.appendChild(plus);
    qrow.appendChild(qc);
    box.appendChild(qrow);

    var go = h("button", "width:100%;height:48px;border:0;border-radius:999px;background:" + PINK + ";color:#fff;font-weight:600;font-size:15px;cursor:pointer", "Comprar agora");
    go.addEventListener("click", confirmSelection);
    box.appendChild(go);

    function render() {
      cells.forEach(function (b, i) {
        var on = i === sel.model;
        b.style.borderColor = on ? PINK : "transparent";
      });
      sbtn.forEach(function (b, i) {
        var on = SIZES[i] === sel.size;
        b.style.background = on ? "color-mix(in oklab," + PINK + " 15%, white)" : "var(--muted)";
        b.style.borderColor = on ? PINK : "transparent";
        b.style.color = on ? PINK : "inherit";
      });
      qn.textContent = sel.qty;
      pic.src = imgs[sel.model] || "";
      chosen.textContent = MODELS[sel.model] + " · Tam " + sel.size;
    }
    render();
    sheet.appendChild(box);
    document.body.appendChild(sheet);
  }

  function selection() {
    return { opcao: MODELS[sel.model] + " - Tam " + sel.size, qtd: sel.qty };
  }
  // Chamado por "Comprar agora". Quando CHECKOUT_URL estiver preenchido, leva o pedido para lá.
  function confirmSelection() {
    var s = selection();
    window.pedidoSelecionado = s;
    document.dispatchEvent(new CustomEvent("pedido:selecionado", { detail: s }));
    if (CHECKOUT_URL) {
      var sep = CHECKOUT_URL.indexOf("?") > -1 ? "&" : "?";
      location.href = CHECKOUT_URL + sep + "opcao=" + encodeURIComponent(s.opcao) + "&qtd=" + s.qtd;
    } else {
      closeSheet();
      toast("Selecionado: " + s.opcao + " (x" + s.qtd + ")");
    }
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeSheet(); });

  var bar = $('[aria-label="Compra rápida"]');
  if (bar) {
    var btns = $$("button", bar);
    var chat = btns[0], add = btns[1], buyBtn = btns[2];
    if (add) add.addEventListener("click", openSheet);
    if (buyBtn) buyBtn.addEventListener("click", openSheet);
    if (chat) chat.addEventListener("click", function () { toast("Atendimento: seg a sex, 9h às 18h"); });
  }
  var cart = $('[aria-label="Carrinho"]') || $$("header button")[2];
  if (cart) cart.addEventListener("click", openSheet);
})();
