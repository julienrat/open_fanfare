(() => {
  const toggleAdminDanger = (visible) => {
    document.querySelectorAll('.admin-danger').forEach((el) => {
      el.classList.toggle('is-hidden', !visible);
    });
  };

  let ctrlDown = false;
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Control' && !ctrlDown) {
      ctrlDown = true;
      toggleAdminDanger(true);
    }
  });
  document.addEventListener('keyup', (event) => {
    if (event.key === 'Control') {
      ctrlDown = false;
      toggleAdminDanger(false);
    }
  });

  const menuToggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  if (menuToggle && menu) {
    menuToggle.addEventListener('click', () => {
      menu.classList.toggle('open');
    });
  }

  const openButtons = document.querySelectorAll('[data-open-modal]');
  const closeButtons = document.querySelectorAll('[data-close-modal]');

  const collapseExpandGroups = (root) => {
    const groups = {};
    root.querySelectorAll('[data-expand-group]').forEach((row) => {
      const group = row.getAttribute('data-expand-group');
      if (!group) return;
      if (!groups[group]) groups[group] = [];
      groups[group].push(row);
    });
    Object.values(groups).forEach((rows) => {
      rows.forEach((row, index) => {
        row.classList.toggle('is-hidden', index >= 3);
      });
    });
    root.querySelectorAll('[data-expand-button]').forEach((button) => {
      const openLabel = button.getAttribute('data-expand-open');
      if (openLabel) {
        button.textContent = openLabel;
      }
    });
  };

  const openModal = (id) => {
    const modal = document.querySelector(`[data-modal="${id}"]`);
    if (modal) {
      if (id.startsWith('event-detail-')) {
        collapseExpandGroups(modal);
      }
      modal.classList.remove('is-hidden');
      const event = new CustomEvent('modal:open', { detail: { modal } });
      document.dispatchEvent(event);
    }
  };

  const closeModal = (id) => {
    const modal = document.querySelector(`[data-modal="${id}"]`);
    if (modal) {
      modal.classList.add('is-hidden');
    }
  };

  const hydrateMusicianSelect = (select) => {
    try {
      const saved = window.localStorage.getItem('lastMusicianId');
      if (!saved) return;
      select.value = saved;
      const option = select.options[select.selectedIndex];
      const firstName = option ? option.getAttribute('data-first-name') || '' : '';
      const lastName = option ? option.getAttribute('data-last-name') || '' : '';
      const form = select.closest('form');
      if (form) {
        const musicianInput = form.querySelector('input[name="musician_id"]');
        const firstNameInput = form.querySelector('input[name="first_name"]');
        const lastNameInput = form.querySelector('input[name="last_name"]');
        if (musicianInput) musicianInput.value = saved;
        if (firstNameInput) firstNameInput.value = firstName;
        if (lastNameInput) lastNameInput.value = lastName;
      }
    } catch (e) {
      // ignore storage errors
    }
  };

  const handleOpenClick = (button, event) => {
    event.preventDefault();
    event.stopPropagation();
    const id = button.getAttribute('data-open-modal');
    if (!id) return;

    if (id === 'presence') {
      const modal = document.querySelector('[data-modal="presence"]');
      if (modal) {
        const form = modal.querySelector('[data-presence-form]');
        const title = modal.querySelector('[data-modal-title]');
        const eventId = button.getAttribute('data-event-id') || '';
        const eventTitle = button.getAttribute('data-event-title') || '';
        const musicianId = button.getAttribute('data-musician-id') || '';
        const firstName = button.getAttribute('data-first-name') || '';
        const lastName = button.getAttribute('data-last-name') || '';
        const statusId = button.getAttribute('data-status-id') || '';
        const comment = button.getAttribute('data-comment') || '';

        if (title) {
          title.textContent = eventTitle ? `Répondre: ${eventTitle}` : "Répondre à l'événement";
        }
        if (form) {
          const eventInput = form.querySelector('input[name="event_id"]');
          const musicianInput = form.querySelector('input[name="musician_id"]');
          const firstNameInput = form.querySelector('input[name="first_name"]');
          const lastNameInput = form.querySelector('input[name="last_name"]');
          const commentInput = form.querySelector('textarea[name="comment"]');
          const select = form.querySelector('[data-musician-select]');
          if (eventInput) eventInput.value = eventId;
          if (musicianInput) musicianInput.value = musicianId;
          if (firstNameInput) firstNameInput.value = firstName;
          if (lastNameInput) lastNameInput.value = lastName;
          if (commentInput) commentInput.value = comment;
          if (select) {
            if (musicianId) {
              select.value = musicianId;
            } else {
              hydrateMusicianSelect(select);
            }
          }
          form.querySelectorAll('input[name="status_id"]').forEach((radio) => {
            radio.checked = statusId !== '' && radio.value === statusId;
          });
        }
      }
    }

    if (['section', 'instrument', 'musician', 'event'].includes(id)) {
      const modal = document.querySelector(`[data-modal="${id}"]`);
      if (modal) {
        const form = modal.querySelector(`[data-admin-form="${id}"]`);
        const title = modal.querySelector('[data-modal-title]');
        const deleteButton = modal.querySelector('[data-delete-button]');
        if (form) {
          const setValue = (name, value) => {
            const field = form.querySelector(`[name="${name}"]`);
            if (field) {
              field.value = value || '';
            }
          };

          if (id === 'section') {
            const sectionId = button.getAttribute('data-section-id') || '';
            setValue('id', sectionId);
            setValue('name', button.getAttribute('data-section-name') || '');
            setValue('color', button.getAttribute('data-section-color') || '');
            if (title) title.textContent = sectionId ? 'Modifier le pupitre' : 'Nouveau pupitre';
            if (deleteButton) deleteButton.classList.toggle('is-hidden', sectionId === '');
          }

          if (id === 'instrument') {
            const instrumentId = button.getAttribute('data-instrument-id') || '';
            setValue('id', instrumentId);
            setValue('name', button.getAttribute('data-instrument-name') || '');
            setValue('color', button.getAttribute('data-instrument-color') || '');
            setValue('section_id', button.getAttribute('data-instrument-section-id') || '');
            if (title) title.textContent = instrumentId ? "Modifier l'instrument" : 'Nouvel instrument';
            if (deleteButton) deleteButton.classList.toggle('is-hidden', instrumentId === '');
          }

          if (id === 'musician') {
            const musicianId = button.getAttribute('data-musician-id') || '';
            setValue('id', musicianId);
            setValue('first_name', button.getAttribute('data-musician-first-name') || '');
            setValue('last_name', button.getAttribute('data-musician-last-name') || '');
            setValue('instrument_id', button.getAttribute('data-musician-instrument-id') || '');
            setValue('color', button.getAttribute('data-musician-color') || '');
            setValue('email', button.getAttribute('data-musician-email') || '');
            setValue('phone', button.getAttribute('data-musician-phone') || '');
            if (title) title.textContent = musicianId ? 'Modifier le musicien' : 'Nouveau musicien';
            if (deleteButton) deleteButton.classList.toggle('is-hidden', musicianId === '');
          }

          if (id === 'event') {
            const eventId = button.getAttribute('data-event-id') || '';
            setValue('id', eventId);
            setValue('title', button.getAttribute('data-event-title') || '');
            setValue('description', button.getAttribute('data-event-description') || '');
            setValue('date', button.getAttribute('data-event-date') || '');
            setValue('location', button.getAttribute('data-event-location') || '');
            setValue('price', button.getAttribute('data-event-price') || '');
            setValue('organizer', button.getAttribute('data-event-organizer') || '');
            setValue('setlist', button.getAttribute('data-event-setlist') || '');
            if (title) title.textContent = eventId ? 'Modifier le concert' : 'Nouveau concert';
            if (deleteButton) deleteButton.classList.toggle('is-hidden', eventId === '');
          }
        }
      }
    }

    openModal(id);
  };

  openButtons.forEach((button) => {
    button.addEventListener('click', (event) => handleOpenClick(button, event));
  });

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-open-modal]');
    if (!target) return;
    if (event.target.closest('[data-stop-propagation]')) {
      event.stopPropagation();
    }
    handleOpenClick(target, event);
  });

  closeButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const id = button.getAttribute('data-close-modal');
      if (id) {
        closeModal(id);
      }
    });
  });

  document.querySelectorAll('[data-modal]').forEach((backdrop) => {
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) {
        const id = backdrop.getAttribute('data-modal');
        if (id) {
          closeModal(id);
        }
      }
    });
  });

  document.querySelectorAll('[data-musician-select]').forEach((select) => {
    hydrateMusicianSelect(select);
    select.addEventListener('change', () => {
      const form = select.closest('form');
      if (!form) return;
      const selected = select.options[select.selectedIndex];
      const musicianId = selected ? selected.value : '';
      const firstName = selected ? selected.getAttribute('data-first-name') || '' : '';
      const lastName = selected ? selected.getAttribute('data-last-name') || '' : '';

      const musicianInput = form.querySelector('input[name="musician_id"]');
      const firstNameInput = form.querySelector('input[name="first_name"]');
      const lastNameInput = form.querySelector('input[name="last_name"]');

      if (musicianInput) musicianInput.value = musicianId;
      if (firstNameInput) firstNameInput.value = firstName;
      if (lastNameInput) lastNameInput.value = lastName;
      if (musicianId) {
        try {
          window.localStorage.setItem('lastMusicianId', musicianId);
          if (firstName && lastName) {
            window.localStorage.setItem('lastMusicianName', `${firstName} ${lastName}`);
          }
        } catch (e) {
          // ignore storage errors
        }
      }
    });
  });

  const updatePresencesTitle = () => {
    const title = document.querySelector('[data-presences-title]');
    if (!title) return;
    try {
      const name = window.localStorage.getItem('lastMusicianName');
      if (name) {
        title.textContent = `Présences aux concerts : ${name}`;
      }
    } catch (e) {
      // ignore storage errors
    }
  };

  const updateRespondButtons = () => {
    try {
      const name = window.localStorage.getItem('lastMusicianName');
      const id = window.localStorage.getItem('lastMusicianId');
      if (!name || !id) return;
    } catch (e) {
      return;
    }

    document.querySelectorAll('[data-open-modal=\"presence\"]').forEach((button) => {
      const responded = (button.getAttribute('data-responded-ids') || '')
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value !== '');
      const savedId = window.localStorage.getItem('lastMusicianId');
      const defaultLabel = button.getAttribute('data-default-label') || 'Répondre';
      if (savedId && responded.includes(savedId)) {
        button.textContent = 'Déjà répondu';
        button.classList.add('already-responded');
      } else {
        button.textContent = defaultLabel;
        button.classList.remove('already-responded');
      }
    });
  };

  updatePresencesTitle();
  updateRespondButtons();

  document.querySelectorAll('[data-expand-button]').forEach((button) => {
    button.addEventListener('click', () => {
      const group = button.getAttribute('data-expand-button');
      if (!group) return;
      const rows = document.querySelectorAll(`[data-expand-group=\"${group}\"]`);
      if (rows.length === 0) return;
      let hasHidden = false;
      rows.forEach((row) => {
        if (row.classList.contains('is-hidden')) {
          hasHidden = true;
        }
      });
      const shouldExpand = hasHidden;
      rows.forEach((row, index) => {
        if (index >= 3) {
          row.classList.toggle('is-hidden', !shouldExpand);
        }
      });
      const openLabel = button.getAttribute('data-expand-open');
      const closeLabel = button.getAttribute('data-expand-close');
      if (openLabel && closeLabel) {
        button.textContent = shouldExpand ? closeLabel : openLabel;
      }
    });
  });

  document.querySelectorAll('[data-delete-button]').forEach((button) => {
    button.addEventListener('click', (event) => {
      if (!window.confirm('Supprimer cet élément ?')) {
        event.preventDefault();
      }
    });
  });

  document.querySelectorAll('[data-confirm]').forEach((button) => {
    button.addEventListener('click', (event) => {
      const message = button.getAttribute('data-confirm') || 'Confirmer ?';
      if (!window.confirm(message)) {
        event.preventDefault();
      }
    });
  });
})();
