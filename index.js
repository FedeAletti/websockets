const express = require('express');
const app = express();
const { engine } = require('express-handlebars');
const fs = require('fs');
const PORT = 8080;

const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer, {
  cors: { origin: '*' },
});

app.use(express.json());
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));

app.use('/public', express.static(__dirname + '/public'));

app.set('view engine', 'hbs');
app.set('views', './views');
app.engine(
  'hbs',
  engine({
    extname: '.hbs',
    defaultLayout: 'index.hbs',
    layoutsDir: __dirname + '/views/layouts',
    partialsDir: __dirname + '/views/partials',
  })
);

let productsHC = [
  {
    title: 'Zomo Dry Zahara',
    price: 680,
    thumbnail: 'https://cdn.zomoofficial.com/wp-content/uploads/2020/02/ZOMO_2019_PY_50G_DRY_SAHARA.jpg',
    id: 1,
  },
  {
    title: 'Zomo Framboera',
    price: 600,
    thumbnail: 'https://cdn.zomoofficial.com/wp-content/uploads/2020/11/ZOMO_2019_PY_50G_FRAMBOERA.png',
    id: 2,
  },
  {
    title: 'Zomo Cola Mint',
    price: 680,
    thumbnail: 'https://cdn.zomoofficial.com/wp-content/uploads/2020/02/ZOMO_2019_PY_50G_COLA_MINT.jpg',
    id: 3,
  },
];

class Chat {
  constructor(nombreArchivo) {
    this.nombreArchivo = `./assets/chat/${nombreArchivo}.json`;
  }

  async getData() {
    try {
      return await fs.promises.readFile(this.nombreArchivo, 'utf8');
    } catch (err) {
      if (err.code == 'ENOENT') {
        fs.writeFile(this.nombreArchivo, '[]', (err) => {
          if (err) throw err;
          console.log('Se creo el archivo');
        });
      }
    }
  }

  async getAll() {
    const data = await this.getData();
    // console.log(data); //data;
    return JSON.parse(data);
  }

  async save(obj) {
    try {
      let fileContent = await this.getData();
      let jsonContent = JSON.parse(fileContent);
      let array = [];
      const indice = jsonContent.map((x) => x.id).sort();
      obj.id = indice[indice.length - 1] + 1;

      if (!obj.id) {
        obj.id = 1;
        array = [{ ...obj }];
        await fs.promises.writeFile(this.nombreArchivo, JSON.stringify(array));
        return array[0].id;
      }

      jsonContent.push(obj);

      await fs.promises.writeFile(this.nombreArchivo, JSON.stringify(jsonContent));
    } catch (err) {
      console.log(err);
    }
  }
}

app.get('/', (req, res) => {
  //sirve productslist.hbs en index.hbs (index.hbs es la plantilla por defecto donde arranca todo)
  res.render('productslist', { root: __dirname + '/public' });
});

app.get('/products/:id', (req, res) => {
  const { id } = req.params;
  console.log(id);
  const found = productsHC.find((product) => product.id == id);

  try {
    const found = productsHC.find((product) => product.id == id);
    if (found) {
      res.render('product', { product: found, productsExist: true });
    } else {
      res.render('errorTemplate', { errorMessage: `Producto de id ${id} no encontrado` });
    }
  } catch (error) {
    res.render('product', { productsExist: false });
  }
});

let chat = [
  {
    id: 0,
    email: 'admin@admin.com',
    message: 'Bienvenido al chat',
    date: new Date().toLocaleString(),
  },
];
const chatList = new Chat('chatlist');

io.on('connection', (socket) => {
  console.log('Usuario Conectado ' + socket.id);
  socket.emit('products', productsHC);

  chatList
    .getAll()
    .then((data) => {
      chat = [...chat, ...data];
      socket.emit('chat', chat);
    })
    .catch((err) => {
      socket.emit('chat', chat);
    });

  socket.on('newMessage', (msg) => {
    chat.push(msg);
    chatList.save(msg);
    try {
      io.sockets.emit('chat', chat);
    } catch (err) {
      console.log(err);
    }
  });

  socket.on('addProduct', (product) => {
    productsHC.push(product);
    io.sockets.emit('products', productsHC);
  });
});

httpServer.listen(process.env.PORT || 8080, () => console.log('SERVER ON'));
