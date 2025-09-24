console.log("JS読み込み")

const form = document.getElementById("form");
const itemInput = document.getElementById("item");
const amountInput = document.getElementById("amount");
const dateInput = document.getElementById("date");
const commentInput = document.getElementById("comment");

const totalEl = document.getElementById("total");
const incomeEl = document.getElementById("income");
const balanceEl = document.getElementById("balance");

//月収
const incomeForm = document.getElementById("income-form");
const incomeInput = document.getElementById("income-input");

const searchInput = document.getElementById("search");
const startDateInput = document.getElementById("start-date");
const endDateInput = document.getElementById("end-date");
const filterBtn = document.getElementById("filter-btn");
const resetBtn = document.getElementById("reset-btn");

//データ
let total = 0;
let items = [];
let income = 0;
let balance = 0;
let monthlyIncome = {};
let fixedIncome = 0;
let categoryChart = null;

//フィルター
filterBtn.addEventListener("click", () => {
  applyFilters();
});

//検索絞り込み
searchInput.addEventListener("input", () => {
  applyFilters();
});

//リセット
resetBtn.addEventListener("click", () => {
  searchInput.value ="";
  startDateInput.value ="";
  endDateInput.value ="";
  applyFilters();
});

//フィルター処理
function applyFilters() {
  const keywrd = searchInput.value.toLowerCase();
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;

  document.querySelectorAll("ul li").forEach(li => {
  const text = li.textContent.toLowerCase();
  const date = li.getAttribute("data-date"); // liに日付を持たせておく

  let match = true;

  //キーワードで絞り込み
  if (keywrd && !text.includes(keywrd)) {
    match = false;
  }

  //日付で絞り込み
  if (date) {
    if (startDate && date < startDate) match = false;
    if (endDate && date > endDate) match = false;
  }

  li.style.display = match ? "" : "none";
});
}

// カテゴリ対応
const categoryMap = {
"食品": document.getElementById("list-food"),
"雑貨": document.getElementById("list-zakka"),
"交通費": document.getElementById("list-transport"),
"家賃": document.getElementById("list-rent"),
"光熱費": document.getElementById("list-utility"),
"お小遣い": document.getElementById("list-pocket"),
"その他": document.getElementById("list-other"),
};

/// 初期データ読み込み
window.addEventListener("load", () => {
  const savedItems = JSON.parse(localStorage.getItem("kakeibo-items"));
  const savedTotal = localStorage.getItem("kakeibo-total");
  const savedIncome = localStorage.getItem("kakeibo-income");
  const savedMonthlyIncome = JSON.parse(localStorage.getItem("kakeibo-monthlyIncome"));
  const savedFixedIncome = localStorage.getItem("kakeibo-fixedIncome");

 if (savedItems) {
    items = savedItems;
    items.forEach(entry => 
      addListitem(entry.category, entry.amount, entry.date, entry.comment, entry.id)
  );
}

   if (savedTotal) {
    total = Number(savedTotal);
    totalEl.textContent = total;
  }

  if (savedIncome) {
    income = Number(savedIncome);
    incomeEl.textContent = income;
  }

  if (savedMonthlyIncome) {
    monthlyIncome = savedMonthlyIncome;
  }

  if (savedMonthlyIncome) {
    fixedIncome = Number(savedFixedIncome);
  }

  const today = new Date();
  const currentMonth = today.toDateString().slice(0, 7);
  if (fixedIncome > 0 && !monthlyIncome[currentMonth]) {
    monthlyIncome[currentMonth] = fixedIncome;
    income = fixedIncome;
    incomeEl.textContent = fixedIncome;
  }

    balance = income - total;
    balanceEl.textContent = balance;

    saveData();
    updateMonthlySummary();
    updateCategoryChart();
});

// 支出入力処理
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const category = itemInput.value;
  const amount = Number(amountInput.value);
  if (!category || !amount) return;

  //入力なしなら今日の日付
  let date = dateInput.value;
  if (!date) {
    const today = new Date();
    date = today.toISOString().split("T")[0]; // YYYY-MM-DD
  }

  const comment = commentInput.value || "";
  const id = Date.now();

  items.push({ id, category, amount, date, comment });

  addListitem(category, amount, date, comment, id);

  total += amount;
  totalEl.textContent = total;

  balance = income - total;
  balanceEl.textContent = balance;

  amountInput.value = "";
  dateInput.value = "";
  commentInput.value = "";

  saveData();
  updateMonthlySummary();
  updateCategoryChart();
});

// 月収入力処理
incomeForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const newIncome = Number(incomeInput.value);
  if (!newIncome) return;

  const today = new Date();
  const month = today.toISOString().slice(0, 7);

  monthlyIncome[month] = newIncome;
  fixedIncome = newIncome;

  income = newIncome;
  incomeEl.textContent = newIncome;

  saveData();
  updateMonthlySummary();

  incomeInput.value = "";
});

//項目追加＆削除ボタン
function addListitem(category, amount, date, comment, id) {
    const li = document.createElement("li");
    li.setAttribute("data-category", category);
    li.innerHTML = `<span>${date} - ${amount}円 ${comment ? "(" + comment + ")" : ""}</span>
    <button class="delete-btn">削除</button>`;

     li.setAttribute("data-date", date);

    const delBtn = li.querySelector(".delete-btn");
    delBtn.addEventListener("click", () => {
        total -= amount;
        balance = income - total;

        totalEl.textContent = total;
        balanceEl.textContent = balance;

        items = items.filter(item => item.id !== id);
        saveData();

        li.remove();
        updateMonthlySummary();
        updateCategoryChart();
    });

    categoryMap[category].appendChild(li);
}

function saveData() {
  localStorage.setItem("kakeibo-items", JSON.stringify(items));
  localStorage.setItem("kakeibo-total", total);
  localStorage.setItem("kakeibo-income", income);
  localStorage.setItem("kakeibo-monthlyIncome", JSON.stringify(monthlyIncome));
  localStorage.setItem("kakeibo-fixedIncome", fixedIncome);
}

//カテゴリの表示/非表示切り替え
function toggleCategory(id) {
    const ul = document.getElementById(id);
    if (!ul) return;
    ul.style.display = (ul.style.display === "none" || ul.style.display === "") ? "block" : "none";
}

  // 月ごとの支出集計
function updateMonthlySummary() {
  const monthlySummary = {};

  items.forEach(entry => {
    const month = entry.date.slice(0, 7);
    if (!monthlySummary[month]) monthlySummary[month] = 0;
    monthlySummary[month] += entry.amount;
  });

  const tableBody = document.querySelector("#monthly-summary-table tbody");
  if (!tableBody) return;
  tableBody.innerHTML = "";
  
  // 支出と収入の両方の月
  const months = Array.from(new Set([
    ...Object.keys(monthlySummary),
    ...Object.keys(monthlyIncome)
  ])).sort();

     months.forEach(month => {
     const expense = monthlySummary[month] || 0;
     const incomeForMonth = monthlyIncome[month] || 0;
     const balance = incomeForMonth - expense;

     const tr = document.createElement("tr");

     tr.innerHTML = `
     <td>${month}</td>
     <td>${expense}円</td>
     <td>${incomeForMonth}円</td>
     <td style="color:${balance < 0 ? `red` : `black`}">${balance}円</td>
     `;
     tableBody.appendChild(tr);
  });
}

function updateCategoryChart() {
  const categorySummary = {};
  items.forEach(entry => {
  if (!categorySummary[entry.category]) {
    categorySummary[entry.category] = 0;
  }
  categorySummary[entry.category] += entry.amount;
});

const labels = Object.keys(categorySummary);
const data = Object.values(categorySummary);

const ctx = document.getElementById("categoryChart").getContext("2d");

if (categoryChart) {
  categoryChart.destroy();
}

categoryChart = new Chart(ctx, {
  type: "pie",
  data: {
    labels: labels,
    datasets: [{
      data: data,
      backgroundColor: [
        "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0",
        "#9966FF", "#FF9F40", "#C9CBCF"
      ]
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      title: { display: true, text: "カテゴリ別支出割合" }
      }
    }
  });
}