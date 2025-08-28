async function saveResults(results) {
  try {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content; // if you embed it in HTML

    const response = await fetch('/save-results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken && { 'X-CSRF-Token': csrfToken })
      },
      body: JSON.stringify({ results }),
      credentials: 'include'  // 👈 important: sends session cookie
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
    const response = await fetch('/get-saved-results');
    if (!response.ok){
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
    const data = await response.json();

    const container = document.getElementById('saved-results');
    container.innerHTML = '';

    data.forEach(item => {
      const div = document.createElement('div');
      div.className = 'saved-result';
      div.innerHTML = `
        <p>Saved on: ${new Date(item.created_at).toLocaleString()}</p>
        <pre>${JSON.stringify(item.results_json, null, 2)}</pre>
        <hr>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    console.error('Error loading saved results:', err);
  }
}

document.addEventListener('DOMContentLoaded', loadSavedResults);
