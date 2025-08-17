#!/usr/bin/env node

/**
 * JWT Secret Generator
 * Run this script to generate a secure JWT secret for your .env file
 */

const crypto = require('crypto');

// Generate a secure random secret (64 bytes = 512 bits)
const jwtSecret = crypto.randomBytes(64).toString('hex');

console.log('🔐 Generated Secure JWT Secret:');
console.log('================================');
console.log(jwtSecret);
console.log('================================');
console.log('\n📝 Copy this secret to your server/.env file:');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log('\n⚠️  IMPORTANT: Keep this secret safe and never commit it to version control!');
