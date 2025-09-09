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
      credentials: 'same-origin'  
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

    const container = document.getElementById('saved-results');
    container.innerHTML = '';

    if (!data || data.length === 0) {
      container.innerHTML = '<p>No saved results found.</p>';
      return;
    }

    data.forEach(item => {

      // TEMP: log first condition keys to check field names
      if (item.results_json && item.results_json[0].possibleConditions && item.results_json[0].possibleConditions.length > 0) {
        console.log("All keys in first condition:", item.results_json[0].possibleConditions[0]);
      }

      const card = document.createElement('div');
      card.className = 'result-card';

      // Card header with saved date
      const header = document.createElement('div');
      header.className = 'card-header';
      header.textContent = `Saved on: ${new Date(item.created_at).toLocaleString()}`;
      card.appendChild(header);

      const content = document.createElement('div');
      content.className = 'card-content';

      // Loop through results_json array
      item.results_json.forEach(entry => {

        // Show system
        const systemDiv = document.createElement('div');
        systemDiv.style.fontWeight = 'bold';
        systemDiv.style.marginTop = '10px';
        systemDiv.textContent = `System: ${entry.system || 'N/A'}`;
        content.appendChild(systemDiv);

        // Only show table if there are possible conditions
        if (entry.possibleConditions && entry.possibleConditions.length > 0) {

          const table = document.createElement('table');
          table.className = 'results-table';
          table.style.width = '100%';
          table.style.borderCollapse = 'collapse';
          table.style.marginBottom = '10px';

          // Table header
          const thead = document.createElement('thead');
          const headerRow = document.createElement('tr');
          ['Condition Name', 'Medical Code', 'Match %'].forEach(h => {
            const th = document.createElement('th');
            th.textContent = h;
            th.style.fontWeight = 'bold';
            th.style.textAlign = 'left';
            th.style.padding = '4px 6px';
            th.style.borderBottom = '1px solid #ddd';
            headerRow.appendChild(th);
          });
          thead.appendChild(headerRow);
          table.appendChild(thead);

          // Table body
          const tbody = document.createElement('tbody');
          entry.possibleConditions.forEach(cond => {
            const tr = document.createElement('tr');

            const tdName = document.createElement('td');
            tdName.textContent = cond.condition_name || '';
            tdName.style.padding = '4px 6px';

            const tdCode = document.createElement('td');
            tdCode.textContent = cond.medical_code || '';
            tdCode.style.padding = '4px 6px';

            const tdMatch = document.createElement('td');
            tdMatch.textContent = cond.match_percentage !== undefined ? cond.match_percentage + '%' : '';
            tdMatch.style.padding = '4px 6px';

            tr.appendChild(tdName);
            tr.appendChild(tdCode);
            tr.appendChild(tdMatch);
            tbody.appendChild(tr);
          });

          table.appendChild(tbody);
          content.appendChild(table);
        }
      });

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

document.addEventListener('DOMContentLoaded', () => {

  const showBtn = document.getElementById('showResultsBtn');
  const resultsContainer = document.getElementById('saved-results');

  showBtn.addEventListener('click', async () => {
    // Toggle visibility
    if (resultsContainer.style.display === 'none') {
      resultsContainer.style.display = 'block';
      showBtn.textContent = "Hide VA Disability Results";
      // Load the results only when first clicked
      if (!resultsContainer.hasChildNodes()) {
        await loadSavedResults();
      }
    } else {
      resultsContainer.style.display = 'none';
      showBtn.textContent = "VA Disability Results";
    }
  });

});

// Delete button
const deleteBtn = document.createElement('button');
deleteBtn.textContent = "Delete";
deleteBtn.className = "delete-btn";
deleteBtn.addEventListener('click', async () => {
  if (confirm("Are you sure you want to delete this saved result?")) {
    try {
      const res = await fetch(`/delete-saved-result/${item.id}`, {
        method: 'DELETE',
        credentials: 'same-origin'
      });

      const result = await res.json();
      if (result.success) {
        card.remove(); // Remove card from dashboard
      } else {
        alert("Failed to delete result.");
      }
    } catch (err) {
      console.error("Error deleting result:", err);
      alert("Error deleting result.");
    }
  }
});
card.appendChild(deleteBtn);

