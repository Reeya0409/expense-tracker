const form = document.getElementById("expense-form");
const list = document.getElementById("expense-list");

const searchInput = document.getElementById("search");
const filter = document.getElementById("filter");
const sort = document.getElementById("sort");
const budgetInput = document.getElementById("budget");
const remaining = document.getElementById("remaining");

const themeBtn = document.querySelector('#themeBtn');

let pieChartObj = null,
    barChartObj = null,
    trendChartObj = null;
let expenses = JSON.parse(
    localStorage.getItem("expenses")
) || [];

budgetInput.value =
    localStorage.getItem("budget") || "";

budgetInput.addEventListener(
    "input",
    () => {
        localStorage.setItem(
            "budget",
            budgetInput.value
        );
        render();
    });

// Dark mode

if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    themeBtn.innerHTML = '🌞 Light Mode';
}
else {
    themeBtn.innerHTML = '🌙 Dark Mode';
}

themeBtn.onclick = () => {
    document.body.classList.toggle("dark");

    if (themeBtn.innerHTML.includes('Dark Mode')) {
        themeBtn.innerHTML = '🌞 Light Mode';
    }else{
        themeBtn.innerHTML = '🌙 Dark Mode';
    }

    localStorage.setItem(
        "theme",
        document.body.classList.contains("dark")
            ? "dark" : "light"
    );

};


render();

// Add/Edit
form.addEventListener("submit", e => {
    e.preventDefault();
    let obj = {

        desc: description.value.trim(),
        amt: parseFloat(amount.value),
        date: date.value,
        category: category.value,
        id: Date.now()
    };

    if (!obj.desc || isNaN(obj.amt))
        return;

    expenses.push(obj);
    save();
    form.reset();

    render();
});

function save() {
    localStorage.setItem(
        "expenses",
        JSON.stringify(expenses)
    );
}


function render() {
    list.innerHTML = '';
    let filtered = [...expenses]
        .filter(e =>
            e.desc.toLowerCase()
                .includes(
                    searchInput.value.toLowerCase()
                )
        );
    if (filter.value !== "all") {
        filtered = filtered.filter(
            e => e.category === filter.value
        );
    }
    if (sort.value === "high")
        filtered.sort((a, b) => b.amt - a.amt);
    else if (sort.value === "low")
        filtered.sort((a, b) => a.amt - b.amt);
    else if (sort.value === "oldest")
        filtered.reverse();
    let total = 0;
    filtered.forEach(e => {
        total += e.amt;
        list.innerHTML += `
<li class="list-group-item d-flex justify-content-between align-items-center">
<div>
<b>${e.desc}</b><br>
${e.category}<br>
${e.date}<br>
₹${e.amt}
</div>

<div>
<button
class="btn btn-danger btn-sm"
onclick="deleteExpense(${e.id})">
Delete
</button>
</div>
</li>
`;
    });
    totalExpense.innerText = "₹" + total;
    transactionCount.innerText = filtered.length;
    highestExpense.innerText =
        "₹" +
        Math.max(
            ...filtered.map(x => x.amt),
            0
        );
    budgetCheck(total);
    createProgress();
    createCategoryTotals();
    drawCharts();
}

window.deleteExpense = function (id) {
    expenses = expenses.filter(
        e => e.id !== id
    );
    save();
    render();
}



function budgetCheck(total) {
    let budget =
        parseFloat(
            budgetInput.value
        ) || 0;
    remaining.innerText =
        budget - total;
    remaining.style.color =
        budget > 0 && total > budget
            ? "red" : "green";
}

function createProgress() {
    let categories = {};
    expenses.forEach(e => {
        categories[e.category] =
            (categories[e.category] || 0)
            + e.amt;
    });

    progressContainer.innerHTML =
        Object.keys(categories)
            .map(key => `
<p>${key}</p>
<div class="progress">
<div
class="progress-bar"
style="width:${categories[key] / 10}%">
₹${categories[key]}
</div>
</div>
`)
            .join('');
}

function createCategoryTotals() {
    let categories = {};
    expenses.forEach(e => {
        categories[e.category] =
            (categories[e.category] || 0)
            + e.amt;
    });
    categoryTotals.innerHTML =
        Object.keys(categories)
            .map(key =>
                `<p>${key}: ₹${categories[key]}</p>`
            )
            .join('');
}

function drawCharts() {

    if (pieChartObj) pieChartObj.destroy();
    if (barChartObj) barChartObj.destroy();
    if (trendChartObj) trendChartObj.destroy();
    let categoryData = {};
    let monthData = {};

    expenses.forEach(e => {

        categoryData[e.category] =
            (categoryData[e.category] || 0)
            + e.amt;
        if (e.date) {
            let month =
                new Date(e.date)
                    .toLocaleString(
                        'default',
                        { month: 'short' }
                    );

            monthData[month] =
                (monthData[month] || 0)
                + e.amt;
        }
    });

    pieChartObj = new Chart(
        pieChart,
        {
            type: 'pie',
            data: {
                labels: Object.keys(categoryData),
                datasets: [{
                    data: Object.values(categoryData)
                }]
            }
        }
    );

    barChartObj = new Chart(
        barChart,
        {
            type: 'bar',
            data: {
                labels: Object.keys(monthData),
                datasets: [{
                    label: 'Monthly Spending',
                    data: Object.values(monthData)
                }]
            }
        }
    );

    trendChartObj = new Chart(
        trendChart,
        {
            type: 'line',
            data: {
                labels: expenses.map(
                    e => e.date || "No Date"
                ),
                datasets: [{
                    label: 'Expense Trend',
                    data: expenses.map(
                        e => e.amt
                    ),
                    fill: false
                }]
            }
        }
    );

}


searchInput.addEventListener(
    "input",
    render
);

filter.addEventListener(
    "change",
    render
);

sort.addEventListener(
    "change",
    render
);


// CSV Export
csvBtn.onclick = () => {

    let csv = "Description,Amount,Date,Category\n";

    expenses.forEach(e => {

        csv +=
            `"${e.desc}","${e.amt}","${e.date}","${e.category}"\n`;

    });

    let blob = new Blob(
        [csv],
        { type: "text/csv;charset=utf-8;" }
    );

    let link =
        document.createElement("a");

    link.href =
        URL.createObjectURL(blob);

    link.download =
        "expenses.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

}

// PDF Export

pdfBtn.onclick = () => {

    const { jsPDF } = window.jspdf;

    let doc =
        new jsPDF();

    doc.text(
        "Expense Report",
        20,
        20
    );

    let y = 40;

    expenses.forEach(e => {

        doc.text(
            `${e.desc} ₹${e.amt} ${e.date} ${e.category}`,
            20,
            y
        );

        y += 10;

        if (y > 270) {

            doc.addPage();

            y = 20;

        }

    });

    doc.save(
        "expenses.pdf"
    );

};