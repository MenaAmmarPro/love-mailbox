"use strict";

/*
 * love-mailbox — page logic.
 *
 * "Letters for Later": write a letter, choose the day it should open, and seal
 * it. The mailbox keeps it until then. Everything is localStorage on this device.
 */

(function () {
  var STORE = "mena-mailbox";

  var state = { letters: [] };

  /* ---------------- helpers ---------------- */

  function pad2(n) { return String(n).padStart(2, "0"); }

  function dayISO(date) {
    var d = date || new Date();
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }

  function asDate(iso) {
    // Parse a YYYY-MM-DD day at local midnight.
    var parts = String(iso).split("-");
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  function daysUntil(openAt) {
    var today = asDate(dayISO());
    var target = asDate(openAt);
    return Math.round((target - today) / 86400000);
  }

  function isOpenable(letter, today) {
    return (today || dayISO()) >= letter.openAt;
  }

  /* ---------------- storage ---------------- */

  function load() {
    state.letters = [];
    var raw = null;
    try { raw = localStorage.getItem(STORE); } catch (e) { raw = null; }
    var s = null;
    if (raw) { try { s = JSON.parse(raw); } catch (e) { s = null; } }
    if (s && Array.isArray(s.letters)) {
      s.letters.forEach(function (l) {
        if (l && typeof l.id === "string" && typeof l.body === "string") {
          state.letters.push({
            id: l.id,
            title: typeof l.title === "string" ? l.title.slice(0, 80) : "",
            body: l.body.slice(0, 4000),
            createdAt: typeof l.createdAt === "string" ? l.createdAt : dayISO(),
            openAt: typeof l.openAt === "string" ? l.openAt : dayISO(),
            openedAt: typeof l.openedAt === "string" ? l.openedAt : null
          });
        }
      });
    }
  }

  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  /* ---------------- actions ---------------- */

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = String(value);
  }

  function note(id, message) { setText(id, message); }

  function find(id) {
    for (var i = 0; i < state.letters.length; i += 1) {
      if (state.letters[i].id === id) return state.letters[i];
    }
    return null;
  }

  function sealLetter(title, body, openAt) {
    body = String(body || "").trim();
    if (!body) return false;
    if (!openAt) openAt = dayISO();
    state.letters.push({
      id: "l" + Date.now() + Math.floor(Math.random() * 1000),
      title: String(title || "").trim().slice(0, 80),
      body: body.slice(0, 4000),
      createdAt: dayISO(),
      openAt: openAt,
      openedAt: null
    });
    save();
    render();
    return true;
  }

  function openLetter(id) {
    var l = find(id);
    if (!l || l.openedAt || !isOpenable(l)) return false;
    l.openedAt = dayISO();
    save();
    render();
    note("mailbox-note", "It's yours now \u2014 read it slowly \u2665");
    return true;
  }

  function removeLetter(id) {
    for (var i = 0; i < state.letters.length; i += 1) {
      if (state.letters[i].id === id) {
        state.letters.splice(i, 1);
        save();
        render();
        note("mailbox-note", "That letter is gone.");
        return true;
      }
    }
    return false;
  }

  function resetMailbox() {
    state.letters = [];
    save();
    render();
    note("save-note", "The mailbox is empty \u2014 you can write a new letter whenever you like.");
  }

  /* ---------------- rendering ---------------- */

  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function renderLetter(l) {
    var today = dayISO();
    var opened = !!l.openedAt;
    var openable = isOpenable(l, today);

    var card = el("div", "letter " + (opened ? "is-open" : "is-sealed"));
    card.setAttribute("data-id", l.id);

    var head = el("div", "letter-head");
    var env = el("div", "envelope");
    env.appendChild(el("span", "seal"));
    head.appendChild(env);

    var headings = el("div", "letter-headings");
    var title = el("h3", "letter-title");
    title.textContent = l.title || "A letter for later";
    headings.appendChild(title);

    var date = el("span", "letter-date");
    if (opened) {
      date.textContent = "Opened " + l.openedAt;
    } else if (openable) {
      date.textContent = "Ready to open \u00b7 sealed " + l.createdAt;
    } else {
      var d = daysUntil(l.openAt);
      date.textContent = "Opens on " + l.openAt + (d > 1 ? " \u00b7 " + d + " days to wait" : " \u00b7 tomorrow");
    }
    headings.appendChild(date);
    head.appendChild(headings);
    card.appendChild(head);

    if (opened) {
      var body = el("p", "letter-body");
      body.textContent = l.body;
      card.appendChild(body);
    }

    var actions = el("div", "letter-actions");
    if (!opened) {
      var btn = el("button", "letter-open");
      btn.type = "button";
      if (openable) {
        btn.textContent = "Open the letter \u2665";
        btn.addEventListener("click", function () { openLetter(l.id); });
      } else {
        btn.textContent = "Sealed";
        btn.disabled = true;
      }
      actions.appendChild(btn);
    }
    var rm = el("button", "letter-remove");
    rm.type = "button";
    rm.textContent = opened ? "Delete" : "Remove";
    rm.addEventListener("click", function () { removeLetter(l.id); });
    actions.appendChild(rm);
    card.appendChild(actions);

    return card;
  }

  function render() {
    var list = document.getElementById("mailbox-list");
    if (list) {
      list.textContent = "";
      if (!state.letters.length) {
        var empty = el("p", "letter-empty");
        empty.textContent = "The mailbox is empty for now \u2014 a blank page, waiting.";
        list.appendChild(empty);
      } else {
        // Newest first.
        state.letters.slice().reverse().forEach(function (l) { list.appendChild(renderLetter(l)); });
      }
    }
    var sealed = state.letters.filter(function (l) { return !l.openedAt; }).length;
    setText("letter-count", state.letters.length);
    setText("sealed-count", sealed);
  }

  /* ---------------- events ---------------- */

  function wire() {
    var seal = document.getElementById("seal-letter");
    if (seal) seal.addEventListener("click", function () {
      var t = document.getElementById("new-title");
      var b = document.getElementById("new-body");
      var d = document.getElementById("open-date");
      var body = b ? b.value : "";
      if (!String(body).trim()) {
        note("write-note", "Write a few words first \u2665");
        return;
      }
      sealLetter(t ? t.value : "", body, d && d.value ? d.value : dayISO());
      if (t) t.value = "";
      if (b) b.value = "";
      if (d) d.value = "";
      note("write-note", "Sealed and tucked away \u2014 it will wait for its day \u2665");
    });

    var reset = document.getElementById("reset-mailbox");
    if (reset) reset.addEventListener("click", resetMailbox);

    var share = document.getElementById("share-button");
    if (share) share.addEventListener("click", function () {
      var url = window.location.href;
      if (navigator.share) {
        navigator.share({ title: document.title, url: url }).catch(function () {});
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { note("save-note", "Link copied \u2665"); })
          .catch(function () { note("save-note", url); });
        return;
      }
      note("save-note", url);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    load();
    render();
    wire();

    var dateInput = document.getElementById("open-date");
    if (dateInput) dateInput.value = dayISO();

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("sw.js").catch(function () {});
      });
    }
  });
})();
