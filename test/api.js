import './setup.js'
import API from '../api.js'

describe('API', () => {
  it('create an API instance', () => {
    const api = API()
    expect(api.sin).to.be.a('function')
  })
})