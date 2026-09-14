(function () {
  // Always reload onto the top of the home page: without this, the browser
  // restores whatever scroll position was last recorded (possibly deep into
  // a different view) before this script gets a chance to pick the active
  // view, so a refresh could visibly land mid-page.
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  if (!window.location.hash) {
    window.scrollTo(0, 0);
  }

  var navItems = document.querySelectorAll('.nav-item');
  var views = document.querySelectorAll('.view');
  var cvCursorSticker = document.getElementById('cv-cursor-sticker');

  function showView(name, anchorId) {
    views.forEach(function (view) {
      var isNowActive = view.dataset.viewPanel === name;
      view.classList.toggle('is-active', isNowActive);
      if (isNowActive) {
        // A sweep-reveal container inside this view may have started out
        // hidden (display: none), which the IntersectionObserver can miss
        // when the view later becomes visible. Re-check its geometry now;
        // reading getBoundingClientRect() right after the class toggle
        // forces the browser to lay out synchronously, so this sees the
        // up-to-date (now visible) geometry without waiting on rAF.
        view.querySelectorAll('.expertise-pills, .stats-sweep, .project-gallery').forEach(function (el) {
          if (el.__sweepCheck) el.__sweepCheck();
        });
      }
    });
    if (cvCursorSticker && name !== 'cv') {
      cvCursorSticker.classList.remove('is-active');
    }
    navItems.forEach(function (item) {
      var isActive = item.dataset.view === name;
      item.classList.toggle('is-active', isActive);
      if (isActive) {
        item.setAttribute('aria-current', 'page');
      } else {
        item.removeAttribute('aria-current');
      }
    });

    if (anchorId) {
      var target = document.getElementById(anchorId);
      if (target) target.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }

  navItems.forEach(function (item) {
    item.addEventListener('click', function () {
      showView(item.dataset.view);
    });
  });

  document.querySelectorAll('[data-nav]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      showView(el.dataset.nav, el.dataset.anchor);
    });
  });

  // CV page: a small sticker follows the cursor, offset beside it.
  var cvView = document.querySelector('[data-view-panel="cv"]');
  if (cvCursorSticker && cvView) {
    document.addEventListener('mousemove', function (e) {
      if (!cvView.classList.contains('is-active')) return;
      cvCursorSticker.classList.add('is-active');
      cvCursorSticker.style.left = e.clientX + 'px';
      cvCursorSticker.style.top = e.clientY + 'px';
    });

    // Swaps the sticker's image while hovering specific CV sections.
    var defaultStickerSrc = cvCursorSticker.getAttribute('src');
    [
      { el: document.getElementById('cv-skills'), src: 'images/cv-cursor-coffee.png' },
      { el: document.getElementById('cv-education'), src: 'images/cv-cursor-book.png' }
    ].forEach(function (entry) {
      if (!entry.el) return;
      entry.el.addEventListener('mouseenter', function () {
        cvCursorSticker.src = entry.src;
      });
      entry.el.addEventListener('mouseleave', function () {
        cvCursorSticker.src = defaultStickerSrc;
      });
    });
  }

  // Email links: copy the address to the clipboard instead of triggering
  // the OS "choose a mail app" dialog. Falls back to mailto: if the
  // clipboard API is unavailable or denied.
  document.querySelectorAll('a[href^="mailto:"]').forEach(function (link) {
    var originalHTML = link.innerHTML;
    var revertTimer = null;
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var email = link.href.replace('mailto:', '').split('?')[0];
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        window.location.href = link.href;
        return;
      }
      navigator.clipboard.writeText(email).then(function () {
        clearTimeout(revertTimer);
        link.textContent = document.documentElement.lang === 'en' ? 'Copied!' : 'Copié !';
        link.classList.add('is-copied');
        revertTimer = setTimeout(function () {
          link.innerHTML = originalHTML;
          link.classList.remove('is-copied');
        }, 1600);
      }, function () {
        window.location.href = link.href;
      });
    });
  });

  // Reveals a container's children one by one, sweeping up from the
  // bottom, once the container scrolls into view.
  function sweepUpReveal(container, itemSelector, staggerMs) {
    if (!container) return;
    if (!('IntersectionObserver' in window)) {
      container.classList.add('is-visible');
      return;
    }
    var items = Array.prototype.slice.call(container.querySelectorAll(itemSelector));
    items.forEach(function (item, i) {
      item.style.animationDelay = (i * staggerMs) + 'ms';
      // Once the reveal animation finishes, drop it entirely so it stops
      // holding the transform/opacity and normal hover transitions (e.g.
      // the project card lift) work again.
      item.addEventListener('animationend', function () {
        item.classList.add('reveal-done');
      });
    });
    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
    observer.observe(container);

    // The container can start out inside a hidden `.view` (display: none),
    // so it has no geometry when first observed and the transition to
    // visible later doesn't reliably re-fire the observer. showView() calls
    // this once its view becomes active, as a manual fallback check.
    container.__sweepCheck = function () {
      if (container.classList.contains('is-visible')) return;
      var rect = container.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        container.classList.add('is-visible');
        observer.unobserve(container);
      }
    };
  }

  sweepUpReveal(document.querySelector('.expertise-pills'), '.pill', 90);
  sweepUpReveal(document.querySelector('.stats-sweep'), '.stat-card', 120);
  sweepUpReveal(document.querySelector('.project-gallery'), '.project-card', 70);

  // Deep link on load, e.g. index.html#view-cv: scroll to the view/anchor
  // matching the hash. The hash is stripped immediately so the browser's
  // own native fragment-scroll never fights this controlled nav.
  var initialAnchor = window.location.hash.slice(1);
  if (initialAnchor) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
    var initialTarget = document.getElementById(initialAnchor);
    var initialPanel = initialTarget && initialTarget.closest('[data-view-panel]');
    if (initialPanel) showView(initialPanel.dataset.viewPanel, initialAnchor);
  }

  document.querySelectorAll('img.photo').forEach(function (img) {
    img.addEventListener('error', function () {
      var placeholder = document.createElement('div');
      placeholder.className = 'photo is-placeholder';
      placeholder.textContent = img.dataset.placeholder || img.alt || 'Image';
      img.replaceWith(placeholder);
    }, { once: true });
  });

  // Language toggle (FR default, EN dictionary). Original French markup is
  // captured once as the source of truth, so switching back to FR never
  // needs its own dictionary entries.
  var TRANSLATIONS_EN = {
    'nav-accueil': 'Home',
    'nav-cv': 'Resume',
    'nav-projets': 'Projects',
    'badge-available': 'Available for new projects',
    'hero-name': 'Edwine Mathieu',
    'hero-role': 'Senior Product Designer',
    'hero-text': "6 years of experience leading SaaS products end-to-end — from discovery to launch — for French and international product teams, from invoicing SaaS to AI agent integration.",
    'btn-voir-projets': 'View projects',
    'stat1-value': '6 years',
    'stat1-label': 'of product experience, from discovery to post-launch',
    'stat2-label': 'of the product cycle owned end-to-end',
    'stat3-label': 'collaboration with cross-functional teams',
    'about-eyebrow': 'About',
    'about-p1': "A product-management-minded Product Designer, I work across the full product lifecycle: understanding the problem in discovery, design, through to continuous post-launch improvement. I've had the chance to collaborate with cross-functional French and international teams, and to lead AI projects — integrating a conversational agent, redesigning design processes.",
    'about-p2': 'My guiding principle: identify the right problem, deliver the right solution, evaluate it, and optimize it.',
    'expertise-eyebrow': 'Expertise',
    'pill-ux-design': 'UX Design',
    'pill-prototyping': 'Prototyping',
    'pill-workshop': 'Workshop facilitation',
    'pill-accessibility': 'Accessibility',
    'project-types-eyebrow': 'Project types',
    'key-projects-title': 'Key projects',
    'all-projects-link': 'All projects →',
    'feat-hubbix-blurb': 'Invoicing designed for building-trade craftspeople — from discovery to launch.',
    'feat-finance-tag': 'Embedded Finance',
    'feat-finance-title': 'Embedded finance',
    'feat-finance-blurb': 'Business account activation journey and co-design of a business chatbot.',
    'feat-cegid-title': 'Cegid — Brand &amp; DS redesign',
    'feat-cegid-blurb': 'Tested 5 creative directions with 100 users to steer the brand.',
    'footer-copyright': '© Edwine Mathieu — Product Designer',
    'footer-email': 'Email',

    'cv-title': 'Background',
    'cv-intro': 'A product-management-minded Product Designer with 6 years of experience across the full product lifecycle — discovery, design, continuous improvement — in service of the product roadmap and business goals.',
    'cv-experience-eyebrow': 'Professional experience',

    'exp1-title': 'Product Designer — Invoicing, Embedded Finance, AI',
    'exp1-b1': 'Lead UX/UI design for the Hubbix Bâtiment (SaaS) and Open Line Bâtiment (on-premise / SaaS) invoicing software.',
    'exp1-b2': 'Structure wireframes and prototypes in line with the design system, in service of MVP priorities.',
    'exp1-b3': 'Coordinate cross-functional product teams to roll out e-invoicing and embedded finance.',
    'exp1-b4': 'Facilitate a Design Sprint and apply Design Thinking to kick off the Hubbix Bâtiment project.',
    'exp1-b5': 'Interview and test users, including for the integration of a new AI assistant.',
    'exp1-b6': 'Support the product team through the 3-week Early Adopter Program before launch.',
    'exp1-b7': 'Collaborate with developers, business consultants, POs, PMs, and PMMs (design reviews, agile ceremonies).',
    'exp1-b8': 'Analyze usage data to ground design decisions and maximize journey efficiency.',
    'exp1-b9': "Launched the company's first Mobile UI Kit: documented responsive components for cross-platform consistency.",

    'exp2-employer': 'Freelance &amp; employed',
    'exp2-title': 'UI/UX Web Designer / Graphic Designer',
    'exp2-b1': 'Created and redesigned WordPress (Elementor) sites for Yvelines Info Jeunes, CEP Paritaire IDF, Crésus IDF, Onlytravaux, and others.',
    'exp2-b2': 'Designed communication materials: brochures, flyers, booklets, social media posts, logos.',

    'exp3-title': 'Communications Officer',
    'exp3-b1': 'Created and managed print and digital communication materials.',
    'exp3-b2': 'Coordinated institutional and event communication projects.',

    'skills-eyebrow': 'Key skills',
    'skill-research-items': 'Interviews, user testing, data analysis, personas, user journeys',
    'skill-design-name': 'Design &amp; Prototyping',
    'skill-method-name': 'Methodologies',
    'skill-analytics-items': 'Maze, Dovetail, Microsoft Clarity, heatmaps, data-driven analysis, Claude, ChatGPT, Gemini',
    'skill-frontend-name': 'Front-end (basics)',
    'skill-a11y-items': 'WCAG best practices, inclusive design',
    'skill-languages-name': 'Languages',
    'skill-languages-items': 'French (native) · English (B1) · Spanish (A1)',
    'education-eyebrow': 'Education',
    'edu1-title': "O'clock — Full-stack JavaScript Web Developer",
    'edu2-title': 'Marcorel — BTS Graphic &amp; Web UX-UI Design',
    'edu3-title': "Université Rennes II — Master's &amp; Bachelor's in Information &amp; Communication",

    'projets-title': 'Projects',
    'projets-intro': 'Product case studies, from invoicing SaaS to AI agent integration, plus a few freelance projects and personal explorations.',

    'gal-agent-ia-blurb': 'User research and product leadership for integrating an AI assistant into the EBP Open Line suite.',
    'gal-citymoov-blurb': 'An integrated mobility prototype designed for the ecological transition and accessibility.',
    'gal-automobile-blurb': 'A digital HMI cockpit for an electric vehicle — driver cluster and central screen.',
    'gal-yij-blurb': 'A complete redesign of a youth-focused site, from user research to WordPress development.',
    'gal-cep-blurb': 'A responsive multi-audience site and journey redesign for two institutional organizations.',
    'gal-luxe-blurb': 'Exploring the visual codes and UX of the luxury sector through Hermès.',

    'citymoov-tag': 'Mobility · Accessibility',
    'automobile-tag': 'Automotive · Mobility',
    'yij-tag': 'Freelance · Web',
    'cep-tag': 'Freelance · Institutional',
    'luxe-tag': 'Favorite · Luxury',


    'agentia-tag': 'AI · Design Leadership',
    'agentia-title': 'AI conversational agent — EBP Open Line',
    'agentia-h1': 'Context',
    'agentia-t1': 'Integrating a conversational agent into the EBP Open Line suite (Accounting, Building, Sales Management), paired with another Product Designer and the AI team (Product Owner, developers).',
    'agentia-h2': 'Upstream framing',
    'agentia-t2': "Upstream, I joined a Cegid working group dedicated to AI: observing and gathering user needs across the group's software, analyzing AI best practices, and formalizing them in an article shared across the whole Cegid group. This step let me understand AI usage across different software before framing the Open Line project.",
    'agentia-h3': 'Leading user research',
    'agentia-t3': 'Assigned to the Open Line products, I coordinated PM, marketing, sales, and the data team to identify needs and define the offer. I designed the interview guide from discussions with the cross-functional team (PM, PO, PMM, Marketing), then ran all the interviews, recorded while preserving participants\' anonymity. The recordings were analyzed with Dovetail, whose AI features helped categorize verbatims and generate topic-based summary videos, speeding up processing and reporting — the study was written up in Notion and presented to stakeholders. It revealed a contrasted adoption of AI: some users remained skeptical, fearing for their personal data, while others, already advanced in using AI ecosystems, saw it as essential for gaining visibility, streamlining their processes and easing decision-making, sometimes with precise expectations for the AI features they wanted in EBP software.',
    'agentia-h4': 'Research scope',
    'agentia-t4': '37 EBP clients surveyed on their relationship with AI through a quantitative survey run with the data team (January 2026). 14 EBP client companies (SMBs, from 1 to over 50 employees) interviewed between March 10 and 31, 2026, across the Accounting, Sales Management, Méca, and Building products.',
    'agentia-h5': 'Results &amp; follow-up',
    'agentia-t5': 'The team built an internal dashboard to analyze prompt and token usage, identify recurring topics, and track how often the chatbot is used. Still being refined, this tool already delivers valuable insights into how the assistant is actually used.',
    'agentia-t5b': 'This project deepened my understanding of AI\'s implications at every level, and pushed me to question and rethink the way I work: what is the user trying to do? How can AI help them? How is our product evolving with AI, how is the UX designer\'s craft evolving with it, and how do we meet these new challenges to keep the experience smooth, competitive, and compelling? How do we adapt to this new paradigm?',
    'agentia-s1': 'clients surveyed (quant.)',
    'agentia-s2': 'companies interviewed',

    'tag-ia': 'AI',
    'tag-coord': 'Cross-functional coordination',

    'hubbix-tag': 'SaaS · Building-trade invoicing',
    'hubbix-h1': 'Context &amp; problem',
    'hubbix-t1': 'Build invoicing software tailored to the building trade (SMBs, craftspeople). Existing tools were too complex, lacked usability, and wasted time on administrative tasks.',
    'hubbix-h2': 'Role &amp; methodology',
    'hubbix-t2': 'UX/UI Designer across 100% of the product cycle: 10 user interviews, SaaS benchmark, wireframes and flows, 5 user tests, early-adopter program, UX analytics (Microsoft Clarity, Heap), agile methodology with PO/PM/devs/marketing.',
    'hubbix-h3': 'Solutions',
    'hubbix-t3': 'A clear, prioritized dashboard, journey-based navigation (quote → validation → invoicing), a sober and professional UI, and contributions to the design system (buttons, forms, alerts).',
    'hubbix-s1': 'clients (June 2025)',
    'hubbix-s2': 'average time / invoice',
    'hubbix-s3': 'user tests',
    'hubbix-intro': "Product Designer on a 0→1 project: from discovery to launch, then continuous improvement of a business SaaS for construction-sector SMEs. Owning the full UX/UI scope, I defined the UX strategy, led user research, designed ~50 responsive screens, ran testing and the Early Adopters program, supported 13 people through delivery, and progressively introduced a data-driven UX approach.",
    'hubbix-case-study-link': 'Read the full case study →',

    'tag-agilite': 'Agility',

    'finance-title': 'EBP — Embedded finance',
    'finance-h1': 'Objective',
    'finance-t1': 'Integrate embedded banking services accessible without leaving the app, letting craftspeople and shopkeepers connect their invoicing software to a business account.',
    'finance-h2': 'Contribution',
    'finance-t2': 'Prototyped the business account activation journey, its funding, and the invoice payment flow.',
    'finance-h3': 'Impact',
    'finance-t3': 'Supported the team dedicated to the Embedded Finance project during convergence workshops, worked closely with business consultants, and delivered the journeys within 1 week. Presented the finalized journeys to management.',

    'cegid-title': 'Cegid — Brand &amp; Design System redesign',
    'cegid-h1': 'Approach',
    'cegid-t1': '5 designer groups each proposed a prototype embodying the new Cegid brand. After research and design, the 5 final prototypes were tested with 100 testers with the help of a panel provider.',
    'cegid-h2': 'Results',
    'cegid-t2': 'Compared the projects against established criteria (color, usability...) to identify friction points and appealing elements, and to steer design decisions group-wide.',

    'citymoov-h1': 'Context',
    'citymoov-t1': 'A prototype for integrated mobility: ecological transition, multimodality, and territorial accessibility, combining public transport, carpooling, and car-sharing.',
    'citymoov-h2': 'Approach',
    'citymoov-t2': 'Reflections on decarbonization, energy sobriety, and journey flow. A dedicated accessibility track: rethinking the mobility experience for people with disabilities.',

    'pill-mobilite': 'Mobility',

    'auto-h1': 'Vision',
    'auto-t1': "A Product Designer specialized in UX/UI, I design digital experiences with a particular interest in automotive and new mobility.",
    'auto-t1b': "I'm interested in the transformation of the vehicle into a software-defined platform: in-vehicle interfaces, connected services, e-mobility, and new forms of interaction between humans, the vehicle, and its environment.",
    'auto-t1c': "In the age of agentic AI, I want to explore a central question: how do you design automotive experiences that are intelligent, contextual, and personalized — without sacrificing the user's understanding, control, and trust?",
    'auto-t1d': "Through my cockpit HMI and EV charging projects, I experiment with these new use cases and think through experience continuity between the vehicle, the smartphone, and mobility services.",
    'auto-t1e': "I'm now looking to bring this approach to teams shaping the next generation of automotive and mobility experiences.",
    'auto-usecases-title': 'Exploring the driving experience in the software-defined vehicle era',
    'auto-h2': 'Use case 1: Cockpit EV — driver cluster &amp; central screen',
    'auto-t2': 'An animated HMI prototype for an electric vehicle: left driver screen and central screen designed as two distinct information planes, with Eco / Comfort / Sport drive modes, navigation, energy and charging management, climate, and media.',
    'auto-h3': 'Hierarchy — one layer of information per plane',
    'auto-t3': 'The left screen carries driving only: speed, lane, energy. Everything else lives on the central screen. A 2px rule separates the planes without adding ornament.',
    'auto-h4': 'Color — green never decorates',
    'auto-t4': "The accent (Clean-Tech green, consistent with E-Orizon's Eleckar network) is reserved for the active mode, the route, and alerts. Modes are distinguished by typography and density, not by color dressing.",
    'auto-h5': 'Grid — six tiles, never more',
    'auto-t5': 'Customization happens within a closed 3×2 grid: the user picks the content, the system keeps the rhythm and the touch targets.',
    'auto-h6': 'Energy — the useful number, not the raw one',
    'auto-t6': 'Range is expressed in kilometers and state of charge on arrival. Instant consumption stays secondary, shown as a histogram.',

    'tag-automobile': 'Automotive',
    'cockpit-link': 'View the animated prototype →',
    'citymoov-link': "Prototype with Claude Design AI →",
    'citymoov-figma-link': 'View the Figma prototype →',

    'eorizon-h0': 'Designing a seamless electric vehicle charging experience',
    'eorizon-questions-intro': 'This project led me to ask questions such as:',
    'eorizon-q1': 'How to reduce range anxiety?',
    'eorizon-q2': 'How to make charging predictable?',
    'eorizon-q3': 'How to connect the mobile experience to the in-vehicle experience?',
    'eorizon-q4': "How to anticipate the driver's needs?",
    'eorizon-t0': "A mobile app prototype for electric mobility: from planning a long-distance trip to arrival, accounting for battery, subscription network, chargers available along the route, and charging budget — 7 screens, for a one-way Paris → Arcachon trip.",
    'eorizon-h1': 'Subscription network, visible priority',
    'eorizon-t1': "The subscription network (Eleckar) is highlighted along the route and on the map, with the subscriber rate set apart from the public rate — the user sees at a glance where they pay less.",
    'eorizon-h2': 'The budget follows the whole trip',
    'eorizon-t2': 'An estimated amount at departure, updated live while driving, checked against the actual cost on arrival — never a surprise.',
    'eorizon-h3': 'Continuous recalculation, never frozen',
    'eorizon-t3': "Actual consumption, wind, temperature, and charger availability recalculate the route continuously; a delay of more than 20 minutes automatically pushes back the charger reservation.",
    'eorizon-h4': 'Compare before you stop',
    'eorizon-t4': "Before each stop, alternative providers are compared by total cost of the detour, not just the price per kWh.",
    'eorizon-link': 'View the E-Orizon prototype →',
    'prototype-back': '← Back to portfolio',

    'yij-h1': 'Mission',
    'yij-t1': 'A full redesign of an overly dense, dated site. Figma mockups, interviews with young users, WordPress development. Handled print and digital communications (banners, flyers, social media).',
    'tag-uxwriting': 'UX Writing',

    'cep-t1': 'Designed a responsive, accessible site for 3 audiences (employees, employers, staff representatives), brand identity, and institutional brochures.',
    'cep-t2': 'Improved the appointment-booking journey and redesigned the interactive map of reception centers, with content optimized for search.',
    'tag-responsive': 'Responsive',

    'luxe-h1': 'Personal exploration',
    'luxe-t1': 'Exploring the digital world of Hermès to understand the visual codes and user experience of the luxury and fashion sector — how design elevates brand image while optimizing customer journeys.',
    'tag-luxe': 'Luxury',

    'tools-eyebrow': 'Tools',
    'lightbox-hint': 'Double-click to zoom — Esc to close',
    'doc-title': 'Edwine Mathieu — Senior Product Designer',
    'meta-description': 'Portfolio of Edwine Mathieu, Senior Product Designer — SaaS, Embedded Finance, AI.'
  };

  var LANG_KEY = 'site-lang';
  var i18nEls = document.querySelectorAll('[data-i18n]');
  var frContent = new Map();
  i18nEls.forEach(function (el) {
    var attr = el.getAttribute('data-i18n-attr');
    frContent.set(el, attr ? el.getAttribute(attr) : el.innerHTML);
  });

  var langButtons = document.querySelectorAll('.lang-btn');

  function applyLanguage(lang) {
    i18nEls.forEach(function (el) {
      var key = el.dataset.i18n;
      var attr = el.getAttribute('data-i18n-attr');
      var value = (lang === 'en' && TRANSLATIONS_EN[key]) ? TRANSLATIONS_EN[key] : frContent.get(el);
      if (attr) {
        el.setAttribute(attr, value);
      } else {
        el.innerHTML = value;
      }
    });
    document.documentElement.lang = lang;
    langButtons.forEach(function (btn) {
      var isActive = btn.dataset.lang === lang;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    typewriterHeroRole();
  }

  // Types out the hero role (e.g. "Product Designer Senior") one letter at
  // a time, as if on a typewriter. Re-run on language switch since
  // applyLanguage() replaces the text instantly beforehand.
  var heroRole = document.querySelector('.hero-role');
  var typewriterTimer = null;

  function typewriterHeroRole() {
    if (!heroRole) return;
    var fullText = heroRole.textContent;
    clearTimeout(typewriterTimer);
    heroRole.textContent = '';
    heroRole.classList.add('is-typing');
    var i = 0;
    function step() {
      heroRole.textContent = fullText.slice(0, i);
      i++;
      if (i <= fullText.length) {
        typewriterTimer = setTimeout(step, 55);
      } else {
        heroRole.classList.remove('is-typing');
      }
    }
    step();
  }

  langButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyLanguage(btn.dataset.lang);
    });
  });

  var savedLang = 'fr';
  try { savedLang = localStorage.getItem(LANG_KEY) || 'fr'; } catch (e) {}
  if (savedLang === 'en') {
    applyLanguage('en');
  } else {
    typewriterHeroRole();
  }
})();
