(() => {
  'use strict';

  /* ---------- i18n ---------- */
  const urlLang = new URLSearchParams(window.location.search).get('lang');
  let currentLang = (urlLang && I18N[urlLang]) ? urlLang : (localStorage.getItem('hdr_lang') || 'en');

  const setLangURL = (lang) => {
    const url = new URL(window.location);
    if (lang === 'en') { url.searchParams.delete('lang'); }
    else { url.searchParams.set('lang', lang); }
    history.replaceState(null, '', url);
  };

  const applyLang = (lang) => {
    const t = I18N[lang];
    if (!t) return;
    currentLang = lang;
    localStorage.setItem('hdr_lang', lang);
    setLangURL(lang);
    document.documentElement.lang = lang === 'uk' ? 'uk' : lang;

    document.title = t._meta.title;
    document.querySelector('meta[name="description"]').content = t._meta.desc;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (t[key] === undefined) return;
      if (el.hasAttribute('data-i18n-html')) {
        el.innerHTML = t[key];
      } else if (el.tagName === 'OPTION') {
        el.textContent = t[key];
      } else {
        el.textContent = t[key];
      }
    });

    document.querySelectorAll('[data-i18n-list]').forEach(ul => {
      const key = ul.dataset.i18nList;
      const items = t[key];
      if (!items) return;
      ul.innerHTML = items.map(f => `<li>${f}</li>`).join('');
    });

    document.querySelectorAll('.lang-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === lang);
    });

    const activeTheme = document.querySelector('.interior-card.active');
    if (activeTheme) activeTheme.click();
  };

  document.getElementById('langSwitcher').addEventListener('click', (e) => {
    const btn = e.target.closest('.lang-btn');
    if (!btn) return;
    applyLang(btn.dataset.lang);
  });

  /* ---------- Nav scroll state ---------- */
  const nav = document.getElementById('nav');
  const onScroll = () => {
    nav.classList.toggle('nav--scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu toggle ---------- */
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    links.classList.toggle('active');
    document.body.style.overflow = links.classList.contains('active') ? 'hidden' : '';
  });

  links.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      links.classList.remove('active');
      document.body.style.overflow = '';
    });
  });

  /* ---------- Counter animation ---------- */
  const counters = document.querySelectorAll('[data-count]');

  const animateCounter = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const duration = 1800;
    const start = performance.now();

    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      el.textContent = current.toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  const counterObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => counterObserver.observe(c));

  /* ---------- Interior theme switcher ---------- */
  const themeData = {
    jungle: {
      image: 'images/jungle.jpg',
      title: 'Jungle',
      desc: 'Step into a verdant oasis. Living plant walls filter the air while warm timber surfaces and rattan accents create a space that feels alive. Ambient rainforest soundscapes play softly through hidden speakers. Natural light pours through panoramic carriage windows \u2014 frosted for privacy, but wide open to the sky.',
      features: [
        'Living plant walls & hanging planters',
        'Reclaimed teak desks & shelving',
        'Ambient nature soundscape system',
        'Frosted panoramic windows',
        'Air-purifying biophilic design'
      ]
    },
    meadow: {
      image: 'images/meadow.jpg',
      title: 'Meadow',
      desc: 'A sun-drenched workspace inspired by wildflower fields. Soft linen upholstery, warm oak surfaces, and dried flower arrangements bring the countryside indoors. Maximised natural light through oversized windows, sheer curtains for gentle diffusion, and a palette of wheat, sage, and cream.',
      features: [
        'Maximised natural light design',
        'Linen & oak material palette',
        'Dried wildflower installations',
        'Sheer privacy curtains',
        'Open pastoral colour scheme'
      ]
    },
    office: {
      image: 'images/classic-office.jpg',
      title: 'Classic Office',
      desc: 'Pure, distraction-free productivity. Clean lines, full-height acoustic panels, height-adjustable desks, and a muted professional palette. Every surface is designed for function \u2014 integrated cable management, whiteboard walls, and precision task lighting.',
      features: [
        'Height-adjustable sit/stand desks',
        'Full-height acoustic panelling',
        'Integrated cable management',
        'Whiteboard accent walls',
        'Precision task lighting'
      ]
    },
    bar: {
      image: 'images/cocktail-bar.jpg',
      title: 'Cocktail Bar',
      desc: 'Creative energy meets speakeasy charm. Moody pendant lighting, brass fixtures, rich velvet seating, and a built-in espresso bar set the stage for bold ideas. Dark walnut surfaces and ambient jazz create an atmosphere that\u2019s half studio, half members\u2019 club.',
      features: [
        'Built-in espresso & drinks bar',
        'Moody pendant lighting',
        'Brass & velvet material palette',
        'Dark walnut work surfaces',
        'Ambient background music system'
      ]
    },
    library: {
      image: 'images/library.jpg',
      title: 'Library',
      desc: 'A scholar\u2019s retreat on rails. Floor-to-ceiling bookshelves line the walls (stocked with curated reads), leather club chairs invite deep thinking, and brass reading lamps cast warm pools of light. Whisper-quiet by design, with thick carpet and heavy curtains.',
      features: [
        'Floor-to-ceiling bookshelves',
        'Curated book collection',
        'Leather club chairs & reading nooks',
        'Brass reading lamps',
        'Sound-dampening carpet & curtains'
      ]
    },
    scandi: {
      image: 'images/scandi-minimal.jpg',
      title: 'Scandi Minimal',
      desc: 'Hygge meets function. Birch plywood surfaces, wool throws draped over benches, muted earth tones, and clean Scandinavian forms. A restrained, calming workspace that strips away the unnecessary and leaves only what matters.',
      features: [
        'Birch plywood desks & shelving',
        'Wool throws & soft textiles',
        'Muted earth-tone palette',
        'Minimalist Scandinavian furniture',
        'Warm indirect lighting'
      ]
    }
  };

  const interiorCards = document.querySelectorAll('.interior-card');
  const interiorVisual = document.getElementById('interiorVisual');
  const interiorTitle = document.getElementById('interiorTitle');
  const interiorDesc = document.getElementById('interiorDesc');
  const interiorFeatures = document.getElementById('interiorFeatures');

  interiorCards.forEach(card => {
    card.addEventListener('click', () => {
      const theme = card.dataset.theme;
      const data = themeData[theme];
      if (!data) return;

      interiorCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      const img = interiorVisual.querySelector('img');
      if (img) {
        img.src = data.image;
        img.alt = `${data.title} interior preview`;
      }
      const t = I18N[currentLang] || I18N.en;
      const localized = (t.themes && t.themes[theme]) || data;
      interiorTitle.textContent = localized.title;
      interiorDesc.textContent = localized.desc;
      interiorFeatures.innerHTML = localized.features
        .map(f => `<li>${f}</li>`)
        .join('');

      const btn = document.querySelector('#interiorBookBtn');
      if (btn) {
        const tmpl = t.theme_book || 'Book a {theme} Cabin';
        btn.textContent = tmpl.replace('{theme}', localized.title);
      }
    });
  });

  /* ---------- Fade-in on scroll ---------- */
  const fadeTargets = document.querySelectorAll(
    '.about__card, .interior-card, .interiors__detail, .feature, .step, .location-card, .pricing-card, .testimonial, .contact__info, .contact__form'
  );

  fadeTargets.forEach(el => el.classList.add('fade-in'));

  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  fadeTargets.forEach(el => fadeObserver.observe(el));

  /* ---------- Staggered animation for grids ---------- */
  const grids = document.querySelectorAll(
    '.about__grid, .interiors__grid, .features__grid, .locations__grid, .pricing__grid, .testimonials__grid'
  );

  grids.forEach(grid => {
    const gridObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const children = entry.target.children;
          Array.from(children).forEach((child, i) => {
            child.style.transitionDelay = `${i * 0.08}s`;
          });
          gridObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    gridObserver.observe(grid);
  });

  /* ---------- Country / currency switcher ---------- */
  const countrySelect = document.getElementById('countrySelect');
  const pricingCards = document.querySelectorAll('.pricing-card[data-prices]');

  const formatPrice = (amount, symbol, currency) => {
    if (currency === 'jpy') return `${symbol}${amount.toLocaleString()}`;
    return `${symbol}${amount}`;
  };

  const updatePrices = () => {
    const opt = countrySelect.selectedOptions[0];
    const region = countrySelect.value;
    const symbol = opt.dataset.symbol;
    const currency = opt.dataset.currency;

    pricingCards.forEach(card => {
      const prices = JSON.parse(card.dataset.prices);
      const price = prices[region];
      const amountEl = card.querySelector('.pricing-card__amount');
      if (amountEl && price !== undefined) {
        amountEl.textContent = formatPrice(price, symbol, currency);
      }
    });
  };

  if (countrySelect) {
    countrySelect.addEventListener('change', updatePrices);
  }

  /* ---------- Stripe Payment Links ---------- */
  const getStripeConfig = () => {
    try {
      return JSON.parse(localStorage.getItem('hdr_stripe') || '{}');
    } catch { return {}; }
  };

  document.querySelectorAll('.js-checkout').forEach(btn => {
    btn.addEventListener('click', () => {
      const plan = btn.dataset.plan;
      const config = getStripeConfig();
      const links = config.paymentLinks || {};
      const url = links[plan];

      if (!url) {
        alert(`No Stripe Payment Link configured for the "${plan}" plan. Visit the admin panel to set it up.`);
        return;
      }

      window.location.href = url;
    });
  });

  /* ---------- Checkout return banner ---------- */
  const params = new URLSearchParams(window.location.search);
  if (params.get('checkout') === 'success') {
    const banner = document.createElement('div');
    banner.className = 'checkout-banner checkout-banner--ok';
    banner.innerHTML = '<strong>Payment successful!</strong> Welcome aboard — check your email for next steps. <button onclick="this.parentElement.remove();history.replaceState(null,\'\',location.pathname)">&times;</button>';
    document.body.prepend(banner);
  } else if (params.get('checkout') === 'cancelled') {
    const banner = document.createElement('div');
    banner.className = 'checkout-banner checkout-banner--cancel';
    banner.innerHTML = 'Checkout was cancelled. <a href="#pricing">Try again?</a> <button onclick="this.parentElement.remove();history.replaceState(null,\'\',location.pathname)">&times;</button>';
    document.body.prepend(banner);
  }

  /* ---------- Contact form ---------- */
  const form = document.getElementById('contactForm');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Sending…';
    btn.disabled = true;

    setTimeout(() => {
      const t = I18N[currentLang] || I18N.en;
      form.innerHTML = `
        <div class="form__success active">
          <h3>${t.form_success_h}</h3>
          <p>${t.form_success_p}</p>
        </div>
      `;
    }, 1200);
  });

  /* ---------- Active nav link highlight ---------- */
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = links.querySelectorAll('a:not(.btn)');

  const highlightNav = () => {
    const scrollY = window.scrollY + 120;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollY >= top && scrollY < top + height) {
        navAnchors.forEach(a => {
          a.style.color = '';
          if (a.getAttribute('href') === `#${id}`) {
            a.style.color = 'var(--clr-primary)';
          }
        });
      }
    });
  };

  window.addEventListener('scroll', highlightNav, { passive: true });

  if (currentLang !== 'en') applyLang(currentLang);
  else {
    setLangURL('en');
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === 'en'));
  }
})();
