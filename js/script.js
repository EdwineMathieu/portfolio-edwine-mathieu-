(function () {
  var navItems = document.querySelectorAll('.nav-item');
  var views = document.querySelectorAll('.view');

  function showView(name, anchorId) {
    views.forEach(function (view) {
      view.classList.toggle('is-active', view.dataset.viewPanel === name);
    });
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
      if (target && target.classList.contains('case-study')) {
        openProject(anchorId);
      } else if (target) {
        target.scrollIntoView();
      }
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

  // Project gallery modal: clicking a thumbnail opens the matching case
  // study full-screen; only one is ever visible (is-open) at a time.
  var projectModal = document.getElementById('project-modal');
  var projectModalClose = projectModal.querySelector('.project-modal-close');
  var openCaseStudy = null;

  function openProject(id) {
    var el = document.getElementById(id);
    if (!el) return;
    if (openCaseStudy) openCaseStudy.classList.remove('is-open');
    el.classList.add('is-open');
    openCaseStudy = el;
    projectModal.classList.add('is-open');
    projectModal.scrollTop = 0;
    document.body.style.overflow = 'hidden';
  }

  function closeProject() {
    if (openCaseStudy) openCaseStudy.classList.remove('is-open');
    openCaseStudy = null;
    projectModal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.project-gallery [data-target]').forEach(function (card) {
    card.addEventListener('click', function () {
      openProject(card.dataset.target);
    });
  });

  projectModalClose.addEventListener('click', closeProject);

  projectModal.addEventListener('click', function (e) {
    if (e.target === projectModal) closeProject();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && projectModal.classList.contains('is-open')) closeProject();
  });

  // Deep link on load, e.g. index.html#cs-automobile: open the view that
  // contains the target anchor (opening the project modal for a case study,
  // or scrolling to it otherwise). The hash is stripped immediately so the
  // browser's own native fragment-scroll never fights this controlled nav.
  var initialAnchor = window.location.hash.slice(1);
  if (initialAnchor) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
    var initialTarget = document.getElementById(initialAnchor);
    if (initialTarget && initialTarget.classList.contains('case-study')) {
      // Case studies now live in #project-modal, a sibling of the .view
      // sections (moved there so the modal can be sized to the viewport
      // rather than to whichever animated view used to contain it) — so
      // they're no longer reachable via closest('[data-view-panel]').
      showView('projets', initialAnchor);
    } else {
      var initialPanel = initialTarget && initialTarget.closest('[data-view-panel]');
      if (initialPanel) showView(initialPanel.dataset.viewPanel, initialAnchor);
    }
  }

  document.querySelectorAll('img.photo').forEach(function (img) {
    img.addEventListener('error', function () {
      var placeholder = document.createElement('div');
      placeholder.className = 'photo is-placeholder';
      placeholder.textContent = img.dataset.placeholder || img.alt || 'Image';
      img.replaceWith(placeholder);
    }, { once: true });
  });

  // Lightbox
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = lightbox.querySelector('.lightbox-img');
  var closeBtn = lightbox.querySelector('.lightbox-close');

  var scale = 1, translateX = 0, translateY = 0;
  var isDragging = false, dragStartX = 0, dragStartY = 0, dragOriginX = 0, dragOriginY = 0;
  var pinchStartDist = 0, pinchStartScale = 1;

  function applyTransform() {
    lightboxImg.style.transform = 'translate(' + translateX + 'px,' + translateY + 'px) scale(' + scale + ')';
    lightboxImg.classList.toggle('is-zoomed', scale > 1);
  }

  function resetZoom() {
    scale = 1;
    translateX = 0;
    translateY = 0;
    applyTransform();
  }

  function openLightbox(src, alt) {
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    resetZoom();
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lightboxImg.src = '';
  }

  function touchDistance(touches) {
    var dx = touches[0].clientX - touches[1].clientX;
    var dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  document.querySelectorAll('.case-image img.photo').forEach(function (img) {
    img.addEventListener('click', function (e) {
      e.stopPropagation();
      openLightbox(img.currentSrc || img.src, img.alt);
    });
  });

  closeBtn.addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox || e.target.classList.contains('lightbox-viewport')) closeLightbox();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox();
  });

  lightboxImg.addEventListener('dblclick', function (e) {
    e.preventDefault();
    if (scale > 1) {
      resetZoom();
    } else {
      scale = 2.5;
      applyTransform();
    }
  });

  lightboxImg.addEventListener('wheel', function (e) {
    e.preventDefault();
    var delta = -e.deltaY * 0.0015;
    scale = Math.min(4, Math.max(1, scale + delta));
    if (scale === 1) {
      translateX = 0;
      translateY = 0;
    }
    applyTransform();
  }, { passive: false });

  lightboxImg.addEventListener('mousedown', function (e) {
    if (scale <= 1) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragOriginX = translateX;
    dragOriginY = translateY;
    lightboxImg.classList.add('is-dragging');
  });

  window.addEventListener('mousemove', function (e) {
    if (!isDragging) return;
    translateX = dragOriginX + (e.clientX - dragStartX);
    translateY = dragOriginY + (e.clientY - dragStartY);
    applyTransform();
  });

  window.addEventListener('mouseup', function () {
    isDragging = false;
    lightboxImg.classList.remove('is-dragging');
  });

  lightboxImg.addEventListener('touchstart', function (e) {
    if (e.touches.length === 2) {
      pinchStartDist = touchDistance(e.touches);
      pinchStartScale = scale;
    } else if (e.touches.length === 1 && scale > 1) {
      isDragging = true;
      dragStartX = e.touches[0].clientX;
      dragStartY = e.touches[0].clientY;
      dragOriginX = translateX;
      dragOriginY = translateY;
    }
  }, { passive: true });

  lightboxImg.addEventListener('touchmove', function (e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      var dist = touchDistance(e.touches);
      scale = Math.min(4, Math.max(1, pinchStartScale * (dist / pinchStartDist)));
      applyTransform();
    } else if (e.touches.length === 1 && isDragging) {
      translateX = dragOriginX + (e.touches[0].clientX - dragStartX);
      translateY = dragOriginY + (e.touches[0].clientY - dragStartY);
      applyTransform();
    }
  }, { passive: false });

  lightboxImg.addEventListener('touchend', function () {
    isDragging = false;
    if (scale <= 1) resetZoom();
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
    'feat-finance-tag': 'Embedded Finance · AI',
    'feat-finance-title': 'Embedded finance &amp; AI assistant',
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
    'gal-luxe-blurb': 'Exploring the visual codes and UX of the luxury sector through Hermès and Versace.',

    'citymoov-tag': 'Mobility · Accessibility',
    'automobile-tag': 'Automotive · Mobility',
    'yij-tag': 'Freelance · Web',
    'cep-tag': 'Freelance · Institutional',
    'luxe-tag': 'Favorite · Luxury',

    'behance-link': 'View on Behance →',

    'agentia-tag': 'AI · Design Leadership',
    'agentia-title': 'AI conversational agent — EBP Open Line',
    'agentia-h1': 'Context',
    'agentia-t1': 'Integrating a conversational agent into the EBP Open Line suite (Accounting, Building, Sales Management), paired with another Product Designer and the AI team (Product Owner, developers).',
    'agentia-h2': 'Upstream framing',
    'agentia-t2': "Upstream, I joined a Cegid working group dedicated to AI: observing and gathering user needs across the group's software, analyzing AI best practices, and formalizing them in an article shared across the whole Cegid group. This step let me understand AI usage across different software before framing the Open Line project.",
    'agentia-h3': 'Leading user research',
    'agentia-t3': 'Assigned to the Open Line products, I coordinated PM, marketing, sales, and the data team to identify needs and define the offer. I designed the interview guide, ran client interviews in pairs, and presented the findings to stakeholders.',
    'agentia-h4': 'Research scope',
    'agentia-t4': '37 EBP clients surveyed on their relationship with AI through a quantitative survey run with the data team (January 2026). 14 EBP client companies (SMBs, from 1 to over 50 employees) interviewed between March 10 and 31, 2026, across the Accounting, Sales Management, Méca, and Building products.',
    'agentia-h5': 'Results &amp; follow-up',
    'agentia-t5': 'Since going live, no support tickets have been raised about the conversational agent; users report being satisfied with the tool. I led the rollout of an internal observability dashboard to refine assistant usage, continuously measure adoption, and confirm or challenge the research hypotheses.',
    'agentia-s1': 'clients surveyed (quant.)',
    'agentia-s2': 'companies interviewed',
    'agentia-s3': 'support tickets post-launch',

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

    'tag-agilite': 'Agility',

    'finance-title': 'EBP — Embedded finance &amp; AI assistant',
    'finance-h1': 'Objective',
    'finance-t1': 'Integrate embedded banking services accessible without leaving the app, letting craftspeople and shopkeepers connect their invoicing software to a business account.',
    'finance-h2': 'Contribution',
    'finance-t2': 'Prototyped the business account activation journey, its funding, and the invoice payment flow. Co-designed the AI chatbot interface with the Product Manager and developers.',
    'finance-h3': 'Impact',
    'finance-t3': 'Took part in the working group on customer adoption of AI assistants and agents in professional software.',

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
    'auto-t1': "A Product Designer specialized in UX/UI, I've worked on a range of digital products and now focus on automotive experiences — connected services, in-vehicle interfaces, and mobility products. My approach: understanding how companies are tackling UX in the software-defined vehicle era, and connecting with the teams facing these challenges.",
    'auto-h2': 'Cockpit EV — driver cluster &amp; central screen',
    'auto-t2': 'An animated HMI prototype for an electric vehicle: driver cluster and central screen designed as two distinct information planes, with Eco / Comfort / Sport drive modes, navigation, energy and charging management, climate, and media.',
    'auto-h3': 'Hierarchy — one layer of information per plane',
    'auto-t3': 'The cluster carries driving only: speed, lane, energy. Everything else lives on the central screen. A 2px rule separates the planes without adding ornament.',
    'auto-h4': 'Color — red never decorates',
    'auto-t4': 'The accent color is reserved for the active mode, the route, and alerts. Modes are distinguished by typography and density, not by color dressing.',
    'auto-h5': 'Grid — six tiles, never more',
    'auto-t5': 'Customization happens within a closed 3×2 grid: the user picks the content, the system keeps the rhythm and the touch targets.',
    'auto-h6': 'Energy — the useful number, not the raw one',
    'auto-t6': 'Range is expressed in kilometers and state of charge on arrival. Instant consumption stays secondary, shown as a histogram.',

    'tag-automobile': 'Automotive',
    'cockpit-link': 'View the animated prototype →',

    'eorizon-h0': 'E-Orizon — planning a long-distance EV trip',
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

    'yij-h1': 'Mission',
    'yij-t1': 'A full redesign of an overly dense, dated site. Figma mockups, interviews with young users, WordPress development. Handled print and digital communications (banners, flyers, social media).',
    'tag-uxwriting': 'UX Writing',

    'cep-t1': 'Designed a responsive, accessible site for 3 audiences (employees, employers, staff representatives), brand identity, and institutional brochures.',
    'cep-t2': 'Improved the appointment-booking journey and redesigned the interactive map of reception centers, with content optimized for search.',
    'tag-responsive': 'Responsive',

    'luxe-h1': 'Personal exploration',
    'luxe-t1': 'Exploring the digital worlds of Hermès and Versace to understand the visual codes and user experience of the luxury and fashion sector — how design elevates brand image while optimizing customer journeys.',
    'tag-luxe': 'Luxury',

    'tools-eyebrow': 'Tools',
    'lightbox-hint': 'Scroll or double-click to zoom — Esc to close',
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
  }

  langButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyLanguage(btn.dataset.lang);
    });
  });

  var savedLang = 'fr';
  try { savedLang = localStorage.getItem(LANG_KEY) || 'fr'; } catch (e) {}
  if (savedLang === 'en') applyLanguage('en');
})();
