import { expect } from 'chai'
import DiscordGateway from '../src'

describe('DiscordGateway', () => {
  it('checks for discord token on init', () => {
    const invalid = () => new DiscordGateway()
    expect(invalid).to.throw(/missing discord token/i)

    const valid = () => new DiscordGateway({ token: 'foo' })
    expect(valid).to.not.throw
  })
})
