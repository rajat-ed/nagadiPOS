// Initialize data from localStorage or set defaults
let products = JSON.parse(localStorage.getItem('products')) || [];
let cart = [];
let sessions = []; // Reset on refresh, not loaded from localStorage initially
let settings = JSON.parse(localStorage.getItem('settings')) || {
    businessName: '',
    currency: 'Rs.'
};
let userName = null; // Reset on refresh

// Unique colors for products
const productColors = [
    { bg: '#ff6b6b', fg: '#fff' },  // Red
    { bg: '#4ecdc4', fg: '#000' },  // Teal
    { bg: '#f7d794', fg: '#000' },  // Yellow
    { bg: '#45b7d1', fg: '#fff' },  // Blue
    { bg: '#96ceb4', fg: '#000' },  // Green
    { bg: '#ffeead', fg: '#000' },  // Light Yellow
    { bg: '#d4a5a5', fg: '#000' },  // Pink
    { bg: '#9b59b6', fg: '#fff' },  // Purple
    { bg: '#e74c3c', fg: '#fff' },  // Dark Red
    { bg: '#3498db', fg: '#fff' }   // Dark Blue
];

// Handle refresh: reset sessions and userName, preserve other data
document.addEventListener('DOMContentLoaded', () => {
    // Reset sessions and userName on every refresh
    sessions = [];
    localStorage.setItem('sessions', JSON.stringify(sessions));
    userName = prompt('Please enter your name:') || 'User';
    localStorage.setItem('userName', userName);

    // Load persistent data
    loadProducts();
    loadHistory();
    loadLogo();
    loadSettings();
    document.getElementById('paid-amount').addEventListener('input', calculateChange);
});

// Add product to catalog
function addProduct() {
    const name = document.getElementById('product-name').value.trim();
    const price = parseFloat(document.getElementById('product-price').value);
    
    if (name && !isNaN(price) && price > 0) {
        const product = { name, price };
        products.push(product);
        localStorage.setItem('products', JSON.stringify(products));
        loadProducts();
        loadRemoveProductOptions();
        
        document.getElementById('product-name').value = '';
        document.getElementById('product-price').value = '';
    } else {
        alert('Please enter a valid product name and price.');
    }
}

// Load products into grid
function loadProducts() {
    const grid = document.getElementById('products');
    grid.innerHTML = '';
    products.forEach((product, index) => {
        const div = document.createElement('div');
        div.className = `product-item color-${(index % productColors.length) + 1}`;
        div.textContent = `${product.name}\n${settings.currency}${product.price.toFixed(2)}`;
        div.onclick = () => addToCart(product);
        grid.appendChild(div);
    });
}

// Add to cart
function addToCart(product) {
    cart.push(product);
    updateCart();
}

// Update cart display
function updateCart() {
    const cartItems = document.getElementById('cart-items');
    cartItems.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        total += item.price;
        const li = document.createElement('li');
        li.className = `color-${(products.findIndex(p => p.name === item.name) % productColors.length) + 1}`;
        li.textContent = `${item.name} - ${settings.currency}${item.price.toFixed(2)}`;
        cartItems.appendChild(li);
    });

    document.getElementById('cart-total').textContent = total.toFixed(2);
    document.getElementById('currency').textContent = settings.currency;
    document.getElementById('checkout-panel').style.display = 'none';
    document.getElementById('checkout-btn').disabled = cart.length === 0;
}

// Start checkout process
function startCheckout() {
    if (cart.length === 0) return;

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const itemList = cart.map(item => `${item.name} - ${settings.currency}${item.price.toFixed(2)}`).join('\n');

    const checkoutPanel = document.getElementById('checkout-panel');
    document.getElementById('checkout-items').textContent = itemList;
    document.getElementById('checkout-total').textContent = total.toFixed(2);
    document.getElementById('checkout-total-currency').textContent = settings.currency;
    document.getElementById('paid-amount').value = '';
    document.getElementById('change-amount').textContent = '0.00';
    document.getElementById('change-currency').textContent = settings.currency;
    document.getElementById('payment-error').style.display = 'none';
    document.getElementById('complete-checkout-btn').disabled = true;
    checkoutPanel.style.display = 'block';
}

// Calculate change and enable checkout button
function calculateChange() {
    const total = parseFloat(document.getElementById('checkout-total').textContent) || 0;
    const paid = parseFloat(document.getElementById('paid-amount').value) || 0;
    const change = paid - total;
    const errorElement = document.getElementById('payment-error');
    const completeBtn = document.getElementById('complete-checkout-btn');

    document.getElementById('change-amount').textContent = change >= 0 ? change.toFixed(2) : '0.00';
    
    if (paid < total && paid > 0) {
        errorElement.style.display = 'block';
        completeBtn.disabled = true;
    } else if (paid >= total) {
        errorElement.style.display = 'none';
        completeBtn.disabled = false;
    } else {
        errorElement.style.display = 'none';
        completeBtn.disabled = true;
    }
}

// Complete checkout
function completeCheckout() {
    const total = parseFloat(document.getElementById('checkout-total').textContent) || 0;
    const paid = parseFloat(document.getElementById('paid-amount').value) || 0;
    const change = paid - total;

    if (isNaN(paid) || paid <= 0 || paid < total) {
        alert('Please enter a valid amount paid that is at least equal to the total.');
        return;
    }

    const transaction = {
        date: new Date().toLocaleString(),
        items: [...cart],
        total: total,
        paid: paid,
        change: change,
        businessName: settings.businessName || 'NagadiPOS',
        cashier: userName
    };

    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const businessName = settings.businessName || 'NagadiPOS';
    const sessionNumber = String(sessions.length + 1).padStart(4, '0');
    const sessionId = `${dateStr}_${businessName}_${userName}_${sessionNumber}`;
    const currentSession = sessions.length > 0 && sessions[0].transactions.length < 10 ? sessions[0] : { sessionId, transactions: [] };
    currentSession.transactions.unshift(transaction);
    if (!sessions.includes(currentSession)) sessions.unshift(currentSession);
    localStorage.setItem('sessions', JSON.stringify(sessions));
    
    cart = [];
    updateCart();
    loadHistory();
}

// Clear cart
function clearCart() {
    cart = [];
    updateCart();
}

// Clear all sessions
function clearSessions() {
    if (confirm('Are you sure you want to clear all sessions? This action cannot be undone.')) {
        sessions = [];
        localStorage.setItem('sessions', JSON.stringify(sessions));
        loadHistory();
    }
}

// Helper function to format items with counts and totals
function formatItems(items) {
    const itemCount = {};
    items.forEach(item => {
        const key = `${item.name} - ${settings.currency}${item.price.toFixed(2)}`;
        itemCount[key] = (itemCount[key] || { count: 0, total: 0 });
        itemCount[key].count += 1;
        itemCount[key].total += item.price;
    });
    return Object.entries(itemCount).map(([item, { count, total }]) => 
        count > 1 ? `${item} (x${count} - ${settings.currency}${total.toFixed(2)})` : item
    ).join('\n');
}

// Load transaction history by sessions
function loadHistory() {
    const sessionContainer = document.getElementById('session-container');
    sessionContainer.innerHTML = '';

    sessions.forEach((session) => {
        const sessionDiv = document.createElement('div');
        sessionDiv.className = 'session';
        sessionDiv.innerHTML = `
            <h3>${session.sessionId}</h3>
            <table class="session-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Paid</th>
                        <th>Change</th>
                        <th>Cashier</th>
                    </tr>
                </thead>
                <tbody id="session-${session.sessionId}"></tbody>
            </table>
            <div class="session-buttons">
                <button onclick="exportSession('${session.sessionId}')">Export Session</button>
            </div>
        `;

        const tbody = sessionDiv.querySelector(`#session-${session.sessionId}`);
        session.transactions.forEach((transaction) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${transaction.date}</td>
                <td>${formatItems(transaction.items)}</td>
                <td>${settings.currency}${transaction.total.toFixed(2)}</td>
                <td>${settings.currency}${transaction.paid.toFixed(2)}</td>
                <td>${settings.currency}${transaction.change.toFixed(2)}</td>
                <td>${transaction.cashier}</td>
            `;
            tbody.appendChild(tr);
        });

        sessionContainer.appendChild(sessionDiv);
    });
}

// Remove product
function removeProduct() {
    const select = document.getElementById('remove-product');
    const name = select.value;
    if (name) {
        products = products.filter(p => p.name !== name);
        localStorage.setItem('products', JSON.stringify(products));
        loadProducts();
        loadRemoveProductOptions();
    }
}

function loadRemoveProductOptions() {
    const select = document.getElementById('remove-product');
    select.innerHTML = '<option value="">Select Product</option>';
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.name;
        option.textContent = product.name;
        select.appendChild(option);
    });
}

// Upload logo
function uploadLogo() {
    const fileInput = document.getElementById('logo-upload');
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const logo = document.getElementById('logo');
            logo.src = e.target.result;
            logo.style.display = 'block';
            localStorage.setItem('logo', e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

// Load logo from localStorage
function loadLogo() {
    const logoData = localStorage.getItem('logo');
    if (logoData) {
        const logo = document.getElementById('logo');
        logo.src = logoData;
        logo.style.display = 'block';
    }
}

// Load and save settings
function loadSettings() {
    document.getElementById('business-name').value = settings.businessName;
    document.getElementById('business-title').textContent = settings.businessName ? `${settings.businessName} NagadiPOS` : 'NagadiPOS';
    loadRemoveProductOptions();

    document.getElementById('business-name').addEventListener('change', saveSettings);
}

function saveSettings() {
    settings.businessName = document.getElementById('business-name').value.trim();
    localStorage.setItem('settings', JSON.stringify(settings));
    document.getElementById('business-title').textContent = settings.businessName ? `${settings.businessName} NagadiPOS` : 'NagadiPOS';
    updateCart();
    loadProducts();
}

// Tab switching
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`[onclick="showTab('${tabId}')"]`).classList.add('active');
}

// Filter transactions by date range
function filterTransactionsByRange(range) {
    const now = new Date();
    let cutoff;
    const allTransactions = sessions.flatMap(session => session.transactions);

    switch (range) {
        case 'last':
            return allTransactions.slice(0, 1);
        case '1day':
            cutoff = new Date(now.setDate(now.getDate() - 1));
            break;
        case '1week':
            cutoff = new Date(now.setDate(now.getDate() - 7));
            break;
        case '1month':
            cutoff = new Date(now.setMonth(now.getMonth() - 1));
            break;
        case '3months':
            cutoff = new Date(now.setMonth(now.getMonth() - 3));
            break;
        case '6months':
            cutoff = new Date(now.setMonth(now.getMonth() - 6));
            break;
        case '1year':
            cutoff = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
        default:
            return allTransactions;
    }

    return allTransactions.filter(t => new Date(t.date) >= cutoff);
}

// Export bills by range
function exportBillsByRange() {
    const range = document.getElementById('export-range').value;
    const filteredTransactions = filterTransactionsByRange(range);
    exportToPDF(filteredTransactions, `NagadiPOS_${range === 'last' ? 'Last_Bill' : range.replace(/(\d+)(\w+)/, '$1_$2')}`);
}

// Export bills for a specific session
function exportSession(sessionId) {
    const session = sessions.find(s => s.sessionId === sessionId);
    if (session && session.transactions.length > 0) {
        exportToPDF(session.transactions, `NagadiPOS_Session_${sessionId}`);
    } else {
        alert('No transactions in this session!');
    }
}

// Professional shopping mall bill format
function exportToPDF(transactions, filename) {
    if (transactions.length === 0) {
        alert('No transactions to export!');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        unit: 'mm',
        format: 'a4',
        compress: true
    });
    let y = 10;

    transactions.forEach((transaction, index) => {
        const itemCount = {};
        transaction.items.forEach(item => {
            const key = `${item.name}`;
            itemCount[key] = (itemCount[key] || { count: 0, price: item.price, total: 0 });
            itemCount[key].count += 1;
            itemCount[key].total += item.price;
        });
        const itemLines = Object.keys(itemCount).length;
        const billHeightEstimate = 30 + (itemLines * 5) + 25;

        if (y + billHeightEstimate > 280) {
            doc.addPage();
            y = 10;
        }

        // Header
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(`${transaction.businessName}`, 105, y, { align: 'center' });
        y += 5;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Cashier: ' + transaction.cashier, 105, y, { align: 'center' });
        y += 5;
        doc.text('Date: ' + transaction.date, 105, y, { align: 'center' });
        y += 5;
        doc.line(10, y, 200, y);
        y += 5;

        // Itemized List Header
        doc.setFontSize(9);
        doc.text('Item', 10, y);
        doc.text('Qty', 130, y, { align: 'right' });
        doc.text('Rate', 160, y, { align: 'right' });
        doc.text('Amount', 190, y, { align: 'right' });
        y += 2;
        doc.line(10, y, 200, y);
        y += 5;

        // Items
        Object.entries(itemCount).forEach(([name, { count, price, total }]) => {
            if (y > 280) {
                doc.addPage();
                y = 10;
            }
            const displayText = doc.splitTextToSize(name, 100)[0];
            doc.text(displayText, 10, y);
            doc.text(String(count), 130, y, { align: 'right' });
            doc.text(`${settings.currency}${price.toFixed(2)}`, 160, y, { align: 'right' });
            doc.text(`${settings.currency}${total.toFixed(2)}`, 190, y, { align: 'right' });
            y += 5;
        });

        // Summary
        y += 2;
        doc.line(10, y, 200, y);
        y += 5;
        doc.setFontSize(10);
        doc.text('Total', 160, y, { align: 'right' });
        doc.text(`${settings.currency}${transaction.total.toFixed(2)}`, 190, y, { align: 'right' });
        y += 5;
        doc.text('Paid', 160, y, { align: 'right' });
        doc.text(`${settings.currency}${transaction.paid.toFixed(2)}`, 190, y, { align: 'right' });
        y += 5;
        doc.text('Change', 160, y, { align: 'right' });
        doc.text(`${settings.currency}${transaction.change.toFixed(2)}`, 190, y, { align: 'right' });
        y += 5;
        doc.line(10, y, 200, y);
        y += 5;
        doc.setFontSize(8);
        doc.text('Thank you!', 105, y, { align: 'center' });
        y += 5;
    });

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('NagadiPOS by Rajat', 10, 292);

    doc.save(`${filename}_${new Date().toLocaleString().replace(/[,:/]/g, '-')}.pdf`);
}

// Sale Summary Logic
function getSaleSummary(range) {
    const now = new Date();
    let cutoff;
    const allTransactions = sessions.flatMap(session => session.transactions);

    switch (range) {
        case 'daily':
            cutoff = new Date(now.setDate(now.getDate() - 1));
            break;
        case 'weekly':
            cutoff = new Date(now.setDate(now.getDate() - 7));
            break;
        default:
            return { items: {}, total: 0, transactions: 0 };
    }

    const filteredTransactions = allTransactions.filter(t => new Date(t.date) >= cutoff);
    const summary = {
        items: {},
        total: 0,
        transactions: filteredTransactions.length
    };

    filteredTransactions.forEach(transaction => {
        summary.total += transaction.total;
        transaction.items.forEach(item => {
            const key = `${item.name} - ${settings.currency}${item.price.toFixed(2)}`;
            summary.items[key] = (summary.items[key] || { count: 0, total: 0 });
            summary.items[key].count += 1;
            summary.items[key].total += item.price;
        });
    });

    return summary;
}

function viewSaleSummary() {
    const range = document.getElementById('summary-range').value;
    const summary = getSaleSummary(range);
    const summaryList = document.getElementById('summary-list');
    summaryList.innerHTML = '';

    Object.entries(summary.items).forEach(([item, { count, total }]) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item}</td>
            <td>${count}</td>
            <td>${settings.currency}${total.toFixed(2)}</td>
        `;
        summaryList.appendChild(tr);
    });

    document.getElementById('summary-total-amount').textContent = summary.total.toFixed(2);
    document.getElementById('summary-transactions').textContent = summary.transactions;
    document.getElementById('summary-total').style.display = 'block';
}

function exportSaleSummary() {
    const range = document.getElementById('summary-range').value;
    const summary = getSaleSummary(range);

    if (Object.keys(summary.items).length === 0) {
        alert('No sales data for the selected range!');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        unit: 'mm',
        format: 'a4',
        compress: true
    });
    let y = 10;

    // Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`${settings.businessName || 'NagadiPOS'} Sale Summary`, 105, y, { align: 'center' });
    y += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${range.charAt(0).toUpperCase() + range.slice(1)} Report`, 105, y, { align: 'center' });
    y += 5;
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, y, { align: 'center' });
    y += 5;
    doc.line(10, y, 200, y);
    y += 5;

    // Summary Table Header
    doc.setFontSize(9);
    doc.text('Item', 10, y);
    doc.text('Qty Sold', 130, y, { align: 'right' });
    doc.text('Total Amount', 190, y, { align: 'right' });
    y += 2;
    doc.line(10, y, 200, y);
    y += 5;

    // Items
    Object.entries(summary.items).forEach(([item, { count, total }]) => {
        if (y > 280) {
            doc.addPage();
            y = 10;
        }
        const displayText = doc.splitTextToSize(item, 100)[0];
        doc.text(displayText, 10, y);
        doc.text(String(count), 130, y, { align: 'right' });
        doc.text(`${settings.currency}${total.toFixed(2)}`, 190, y, { align: 'right' });
        y += 5;
    });

    // Total Summary
    y += 2;
    doc.line(10, y, 200, y);
    y += 5;
    doc.setFontSize(10);
    doc.text('Total Sales', 160, y, { align: 'right' });
    doc.text(`${settings.currency}${summary.total.toFixed(2)}`, 190, y, { align: 'right' });
    y += 5;
    doc.text('Transactions', 160, y, { align: 'right' });
    doc.text(String(summary.transactions), 190, y, { align: 'right' });
    y += 5;
    doc.line(10, y, 200, y);

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('NagadiPOS by Rajat', 10, 292);

    doc.save(`NagadiPOS_${range}_Summary_${new Date().toLocaleString().replace(/[,:/]/g, '-')}.pdf`);
}
