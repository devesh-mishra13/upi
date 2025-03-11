"use client"; // Ensure it's a Client Component in Next.js

import { useState, useEffect } from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
} from "chart.js";

import { pipe, flow } from "fp-ts/function";
import * as O from "fp-ts/Option";
import {produce} from "immer";

// ✅ Register Chart.js components
ChartJS.register(BarElement, ArcElement, Tooltip, Legend, CategoryScale, LinearScale);

const getCurrentMonth = () => new Date().toISOString().slice(0, 7); // YYYY-MM

type Transaction = { id: number; amount: number; category: string; date: string };

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [newTransaction, setNewTransaction] = useState({
    amount: "",
    category: "",
    date: getCurrentMonth(),
  });
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  useEffect(() => {
    const savedTransactions = JSON.parse(localStorage.getItem("transactions") || "[]");
    setTransactions(savedTransactions);
  }, []);

  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = () => {
    if (!newTransaction.amount || !newTransaction.category) return;

    setTransactions(
      produce((draft: Transaction[]) => {
        draft.push({
          id: Date.now(),
          amount: Number(newTransaction.amount),
          category: newTransaction.category,
          date: newTransaction.date,
        });
      })
    );

    setNewTransaction({ amount: "", category: "", date: getCurrentMonth() });
  };

  // ✅ Functional Programming: Using `Option` to safely handle data
  const filteredTransactions: Transaction[] = pipe(
    O.fromNullable(transactions as Transaction[]), // Explicitly set type
    O.map((txs) => txs.filter((tx) => tx.date.startsWith(selectedMonth))),
    O.getOrElse<Transaction[]>(() => []) // Ensure correct fallback type
  );
  

  const categoryTotals: Record<string, number> = pipe(
    O.fromNullable(filteredTransactions),
    O.map((txs) =>
      txs.reduce(
        (acc, tx) => ({
          ...acc,
          [tx.category]: (acc[tx.category] || 0) + tx.amount,
        }),
        {} as Record<string, number>
      )
    ),
    O.getOrElse(() => ({}))
  );

  const totalSpending: number = pipe(
    O.fromNullable(filteredTransactions),
    O.map((txs) => txs.reduce((sum, tx) => sum + tx.amount, 0)),
    O.getOrElse(() => 0)
  );

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-4">UPI Insights</h1>

      {/* Add Transaction Form */}
      <div className="mb-4 p-4 border rounded-lg shadow-md w-96">
        <h2 className="text-lg font-semibold mb-2">Add Transaction</h2>
        <input
          type="number"
          placeholder="Amount"
          value={newTransaction.amount}
          onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
          className="border p-2 w-full mb-2"
        />
        <input
          type="text"
          placeholder="Category"
          value={newTransaction.category}
          onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
          className="border p-2 w-full mb-2"
        />
        <input
          type="month"
          value={newTransaction.date}
          onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
          className="border p-2 w-full mb-2"
        />
        <button onClick={addTransaction} className="bg-blue-500 text-white px-4 py-2 w-full">
          Add
        </button>
      </div>

      {/* Month Filter */}
      <select
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
        className="mb-4 p-2 border rounded"
      >
        {Array.from(new Set(transactions.map((tx) => tx.date))).map((month) => (
          <option key={month} value={month}>
            {month}
          </option>
        ))}
      </select>

      {/* Total Spending */}
      <h2 className="text-xl font-semibold mb-4">Total Spending: ₹{totalSpending}</h2>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 w-2/3">
        <div className="w-full">
          <Bar
            data={{
              labels: Object.keys(categoryTotals),
              datasets: [
                {
                  label: "Spending",
                  data: Object.values(categoryTotals),
                  backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
                },
              ],
            }}
          />
        </div>
        <div className="w-full">
          <Pie
            data={{
              labels: Object.keys(categoryTotals),
              datasets: [
                {
                  data: Object.values(categoryTotals),
                  backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
                },
              ],
            }}
          />
        </div>
      </div>

      {/* Transaction List */}
      <div className="mt-6 w-96 border rounded-lg p-4 shadow-md">
        <h2 className="text-lg font-semibold mb-2">Transactions</h2>
        {filteredTransactions.map((tx) => (
          <div key={tx.id} className="flex justify-between p-2 border-b">
            <span>{tx.category}</span>
            <span>₹{tx.amount}</span>
            <span className="text-gray-500 text-sm">{tx.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
