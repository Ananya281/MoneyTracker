let expenses = [];
let totalAmount = 0;

const categorySelect = document.getElementById('category_select');
const amountInput = document.getElementById('amount_input');
const infoInput = document.getElementById('info');
const dateInput = document.getElementById('date_input');
const addBtn = document.getElementById('add_btn');
const expenseTableBody = document.getElementById('expense-table-body');
const totalAmountCell = document.getElementById('total-amount');

addBtn.addEventListener('click', function() {
    const category = categorySelect.value;
    const info = infoInput.value;
    const amount = Number(amountInput.value);
    const date = dateInput.value;

    if (category === '') {
        alert('Please select a category.');
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount.');
        return;
    }
    if (info === '') {
        alert('Please enter expense/income info.');
        return;
    }
    if (date === '') {
        alert('Please select a date.');
        return;
    }

    const newExpense = { category, amount, info, date };
    expenses.push(newExpense);

    if (category === 'Income') {
        totalAmount += amount;
    } else if (category === 'Expense') {
        totalAmount -= amount;
    }

    totalAmountCell.textContent = totalAmount.toFixed(2); // Display total amount

    // Create a new row for the expense table
    const newRow = expenseTableBody.insertRow();

    // Insert cells for each column
    const categoryCell = newRow.insertCell();
    const amountCell = newRow.insertCell();
    const infoCell = newRow.insertCell();
    const dateCell = newRow.insertCell();
    const deleteCell = newRow.insertCell();

    // Populate cells with data
    categoryCell.textContent = newExpense.category;
    amountCell.textContent = newExpense.amount.toFixed(2);
    infoCell.textContent = newExpense.info;
    dateCell.textContent = newExpense.date;

    // Create delete icon element
    const deleteIcon = document.createElement('i');
    deleteIcon.classList.add('fas', 'fa-trash-alt', 'delete-icon');
    deleteIcon.setAttribute('data-index', expenses.length - 1); // Set index for deletion reference
    deleteIcon.addEventListener('click', function() {
        const index = parseInt(deleteIcon.getAttribute('data-index'));
        const deletedExpense = expenses[index];
        if (deletedExpense.category === 'Income') {
            totalAmount -= deletedExpense.amount;
        } else if (deletedExpense.category === 'Expense') {
            totalAmount += deletedExpense.amount;
        }
        totalAmountCell.textContent = totalAmount.toFixed(2); // Update total amount display

        // Remove the row from the table
        expenseTableBody.removeChild(newRow);

        // Remove the expense from the expenses array
        expenses.splice(index, 1);
    });

    // Append delete icon to deleteCell
    deleteCell.appendChild(deleteIcon);

    // Clear input fields after adding expense
    categorySelect.value = '';
    amountInput.value = '';
    infoInput.value = '';
    dateInput.value = '';
});

// Function to initialize the table with existing expenses
function initializeTable() {
    // Clear existing rows
    while (expenseTableBody.firstChild) {
        expenseTableBody.removeChild(expenseTableBody.firstChild);
    }

    expenses.forEach((expense, index) => {
        // Skip adding example row with 'Groceries'
        if (expense.info === 'Groceries') {
            return;
        }

        const newRow = expenseTableBody.insertRow();

        const categoryCell = newRow.insertCell();
        const amountCell = newRow.insertCell();
        const infoCell = newRow.insertCell();
        const dateCell = newRow.insertCell();
        const deleteCell = newRow.insertCell();

        categoryCell.textContent = expense.category;
        amountCell.textContent = expense.amount.toFixed(2);
        infoCell.textContent = expense.info;
        dateCell.textContent = expense.date;

        const deleteIcon = document.createElement('i');
        deleteIcon.classList.add('fas', 'fa-trash-alt', 'delete-icon');
        deleteIcon.setAttribute('data-index', index);
        deleteIcon.addEventListener('click', function() {
            const index = parseInt(deleteIcon.getAttribute('data-index'));
            const deletedExpense = expenses[index];
            if (deletedExpense.category === 'Income') {
                totalAmount -= deletedExpense.amount;
            } else if (deletedExpense.category === 'Expense') {
                totalAmount += deletedExpense.amount;
            }
            totalAmountCell.textContent = totalAmount.toFixed(2);

            expenseTableBody.removeChild(newRow);
            expenses.splice(index, 1);
        });

        deleteCell.appendChild(deleteIcon);
    });

    totalAmountCell.textContent = totalAmount.toFixed(2);
}

// Call initializeTable to populate existing expenses on page load
initializeTable();
