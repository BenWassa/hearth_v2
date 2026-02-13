const app = require('./app');

const PORT = Number.parseInt(process.env.PORT || '8080', 10);

app.listen(PORT, () => {
  console.log(`Hearth server listening on port ${PORT}`);
});
