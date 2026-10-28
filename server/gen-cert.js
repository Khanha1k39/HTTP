/**
 * Generate self-signed certificate using Node.js built-in crypto
 * Requires Node.js >= 15
 */
const { generateKeyPairSync, createSign } = require('crypto');
const fs = require('fs');
const path = require('path');

// Node 24 has built-in x509 support via the `crypto` module
// We'll use the `selfsigned` approach via a simple script

const { execSync } = require('child_process');

const certsDir = path.join(__dirname, 'certs');

// Try using node's built-in TLS cert generation
try {
  // Node >= 22 supports generateCertificate – fallback to forge-like approach
  const tls = require('tls');
  
  // Use node:crypto to create a self-signed cert
  const { X509Certificate } = require('crypto');
  
  // Generate key pair
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });

  // Export as PEM
  const privKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' });
  
  // For the cert, we need to create a proper X509 - use forge via npm or use openssl bundled in node
  // Actually let's use the openssl that comes bundled with Git or use a different approach
  
  // Check if openssl is available via git
  const gitOpenssl = 'C:\\Program Files\\Git\\usr\\bin\\openssl.exe';
  const fs2 = require('fs');
  
  if (fs2.existsSync(gitOpenssl)) {
    console.log('Using Git bundled OpenSSL...');
    execSync(`"${gitOpenssl}" req -x509 -newkey rsa:2048 -keyout "${path.join(certsDir, 'key.pem')}" -out "${path.join(certsDir, 'cert.pem')}" -days 365 -nodes -subj "/CN=localhost"`, { stdio: 'inherit' });
    console.log('✅ Certificates generated successfully!');
  } else {
    console.log('Git OpenSSL not found, trying system paths...');
    // Try Windows built-in or other locations
    const locations = [
      'C:\\Windows\\System32\\openssl.exe',
      'C:\\OpenSSL-Win64\\bin\\openssl.exe',
      'C:\\Program Files\\OpenSSL-Win64\\bin\\openssl.exe',
    ];
    let found = false;
    for (const loc of locations) {
      if (fs2.existsSync(loc)) {
        execSync(`"${loc}" req -x509 -newkey rsa:2048 -keyout "${path.join(certsDir, 'key.pem')}" -out "${path.join(certsDir, 'cert.pem')}" -days 365 -nodes -subj "/CN=localhost"`, { stdio: 'inherit' });
        found = true;
        console.log('✅ Certificates generated successfully!');
        break;
      }
    }
    if (!found) {
      // Fallback: use pre-generated test certificates (for demo only!)
      console.log('⚠️  No OpenSSL found, using embedded test certificate...');
      require('./gen-cert-fallback.js');
    }
  }
} catch (e) {
  console.error('Error generating cert:', e.message);
  require('./gen-cert-fallback.js');
}
