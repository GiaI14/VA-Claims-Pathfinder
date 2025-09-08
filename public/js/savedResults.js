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

      // Content container
      const content = document.createElement('div');
      content.className = 'card-content';

      // Create a table for results_json
      const table = document.createElement('table');
      table.className = 'results-table';
      const tbody = document.createElement('tbody');

      // Iterate over keys in results_json
      for (const [key, value] of Object.entries(item.results_json)) {
        const tr = document.createElement('tr');

        const tdKey = document.createElement('td');
        tdKey.textContent = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        tdKey.style.fontWeight = 'bold';

        const tdValue = document.createElement('td');
        // Check if value is object or array, convert to readable string
        tdValue.textContent = (typeof value === 'object') ? JSON.stringify(value, null, 2) : value;

        tr.appendChild(tdKey);
        tr.appendChild(tdValue);
        tbody.appendChild(tr);
      }

      table.appendChild(tbody);
      content.appendChild(table);
      card.appendChild(content);
      container.appendChild(card);
    });

  } catch (err) {
    console.error('Error loading saved results:', err);
    const container = document.getElementById('saved-results');
    container.innerHTML = `<p style="color:red;">Error loading saved results.</p>`;
  }
}

document.addEventListener('DOMContentLoaded', loadSavedResults);




