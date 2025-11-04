// Quick script to check order status and manually complete if needed
const orderId = process.argv[2] || 'ORD-1762280921472-EZ1Z15S';

console.log(`\n🔍 Checking order: ${orderId}\n`);

// Test the completion endpoint
fetch(`http://localhost:3000/api/complete-order?orderId=${orderId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
})
  .then(res => res.json())
  .then(data => {
    console.log('📋 Response:', JSON.stringify(data, null, 2));
    if (data.success) {
      console.log('\n✅ Order completed! Check your dashboard.');
    }
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    console.log('\n💡 Make sure your dev server is running on localhost:3000');
  });
