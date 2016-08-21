/** @flow */
/** @module gateway-discord */
import { Gateway, Event, Channel, Message, User } from '@sensate/sensate'
import assert from 'assert'
import Discord from 'discord.js'

/**
 * Discord Gateway for Sensate
 */
export default class DiscordGateway extends Gateway {
  /**
   * Create a new DiscordGateway
   */
  constructor (config: { [key: string]: string }) {
    super(config)

    // Ensure discord connection token is given
    assert(this.config.token, 'Discord token cannot be empty.')

    // Bind function scope
    this._transformDiscordChannel = this._transformDiscordChannel.bind(this)
    this._transformDiscordMessage = this._transformDiscordMessage.bind(this)
    this._transformDiscordUser = this._transformDiscordUser.bind(this)
  }

  /**
   * Connect to Discord
   */
  connect (): Promise<Gateway> {
    return new Promise((resolve, reject) => {
      this.client = new Discord.Client()

      // Handle incoming discord messages
      this.client.on('message', message => {
        // Skip TTS messages
        if (message.tts) return

        // Turn dicord message into sensate message
        this.emit(Event.MESSAGE, this._transformDiscordMessage(message))
      })

      this.client.on('ready', () => {
        // Turn discord users into sensate users
        this.users = this.client.users
          .filter(u => u.id !== this.client.user.id)
          .map(this._transformDiscordUser)

        // Turn discord channels into sensate channels
        this.channels = this.client.channels
          .filter(c => c.type !== 'text')
          .map(this._transformDiscordChannel)

        resolve(this)
      })

      // Sign in and begin
      this.client
        .loginWithToken(this.config.token)
        .catch(error => reject(error))
    })
  }

  /**
   * Send a text message to a channel
   * @param {Channel} channel The channel to send the message to
   * @param {string}  text    The message to send
   * @return {Promise<Gateway>} A promise with the gateway that completes after message sent
   */
  sendChannelMessage (channel: Channel, text: string): Promise<Gateway> {
    return new Promise((resolve, reject) => {
      this.client
        .sendMessage(channel.id, text)
        .then(message => resolve(this))
        .catch(error => reject(error))
    })
  }

  /**
   * Send a text message to a user
   * @param {User}   user The user to send the message to
   * @param {string} text The message to send
   * @return {Promise<Gateway>} A promise with the gateway that completes after message sent
   */
  sendUserMessage (user: User, text: string): Promise<Gateway> {
    return new Promise((resolve, reject) => {
      this.client
        .sendMessage(user.id, text)
        .then(message => resolve(this))
        .catch(error => reject(error))
    })
  }

  /**
   * Reply to a given message
   * @param {Message} message The message to reply to
   * @param {string}  text    The text to reply with
   * @return {Promise<Gateway>} A promise with the gateway that completes after message sent
   */
  replyToMessage (message: Message, text: string): Promise<Gateway> {
    return new Promise((resolve, reject) => {
      if (!message.channel) {
        resolve(this.sendUserMessage(message.author, text))
      } else {
        resolve(this.sendChannelMessage(message.channel, `${message.author.name}: ${text}`))
      }
    })
  }

  /**
   * Transform a discord channel into a sensate channel
   * @param {Discord.Channel} channel The channel to transform
   * @return {Channel} The transformed sensate channel
   */
  _transformDiscordChannel (channel: Discord.Channel): Channel {
    return new Channel({
      id: channel.id,
      name: channel.isPrivate ? `direct-${channel.recipient.name}` : channel.name,
      gateway: this
    })
  }

  /**
   * Transform a discord message into a sensate message
   * @param {Discord.Message} message The message to transform
   * @return {Message} The transformed sensate message
   */
  _transformDiscordMessage (message: Discord.Message): Message {
    return new Message({
      id: message.id,
      content: message.content,
      timestamp: message.timestamp,
      gateway: this,
      author: this.users.find(u => u.id === message.author.id),
      channel: this._transformDiscordChannel(message.channel)
    })
  }

  /**
   * Transform a discord user into a sensate user
   * @param {Discord.User} channel The user to transform
   * @return {User} The transformed sensate user
   */
  _transformDiscordUser (user: Discord.User): User {
    return new User({
      id: user.id,
      name: user.username,
      gateway: this
    })
  }
}
