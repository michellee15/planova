//displays the add expense form
function ExpenseForm({formData, onChange, onSubmit}) {
  return (
    <form onSubmit={onSubmit}>
      <input
        type="text"
        name="title"
        value={formData.title}
        onChange={onChange}
        placeholder="Expense title"
      />

      <input 
        type="number"
        name="amount"
        value={formData.amount}
        onChange={onChange}
        placeholder="Amount"
        step="0.01"
      />

      <select 
        name="category"
        value={formData.category}
        onChange={onChange}
      >
        <option value="">Select category</option>
        <option value="Food">Food</option>
        <option value="Drinks">Drinks</option>
        <option value="Groceries">Groceries</option>
        <option value="Shopping">Shopping</option>
        <option value="Others">Others</option>
      </select>

      {formData.category === "Others" && (
        <input
          type="text"
          name="custom_category"
          value={formData.custom_category}
          onChange={onChange}
          placeholder="Enter category"
        />
      )}

      <input 
        type="text"
        name="paid_by"
        value={formData.paid_by}
        onChange={onChange}
        placeholder="Paid by"
      />

      <input 
        type="date"
        name="expense_date"
        value={formData.expense_date}
        onChange={onChange}
      />
      <button type="submit">Add Expense</button>
    </form>
  )
}

export default ExpenseForm;