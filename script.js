let products = [];
let cart = [];
let selectedProduct = null;

const productContainer = document.getElementById('productContainer');
const searchInput = document.getElementById('searchInput');
const cartCount = document.getElementById('cartCount');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');

const quantityModal = new bootstrap.Modal(document.getElementById('quantityModal'));
const cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
const paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));

async function fetchProducts() {
  try {
    const response = await fetch('https://fakestoreapi.com/products');
    products = await response.json();
    renderProducts(products);
  } catch (error) {
    console.error('Error al obtener productos:', error);
  }
}

function renderProducts(productList) {
  productContainer.innerHTML = '';
  productList.forEach(product => {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4';
    col.innerHTML = `
      <div class="card h-100">
        <img src="${product.image}" class="card-img-top" alt="${product.title}">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${product.title}</h5>
          <p class="card-text">$${product.price.toFixed(2)}</p>
          <button class="btn btn-outline-primary mt-auto add-to-cart" data-id="${product.id}">Añadir al carrito</button>
        </div>
      </div>
    `;
    productContainer.appendChild(col);
  });

  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', (e) => {
      const productId = e.target.getAttribute('data-id');
      selectedProduct = products.find(p => p.id == productId);
      document.getElementById('productQuantity').value = 1;
      quantityModal.show();
    });
  });
}

function updateCartCount() {
  let count = cart.reduce((acc, item) => acc + item.quantity, 0);
  cartCount.textContent = count;
}

function addToCart(product, quantity) {
  const existingItem = cart.find(item => item.id === product.id);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({ ...product, quantity });
  }
  updateCartCount();
}

function renderCart() {
  cartItems.innerHTML = '';
  let total = 0;
  cart.forEach(item => {
    total += item.price * item.quantity;
    const div = document.createElement('div');
    div.className = 'd-flex justify-content-between align-items-center mb-2';
    div.innerHTML = `
      <div>
        <strong>${item.title}</strong> (x${item.quantity})
      </div>
      <div>$${(item.price * item.quantity).toFixed(2)}</div>
    `;
    cartItems.appendChild(div);
  });
  cartTotal.textContent = total.toFixed(2);
}

document.getElementById('addToCartConfirm').addEventListener('click', () => {
  const quantity = parseInt(document.getElementById('productQuantity').value);
  if (selectedProduct && quantity > 0) {
    addToCart(selectedProduct, quantity);
    quantityModal.hide();
  }
});

document.getElementById('cartIcon').addEventListener('click', (e) => {
  e.preventDefault();
  renderCart();
  cartModal.show();
});

searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase();
  const filtered = products.filter(product =>
    product.title.toLowerCase().includes(query) ||
    product.category.toLowerCase().includes(query)
  );
  renderProducts(filtered);
});

document.getElementById('paymentForm').addEventListener('submit', (e) => {
  e.preventDefault();
  generatePDFInvoice();
  paymentModal.hide();
  cart = [];
  updateCartCount();
  alert('Pago procesado y factura generada.');
});

document.getElementById('openPaymentForm').addEventListener('click', () => {
  cartModal.hide();
  paymentModal.show();
});

/**
 * Función mejorada para generar la factura en PDF utilizando jsPDF
 */
function generatePDFInvoice() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const headerHeight = 30;
  const primaryColor = [255, 111, 97]; // rgb de #ff6f61

  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text("Factura de Compra", pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  const payerName = document.getElementById('payerName').value || "Cliente";
  const fecha = new Date().toLocaleString();
  doc.text(`Nombre del Cliente: ${payerName}`, 10, headerHeight + 10);
  doc.text(`Fecha: ${fecha}`, pageWidth - 10, headerHeight + 10, { align: 'right' });

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(10, headerHeight + 15, pageWidth - 10, headerHeight + 15);

  let startY = headerHeight + 25;
  doc.setFillColor(230, 230, 230);
  doc.rect(10, startY, pageWidth - 20, 10, 'F');
  doc.setFontSize(12);
  doc.text("Producto", 15, startY + 7);
  doc.text("Cantidad", pageWidth / 2 - 20, startY + 7);
  doc.text("Total", pageWidth - 40, startY + 7);

  startY += 12;
  cart.forEach(item => {
    doc.text(`${item.title}`, 15, startY);
    doc.text(`${item.quantity}`, pageWidth / 2 - 20, startY);
    doc.text(`$${(item.price * item.quantity).toFixed(2)}`, pageWidth - 40, startY);
    startY += 8;
  });

  
  doc.line(10, startY, pageWidth - 10, startY);

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  doc.setFontSize(14);
  doc.text(`Total a pagar: $${total.toFixed(2)}`, 15, startY + 12);

 
  doc.save('factura.pdf');
}


fetchProducts();
