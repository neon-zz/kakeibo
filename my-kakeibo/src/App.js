//===============
// 家計簿アプリ本体
//===============
import React, { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from "chart.js";
import "./App.css"; // CSS 読み込み

ChartJS.register(ArcElement, Tooltip, Legend, Title);

function App() {
  //===================
  // ランダムカラー生成
  //====================
  const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 16)];
    return color;
  };

  //=============== 状態管理 ===============
  const [items, setItems] = useState([]); // 支出データ
  const [categories, setCategories] = useState([
    "食品", "雑貨", "交通費", "家賃", "光熱費", "お小遣い", "その他"
  ]);
  const [categoryColors, setCategoryColors] = useState({
    "食品": "#FF6384",
    "雑貨": "#36A2EB",
    "交通費": "#f1f141",
    "家賃": "#60f343",
    "光熱費": "#c1a8f2ff",
    "お小遣い": "#FF9F40",
    "その他": "#C9CBCF"
  });
  const [newCategory, setNewCategory] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [incomes, setIncomes] = useState({}); // ← 修正: 複数月の収入を管理

  //======================
  // データ読み込み
  //======================
  useEffect(() => {
    const savedItems = JSON.parse(localStorage.getItem("kakeibo-items")) || [];
    const savedCategories = JSON.parse(localStorage.getItem("kakeibo-categories")) || [];
    const savedIncomes = JSON.parse(localStorage.getItem("kakeibo-incomes")) || {};

    setItems(savedItems);
    setCategories(savedCategories);
    setIncomes(savedIncomes);
  }, []);

  //======================
  // データ保存
  //======================
  useEffect(() => {
    localStorage.setItem("kakeibo-items", JSON.stringify(items));
    localStorage.setItem("kakeibo-categories", JSON.stringify(categories));
    localStorage.setItem("kakeibo-incomes", JSON.stringify(incomes));
  }, [items, categories, incomes]);

  //=====================
  // カテゴリ追加
  //=====================
  const handleAddCategory = (e) => {
    e.preventDefault();
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      alert("このカテゴリはすでに存在します。");
      return;
    }
    const newColor = getRandomColor();
    setCategories([...categories, trimmed]);
    setCategoryColors({ ...categoryColors, [trimmed]: newColor });
    setNewCategory("");
  };

  //=====================
  // 支出追加
  //=====================
  const handleAddExpense = (e) => {
    e.preventDefault();
    const category = e.target.category.value;
    const amount = Number(e.target.amount.value);
    const date = e.target.date.value;
    const comment = e.target.comment.value;

    if (!category || !amount || amount <= 0 || !date) {
      alert("カテゴリと金額を正しく入力してください。");
      return;
    }

    const newItem = {
      id: Date.now(),
      category,
      amount,
      date,
      comment
    };
    setItems([...items, newItem]);
    e.target.reset();
  };

  //=====================
  // 支出削除
  //=====================
  const handleDelete = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  //=====================
  // 月ごとフィルター処理
  //=====================
  const getMonthKey = (dateString) => (dateString ? dateString.slice(0, 7) : "");

  const months = Array.from(
    new Set(items.map((item) => getMonthKey(item.date)).filter(Boolean))
  ).sort((a, b) => b.localeCompare(a));

  const filteredItems =
    selectedMonth === "all"
      ? items
      : items.filter((item) => getMonthKey(item.date) === selectedMonth);

  //=====================
  // 収入・残高計算
  //=====================
  const currentIncome = incomes[selectedMonth] || 0;

  const handleIncomeChange = (e) => {
    const value = Number(e.target.value) || 0;
    setIncomes({ ...incomes, [selectedMonth]: value });
  };

  const total = filteredItems.reduce((sum, i) => sum + i.amount, 0);
  const balance = selectedMonth === "all" ? 0 : currentIncome - total;

  //=====================
  // グラフ用データ
  //=====================
  const categorySummary = categories.map((cat) =>
    filteredItems
      .filter((i) => i.category === cat)
      .reduce((sum, i) => sum + i.amount, 0)
  );

  const chartData = {
    labels: categories,
    datasets: [
      {
        data: categorySummary,
        backgroundColor: categories.map((cat) => categoryColors[cat])
      }
    ]
  };

  //=====================
  // 画面構成
  //=====================
  return (
    <div className="container">
      <h1>家計簿</h1>

      {/* 月選択 */}
      <div className="filter-box">
        <label>表示する月 : </label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          <option value="all">全て</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* 月収入力 */}
      <div className="filter-box">
        <label>
          {selectedMonth === "all" ? "全ての月収合計" : `${selectedMonth} の月収`}:
        </label>
        <input
          type="number"
          value={
            selectedMonth === "all"
              ? Object.values(incomes).reduce((sum, val) => sum + val, 0)
              : currentIncome
          }
          onChange={(e) => {
            if (selectedMonth === "all") return; // 全ては編集不可でもOK
            handleIncomeChange(e);
          }}
          placeholder={selectedMonth === "all" ? "" : "収入を入力"}
          disabled={selectedMonth === "all"} // 編集不可にする場合
        />
        <span>円</span>
      </div>


      {/* カテゴリ追加 */}
      <h2>カテゴリを追加</h2>
      <form onSubmit={handleAddCategory}>
        <input
          type="text"
          placeholder="新しいカテゴリ名を入力"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        />
        <button type="submit">追加</button>
      </form>

      {/* 支出追加 */}
      <h2>支出を追加</h2>
      <form onSubmit={handleAddExpense}>
        <select name="category">
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input type="number" name="amount" placeholder="金額" />
        <input type="date" name="date" />
        <input type="text" name="comment" placeholder="コメント" />
        <button type="submit">追加</button>
      </form>

      {/* 合計表示 */}
      {selectedMonth !== "all" && (
        <div className="summary">
          <p>支出合計: {total}円</p>
          <p>残高: {balance}円</p>
        </div>
      )}

      {/* 支出一覧 */}
      <h2>
        支出一覧{" "}
        {selectedMonth !== "all" && (
          <span style={{ fontSize: "0.8em", color: "#545454ff" }}>
            ({selectedMonth})
          </span>
        )}
      </h2>

      {categories.map((cat) => (
        <div key={cat}>
          <h3>{cat}</h3>
          <ul>
            {filteredItems
              .filter((i) => i.category === cat)
              .map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.date}</strong>
                    <span> - {item.amount}円</span>
                    {item.comment && <em> ({item.comment})</em>}
                  </div>
                  <button onClick={() => handleDelete(item.id)}>削除</button>
                </li>
              ))}
          </ul>
        </div>
      ))}

      {/* グラフ表示 */}
      <h2>カテゴリごとの支出割合</h2>
      <Pie data={chartData} />
    </div>
  );
}

export default App;
