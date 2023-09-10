import { InteractionCount } from './data';

export class Subject {
  constructor(
    public readonly id: string,
  ) {
  }

  async addInteraction(type: string) {
    if (!/^\p{Emoji}$/u.test(type)) {
      throw new Error('Invalid interaction type');
    }

    const res = await InteractionCount
      .update({
        subject: this.id,
        type,
      })
      .add({ count: 1 })
      .go({ response: 'all_new' });

    return {
      id: res.data.subject,
      type: res.data.type,
      count: res.data.count,
    };
  }

  async getInteractions() {
    const res = await InteractionCount.query
      .main({ subject: this.id })
      .go();

    return res.data.map((item) => ({
      type: item.type,
      count: item.count,
    }));
  }
}