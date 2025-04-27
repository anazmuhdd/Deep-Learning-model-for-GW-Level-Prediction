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

  const threshold = 7.5;
  const lowGroundwaterAlerts = [];

  if (!Array.isArray(data) || data.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">No data available for selected month</td></tr>`;
    return;
  }

  data.forEach(entry => {
    let isLow = false;
    let warning = "OK";

    // Check priority: actual groundwaterLevel > predictedGroundwaterLevel
    if (entry.groundwaterLevel !== undefined && entry.groundwaterLevel !== null) {
      isLow = entry.groundwaterLevel < threshold;
    } else if (entry.predictedGroundwaterLevel !== undefined && entry.predictedGroundwaterLevel !== null) {
      isLow = entry.predictedGroundwaterLevel < threshold;
    }

    if (isLow) {
      warning = "⚠️ Low Groundwater";
      lowGroundwaterAlerts.push({
        date: entry.date,
        groundwaterLevel: entry.groundwaterLevel,
        predictedGroundwaterLevel: entry.predictedGroundwaterLevel
      });
    }

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

  // ✅ Send email if warnings found
  if (lowGroundwaterAlerts.length > 0) {
    fetch("/api/email/send-warning-emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alerts: lowGroundwaterAlerts })
    })
    .then(res => res.json())
    .then(resp => {
      console.log("📧 Email Alert Sent:", resp);
      alert("🚨 Warning email sent to government authorities for low groundwater levels!");
    })
    .catch(err => console.error("❌ Email sending failed:", err));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const today = new Date();
  const defaultMonth = String(today.getMonth() + 1).padStart(2, "0");
  const defaultYear = today.getFullYear();
  const defaultFormatted = `${defaultYear}-${defaultMonth}`;

  document.getElementById("filterDate").value = `${defaultFormatted}-01`;

  // Fetch and render current month’s data
  fetchDataByMonth(defaultFormatted);

  // Filter by selected month
  document.getElementById("filterDate").addEventListener("change", e => {
    const selectedDate = new Date(e.target.value);
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const formatted = `${year}-${month}`;
    fetchDataByMonth(formatted);
  });
});
