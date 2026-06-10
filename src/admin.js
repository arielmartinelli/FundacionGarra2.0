import { supabase, getPets, savePet, deletePet, resetPets, getNews, saveNews, deleteNews, resetNews } from './db.js';

document.addEventListener('DOMContentLoaded', async () => {
  /* ==========================================
     AUTHENTICATION SECURITY CHECK
     ========================================== */
  let session = null;
  try {
    const { data } = await supabase.auth.getSession();
    session = data.session;
  } catch (err) {
    console.warn('Supabase Auth connection issue: ', err.message);
  }

  // Secure redirect if not logged in
  if (!session) {
    window.location.href = './login.html';
    return;
  }

  // Display session details and handle signout
  const adminUserEmail = document.getElementById('admin-user-email');
  const btnLogout = document.getElementById('btn-logout');
  
  if (adminUserEmail && btnLogout) {
    adminUserEmail.textContent = session.user.email;
    adminUserEmail.style.display = 'inline';
    btnLogout.style.display = 'inline';

    btnLogout.addEventListener('click', async () => {
      try {
        await supabase.auth.signOut();
        window.location.href = './login.html';
      } catch (err) {
        console.error('Error signing out: ', err.message);
        window.location.href = './login.html';
      }
    });
  }

  /* ==========================================
     THEME TOGGLE (DARK / LIGHT MODE)
     ========================================== */
  const themeToggleBtn = document.getElementById('theme-toggle');
  const storedTheme = localStorage.getItem('theme') || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  
  document.documentElement.setAttribute('data-theme', storedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }

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
     TAB SWITCHING LOGIC (MASCOTAS VS NOTICIAS)
     ========================================== */
  const tabPets = document.getElementById('tab-pets');
  const tabNews = document.getElementById('tab-news');
  const sectionPets = document.getElementById('admin-section-pets');
  const sectionNews = document.getElementById('admin-section-news');

  if (tabPets && tabNews && sectionPets && sectionNews) {
    tabPets.addEventListener('click', () => {
      tabPets.classList.add('active');
      tabNews.classList.remove('active');
      sectionPets.style.display = 'block';
      sectionNews.style.display = 'none';
      renderAdminTable();
    });

    tabNews.addEventListener('click', () => {
      tabNews.classList.add('active');
      tabPets.classList.remove('active');
      sectionNews.style.display = 'block';
      sectionPets.style.display = 'none';
      renderAdminNewsTable();
    });
  }

  /* ==========================================
     MASCOTAS CRUD OPERATIONS
     ========================================== */
  const adminPetsTbody = document.getElementById('admin-pets-tbody');
  const adminFormCard = document.getElementById('admin-form-card');
  const adminPetForm = document.getElementById('admin-pet-form');
  
  const formTitle = document.getElementById('form-title');
  const formSubtitle = document.getElementById('form-subtitle');
  
  const petIdInput = document.getElementById('pet-id');
  const petNameInput = document.getElementById('pet-name');
  const petAgeInput = document.getElementById('pet-age');
  const petCategoryInput = document.getElementById('pet-category');
  const petAdoptedInput = document.getElementById('pet-adopted');
  const petTraitsInput = document.getElementById('pet-traits');
  const petImageUrlInput = document.getElementById('pet-image-url');
  const petDescriptionInput = document.getElementById('pet-description');
  
  const btnShowAddForm = document.getElementById('btn-show-add-form');
  const btnCancelForm = document.getElementById('btn-cancel-form');
  const btnResetDb = document.getElementById('btn-reset-db');
  
  const presetOptions = document.querySelectorAll('.preset-option');

  // Render list of pets in admin table
  const renderAdminTable = async () => {
    if (!adminPetsTbody) return;
    
    adminPetsTbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
          Cargando base de datos de Supabase... 🐾
        </td>
      </tr>
    `;

    const pets = await getPets();
    
    if (pets.length === 0) {
      adminPetsTbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
            No hay mascotas cargadas en la base de datos. ¡Agregá una nueva! 🐾
          </td>
        </tr>
      `;
      return;
    }

    adminPetsTbody.innerHTML = pets.map(pet => {
      const categoryLabel = pet.category === 'puppy' ? 'Cachorro' : pet.category === 'adult' ? 'Adulto' : 'Viejito';
      const statusBadge = pet.adopted 
        ? `<span class="admin-badge-adopted">Adoptado</span>`
        : `<span class="admin-badge-available">En Adopción</span>`;

      return `
        <tr id="admin-row-${pet.id}">
          <td>
            <img src="${pet.image}" alt="${pet.name}" class="admin-thumbnail" onerror="this.src='./puppy_golden.png'" />
          </td>
          <td style="font-weight: 600;">${pet.name}</td>
          <td>${pet.age}</td>
          <td>${categoryLabel}</td>
          <td>${statusBadge}</td>
          <td class="admin-actions-cell">
            <button class="btn btn-secondary admin-btn-sm btn-toggle-status" data-id="${pet.id}">
              ${pet.adopted ? 'Marcar Disponible' : 'Marcar Adoptado'}
            </button>
            <button class="btn btn-outline admin-btn-sm btn-edit-pet" data-id="${pet.id}">
              Editar
            </button>
            <button class="btn btn-outline admin-btn-sm btn-delete-pet" data-id="${pet.id}" style="border-color: #ef4444; color: #ef4444;">
              Borrar
            </button>
          </td>
        </tr>
      `;
    }).join('');
  };

  // Preset Image Picker (Pets)
  presetOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      presetOptions.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      const imgPath = opt.getAttribute('data-img');
      petImageUrlInput.value = imgPath;
    });
  });

  // Show Add Form (Pets)
  if (btnShowAddForm) {
    btnShowAddForm.addEventListener('click', () => {
      adminPetForm.reset();
      petIdInput.value = '';
      formTitle.textContent = 'Agregar Nueva Mascota';
      formSubtitle.textContent = 'Completá los datos del nuevo rescatado.';
      
      presetOptions.forEach(opt => opt.classList.remove('selected'));
      presetOptions[0].classList.add('selected');
      petImageUrlInput.value = presetOptions[0].getAttribute('data-img');
      
      adminFormCard.style.display = 'block';
      adminFormCard.scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (btnCancelForm) {
    btnCancelForm.addEventListener('click', () => {
      adminFormCard.style.display = 'none';
      adminPetForm.reset();
    });
  }

  // Submit Form (Add/Edit Pet)
  if (adminPetForm) {
    adminPetForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const id = petIdInput.value;
      const name = petNameInput.value.trim();
      const age = petAgeInput.value.trim();
      const category = petCategoryInput.value;
      const adopted = petAdoptedInput.value === 'true';
      const description = petDescriptionInput.value.trim();
      const image = petImageUrlInput.value.trim();
      
      const traits = petTraitsInput.value
        .split(',')
        .map(t => t.trim())
        .filter(t => t !== '');

      const petData = {
        name,
        age,
        category,
        adopted,
        traits,
        image,
        description
      };

      if (id) {
        petData.id = id;
      }

      await savePet(petData);

      adminFormCard.style.display = 'none';
      adminPetForm.reset();
      await renderAdminTable();
      
      alert(id ? '¡Mascota editada con éxito! 🐾' : '¡Mascota agregada con éxito! 🐾');
    });
  }

  // Row actions (Pets Table)
  if (adminPetsTbody) {
    adminPetsTbody.addEventListener('click', async (e) => {
      const target = e.target;
      const petId = target.getAttribute('data-id');
      if (!petId) return;

      const pets = await getPets();
      const pet = pets.find(p => p.id === petId);
      if (!pet) return;

      // Toggle status
      if (target.classList.contains('btn-toggle-status')) {
        pet.adopted = !pet.adopted;
        await savePet(pet);
        await renderAdminTable();
      }

      // Edit
      if (target.classList.contains('btn-edit-pet')) {
        petIdInput.value = pet.id;
        petNameInput.value = pet.name;
        petAgeInput.value = pet.age;
        petCategoryInput.value = pet.category;
        petAdoptedInput.value = pet.adopted ? 'true' : 'false';
        petTraitsInput.value = pet.traits.join(', ');
        petImageUrlInput.value = pet.image;
        petDescriptionInput.value = pet.description;

        presetOptions.forEach(opt => {
          if (opt.getAttribute('data-img') === pet.image) {
            opt.classList.add('selected');
          } else {
            opt.classList.remove('selected');
          }
        });

        formTitle.textContent = `Editar Mascota: ${pet.name}`;
        formSubtitle.textContent = `Modificá los campos necesarios para actualizar los datos.`;

        adminFormCard.style.display = 'block';
        adminFormCard.scrollIntoView({ behavior: 'smooth' });
      }

      // Delete
      if (target.classList.contains('btn-delete-pet')) {
        if (confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${pet.name}?`)) {
          await deletePet(petId);
          await renderAdminTable();
        }
      }
    });
  }

  // Reset database (Pets)
  if (btnResetDb) {
    btnResetDb.addEventListener('click', async () => {
      if (confirm('¿Estás seguro de que deseas restaurar la base de datos a sus 9 perritos iniciales? Esto borrará tus cambios actuales en Supabase.')) {
        await resetPets();
        await renderAdminTable();
        alert('Base de datos de mascotas restaurada con éxito. 🐾');
      }
    });
  }

  /* ==========================================
     NOTICIAS CRUD OPERATIONS
     ========================================== */
  const adminNewsTbody = document.getElementById('admin-news-tbody');
  const adminNewsFormCard = document.getElementById('admin-news-form-card');
  const adminNewsForm = document.getElementById('admin-news-form');
  
  const newsFormTitle = document.getElementById('news-form-title');
  const newsFormSubtitle = document.getElementById('news-form-subtitle');
  
  const newsIdInput = document.getElementById('news-id');
  const newsTitleInput = document.getElementById('news-title');
  const newsDateInput = document.getElementById('news-date');
  const newsImageUrlInput = document.getElementById('news-image-url');
  const newsDescriptionInput = document.getElementById('news-description');
  
  const btnShowAddNewsForm = document.getElementById('btn-show-add-news-form');
  const btnCancelNewsForm = document.getElementById('btn-cancel-news-form');
  const btnResetNewsDb = document.getElementById('btn-reset-news-db');
  
  const presetOptionsNews = document.querySelectorAll('.preset-option-news');

  // Render news table
  const renderAdminNewsTable = async () => {
    if (!adminNewsTbody) return;
    
    adminNewsTbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px; color: var(--text-muted);">
          Cargando noticias de Supabase... 📰
        </td>
      </tr>
    `;

    const news = await getNews();
    
    if (news.length === 0) {
      adminNewsTbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 40px; color: var(--text-muted);">
            No hay noticias cargadas. ¡Agregá una nueva! 📰
          </td>
        </tr>
      `;
      return;
    }

    adminNewsTbody.innerHTML = news.map(item => {
      return `
        <tr id="admin-news-row-${item.id}">
          <td>
            <img src="${item.image}" alt="${item.title}" class="admin-thumbnail" onerror="this.src='./hero_dog.png'" />
          </td>
          <td style="font-weight: 600;">${item.title}</td>
          <td>${item.date}</td>
          <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.description}</td>
          <td class="admin-actions-cell">
            <button class="btn btn-outline admin-btn-sm btn-edit-news" data-id="${item.id}">
              Editar
            </button>
            <button class="btn btn-outline admin-btn-sm btn-delete-news" data-id="${item.id}" style="border-color: #ef4444; color: #ef4444;">
              Borrar
            </button>
          </td>
        </tr>
      `;
    }).join('');
  };

  // Preset Image Picker (News)
  presetOptionsNews.forEach(opt => {
    opt.addEventListener('click', () => {
      presetOptionsNews.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      const imgPath = opt.getAttribute('data-img');
      newsImageUrlInput.value = imgPath;
    });
  });

  // Show Add Form (News)
  if (btnShowAddNewsForm) {
    btnShowAddNewsForm.addEventListener('click', () => {
      adminNewsForm.reset();
      newsIdInput.value = '';
      newsFormTitle.textContent = 'Agregar Nueva Noticia';
      newsFormSubtitle.textContent = 'Completá los datos de la novedad.';
      
      // Auto-fill current date formatted like "10 Jun 2026"
      const options = { day: 'numeric', month: 'short', year: 'numeric' };
      const today = new Date().toLocaleDateString('es-ES', options);
      const formattedToday = today.replace('.', '').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      newsDateInput.value = formattedToday;

      presetOptionsNews.forEach(opt => opt.classList.remove('selected'));
      presetOptionsNews[0].classList.add('selected');
      newsImageUrlInput.value = presetOptionsNews[0].getAttribute('data-img');
      
      adminNewsFormCard.style.display = 'block';
      adminNewsFormCard.scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (btnCancelNewsForm) {
    btnCancelNewsForm.addEventListener('click', () => {
      adminNewsFormCard.style.display = 'none';
      adminNewsForm.reset();
    });
  }

  // Submit Form (Add/Edit News)
  if (adminNewsForm) {
    adminNewsForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const id = newsIdInput.value;
      const title = newsTitleInput.value.trim();
      const date = newsDateInput.value.trim();
      const description = newsDescriptionInput.value.trim();
      const image = newsImageUrlInput.value.trim();

      const newsData = {
        title,
        date,
        image,
        description
      };

      if (id) {
        newsData.id = id;
      }

      await saveNews(newsData);

      adminNewsFormCard.style.display = 'none';
      adminNewsForm.reset();
      await renderAdminNewsTable();
      
      alert(id ? '¡Noticia editada con éxito! 📰' : '¡Noticia agregada con éxito! 📰');
    });
  }

  // Row actions (News Table)
  if (adminNewsTbody) {
    adminNewsTbody.addEventListener('click', async (e) => {
      const target = e.target;
      const newsId = target.getAttribute('data-id');
      if (!newsId) return;

      const newsList = await getNews();
      const item = newsList.find(n => n.id === newsId);
      if (!item) return;

      // Edit
      if (target.classList.contains('btn-edit-news')) {
        newsIdInput.value = item.id;
        newsTitleInput.value = item.title;
        newsDateInput.value = item.date;
        newsImageUrlInput.value = item.image;
        newsDescriptionInput.value = item.description;

        presetOptionsNews.forEach(opt => {
          if (opt.getAttribute('data-img') === item.image) {
            opt.classList.add('selected');
          } else {
            opt.classList.remove('selected');
          }
        });

        newsFormTitle.textContent = `Editar Noticia: ${item.title}`;
        newsFormSubtitle.textContent = `Modificá los campos necesarios para actualizar la noticia.`;

        adminNewsFormCard.style.display = 'block';
        adminNewsFormCard.scrollIntoView({ behavior: 'smooth' });
      }

      // Delete
      if (target.classList.contains('btn-delete-news')) {
        if (confirm(`¿Estás seguro de que deseas eliminar la noticia: "${item.title}"?`)) {
          await deleteNews(newsId);
          await renderAdminNewsTable();
        }
      }
    });
  }

  // Reset database (News)
  if (btnResetNewsDb) {
    btnResetNewsDb.addEventListener('click', async () => {
      if (confirm('¿Estás seguro de que deseas restaurar la sección de noticias a las 6 iniciales? Esto borrará tus cambios actuales en Supabase.')) {
        await resetNews();
        await renderAdminNewsTable();
        alert('Noticias restauradas con éxito. 📰');
      }
    });
  }

  // Initial load
  await renderAdminTable();
});
