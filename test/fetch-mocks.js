const fetchMock = require('fetch-mock');
const mockery = require('mockery');
const Config = require('../config.json');

console.log('mocking fetch');
mockery.registerMock('node-fetch', fetchMock.fetchMock);
fetchMock.mock(Config.soma_api_url + 'channels.json', {
  channels: [{
    id: 'poptron',
    title: 'PopTron',
    xlimage: 'http://api.somafm.com/logos/512/poptron512.png'
  }, {
    id: 'cliqhop',
    title: 'cliqhop idm',
    xlimage: 'http://api.somafm.com/logos/512/cliqhop512.jpg'
  }]
});
