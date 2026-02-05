import { OrthancsClient } from '../src/index';

async function main() {
  // Create a client pointing to your memory backend
  const client = new OrthancsClient({
    endpoint: 'http://localhost:3000', // or https://api.orthanc.ai
    apiKey: 'your-api-key-here'
  });

  // Query the memory system
  try {
    const result = await client.query('user-123', 'What do I like?');
    
    console.log('Memories found:', result.count);
    console.log('Query type:', result.queryType);
    console.log('Response time:', result.latency_ms + 'ms');
    console.log('\nResults:');
    
    result.memories.forEach((memory, index) => {
      console.log(`  ${index + 1}. ${memory} (score: ${result.scores[index]})`);
    });
  } catch (error) {
    console.error('Error querying memory:', error);
  }
}

main();
