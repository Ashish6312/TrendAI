// Quick test script to check backend response time
const testBackend = async () => {
  const apiUrl = 'http://localhost:8000';
  
  console.log('Testing backend response time...');
  const start = Date.now();
  
  try {
    const response = await fetch(`${apiUrl}/api/auth/test`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const end = Date.now();
    const responseTime = end - start;
    
    console.log(`Backend response time: ${responseTime}ms`);
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response:', data);
    } else {
      console.log('Backend not responding properly');
    }
  } catch (error) {
    const end = Date.now();
    const responseTime = end - start;
    console.error(`Backend error after ${responseTime}ms:`, error.message);
  }
};

testBackend();