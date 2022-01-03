import { CommandInteraction, Permissions } from 'discord.js';
import RoleBot from '../../src/bot';
import { ICategory } from '../../src/database/category';
import {
  EDIT_CATEGORY_BY_ID,
  GET_CATEGORY_BY_NAME,
} from '../../src/database/database';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';

export class EditCategoryCommand extends SlashCommand {
  constructor(client: RoleBot) {
    super(
      client,
      'category-edit',
      `Edit any category's name, description, or if it's mutually exclusive.`,
      Category.category,
      [Permissions.FLAGS.MANAGE_ROLES]
    );

    this.addStringOption(
      'name',
      'Change the name of the category. This is the title of the embed.',
      true
    );
    this.addStringOption(
      'new-name',
      'Change the name of the category. This is the title of the embed.'
    );
    this.addStringOption(
      'new-description',
      'Change the description. This is shown above your react roles in the embed.'
    );
    this.addBoolOption(
      'mutually-exclusive',
      'Change if roles in this category should be mutually exclusive.'
    );
  }

  execute = async (interaction: CommandInteraction) => {
    const [name, newName, newDesc] = this.extractStringVariables(
      interaction,
      'name',
      'new-name',
      'new-description'
    );

    const mutuallyExclusive =
      interaction.options.getBoolean('mutually-exclusive');

    if (!newName && !newDesc && !mutuallyExclusive) {
      this.log.debug(`User didn't change anything about the category`);

      return interaction.reply({
        ephemeral: true,
        content: `Hey! You need to pass at _least_ one updated field about the category.`,
      });
    }

    if (!name) {
      this.log.error(`Required option name was undefined.`);

      return interaction.reply({
        ephemeral: true,
        content: `Hey! I had an issue finding the category. Please wait a second and try again.`,
      });
    }

    const category = await GET_CATEGORY_BY_NAME(interaction.guildId, name);

    if (!category) {
      this.log.debug(
        `Category not found with name[${name}] in guild[${interaction.guildId}]`
      );

      return interaction.reply(
        `Hey! I couldn't find a category with that name. The name is _case sensitive_ so make sure it's typed correctly.`
      );
    }

    const updatedCategory: Partial<ICategory> = {
      name: newName ?? category.name,
      description: newDesc ?? category.description,
      mutuallyExclusive: mutuallyExclusive ?? category.mutuallyExclusive,
    };

    EDIT_CATEGORY_BY_ID(category.id, updatedCategory).then(() => {
      this.log.info(
        `Updated category[${category.id}] in guild[${interaction.guildId}] successfully.`
      );

      interaction.reply({
        ephemeral: true,
        content: `Hey! I successfully updated the category for you.`,
      });
    });
  };
}
