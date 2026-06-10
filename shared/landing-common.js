// BlueLetter pre-launch landing pages — shared behavior
// Waitlist capture, nav hairline-on-scroll, scroll reveal.

(function () {
  'use strict';

  var BASE_COUNT = 2184;

  // ----- Nav hairline on scroll -----
  function initNav() {
    var nav = document.querySelector('.bl-nav');
    if (!nav) return;
    var onScroll = function () {
      nav.classList.toggle('scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ----- Waitlist forms -----
  // Real capture: POST to /api/signup (Vercel function → Google Sheets "Blue Letter
  // Sign Ups" via GOOGLE_SHEETS_URL). On success we flip every .bl-waitlist on the
  // page into its inline "joined" success state. The signup is persisted so a
  // returning visitor sees the joined state immediately on next load.
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function getStored(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function setStored(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }

  function markAllJoined(position) {
    document.querySelectorAll('.bl-waitlist').forEach(function (w) {
      w.classList.add('joined');
      var msg = w.querySelector('.success .msg');
      if (msg) {
        msg.textContent = position
          ? "You're #" + Number(position).toLocaleString('en-US') + " on the list."
          : "You're on the list.";
      }
    });
  }

  function initWaitlist() {
    // Returning visitor who already signed up → show joined state straight away.
    if (getStored('bl_signup_email')) {
      markAllJoined(parseInt(getStored('bl_signup_position'), 10) || null);
    }

    document.querySelectorAll('.bl-waitlist form').forEach(function (form) {
      var input = form.querySelector('input[type="email"]');
      var button = form.querySelector('button');

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = (input && input.value || '').trim();
        if (!EMAIL_RE.test(v)) {
          if (input) { input.style.borderColor = 'var(--error)'; input.focus(); }
          return;
        }
        if (input) input.style.borderColor = '';
        if (button) { button.disabled = true; button.style.opacity = '0.6'; }

        fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: v }),
        })
          .then(function (res) {
            return res.json().then(function (data) {
              if (!res.ok) throw new Error(data.error || 'Signup failed');
              return data;
            });
          })
          .then(function (data) {
            setStored('bl_signup_email', v);
            if (data.position) setStored('bl_signup_position', String(data.position));
            markAllJoined(data.position);
          })
          .catch(function (err) {
            if (button) { button.disabled = false; button.style.opacity = ''; }
            if (input) input.style.borderColor = 'var(--error)';
            var note = form.parentElement && form.parentElement.querySelector('.bl-waitlist-note');
            if (note) note.textContent = err.message || 'Something went wrong. Please try again.';
          });
      });

      if (input) {
        input.addEventListener('input', function () { input.style.borderColor = ''; });
      }
    });
  }

  // ----- Scroll reveal (position-based; IO is unreliable in some hosts) -----
  function initReveal() {
    var els = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    if (!els.length) return;
    function check() {
      els = els.filter(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.92 && r.bottom > 0) {
          el.classList.add('in');
          return false;
        }
        return true;
      });
      if (!els.length) {
        window.removeEventListener('scroll', check);
        window.removeEventListener('resize', check);
      }
    }
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check, { passive: true });
    check();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initNav(); initWaitlist(); initReveal();
    });
  } else {
    initNav(); initWaitlist(); initReveal();
  }
})();
