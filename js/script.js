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
      setTimeout(function () {
        var el = document.getElementById(anchorId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 60);
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

  document.querySelectorAll('img.photo').forEach(function (img) {
    img.addEventListener('error', function () {
      var placeholder = document.createElement('div');
      placeholder.className = 'photo is-placeholder';
      placeholder.textContent = img.dataset.placeholder || img.alt || 'Image';
      img.replaceWith(placeholder);
    }, { once: true });
  });
})();
