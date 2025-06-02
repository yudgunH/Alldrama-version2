const http = require('http');

// Test latest comments API
const testLatestComments = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/comments/latest?limit=5',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    console.log('Making request to:', `http://${options.hostname}:${options.port}${options.path}`);

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response Body Length:', data.length);
        
        if (res.statusCode === 200) {
          try {
            const parsedData = JSON.parse(data);
            console.log('✅ Success! Found', parsedData.length, 'comments');
            resolve(parsedData);
          } catch (error) {
            console.log('❌ Failed to parse JSON:', error.message);
            resolve(data);
          }
        } else {
          console.log('❌ Non-200 status code');
          resolve(data);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request Error:', error.message);
      reject(error);
    });

    req.end();
  });
};

// Test comment by ID API
const testCommentById = (id = 1) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/comments/${id}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    console.log('Making request to:', `http://${options.hostname}:${options.port}${options.path}`);

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        
        if (res.statusCode === 200) {
          try {
            const parsedData = JSON.parse(data);
            console.log('✅ Success! Comment ID:', parsedData.id);
            resolve(parsedData);
          } catch (error) {
            console.log('❌ Failed to parse JSON:', error.message);
            resolve(data);
          }
        } else {
          console.log('❌ Error response:', data);
          resolve(data);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request Error:', error.message);
      reject(error);
    });

    req.end();
  });
};

// Test all comments API (without auth - should fail)
const testAllComments = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/comments/all?limit=5',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    console.log('Making request to:', `http://${options.hostname}:${options.port}${options.path}`);

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        
        if (res.statusCode === 401) {
          console.log('✅ Expected 401 (Unauthorized) - Auth required');
        } else if (res.statusCode === 200) {
          console.log('✅ Success! (if authenticated)');
        } else {
          console.log('❌ Unexpected status:', res.statusCode);
        }
        
        try {
          const parsedData = JSON.parse(data);
          console.log('Response:', parsedData.message || 'Success');
          resolve(parsedData);
        } catch (error) {
          console.log('Response:', data);
          resolve(data);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request Error:', error.message);
      reject(error);
    });

    req.end();
  });
};

// Main test function
const runTests = async () => {
  console.log('=== Testing Comment APIs ===\n');

  try {
    console.log('1. Testing Latest Comments API...');
    await testLatestComments();
    console.log('\n');

    console.log('2. Testing Comment By ID API...');
    await testCommentById(1);
    console.log('\n');

    console.log('3. Testing All Comments API (no auth)...');
    await testAllComments();
    console.log('\n');

  } catch (error) {
    console.error('Test Error:', error.message);
  }
  
  console.log('Tests completed.');
};

// Run tests
runTests(); 