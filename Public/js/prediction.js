const predictionData = [
  { year: 2014, pump_sets: 263607, population: 3639546, rainfall: 0, prediction: null },
  { year: 2015, pump_sets: 270320, population: 3702139, rainfall: 848.65, prediction: null },
  { year: 2016, pump_sets: 278375, population: 3765809, rainfall: 530.85, prediction: null },
  { year: 2017, pump_sets: 270859, population: 3830574, rainfall: 1066.895, prediction: null },
  { year: 2018, pump_sets: 270194, population: 3896452, rainfall: 1622.405, prediction: null },
  { year: 2019, pump_sets: 270671, population: 3963464, rainfall: 859.5, prediction: null },
  { year: 2020, pump_sets: null, population: 4031628, rainfall: 638, prediction: null },
  { year: 2021, pump_sets: 272437, population: 4100964, rainfall: 2524.408333, prediction: null },
  { year: 2022, pump_sets: 271249, population: 4171493, rainfall: 2660.93, prediction: null },
  { year: 2023, pump_sets: 271327, population: 4243235, rainfall: 6301.19, prediction: null },
  { year: 2024, pump_sets: 271554, population: 4316210, rainfall: 4965.4, prediction: null },
];

function renderPredictionTable(data) {
  const tableBody = document.querySelector(".prediction-table tbody");
  tableBody.innerHTML = "";

  data.forEach(entry => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.year}</td>
      <td>${entry.pump_sets !== null ? entry.pump_sets : '—'}</td>
      <td>${entry.population}</td>
      <td>${entry.rainfall}</td>
      <td>${entry.prediction !== null ? entry.prediction : '—'}</td>
    `;
    tableBody.appendChild(row);
  });
}

renderPredictionTable(predictionData);

const searchInput = document.querySelector(".search-input");
searchInput.addEventListener("input", function () {
  const query = this.value.toLowerCase();

  const filteredData = predictionData.filter(entry =>
    entry.year.toString().includes(query) ||
    (entry.pump_sets && entry.pump_sets.toString().includes(query)) ||
    entry.population.toString().includes(query) ||
    entry.rainfall.toString().includes(query)
  );

  renderPredictionTable(filteredData);
});
