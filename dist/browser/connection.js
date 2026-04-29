  /*
   * Runtime connection config for POS Supermarket Web.
   * This file is served from /connection.js and loaded before Angular bootstraps.
   */
  (function attachConnectionConfig(global) {
    var config = {
      host : 'http://localhost:3000', // socket server host port gabung saja
      apiUrl: '/api', 
      terminalId: 'T01',
      storeOutletId: 'OT99',
      printerName: 'EPSON TM-T88VI',
      printerType: 'LAN',
      printerIp: '192.168.1.200',
      serialComPort: 'COM3',
    };

    global.__POS_CONNECTION__ = config;
  })(typeof window !== 'undefined' ? window : globalThis);