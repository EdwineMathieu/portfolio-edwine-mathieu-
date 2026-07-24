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

  document.querySelectorAll('img.photo').forEach(function (img) {
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
})();
