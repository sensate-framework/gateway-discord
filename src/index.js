/** @flow */
/** @module gateway-discord */
import { Gateway } from '@sensate/sensate'
import assert from 'assert'

/**
 * Discord Gateway for Sensate
 */
export default class DiscordGateway extends Gateway {
  constructor (config: { [key: string]: string }) {
    super(config)

    // Ensure discord connection token is given
    assert(this.config.token, 'Missing Discord token in config.')
  }
}
