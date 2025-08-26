const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost', //IP do pc q hospeda o mysql
    user: 'root',
    password: '',
    database: 'polpas'
});

db.connect(err => {
    if (err) {
        console.error('Erro ao conectar no banco:', err);
    } else {
        console.log('Conectado ao banco de dados');
    }
});

module.exports = db;
