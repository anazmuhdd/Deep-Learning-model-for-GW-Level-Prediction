async function fetchDataByMonth(monthString) {
  try {
    const response = await fetch(`/api/predictions/${monthString}`);
    const data = await response.json();
    renderTable(data);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

function renderTable(data) {
  const tableBody = document.getElementById("tableBody");
  tableBody.innerHTML = "";

  // Set threshold (e.g., if groundwater level is below 10.0 m, it's low)
  const threshold = 7.5;

  if (!Array.isArray(data) || data.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">No data available for selected month</td></tr>`;
    return;
  }

  data.forEach(entry => {
    let warning = (entry.groundwaterLevel < threshold) ? "Low Groundwater" : "OK";
    const row = `<tr>
      <td class="px-4 py-2">${entry.date || 'N/A'}</td>
      <td class="px-4 py-2">${entry.rainfall ?? 'N/A'}</td>
      <td class="px-4 py-2">${entry.temperature ?? 'N/A'}</td>
      <td class="px-4 py-2">${entry.predictedGroundwaterLevel ?? 'N/A'}</td>
      <td class="px-4 py-2">${entry.groundwaterLevel ?? 'N/A'}</td>
      <td class="px-4 py-2">${warning}</td>
    </tr>`;
    tableBody.insertAdjacentHTML("beforeend", row);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const today = new Date();
  const defaultMonth = String(today.getMonth() + 1).padStart(2, "0");
  const defaultYear = today.getFullYear();
  const defaultFormatted = `${defaultYear}-${defaultMonth}`;

  document.getElementById("filterDate").value = `${defaultFormatted}-01`;

  // Fetch and render current month’s data
  fetchDataByMonth(defaultFormatted);

  // Event listener for filtering
  document.getElementById("filterDate").addEventListener("change", e => {
    const selectedDate = new Date(e.target.value);
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const formatted = `${year}-${month}`;
    fetchDataByMonth(formatted);
  });
});
