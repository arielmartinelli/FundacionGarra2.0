import { supabase, getPets, savePet, deletePet, resetPets } from './db.js';

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
     ADMIN TABLE & CRUD OPERATIONS (ASYNC/AWAIT)
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

  // Render list of pets in admin table (Async)
  const renderAdminTable = async () => {
    if (!adminPetsTbody) return;
    
    // Clear and show loading state
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

  // Initial table load
  await renderAdminTable();

  // Collapsible Form Toggle
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

  btnCancelForm.addEventListener('click', () => {
    adminFormCard.style.display = 'none';
    adminPetForm.reset();
  });

  // Preset Image Picker
  presetOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      presetOptions.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      const imgPath = opt.getAttribute('data-img');
      petImageUrlInput.value = imgPath;
    });
  });

  // Handle Form Submission (Add / Edit)
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

    // Save to Supabase (Async)
    await savePet(petData);

    adminFormCard.style.display = 'none';
    adminPetForm.reset();
    await renderAdminTable();
    
    alert(id ? '¡Mascota editada con éxito! 🐾' : '¡Mascota agregada con éxito! 🐾');
  });

  // Handle Action Buttons Click (Edit, Delete, Toggle Status)
  if (adminPetsTbody) {
    adminPetsTbody.addEventListener('click', async (e) => {
      const target = e.target;
      const petId = target.getAttribute('data-id');
      if (!petId) return;

      const pets = await getPets();
      const pet = pets.find(p => p.id === petId);
      if (!pet) return;

      // Toggle status action
      if (target.classList.contains('btn-toggle-status')) {
        pet.adopted = !pet.adopted;
        await savePet(pet);
        await renderAdminTable();
      }

      // Edit action
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

      // Delete action
      if (target.classList.contains('btn-delete-pet')) {
        if (confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${pet.name}?`)) {
          await deletePet(petId);
          await renderAdminTable();
        }
      }
    });
  }

  // Reset database button
  if (btnResetDb) {
    btnResetDb.addEventListener('click', async () => {
      if (confirm('¿Estás seguro de que deseas restaurar la base de datos a sus 9 perritos iniciales? Esto borrará tus cambios actuales en Supabase.')) {
        await resetPets();
        await renderAdminTable();
        alert('Base de datos restaurada con éxito. 🐾');
      }
    });
  }
});
