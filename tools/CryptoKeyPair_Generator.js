const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

module.exports = generateKeyPair
function generateKeyPair() {
    if (!fs.existsSync(path.join(process.cwd(), 'CryptoKeyPair', 'publicKey.pem')) || !fs.existsSync(path.join(process.cwd(), 'CryptoKeyPair', 'privateKey.pem'))) {
        const {publicKey, privateKey} = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem',
            },
            privateKeyEncoding: {
                type: 'pkcs1',
                format: 'pem',
            },
        });

        if (!fs.existsSync(path.join(process.cwd(), 'CryptoKeyPair'))) {
            fs.mkdirSync(path.join(process.cwd(), 'CryptoKeyPair'));
        }

        fs.writeFileSync(path.join(process.cwd(), 'CryptoKeyPair', 'publicKey.pem'), publicKey)
        fs.writeFileSync(path.join(process.cwd(), 'CryptoKeyPair', 'privateKey.pem'), privateKey)

        console.log('A key pair has been generated.')
    } else {
        console.log('The key pair exists.')
    }

}