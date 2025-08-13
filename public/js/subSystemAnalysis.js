document.addEventListener('DOMContentLoaded', () => {
  const symptomEntriesContainer = document.getElementById('symptomEntriesContainer');
  const addEntryButton = document.getElementById('addEntryButton');
  const dynamicSymptomsList = document.getElementById('dynamicSymptomsList');

  // Assuming systems are loaded on page from backend and put into first system select

  // When system changes, fetch sub-systems for that system and populate dropdown
  symptomEntriesContainer.addEventListener('change', async e => {
    if (!e.target.classList.contains('system-select')) return;

    const entry = e.target.closest('.symptom-entry');
    if (!entry) return;

    const system = e.target.value;
    const subSystemSelect = entry.querySelector('.sub-system-select');
    dynamicSymptomsList.innerHTML = '';

    // Reset sub-system options
    subSystemSelect.innerHTML = `<option value="">Select a sub-system</option>`;

    if (!system) return;

    try {
      const res = await fetch(`/api/sub-systems/${encodeURIComponent(system)}`);
      if (!res.ok) throw new Error('Failed to fetch sub-systems');

      const subSystems = await res.json();

      subSystems.forEach(sub => {
        const option = document.createElement('option');
        option.value = sub;
        option.textContent = sub;
        subSystemSelect.appendChild(option);
      });
    } catch (err) {
      console.error('Error loading sub-systems:', err);
      alert('Error loading sub-systems');
    }
  });

  // When sub-system changes, fetch symptoms for that sub-system (before any analyze)
  const systemImages = {
    'Dental and Oral Conditions': '512px-202402_Oral_Cavity.svg.png',
    'Hemic and Lymphatic Systems': '512px-2201_Anatomy_of_the_Lymphatic_System.jpg',
    'Cardiovascular system': '512px-Circulatory_System_en_edited.svg.png',
    'Skin': '512px-Dermatology_-_Integumentary_system_1_--_Smart-Servier.png',
    'Digestive System': '512px-Digestive_system_diagram_en.svg.png',
    'Endocrine system': '512px-Endocrine_English.svg.png',
    'Gynecological conditions and disprders of the breast': '512px-Female_genital_system_-_Sagittal_view.svg.png',
    'Eye': '512px-Lateral_orbit_nerves_chngd.jpg',
    'Genitourinary system': '512px-Male_and_female_genital_organs.svg.png',
    'Musculoskeletal system': '512px-Skeleton_and_muscles.png',
    'Respiratory system': '512px-Respiratory_system_complete_fr_simplified.svg.png',
    'Nervous System': '512px-TE-Nervous_system_diagram.svg.png',
    'Ear': 'Auditory_System.jpg',
    'Sense Organs': 'Sense-Organ.png',
  };

  symptomEntriesContainer.addEventListener('change', async e => {
    if (!e.target.classList.contains('system-select')) return;

    const entry = e.target.closest('.symptom-entry');
    if (!entry) return;

    const system = e.target.value;
    const subSystemSelect = entry.querySelector('.sub-system-select');
    const systemImage = entry.querySelector('.system-image');

    dynamicSymptomsList.innerHTML = '';
    subSystemSelect.innerHTML = `<option value="">Select a sub-system</option>`;

    // Show system image
    if (system && systemImages[system]) {
      systemImage.src = `/images/${systemImages[system]}`;
      systemImage.style.display = 'inline-block';
    } else {
      systemImage.style.display = 'none';
      systemImage.src = '';
    }

    if (!system) return;

    try {
      const res = await fetch(`/api/sub-systems/${encodeURIComponent(system)}`);
      if (!res.ok) throw new Error('Failed to fetch sub-systems');

      const subSystems = await res.json();

      subSystems.forEach(sub => {
        const option = document.createElement('option');
        option.value = sub;
        option.textContent = sub;
        subSystemSelect.appendChild(option);
      });
    } catch (err) {
      console.error('Error loading sub-systems:', err);
      alert('Error loading sub-systems');
    }
  });
});
