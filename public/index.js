const socket = io();

socket.on('connection', () => {
  console.log('Usuario Conectado');
});

function renderProds(products) {
  const html = products.reduce(
    (html, item) =>
      `
          <div class="col-md-5 my-2">
            <div class="card">
              <img src="${item.thumbnail}" alt="${item.title}">
              <div class="card-body">
                <h3>${item.title}</h3>
                ${item.description ? `<p>${item.description}</p>` : ''}
                <p class="badge bg-success">$ ${item.price}</p>
              </div>
            </div>
          </div>
        ` + html,
    ''
  );
  document.getElementById('products').innerHTML = html;
}

function renderMsgs(msgs) {
  document.getElementById('chat').innerHTML = '';
  const html = msgs.reduce(
    (html, item) =>
      html +
      `
                <div class="message">
                    <span ${item.email === 'admin@admin.com' ? "class='badge bg-danger'" : "class='badge bg-dark'"}>${item.email}</span>: ${item.message}
                    <br>
                    <small class="">${item.date}</small>
                </div>
            `,
    ''
  );
  document.getElementById('chat').innerHTML = html;
}

function addMessage(messageData) {
  let messageToAdd = {
    email: messageData.email.value,
    message: messageData.message.value,
    date: new Date().toLocaleString(),
  };
  socket.emit('newMessage', messageToAdd);
}

function addProduct(productData) {
  let productToAdd = {
    title: productData.title.value,
    price: productData.price.value,
    thumbnail: productData.price.value,
  };
  socket.emit('addProduct', productToAdd);
}

socket.on('products', (data) => {
  renderProds(data);
});

socket.on('chat', (data) => {
  renderMsgs(data);
});
