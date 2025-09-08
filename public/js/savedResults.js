async function saveResults(results) {
  try {
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

    const response = await fetch('/save-results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({ results }),
      credentials: 'same-origin'  // 👈 important: sends session cookie
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const data = await response.json();
    console.log('Save result response:', data);

    if (data.success) {
      alert('Results saved successfully!');
      await loadSavedResults(); // reload the saved list
    } else {
      alert(`Save failed: ${data.message}`);
    }
  } catch (err) {
    console.error('Error saving results:', err);
    alert('Error saving results. See console for details.');
  }
}

async function loadSavedResults() {
  try {
    const response = await fetch('/get-saved-results', { credentials: 'same-origin' });
    const data = await response.json();

    // Adjust: handle array or object response
    const results = data.results || data; // fallback to old format

    const container = document.getElementById('saved-results');
    container.innerHTML = '';

    if (!results || results.length === 0) {
      container.innerHTML = '<p>No saved results found.</p>';
      return;
    }

    results.forEach(item => {
      const card = document.createElement('div');
      card.className = 'result-card';

      // Header
      const header = document.createElement('div');
      header.className = 'card-header';
      header.textContent = `Saved on: ${new Date(item.created_at).toLocaleString()}`;
      card.appendChild(header);

      // Content
      const content = document.createElement('div');
      content.className = 'card-content';

      const table = document.createElement('table');
      table.className = 'results-table';
      const tbody = document.createElement('tbody');

      Object.entries(item.results_json).forEach(([key, value]) => {
        const tr = document.createElement('tr');

        const tdKey = document.createElement('td');
        tdKey.textContent = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        tdKey.style.fontWeight = 'bold';

        const tdValue = document.createElement('td');
        tdValue.textContent = value;

        tr.appendChild(tdKey);
        tr.appendChild(tdValue);
        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
      content.appendChild(table);
      card.appendChild(content);

      container.appendChild(card);
    });

  } catch (err) {
    console.error('Error loading saved results:', err);
    const container = document.getElementById('saved-results');
    container.innerHTML = `<p style="color:red;">Error loading save



