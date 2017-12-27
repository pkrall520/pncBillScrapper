const dbConfig = require('./db.json');
const mysql = require('mysql');

const con = mysql.createConnection(dbConfig);
// con.query('UPDATE users SET foo = ?, bar = ?, baz = ? WHERE id = ?', ['a', 'b', 'c', userId]);
