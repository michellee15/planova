import {useEffect, useState} from "react";
import {
  getExpensesByTripId,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../api/expenseApi";

function useExpenses(tripId) {
  const [expenses, setExpenses] = useState([]);
  const [expenseFormData, setExpenseFormData] = useState({
    title: "", amount: "", category: "", paid_by_member_id: "", split_member_ids: [], expense_date:"",
  });
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editExpenseFormData, setEditExpenseFormData] = useState({
    title: "", amount: "", category: "", custom_category: "", paid_by_member_id: "", split_member_ids: [], expense_date: "",
  });

  const loadExpenses = async () => {
    try {
      const expenseData = await getExpensesByTripId(tripId);

      if (Array.isArray(expenseData)) {
        setExpenses(expenseData);
      } else {
        console.error("Expenses data is not an array:", expenseData);
        setExpenses([]);
      }
    } catch (error) {
      console.error("Error loading expenses:", error);
      setExpenses([]);
    }
  };

  useEffect(() => {
    if (tripId) {
      loadExpenses();
    }
  }, [tripId]);

  const handleExpenseChange = (event) => {
    const {name, value} = event.target;
    setExpenseFormData((prevData) => ({
      ...prevData, [name]: value,
    }));
  };

  const handleCreateExpense = async (event) => {
    event.preventDefault();
    if (!expenseFormData.title || !expenseFormData.amount || expenseFormData.split_member_ids === 0) return;
    const finalisedCategory = expenseFormData.category === "Others" ? expenseFormData.custom_category : expenseFormData.category;
    try {
      await createExpense(tripId, {
      title: expenseFormData.title, 
      amount: Number(expenseFormData.amount), 
      category: finalisedCategory || null, 
      paid_by_member_id: expenseFormData.paid_by_member_id || null, 
      split_member_ids: expenseFormData.split_member_ids,
      expense_date: expenseFormData.expense_date || null,
      });
      await loadExpenses();
      setExpenseFormData({
        title: "", amount: "", category: "", custom_category: "", paid_by_member_id: "", expense_date: "", 
      });
    } catch (error) {
      console.error("Error creating expense: ", error);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    try {
      await deleteExpense(expenseId);
      await loadExpenses();
    } catch (error) {
      console.error("Error deleting expense: ", error);
    }
  }

  //function that saves edited data to backend 
  const handleEditExpenseChange = (event) => {
    const {name, value} = event.target;
    setEditExpenseFormData((prevData) => ({
      ...prevData, [name]: value,
    }));
  }

  const handleEditExpense = async (expenseId) => {
    if (!editExpenseFormData.title || !editExpenseFormData.amount) return;
    const finalisedCategory = editExpenseFormData.category === "Others" ? editExpenseFormData.custom_category : editExpenseFormData.category;
    try {
      await updateExpense(expenseId, {
        title: editExpenseFormData.title,
        amount: Number(editExpenseFormData.amount),
        category: finalisedCategory || null,
        paid_by_member_id: editExpenseFormData.paid_by_member_id || null,
        expense_date: editExpenseFormData.expense_date || null,
      });
      await loadExpenses();
      setEditingExpenseId(null);
      setEditExpenseFormData({
        title: "", amount: "", category: "", custom_category: "", paid_by_member_id: "", expense_date: "",
      });
    } catch (error) {
      console.error("Error updating expense: ", error)
    }
  }

  // when user press edit button
  const handleStartEditExpense = async (expense) => {
    try {
      setEditingExpenseId(expense.id);
      setEditExpenseFormData({
        title: expense.title || "", 
        amount: expense.amount || "", 
        category: expense.category || "", 
        custom_category: expense.custom_category || "", 
        paid_by_member_id: expense.paid_by_member_id || "", 
        expense_date: expense.expense_date ? expense.expense_date.slice(0,10) : "",
      });
    } catch (error) {
      console.error("Error updating expense: ", error);
    }
  }

  // when user press cancel button
  const handleCancelEditExpense = () => {
    setEditingExpenseId(null);
    setEditExpenseFormData({
      title: "", amount: "", category: "", custom_category: "", paid_by_member_id: "", expense_date: "",
    });
  }

  const handleSplitMemberChange = (event) => {
    const memberId = Number(event.target.value);
    const checked = event.target.checked;
    setExpenseFormData((prevData) => {
      const currentSplitMembers = prevData.split_member_ids;
      if (checked) {
        return {
          ...prevData,
          split_member_ids: [...currentSplitMembers, memberId],
        };
      }
      return {
        ...prevData,
        split_member_ids: currentSplitMembers.filter((id) => id !== memberId),
      };
    });
  };

  return {
    expenses, expenseFormData, editingExpenseId, editExpenseFormData, loadExpenses, handleExpenseChange, 
    handleCreateExpense, handleEditExpense, handleEditExpenseChange, handleDeleteExpense, handleStartEditExpense, 
    handleCancelEditExpense, handleSplitMemberChange
  };
}

export default useExpenses;