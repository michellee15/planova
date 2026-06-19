import {useEffect, useState} from "react";
import {Link, useParams} from "react-router-dom";
import { getTripById } from "../api/tripApi";
import { getExpensesByTripId, createExpense, } from "../api/expenseApi";
import TripHeader from "../components/tripDetails/TripHeader";
import TripOverview from "../components/tripDetails/TripOverview";
import BudgetSummary from "../components/tripDetails/BudgetSummary";
import ExpenseForm from "../components/expenses/ExpenseForm";
import ExpenseList from "../components/expenses/ExpenseList";

function TripDetailsPage() {
  const {id} = useParams();
  const [trip, setTrip] = useState(null);
  const[loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [expenseFormData, setExpenseFormData] = useState({
    title: "", amount: "", category: "", paid_by: "", expense_date:"",
  });

  useEffect(() => {
    const loadTripDetails = async () => {
      try {
        setLoading(true);
        const data = await getTripById(id);
        setTrip(data);
        const expenseData = await getExpensesByTripId(id);
        setExpenses(expenseData);
      } catch (error) {
        console.error("Error loading trip: ", error);
        setError("Failed to load trips.");
      } finally {
        setLoading(false);
      }
    };

    const loadExpenses = async () => {
      try {
        const expenseData = await getExpensesByTripId(id);
  
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

    loadTripDetails();
    loadExpenses();
  }, [id]);

  const handleExpenseChange = (event) => {
    const {name, value} = event.target;
    setExpenseFormData((prevData) => ({
      ...prevData, [name]: value,
    }));
  };

  const handleCreateExpense = async (event) => {
    event.preventDefault();
    if (!expenseFormData.title || !expenseFormData.amount) return;
    const finalisedCategory = expenseFormData.category === "Others" ? expenseFormData.custom_category : expenseFormData.category;
    try {
      await createExpense(id, {
      title: expenseFormData.title, 
      amount: Number(expenseFormData.amount), 
      category: finalisedCategory || null, 
      paid_by: expenseFormData.paid_by || null, 
      expense_date: expenseFormData.expense_date || null,
      });
      const updatedExpense = await getExpensesByTripId(id);
      setExpenses(updatedExpense);
      setExpenseFormData({
        title: "", amount: "", category: "", custom_category: "", paid_by: "", expense_date: "", 
      });
    } catch (error) {
      console.error("Error creating expense: ", error);
    }
  };

  if (loading) return <p>Loading trip...</p>;

  if (error) {
    return (
      <main>
        <Link to="/">Back to all trips</Link>
        <p>{error}</p>
      </main>
    );
  }

  if (!trip) {
    return (
      <main>
        <Link to="/">Back to all trips</Link>
        <p>Trip not found.</p>
      </main>
    );
  }

  return (
    <main>
      <Link to="/">Back to all trips</Link>
      <TripHeader trip={trip}/>
      <TripOverview trip={trip}/>
      <BudgetSummary trip={trip} expenses={expenses || []}/>
      <section>
        <h2>Expenses</h2>
        <ExpenseForm
          formData={expenseFormData}
          onChange={handleExpenseChange}
          onSubmit={handleCreateExpense}
        />
        <ExpenseList
          expenses={expenses}
          currency={trip.currency}
        />
      </section>
      <section>
        <h2>Itinerary</h2>
        <p>No itinerary items yet.</p>
      </section>
    </main>
  );
}

export default TripDetailsPage;