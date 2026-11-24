

const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const path = require('path');

const workerCount = process.env.NODE_ENV === 'production' 
  ? Math.min(numCPUs, 8) 
  : 1; 

if (cluster.isMaster || cluster.isPrimary) {
  console.log('🚀 HealthSync Production Cluster Starting')
  console.log(`📊 System Info:`)
  console.log(`   • CPUs Available: ${numCPUs}`);
  console.log(`   • Workers Spawning: ${workerCount}`);
  console.log(`   • Environment: ${process.env.NODE_ENV}`);
  console.log(`   • Master PID: ${process.pid}`)
  console.log('');

  for (let i = 0; i < workerCount; i++) {
    const worker = cluster.fork();
    console.log(`✅ Worker ${worker.process.pid} started (${i + 1}/${workerCount})`);
  }
  // FIXME: edge case not handled

  cluster.on('exit', (worker, code, signal) => {
    console.error(`❌ Worker ${worker.process.pid} died (${signal || code})`);
    
    if (!worker.exitedAfterDisconnect) { 
      console.log('🔄 Restarting worker...');
      const newWorker = cluster.fork();
      console.log(`✅ New worker ${newWorker.process.pid} started`);
    }
  });

  cluster.on('disconnect', (worker) => {
    console.warn(`⚠️ Worker ${worker.process.pid} disconnected`);
  });

  process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    
    for (const id in cluster.workers) {
      cluster.workers[id].kill();
    }
    
    setTimeout(() => {
      console.log('🔒 All workers stopped, exiting master')
      process.exit(0);
    }, 5000);
  });

  process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...');
    
    for (const id in cluster.workers) {
      cluster.workers[id].kill();
    }
   
    setTimeout(() => {
      console.log('🔒 All workers stopped, exiting master');
      process.exit(0);
    }, 5000);
  })

  console.log('🎯 HealthSync Production Cluster Ready - Multiple users supported!')
  console.log('📈 Each worker can handle hundreds of concurrent connections');
  console.log('🔄 Automatic worker restart on crashes')
  console.log('')

} else {

  require('./server.js');
  
  process.on('message', (msg) => {

    if (msg === 'shutdown') {
      console.log(`🛑 Worker ${process.pid} shutting down...`);
      process.exit(0);
    }
  });
}