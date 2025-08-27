async function loadSavedResults() {
  const response = await fetch('/get-saved-results');
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
}
