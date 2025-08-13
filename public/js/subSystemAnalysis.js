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
  symptomEntriesContainer.addEventListener('change', async e => {
    if (!e.target.classList.contains('sub-system-select')) return;

    const subSystem = e.target.value;
    dynamicSymptomsList.innerHTML = '';

    if (!subSystem) return;

    try {
      const res = await fetch(`/api/symptoms/${encodeURIComponent(subSystem)}`);
      if (!res.ok) throw new Error('Failed to fetch symptoms');

      const symptoms = await res.json();

      const frag = document.createDocumentFragment();
      symptoms.forEach(symptom => {
        const label = document.createElement('label');
        label.className = 'symptom-item';
        label.innerHTML = `<input type="checkbox" value="${symptom}"> ${symptom}`;
        frag.appendChild(label);
      });
      dynamicSymptomsList.appendChild(frag);
    } catch (err) {
      console.error('Failed to load symptoms:', err);
      dynamicSymptomsList.innerHTML = '<p>Failed to load symptoms</p>';
    }
  });
});
