#!/usr/bin/env node

/**
 * Firebase Configuration Validator
 * Run this script to check if your Firebase setup is correct
 *
 * Usage: node validate-firebase.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔥 Firebase Configuration Validator\n');

// Read .env.local file
const envPath = path.join(__dirname, '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('❌ ERROR: .env.local file not found!');
  console.log('📝 Create a .env.local file in the project root.\n');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');

// Parse environment variables
const env = {};
envLines.forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=');
    if (key && value) {
      env[key.trim()] = value.trim();
    }
  }
});

// Required Firebase variables
const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

let allValid = true;
let errors = [];
let warnings = [];

console.log('📋 Checking Firebase Configuration:\n');

requiredVars.forEach(varName => {
  const value = env[varName];

  if (!value) {
    console.log(`❌ ${varName}: MISSING`);
    errors.push(`${varName} is not set`);
    allValid = false;
  } else if (value.includes('placeholder') || value.includes('your-')) {
    console.log(`⚠️  ${varName}: PLACEHOLDER (needs real value)`);
    warnings.push(`${varName} has placeholder value: ${value}`);
    allValid = false;
  } else {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  }
});

console.log('\n' + '='.repeat(60) + '\n');

// Validation results
if (errors.length > 0) {
  console.log('❌ ERRORS:');
  errors.forEach(err => console.log(`   - ${err}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS:');
  warnings.forEach(warn => console.log(`   - ${warn}`));
  console.log('');
}

if (allValid) {
  console.log('✅ SUCCESS: Firebase configuration looks good!');
  console.log('');
  console.log('🚀 Next steps:');
  console.log('   1. Restart your dev server: npm run dev');
  console.log('   2. Open http://localhost:3001');
  console.log('   3. Try signing in with Google or Email/Password');
  console.log('');
} else {
  console.log('❌ FAILED: Firebase configuration is incomplete or invalid.');
  console.log('');
  console.log('📖 Follow the setup guide:');
  console.log('   1. Read: FIREBASE_SETUP.md');
  console.log('   2. Create Firebase project: https://console.firebase.google.com');
  console.log('   3. Copy your Firebase config to .env.local');
  console.log('   4. Run this script again: node validate-firebase.js');
  console.log('');
  process.exit(1);
}

// Additional checks
console.log('🔍 Additional Checks:\n');

// Check API Key
const apiKey = env['VITE_FIREBASE_API_KEY'];
if (apiKey && apiKey.startsWith('AIza')) {
  console.log('✅ API Key format looks correct (starts with AIza)');
} else if (apiKey) {
  console.log('⚠️  API Key format unusual (should start with AIza)');
}

// Check Auth Domain
const authDomain = env['VITE_FIREBASE_AUTH_DOMAIN'];
if (authDomain && authDomain.includes('firebaseapp.com')) {
  console.log('✅ Auth Domain looks correct (contains firebaseapp.com)');
} else if (authDomain) {
  console.log('⚠️  Auth Domain format unusual (should end with firebaseapp.com)');
}

// Check Project ID
const projectId = env['VITE_FIREBASE_PROJECT_ID'];
if (projectId && projectId.length > 0 && !projectId.includes(' ')) {
  console.log('✅ Project ID looks correct');
} else if (projectId) {
  console.log('⚠️  Project ID should not contain spaces');
}

console.log('\n' + '='.repeat(60) + '\n');
console.log('✨ Validation complete!\n');
