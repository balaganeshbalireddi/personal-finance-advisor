// Load transactions from localStorage
let transactions = [];
if (localStorage.getItem("transactions")) {
  const stored = JSON.parse(localStorage.getItem("transactions"));
  transactions = stored.map(t => ({ ...t, date: new Date(t.date) }));
}

// Save transactions to localStorage
function saveTransactions() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

// Update UI
function updateUI() {
  const balanceEl = document.getElementById("balance");
  const incomeEl = document.getElementById("income");
  const expenseEl = document.getElementById("expense");
  const listEl = document.getElementById("transaction-list");

  let income = 0, expense = 0;
  listEl.innerHTML = "";

  transactions.forEach((t, index) => {
    const li = document.createElement("li");
    li.classList.add(t.type);
    li.innerHTML = `
      ${t.text} (${t.category}): ₹${t.amount}
      <span>
        <button onclick="editTransaction(${index})">✏️</button>
        <button onclick="deleteTransaction(${index})">🗑️</button>
      </span>
    `;
    listEl.appendChild(li);

    if (t.type === "income") income += t.amount;
    else expense += t.amount;
  });

  balanceEl.innerText = `₹${income - expense}`;
  incomeEl.innerText = `₹${income}`;
  expenseEl.innerText = `₹${expense}`;

  renderReportChart(transactions);
  renderTrendChart();
}

// Add transaction
function addTransaction() {
  const text = document.getElementById("text").value;
  const amount = +document.getElementById("amount").value;
  const type = document.getElementById("type").value;
  const category = document.getElementById("category").value || "Others";

  if (!text || !amount) { alert("Please enter all fields"); return; }

  const date = new Date();
  transactions.push({ text, amount, type, category, date });
  saveTransactions();

  document.getElementById("text").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("category").value = "";

  updateUI();
}

// Edit transaction
function editTransaction(index) {
  const t = transactions[index];
  document.getElementById("text").value = t.text;
  document.getElementById("amount").value = t.amount;
  document.getElementById("category").value = t.category;
  document.getElementById("type").value = t.type;

  transactions.splice(index, 1);
  saveTransactions();
  updateUI();
}

// Delete transaction
function deleteTransaction(index) {
  if (confirm("Are you sure you want to delete this transaction?")) {
    transactions.splice(index, 1);
    saveTransactions();
    updateUI();
  }
}

// Pie/Doughnut Chart
let chart;
function renderReportChart(dataArr) {
  const ctx = document.getElementById("financeChart").getContext("2d");
  if (chart) chart.destroy();

  const labels = [];
  const data = [];
  const colors = ["#dc3545","#ff7f50","#ffb347","#ffc107","#20c997","#0dcaf0","#6f42c1"];
  const backgroundColors = [];
  let colorIndex = 0;

  const grouped = {};
  dataArr.forEach(t => {
    const key = t.type === "income" ? "Income" : t.category;
    grouped[key] = (grouped[key] || 0) + t.amount;
  });

  for (const key in grouped) {
    labels.push(key);
    data.push(grouped[key]);
    backgroundColors.push(key === "Income" ? "#28a745" : colors[colorIndex % colors.length]);
    colorIndex++;
  }

  chart = new Chart(ctx, {
    type: "doughnut",
    data: { labels, datasets: [{ data, backgroundColor: backgroundColors }] },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } }
  });
}

// Reports
function updateReport(period) {
  const now = new Date();
  let filtered = [];

  if (period === "daily") {
    filtered = transactions.filter(t => t.date.toDateString() === now.toDateString());
  } else if (period === "weekly") {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    filtered = transactions.filter(t => t.date >= startOfWeek && t.date <= now);
  } else if (period === "monthly") {
    filtered = transactions.filter(t => t.date.getMonth() === now.getMonth() &&
                                        t.date.getFullYear() === now.getFullYear());
  } else { // all
    filtered = transactions;
  }

  renderReportChart(filtered);
}

// Trend Line Chart (last 30 days)
function renderTrendChart() {
  const ctx = document.getElementById("trendChart").getContext("2d");
  if (window.trendChart) window.trendChart.destroy();

  const last30Days = [];
  const incomeData = [];
  const expenseData = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const day = new Date();
    day.setDate(today.getDate() - i);
    last30Days.push(`${day.getDate()}/${day.getMonth()+1}`);

    const dailyIncome = transactions
      .filter(t => t.type === "income" && t.date.toDateString() === day.toDateString())
      .reduce((sum, t) => sum + t.amount, 0);

    const dailyExpense = transactions
      .filter(t => t.type === "expense" && t.date.toDateString() === day.toDateString())
      .reduce((sum, t) => sum + t.amount, 0);

    incomeData.push(dailyIncome);
    expenseData.push(dailyExpense);
  }

  window.trendChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: last30Days,
      datasets: [
        { label: "Income", data: incomeData, borderColor: "#28a745", fill: false },
        { label: "Expense", data: expenseData, borderColor: "#dc3545", fill: false }
      ]
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } }
  });
}

// Dark Mode
const darkModeBtn = document.getElementById("darkModeToggle");
if (localStorage.getItem("darkMode") === "enabled") {
  document.body.classList.add("dark-mode");
  darkModeBtn.innerText = "☀️ Light Mode";
}
darkModeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  if (document.body.classList.contains("dark-mode")) {
    darkModeBtn.innerText = "☀️ Light Mode";
    localStorage.setItem("darkMode", "enabled");
  } else {
    darkModeBtn.innerText = "🌙 Dark Mode";
    localStorage.setItem("darkMode", "disabled");
  }
});

// Initialize
updateUI();
