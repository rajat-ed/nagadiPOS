// Initialize data from localStorage or set defaults
let products = JSON.parse(localStorage.getItem('products')) || [];
let cart = [];
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let settings = JSON.parse(localStorage.getItem('settings')) || {
    businessName: '',
    currency: '$'
};

// Load data on page load
document.addEventListener('DOMContentLoaded', () => {
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
    products.forEach((product) => {
        const div = document.createElement('div');
        div.className = 'product-item';
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

    cart.forEach((item) => {
        total += item.price;
        const li = document.createElement('li');
        li.textContent = `${item.name} - ${settings.currency}${item.price.toFixed(2)}`;
        cartItems.appendChild(li);
    });

    document.getElementById('cart-total').textContent = total.toFixed(2);
    document.getElementById('currency').textContent = settings.currency;
    document.getElementById('checkout-panel').style.display = 'none';
}

// Start checkout process
function startCheckout() {
    if (cart.length === 0) {
        alert('Cart is empty!');
        return;
    }

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const itemList = cart.map(item => `${item.name} - ${settings.currency}${item.price.toFixed(2)}`).join('\n');

    const checkoutPanel = document.getElementById('checkout-panel');
    document.getElementById('checkout-items').textContent = itemList;
    document.getElementById('checkout-total').textContent = total.toFixed(2);
    document.getElementById('checkout-total-currency').textContent = settings.currency;
    document.getElementById('payment-section').style.display = 'none';
    document.getElementById('confirm-items-btn').style.display = 'block';
    checkoutPanel.style.display = 'block';
}

// Confirm items and show payment section
function confirmItems() {
    document.getElementById('payment-section').style.display = 'block';
    document.getElementById('confirm-items-btn').style.display = 'none';
    document.getElementById('paid-amount').value = '';
    document.getElementById('change-amount').textContent = '0.00';
    document.getElementById('change-currency').textContent = settings.currency;
    document.getElementById('payment-error').style.display = 'none';
}

// Calculate change and show error if paid < total
function calculateChange() {
    const total = parseFloat(document.getElementById('checkout-total').textContent) || 0;
    const paid = parseFloat(document.getElementById('paid-amount').value) || 0;
    const change = paid - total;
    const errorElement = document.getElementById('payment-error');

    document.getElementById('change-amount').textContent = change >= 0 ? change.toFixed(2) : '0.00';
    
    if (paid < total && paid > 0) {
        errorElement.style.display = 'block';
    } else {
        errorElement.style.display = 'none';
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
        businessName: settings.businessName || 'NagadiPOS'
    };

    transactions.unshift(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    cart = [];
    updateCart();
    loadHistory();
}

// Clear cart
function clearCart() {
    cart = [];
    updateCart();
}

// Helper function to format items with counts
function formatItems(items) {
    const itemCount = {};
    items.forEach(item => {
        const key = `${item.name} - ${settings.currency}${item.price.toFixed(2)}`;
        itemCount[key] = (itemCount[key] || 0) + 1;
    });
    return Object.entries(itemCount).map(([item, count]) => 
        count > 1 ? `${item} (x${count})` : item
    ).join('\n');
}

// Load transaction history as table
function loadHistory() {
    const transactionList = document.getElementById('transaction-list');
    transactionList.innerHTML = '';

    transactions.forEach((transaction) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${transaction.date}</td>
            <td>${formatItems(transaction.items)}</td>
            <td>${settings.currency}${transaction.total.toFixed(2)}</td>
            <td>${settings.currency}${transaction.paid.toFixed(2)}</td>
            <td>${settings.currency}${transaction.change.toFixed(2)}</td>
        `;
        transactionList.appendChild(tr);
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
    document.getElementById('currency-symbol').value = settings.currency;
    document.getElementById('business-title').textContent = settings.businessName ? `${settings.businessName} NagadiPOS` : 'NagadiPOS';
    loadRemoveProductOptions();

    document.getElementById('business-name').addEventListener('change', saveSettings);
    document.getElementById('currency-symbol').addEventListener('change', saveSettings);
}

function saveSettings() {
    settings.businessName = document.getElementById('business-name').value.trim();
    settings.currency = document.getElementById('currency-symbol').value.trim() || '$';
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

    switch (range) {
        case 'last':
            return transactions.slice(0, 1);
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
            return transactions;
    }

    return transactions.filter(t => new Date(t.date) >= cutoff);
}

// Export bills by selected range
function exportBillsByRange() {
    const range = document.getElementById('export-range').value;
    const filteredTransactions = filterTransactionsByRange(range);

    if (filteredTransactions.length === 0) {
        alert('No transactions in the selected range!');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        unit: 'mm',
        format: 'a4',
        compress: true
    });
    let y = 10;

    filteredTransactions.forEach((transaction, index) => {
        if (y > 280) {
            doc.addPage();
            y = 10;
        }

        // Header
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(`${transaction.businessName} NagadiPOS`, 10, y);
        y += 5;

        // Date
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Date: ${transaction.date}`, 10, y);
        y += 8;

        // Items
        const itemCount = {};
        transaction.items.forEach(item => {
            const key = `${item.name} - ${settings.currency}${item.price.toFixed(2)}`;
            itemCount[key] = (itemCount[key] || 0) + 1;
        });

        Object.entries(itemCount).forEach(([item, count]) => {
            if (y > 280) {
                doc.addPage();
                y = 10;
            }
            const [name, price] = item.split(' - ');
            const displayText = count > 1 ? `${name} (x${count})` : name;
            const priceText = count > 1 ? `${price} (x${count})` : price;
            const maxWidth = 140;
            const truncatedName = doc.splitTextToSize(displayText, maxWidth)[0];
            doc.text(truncatedName, 10, y);
            doc.text(priceText, 190, y, { align: 'right' });
            y += 5;
        });

        // Summary
        y += 2;
        doc.line(10, y, 190, y);
        y += 5;
        doc.setFontSize(9);
        doc.text(`Total: ${settings.currency}${transaction.total.toFixed(2)}`, 190, y, { align: 'right' });
        y += 5;
        doc.text(`Paid: ${settings.currency}${transaction.paid.toFixed(2)}`, 190, y, { align: 'right' });
        y += 5;
        doc.text(`Change: ${settings.currency}${transaction.change.toFixed(2)}`, 190, y, { align: 'right' });
        y += 10;
    });

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('NagadiPOS | Rajat', 10, 292);
    doc.text('Thank you!', 190, 292, { align: 'right' });

    const rangeText = range === 'last' ? 'Last_Bill' : range.replace(/(\d+)(\w+)/, '$1_$2');
    doc.save(`NagadiPOS_${rangeText}_${new Date().toLocaleString().replace(/[,:/]/g, '-')}.pdf`);
}