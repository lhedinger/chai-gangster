import path from 'path';

global.__dirname = path.resolve('./');
console.log(__dirname);