#!/usr/bin/env node

// Script test CORS và API endpoints

const testCors = async () => {
  console.log('🧪 Testing CORS and API endpoints...\n');
  
  // Test 1: convert-hls API trên Worker
  console.log('1. Testing convert-hls API...');
  try {
    const response = await fetch('https://media.alldrama.tech/api/convert-hls', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000'
      }
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   CORS Headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.headers.get('Access-Control-Allow-Origin')) {
      console.log('   ✅ CORS configured correctly');
    } else {
      console.log('   ❌ CORS not configured');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log();
  
  // Test 2: video-uploaded API trên Backend
  console.log('2. Testing video-uploaded API...');
  try {
    const response = await fetch('https://alldramaz.com/api/media/episodes/1/1/video-uploaded', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000'
      }
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   CORS Headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.headers.get('Access-Control-Allow-Origin')) {
      console.log('   ✅ CORS configured correctly');
    } else {
      console.log('   ❌ CORS not configured');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log();
  
  // Test 3: Kiểm tra endpoint tồn tại
  console.log('3. Testing endpoint existence...');
  try {
    const response = await fetch('https://alldramaz.com/api/media/episodes/1/1/video-uploaded', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      },
      body: JSON.stringify({ videoKey: 'test' })
    });
    
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('   ✅ Endpoint exists (needs authentication)');
    } else if (response.status === 404) {
      console.log('   ❌ Endpoint not found');
    } else {
      console.log(`   ℹ️  Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('\n🎯 Test completed!');
  console.log('📝 Expected behavior:');
  console.log('   - CORS should allow localhost:3000');
  console.log('   - convert-hls should respond with 401 (needs auth)');
  console.log('   - video-uploaded should respond with 401 (needs auth)');
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testCors().catch(console.error);
}

export { testCors }; 