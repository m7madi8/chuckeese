(function () {
	const $ = (s, r = document) => r.querySelector(s);
	const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

	// Mobile nav toggle
	const navToggle = $('.nav-toggle');
	const siteNav = $('.site-nav');
	const navBackdrop = $('.nav-backdrop');
	const fabMenu = null;
	const navClose = $('.nav-close');
	if (navToggle && siteNav) {
		navToggle.addEventListener('click', () => {
			const expanded = navToggle.getAttribute('aria-expanded') === 'true';
			navToggle.setAttribute('aria-expanded', String(!expanded));
			siteNav.classList.toggle('open');
			navBackdrop && navBackdrop.toggleAttribute('hidden');
			navBackdrop && navBackdrop.classList.toggle('show');
		});
		// close on link click (mobile UX)
		siteNav.addEventListener('click', (e) => {
			const target = e.target.closest('a[href^="#"]');
			if (target) {
				navToggle.setAttribute('aria-expanded', 'false');
				siteNav.classList.remove('open');
				navBackdrop && navBackdrop.setAttribute('hidden', '');
				navBackdrop && navBackdrop.classList.remove('show');
			}
		});
	}
	if (navClose && siteNav) {
		navClose.addEventListener('click', () => {
			siteNav.classList.remove('open');
			navToggle && navToggle.setAttribute('aria-expanded', 'false');
			navBackdrop && navBackdrop.setAttribute('hidden', '');
			navBackdrop && navBackdrop.classList.remove('show');
		});
	}
	// Floating Menu button opens primary nav on small screens
	// removed floating menu button handler



	// close off-canvas by tapping backdrop
	if (navBackdrop && siteNav) {
		navBackdrop.addEventListener('click', () => {
			siteNav.classList.remove('open');
			navToggle && navToggle.setAttribute('aria-expanded', 'false');
			navBackdrop.setAttribute('hidden', '');
			navBackdrop.classList.remove('show');
		});
	}

	// Year
	const yearEl = $('#year');
	if (yearEl) yearEl.textContent = new Date().getFullYear();

	// Scroll progress
	const progress = $('#scrollProgress');
	if (progress) {
		const onScroll = () => {
			const scrollTop = window.scrollY || document.documentElement.scrollTop;
			const docHeight = document.documentElement.scrollHeight - window.innerHeight;
			const ratio = docHeight > 0 ? (scrollTop / docHeight) : 0;
			progress.style.width = `${ratio * 100}%`;
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();
	}

	// Remove skeleton on image load
	$$('img.skeleton').forEach((img) => {
		if (img.complete) img.classList.remove('skeleton');
		img.addEventListener('load', () => img.classList.remove('skeleton'));
	});

	// ToTop button removed

	// Header shrink on scroll
	const headerEl = $('.site-header');
	if (headerEl) {
		const onHeader = () => {
			headerEl.style.boxShadow = window.scrollY > 10 ? '0 10px 24px rgba(0,0,0,0.08)' : '0 6px 24px rgba(0,0,0,0.06)';
		};
		window.addEventListener('scroll', onHeader, { passive: true });
		onHeader();
	}

	// Register service worker
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.register('/sw.js').catch(() => {});
	}

	// Reveal on scroll
	const revealEls = $$('.reveal');
	if ('IntersectionObserver' in window && revealEls.length) {
		const io = new IntersectionObserver((entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					entry.target.classList.add('is-visible');
					// add extra anim class for items/cards
					if (entry.target.matches('.card, .slide, .section .container, .tabs')) {
						entry.target.classList.add('anim-in');
					}
					io.unobserve(entry.target);
				}
			}
		}, { threshold: 0.2 });
		revealEls.forEach((el) => io.observe(el));
	} else {
		revealEls.forEach((el) => el.classList.add('is-visible'));
	}

	// Carousel
	const carousel = $('.carousel');
	if (carousel) {
		const track = $('.carousel-track', carousel);
		const prevBtn = $('.prev', carousel);
		const nextBtn = $('.next', carousel);
		let index = 0;
		let autoplayTimer;
		let startX = 0;
		let isDragging = false;
		let accumulated = 0;

		function update() {
			const slides = $$('.slide', track);
			if (!slides.length) return;
			const slide = slides[0];
			const slideWidth = slide.getBoundingClientRect().width + 16; // include gap
			track.style.transform = `translateX(${-index * slideWidth}px)`;
		}

		function next() {
			const slides = $$('.slide', track);
			index = (index + 1) % slides.length;
			update();
		}

		function prev() {
			const slides = $$('.slide', track);
			index = (index - 1 + slides.length) % slides.length;
			update();
		}

		function startAutoplay() {
			stopAutoplay();
			autoplayTimer = setInterval(next, 3500);
		}
		function stopAutoplay() { if (autoplayTimer) clearInterval(autoplayTimer); }

		nextBtn && nextBtn.addEventListener('click', () => { next(); startAutoplay(); });
		prevBtn && prevBtn.addEventListener('click', () => { prev(); startAutoplay(); });
		window.addEventListener('resize', update);
		track.addEventListener('mouseenter', stopAutoplay);
		track.addEventListener('mouseleave', startAutoplay);

		// touch swipe
		track.addEventListener('touchstart', (e) => {
			startX = e.touches[0].clientX; isDragging = true; accumulated = 0; stopAutoplay();
		}, { passive: true });
		track.addEventListener('touchmove', (e) => {
			if (!isDragging) return; const dx = e.touches[0].clientX - startX; accumulated = dx;
			track.style.transition = 'none';
			const slides = $$('.slide', track);
			const slide = slides[0];
			const slideWidth = slide.getBoundingClientRect().width + 16;
			track.style.transform = `translateX(${(-index * slideWidth) + dx}px)`;
		}, { passive: true });
		track.addEventListener('touchend', () => {
			isDragging = false; track.style.transition = '';
			if (Math.abs(accumulated) > 40) { accumulated < 0 ? next() : prev(); }
			startAutoplay();
		});
		update();
		startAutoplay();
	}

	// Menu filters
	const tabs = $$('.tab');
	const grid = $('#menuGrid');
	if (tabs.length && grid) {
		tabs.forEach((tab) => {
			tab.addEventListener('click', () => {
				tabs.forEach((t) => t.classList.remove('is-active'));
				tab.classList.add('is-active');
				// subtle, calm click feedback
				tab.classList.add('is-activating');
				setTimeout(() => tab.classList.remove('is-activating'), 240);
				const filter = tab.getAttribute('data-filter');
				const cards = $$('.card', grid);
				cards.forEach((card) => {
					const cat = card.getAttribute('data-category');
					const show = filter === 'all' || filter === cat;
					card.style.display = show ? '' : 'none';
					if (show) { card.classList.remove('anim-in'); void card.offsetWidth; card.classList.add('anim-in'); }
				});
			});
		});
	}

	// Rely on native smooth scrolling; no JS interception for anchors

	// Hero primary/secondary buttons: ensure correct targets
	const heroOrder = document.querySelector('#hero .btn.btn--primary');
	const heroPopular = document.querySelector('#hero .btn.btn--ghost');
	if (heroOrder) heroOrder.setAttribute('href', '#menu');
	if (heroPopular) heroPopular.setAttribute('href', '#showcase');

	// Scroll spy for header nav
	const navLinks = $$('.site-nav a[href^="#"]');
	const sections = navLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
	if (sections.length) {
		const spy = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				const id = '#' + entry.target.id;
				const link = navLinks.find((l) => l.getAttribute('href') === id);
				if (link) {
					if (entry.isIntersecting) { navLinks.forEach((l)=>l.classList.remove('active')); link.classList.add('active'); }
				}
			});
		}, { rootMargin: '-40% 0px -50% 0px', threshold: 0.01 });
		sections.forEach((sec) => spy.observe(sec));
	}

	// Map: two branches using Leaflet (front-end only)
	(function initMap() {
		const mapContainer = document.getElementById('map');
		if (!mapContainer || typeof L === 'undefined') return;

		// Updated coordinates for Ramallah (Palestine) and Miami (USA)
		const branches = [
			{ name: 'Palestine - Ramallah - CCC Building', address: 'Palestine, Ramallah, CCC Building', phone: '+970 59 123 4567', coords: [31.9026, 35.1956] },
			{ name: 'Miami', address: 'Miami, FL, USA', phone: '+1 (305) 555-1234', coords: [25.7617, -80.1918] }
		];

		const map = L.map('map', { scrollWheelZoom: false }).setView(branches[0].coords, 12);
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);

		const markers = branches.map((b) => L.marker(b.coords).addTo(map).bindPopup(`<strong>${b.name}</strong><br/>${b.address}`));

		function focusBranch(index) {
			const b = branches[index];
			map.setView(b.coords, 13, { animate: true });
			markers[index].openPopup();
			const addressEl = document.querySelector('.branch-address');
			const phoneEl = document.querySelector('.branch-phone');
			if (addressEl) addressEl.textContent = b.address;
			if (phoneEl) {
				if (b.phone && b.phone.trim()) {
					phoneEl.style.display = '';
					phoneEl.href = `tel:${b.phone.replace(/[^+0-9]/g, '')}`;
					phoneEl.innerHTML = `<i class="fa-solid fa-phone"></i> ${b.phone}`;
				} else {
					phoneEl.style.display = 'none';
					phoneEl.removeAttribute('href');
					phoneEl.innerHTML = `<i class="fa-solid fa-phone"></i>`;
				}
			}
		}

		const branchButtons = $$('.branch-btn');
		branchButtons.forEach((btn) => {
			btn.addEventListener('click', () => {
				branchButtons.forEach((b) => { b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false'); });
				btn.classList.add('is-active');
				btn.setAttribute('aria-selected', 'true');
				const index = Number(btn.getAttribute('data-branch')) || 0;
				focusBranch(index);
			});
		});

		focusBranch(0);
	})();

	// Smooth scroll handler (native when available, fallback otherwise)
	(function initSmoothScroll() {
		const supportsCssSmooth = ('CSS' in window) && typeof CSS.supports === 'function' && CSS.supports('scroll-behavior', 'smooth');

		function easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
		function smoothScrollTo(targetY, duration) {
			const startY = window.scrollY || document.documentElement.scrollTop;
			const distance = targetY - startY;
			let startTime = null;
			function step(timestamp) {
				if (startTime === null) startTime = timestamp;
				const elapsed = timestamp - startTime;
				const progress = Math.min(elapsed / duration, 1);
				const eased = easeInOutQuad(progress);
				window.scrollTo(0, startY + distance * eased);
				if (elapsed < duration) requestAnimationFrame(step);
			}
			requestAnimationFrame(step);
		}

		document.addEventListener('click', (e) => {
			const link = e.target.closest('a[href^="#"]');
			if (!link) return;
			const id = link.getAttribute('href');
			if (!id || id === '#') return;
			const target = document.querySelector(id);
			if (!target) return;
			// prevent default only for on-page anchors
			const isSamePage = link.pathname === location.pathname && link.hostname === location.hostname;
			if (isSamePage) e.preventDefault();
			const performScroll = () => {
				// Prefer native API on modern browsers for reliability
				try {
					target.scrollIntoView({ behavior: 'smooth', block: 'start' });
				} catch (_) {
					const headerOffset = 72;
					const targetY = target.getBoundingClientRect().top + (window.scrollY || document.documentElement.scrollTop) - headerOffset;
					if (supportsCssSmooth) {
						window.scrollTo({ top: targetY, behavior: 'smooth' });
					} else {
						smoothScrollTo(targetY, 520);
					}
				}
				// add gentle slide-in effect on target
				target.classList.remove('anchor-slide-in');
				void target.offsetWidth; // reflow to restart animation
				target.classList.add('anchor-slide-in');
			};

			// If mobile nav is open, close it first, then scroll after transition
			if (isSamePage && siteNav && siteNav.classList.contains('open')) {
				const onDone = () => { performScroll(); };
				siteNav.addEventListener('transitionend', onDone, { once: true });
				// Fallback in case transitionend doesn't fire
				setTimeout(performScroll, 320);
				siteNav.classList.remove('open');
				navToggle && navToggle.setAttribute('aria-expanded', 'false');
				navBackdrop && navBackdrop.setAttribute('hidden', '');
				navBackdrop && navBackdrop.classList.remove('show');
			} else if (isSamePage) {
				performScroll();
			}
		}, { passive: false });
	})();
})();


