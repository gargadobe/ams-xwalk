import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const slides = [...block.children];
  if (slides.length === 0) return;

  // Create carousel container
  const carouselContainer = document.createElement('div');
  carouselContainer.className = 'carousel-container';

  // Create slides wrapper
  const slidesWrapper = document.createElement('div');
  slidesWrapper.className = 'carousel-slides';

  // Create slides
  slides.forEach((slide, index) => {
    const slideElement = document.createElement('div');
    slideElement.className = `carousel-slide ${index === 0 ? 'active' : ''}`;
    moveInstrumentation(slide, slideElement);

    // Move content from original slide
    while (slide.firstElementChild) {
      const child = slide.firstElementChild;
      if (child.children.length === 1 && child.querySelector('picture')) {
        child.className = 'carousel-slide-image';
      } else {
        child.className = 'carousel-slide-content';
      }
      slideElement.append(child);
    }

    slidesWrapper.append(slideElement);
  });

  // Optimize images
  slidesWrapper.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '1200' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  // Create navigation buttons
  const prevButton = document.createElement('button');
  prevButton.className = 'carousel-button carousel-button-prev';
  prevButton.setAttribute('aria-label', 'Previous slide');
  prevButton.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>';

  const nextButton = document.createElement('button');
  nextButton.className = 'carousel-button carousel-button-next';
  nextButton.setAttribute('aria-label', 'Next slide');
  nextButton.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>';

  // Create indicators
  const indicators = document.createElement('div');
  indicators.className = 'carousel-indicators';
  slides.forEach((_, index) => {
    const indicator = document.createElement('button');
    indicator.className = `carousel-indicator ${index === 0 ? 'active' : ''}`;
    indicator.setAttribute('aria-label', `Go to slide ${index + 1}`);
    indicator.addEventListener('click', () => goToSlide(index));
    indicators.append(indicator);
  });

  // State management
  let currentSlide = 0;
  let autoPlayInterval = null;
  let isTransitioning = false;

  // Go to specific slide
  function goToSlide(index, direction = null) {
    if (isTransitioning || index === currentSlide) return;

    const slides = slidesWrapper.querySelectorAll('.carousel-slide');
    const indicators = carouselContainer.querySelectorAll('.carousel-indicator');
    
    isTransitioning = true;

    // Update current slide
    slides[currentSlide].classList.remove('active');
    indicators[currentSlide]?.classList.remove('active');

    currentSlide = index;
    if (currentSlide >= slides.length) currentSlide = 0;
    if (currentSlide < 0) currentSlide = slides.length - 1;

    slides[currentSlide].classList.add('active');
    indicators[currentSlide]?.classList.add('active');

    // Update slide position
    slidesWrapper.style.setProperty('--current-slide', currentSlide);

    setTimeout(() => {
      isTransitioning = false;
    }, 300);
  }

  // Next slide
  function nextSlide() {
    goToSlide(currentSlide + 1, 'next');
  }

  // Previous slide
  function prevSlide() {
    goToSlide(currentSlide - 1, 'prev');
  }

  // Auto-play functionality
  function startAutoPlay() {
    stopAutoPlay();
    autoPlayInterval = setInterval(() => {
      nextSlide();
    }, 5000); // Auto-advance every 5 seconds
  }

  function stopAutoPlay() {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = null;
    }
  }

  // Event listeners
  nextButton.addEventListener('click', () => {
    stopAutoPlay();
    nextSlide();
    startAutoPlay();
  });

  prevButton.addEventListener('click', () => {
    stopAutoPlay();
    prevSlide();
    startAutoPlay();
  });

  // Keyboard navigation
  block.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevSlide();
      stopAutoPlay();
      startAutoPlay();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextSlide();
      stopAutoPlay();
      startAutoPlay();
    }
  });

  // Touch/swipe support
  let touchStartX = 0;
  let touchEndX = 0;

  slidesWrapper.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  slidesWrapper.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swipe left - next slide
        nextSlide();
      } else {
        // Swipe right - previous slide
        prevSlide();
      }
      stopAutoPlay();
      startAutoPlay();
    }
  }

  // Pause auto-play on hover
  carouselContainer.addEventListener('mouseenter', stopAutoPlay);
  carouselContainer.addEventListener('mouseleave', startAutoPlay);

  // Assemble carousel
  carouselContainer.append(slidesWrapper);
  carouselContainer.append(prevButton);
  carouselContainer.append(nextButton);
  carouselContainer.append(indicators);

  // Clear block and add carousel
  block.textContent = '';
  block.append(carouselContainer);

  // Make block focusable for keyboard navigation
  block.setAttribute('tabindex', '0');

  // Start auto-play
  startAutoPlay();

  // Pause auto-play when tab is not visible
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoPlay();
    } else {
      startAutoPlay();
    }
  });
}
