import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  parseEmoji,
} from 'discord.js';
import {
  GET_REACT_ROLE_BY_EMOJI,
  GET_REACT_ROLE_BY_ROLE_ID,
  UPDATE_REACT_ROLE_EMOJI_ID,
  UPDATE_REACT_ROLE_EMOJI_TAG,
} from '../../src/database/queries/reactRole.query';
import { RolePing } from '../../utilities/utilPings';
import { SlashSubCommand } from '../command';

export class EditSubCommand extends SlashSubCommand {
  constructor(baseCommand: string) {
    super(baseCommand, 'edit', 'Edit any existing react roles emoji!', [
      {
        name: 'role',
        description: 'The role that belongs to the react role.',
        required: true,
        type: ApplicationCommandOptionType.Role,
      },
      {
        name: 'new-emoji',
        description: 'The new emoji for the react role.',
        required: true,
        type: ApplicationCommandOptionType.String,
      },
    ]);
  }

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      return this.log.debug('Missing guildID on interaction.');
    }

    await interaction.deferReply({
      ephemeral: true,
    });

    const role = this.expect(interaction.options.getRole('role'), {
      message: `Somehow the role is missing! Please try again.`,
      prop: 'role',
    });
    const emoji = this.expect(interaction.options.getString('new-emoji'), {
      message: 'Somehow the emoji is missing! Please try again.',
      prop: 'emoji',
    });

    const doesReactRoleExist = await GET_REACT_ROLE_BY_ROLE_ID(role.id);
    if (!doesReactRoleExist) {
      return interaction.editReply(
        `Hey! That role doesn't belong to an existing react role.`
      );
    }

    const parsedEmoji = parseEmoji(emoji);

    if (!parsedEmoji?.id && !parsedEmoji?.name) {
      return interaction.editReply(
        `Hey! I had an issue parsing whatever emoji you passed in. Please wait and try again.`
      );
    }

    const emojiContent = parsedEmoji.id ?? parsedEmoji.name;

    const doesEmojiBelongToReactRole = await GET_REACT_ROLE_BY_EMOJI(
      emojiContent,
      interaction.guildId
    );

    if (doesEmojiBelongToReactRole) {
      return interaction.editReply(
        `Hey! That emoji belongs to a react role (${RolePing(
          doesEmojiBelongToReactRole.roleId
        )})`
      );
    }

    const emojiTag = parsedEmoji?.id
      ? `<${parsedEmoji.animated ? 'a' : ''}:nn:${parsedEmoji.id}>`
      : null;

    await UPDATE_REACT_ROLE_EMOJI_ID(role.id, emojiContent);
    await UPDATE_REACT_ROLE_EMOJI_TAG(role.id, emojiTag);

    this.log.debug(
      `Updated role[${role.id}] to use emoji[${JSON.stringify(parsedEmoji)} - ${
        emojiTag ?? parsedEmoji.name
      }]`,
      interaction.guildId
    );

    return interaction.editReply(
      `:tada: Successfully updated the react role (${
        emojiTag ?? parsedEmoji.name
      } - ${RolePing(role.id)}) :tada:`
    );
  };
}
