import './style.css';
import { getPets, getNews } from './db.js';

document.addEventListener('DOMContentLoaded', () => {
  /* ==========================================
     THEME TOGGLE (DARK / LIGHT MODE)
     ========================================== */
  const themeToggleBtn = document.getElementById('theme-toggle');
  const storedTheme = localStorage.getItem('theme') || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  
  // Apply initial theme
  document.documentElement.setAttribute('data-theme', storedTheme);

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });

  /* ==========================================
     MOBILE NAVIGATION MENU
     ========================================== */
  const mobileToggle = document.getElementById('mobile-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const isOpen = navMenu.classList.contains('active');
      mobileToggle.innerHTML = isOpen 
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        mobileToggle.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
      });
    });
  }

  /* ==========================================
     HEADER SCROLL SHADOW & NAV ACTIVE HIGHLIGHT
     ========================================== */
  const header = document.getElementById('header');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    if (header) {
      if (window.scrollY > 50) {
        header.classList.add('header-scrolled');
      } else {
        header.classList.remove('header-scrolled');
      }
    }

    let scrollY = window.scrollY;
    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 100;
      const sectionId = current.getAttribute('id');
      const activeLink = document.querySelector(`.nav-menu a[href*=${sectionId}]`);

      if (activeLink) {
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          navLinks.forEach(link => link.classList.remove('active'));
          activeLink.classList.add('active');
        }
      }
    });
  });

  /* ==========================================
     DYNAMIC DYNAMIC PET RENDERING FROM DATABASE
     ========================================== */
  const petsGrid = document.getElementById('pets-grid');
  
  // Determine if we are on the homepage (featured mode) or adoption catalog page (full mode)
  // The home page has the "Ver todos los perritos" button
  const isHomepage = !!document.getElementById('btn-see-all-pets');

  const renderAdoptionGrid = async (categoryFilter = 'all') => {
    if (!petsGrid) return;
    
    // Fetch latest pets
    const allPets = await getPets();
    
    // Filter pets
    let filteredPets = allPets;
    
    // If we are on homepage, show all pets (including adopted) and limit to 3
    if (isHomepage) {
      // Filter by category if selected
      if (categoryFilter !== 'all') {
        filteredPets = filteredPets.filter(p => p.category === categoryFilter);
      }
      // Limit to 3 items
      filteredPets = filteredPets.slice(0, 3);
    } else {
      // Catalog page shows all pets, filterable
      if (categoryFilter !== 'all') {
        filteredPets = filteredPets.filter(p => p.category === categoryFilter);
      }
    }

    if (filteredPets.length === 0) {
      petsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
          <p style="font-size: 1.2rem; font-weight: 500;">No hay mascotas disponibles en esta categoría por el momento. 🐾</p>
        </div>
      `;
      return;
    }

    petsGrid.innerHTML = filteredPets.map(pet => {
      const traitsHtml = pet.traits.map(t => `<span class="trait-tag">${t}</span>`).join('');
      
      let statusBadgeHtml = '';
      if (pet.adopted) {
        statusBadgeHtml = `<span class="badge badge-secondary pet-status-badge" style="background-color: rgba(42, 157, 143, 0.2); color: var(--secondary);">Adoptado</span>`;
      } else {
        const catLabel = pet.category === 'puppy' ? 'Cachorro' : pet.category === 'adult' ? 'Adulto' : 'Viejito';
        const badgeClass = pet.category === 'puppy' ? 'badge-primary' : 'badge-secondary';
        statusBadgeHtml = `<span class="badge ${badgeClass} pet-status-badge" ${pet.category === 'senior' ? 'style="background-color: rgba(244,162,97,0.1); color: var(--accent);"' : ''}>${catLabel}</span>`;
      }

      return `
        <div class="pet-card ${pet.adopted ? 'adopted' : ''}" data-category="${pet.category}" id="pet-${pet.id}" style="opacity: 0; transform: scale(0.95); transition: var(--transition);">
          <div class="pet-image-container">
            ${statusBadgeHtml}
            <img src="${pet.image}" alt="${pet.name}, mascota en adopción" />
          </div>
          <div class="pet-content">
            <div class="pet-title">
              <h3>${pet.name}</h3>
              <span class="pet-age">${pet.age}</span>
            </div>
            <div class="pet-traits">
              ${traitsHtml}
            </div>
            <p class="pet-description">${pet.description}</p>
            <div class="pet-action">
              ${pet.adopted 
                ? `<button class="btn btn-outline" style="opacity: 0.65; cursor: not-allowed; border-color: var(--secondary); color: var(--secondary);" disabled>¡Adoptado! 🎉</button>`
                : `<button class="btn btn-primary btn-adopt-trigger" data-pet="${pet.name}" id="btn-adopt-${pet.id}">Adoptar</button>`
              }
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Trigger visual fade-in transition
    setTimeout(() => {
      const cards = petsGrid.querySelectorAll('.pet-card');
      cards.forEach((card, idx) => {
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'scale(1)';
        }, idx * 50);
      });
    }, 50);
  };

  // Initialize pets grid rendering
  renderAdoptionGrid();

  /* ==========================================
     PET CATALOG FILTERING CONTROLLERS
     ========================================== */
  const filterBtns = document.querySelectorAll('.filter-btn');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // If it is an anchor link (e.g. homepage 'Ver todo'), let it navigate
      if (btn.tagName === 'A') return;
      
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');
      renderAdoptionGrid(filterValue);
    });
  });

  /* ==========================================
     INTERACTIVE DONATION SIMULATOR & MP COPY
     ========================================== */
  const donationSlider = document.getElementById('donation-slider');
  const donationAmountText = document.getElementById('donation-amount-text');
  const presetBtns = document.querySelectorAll('.preset-btn');
  
  const impactFood = document.getElementById('impact-food');
  const impactHealth = document.getElementById('impact-health');
  const btnCopyAlias = document.getElementById('btn-copy-alias');
  const copyToast = document.getElementById('copy-toast');
  const btnDonateMock = document.getElementById('btn-donate-mock');

  if (donationSlider) {
    const updateDonationImpact = (value) => {
      const formattedVal = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0
      }).format(value);
      
      donationAmountText.textContent = `${formattedVal} ARS`;

      const foodDays = Math.floor(value / 500);
      const healthTreatments = Math.floor(value / 5000);

      impactFood.textContent = foodDays;
      impactHealth.textContent = healthTreatments;
    };

    donationSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      updateDonationImpact(val);
      
      presetBtns.forEach(btn => {
        const btnVal = parseInt(btn.getAttribute('data-value'), 10);
        if (btnVal === val) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    });

    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const val = parseInt(btn.getAttribute('data-value'), 10);
        donationSlider.value = val;
        updateDonationImpact(val);
      });
    });

    if (btnCopyAlias) {
      btnCopyAlias.addEventListener('click', () => {
        const aliasText = document.getElementById('alias-mp').textContent;
        navigator.clipboard.writeText(aliasText).then(() => {
          copyToast.style.display = 'block';
          setTimeout(() => {
            copyToast.style.display = 'none';
          }, 3000);
        }).catch(err => {
          console.error('Error al copiar el alias: ', err);
        });
      });
    }

    if (btnDonateMock) {
      btnDonateMock.addEventListener('click', () => {
        const donationVal = donationSlider.value;
        const formattedVal = new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS',
          minimumFractionDigits: 0
        }).format(donationVal);

        alert(`¡Muchas gracias por tu intención de colaborar por ${formattedVal}!\n\nEste es un sitio web de demostración. Para donar realmente a la Fundación Garra de Córdoba, podés hacerlo transfiriendo al ALIAS oficial de Mercado Pago:\n\n👉 ADOPTA.CASTRA.CUIDA`);
      });
    }
  }

  /* ==========================================
     ADOPTION FORM MODAL MANAGEMENT
     ========================================== */
  const adoptionModal = document.getElementById('adoption-modal');
  const modalPetName = document.getElementById('modal-pet-name');
  const formPetName = document.getElementById('form-pet-name');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const adoptionForm = document.getElementById('adoption-form');

  document.addEventListener('click', (e) => {
    if (e.target && e.target.classList.contains('btn-adopt-trigger')) {
      const petName = e.target.getAttribute('data-pet');
      modalPetName.textContent = petName;
      formPetName.value = petName;
      adoptionModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  });

  const closeModal = () => {
    if (adoptionModal) {
      adoptionModal.classList.remove('active');
      document.body.style.overflow = '';
      adoptionForm.reset();
    }
  };

  if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);

  if (adoptionModal) {
    adoptionModal.addEventListener('click', (e) => {
      if (e.target === adoptionModal) {
        closeModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && adoptionModal && adoptionModal.classList.contains('active')) {
      closeModal();
    }
  });

  if (adoptionForm) {
    adoptionForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const petName = formPetName.value;
      const userName = document.getElementById('adopt-name').value;
      const userPhone = document.getElementById('adopt-phone').value;

      const modalBody = document.querySelector('.modal-body');
      const originalContent = modalBody.innerHTML;

      modalBody.innerHTML = `
        <div class="success-alert">
          <svg viewBox="0 0 24 24" style="width: 24px; height: 24px; fill: currentColor;" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span><strong>¡Solicitud Enviada con Éxito!</strong></span>
        </div>
        <p style="font-size: 1.05rem; margin-bottom: 24px; line-height: 1.6;">
          Hola <strong>${userName}</strong>, hemos recibido tu postulación de adopción para <strong>${petName}</strong>. 
          Nuestro equipo revisará las condiciones de tu hogar y nos pondremos en contacto con vos al teléfono <strong>${userPhone}</strong> en menos de 24 horas para coordinar la entrevista.
        </p>
        <p style="font-weight: 500; color: var(--primary);">¡Gracias por abrir tu corazón a un rescatado! 🐾</p>
        <button class="btn btn-primary" id="btn-success-close" style="width: 100%; margin-top: 24px;">Entendido</button>
      `;

      document.getElementById('btn-success-close').addEventListener('click', () => {
        closeModal();
        setTimeout(() => {
          modalBody.innerHTML = originalContent;
        }, 500);
      });
    });
  }

  /* ==========================================
     VOLUNTEER FORM HANDLING
     ========================================== */
  const volunteerForm = document.getElementById('volunteer-form');
  const volunteerFormContainer = document.getElementById('volunteer-form-container');

  if (volunteerForm) {
    volunteerForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('vol-name').value;
      const phone = document.getElementById('vol-phone').value;
      const roleSelect = document.getElementById('vol-role');
      const roleText = roleSelect.options[roleSelect.selectedIndex].text;

      volunteerFormContainer.innerHTML = `
        <div style="text-align: center; padding: 40px 0;">
          <div class="success-alert" style="justify-content: center; margin-bottom: 24px;">
            <svg viewBox="0 0 24 24" style="width: 28px; height: 28px; fill: currentColor;" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span style="font-size: 1.15rem;"><strong>¡Registro Exitoso!</strong></span>
          </div>
          <h3 style="font-size: 1.5rem; margin-bottom: 16px;">¡Gracias por sumarte, ${name}!</h3>
          <p style="color: var(--text-muted); margin-bottom: 24px; line-height: 1.6;">
            Tu solicitud para participar como <strong>"${roleText}"</strong> ha sido registrada. 
            Te contactaremos por WhatsApp al número <strong>${phone}</strong> para invitarte a la próxima reunión informativa o coordinar tu visita al predio en Córdoba.
          </p>
          <p style="font-size: 1.2rem; color: var(--primary); font-family: var(--font-headings);">¡Nos vemos pronto en el refugio! 🐾</p>
        </div>
      `;
    });
  }

  /* ==========================================
     DYNAMIC NEWS RENDERING & HORIZONTAL SCROLL TRACK
     ========================================== */
  const newsGrid = document.getElementById('news-grid');
  const newsPrevBtn = document.getElementById('news-prev');
  const newsNextBtn = document.getElementById('news-next');
  
  if (newsGrid) {
    let allNews = [];

    const renderNews = () => {
      newsGrid.innerHTML = allNews.map(item => `
        <article class="news-card" id="news-${item.id}" style="opacity: 0; transform: translateY(10px); transition: var(--transition);">
          <div class="news-img">
            <span class="news-date">${item.date}</span>
            <img src="${item.image}" alt="${item.title}" onerror="this.src='./hero_dog.png'" />
          </div>
          <div class="news-content">
            <h3>${item.title}</h3>
            <p>${item.description}</p>
          </div>
        </article>
      `).join('');

      // Trigger fade-in transition
      setTimeout(() => {
        const cards = newsGrid.querySelectorAll('.news-card');
        cards.forEach((card, idx) => {
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, idx * 50);
        });
      }, 50);
    };

    // Load news and initialize
    const initNews = async () => {
      allNews = await getNews();
      renderNews();
    };

    initNews();

    // Event listeners for prev/next buttons (scrolling horizontally)
    if (newsPrevBtn) {
      newsPrevBtn.addEventListener('click', () => {
        const card = newsGrid.querySelector('.news-card');
        const scrollAmount = card ? card.offsetWidth + 24 : 380; // card width + gap
        newsGrid.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      });
    }

    if (newsNextBtn) {
      newsNextBtn.addEventListener('click', () => {
        const card = newsGrid.querySelector('.news-card');
        const scrollAmount = card ? card.offsetWidth + 24 : 380; // card width + gap
        newsGrid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      });
    }
  }

  /* ==========================================
     SCROLL PROGRESS PAW INDICATORS
     ========================================== */
  const pawIndicators = document.querySelectorAll('.paw-indicator');

  if (pawIndicators.length > 0) {
    const updatePawScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      const scrollPercent = (window.scrollY / scrollHeight) * 100;
      
      pawIndicators.forEach((paw, idx) => {
        const threshold = (idx + 1) * 20 - 5; // 15%, 35%, 55%, 75%, 95%
        if (scrollPercent >= threshold) {
          paw.classList.add('active');
        } else {
          paw.classList.remove('active');
        }
      });
    };

    window.addEventListener('scroll', updatePawScroll);
    updatePawScroll(); // Initial run to light up the first ones if page loaded scrolled
  }

  /* ==========================================
     INTERSECTION OBSERVER FOR SCROLL ANIMATIONS
     ========================================== */
  const scrollElements = document.querySelectorAll('.animate-on-scroll');

  if (scrollElements.length > 0) {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.05,
        rootMargin: '0px 0px -30px 0px'
      });

      scrollElements.forEach(el => observer.observe(el));
    }
  }
});
